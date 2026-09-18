// supabase/functions/newsletter-unsubscribe/index.ts
//
// Publique, verify_jwt = false (comme send-contact-email). Le GET n'a JAMAIS
// d'effet — les scanners d'email (Gmail/Outlook) pré-chargent les liens des
// e-mails, un GET qui désabonnerait quelqu'un viderait la liste toute seule
// sans qu'un humain ait cliqué. Seul le POST retire vraiment.
//
// Anti-énumération : token inconnu et token déjà utilisé renvoient EXACTEMENT
// la même réponse — jamais de PII, jamais de fuite sur l'existence d'une adresse.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimitPg } from '../_shared/rate-limiter.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET (et toute autre méthode) : jamais de lecture ni d'écriture en base.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ outcome: 'no_op' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRateLimitPg(supabase, `newsletter-unsubscribe:${ip}`, 20, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    // Le jeton voyage dans l'URL (query string) : c'est ce qui permet au bouton
    // « Se désinscrire » de la page ET au bouton natif Gmail/Outlook (en-tête
    // List-Unsubscribe-Post, RFC 8058 — POST automatique sans page) de pointer
    // vers la même route, sans dépendre d'un corps JSON.
    const url = new URL(req.url);
    let token = url.searchParams.get('token');
    if (!token) {
      // Repli : notre propre page peut aussi envoyer { token } en JSON.
      const body = await req.json().catch(() => null);
      token = typeof body?.token === 'string' ? body.token : null;
    }

    if (!token) {
      return new Response(JSON.stringify({ outcome: 'already_or_invalid' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscriber, error: lookupErr } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (lookupErr) {
      console.error('[newsletter-unsubscribe] lookup failed:', lookupErr.message);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriber) {
      // Jeton inconnu — même réponse qu'un jeton déjà utilisé (anti-énumération).
      return new Response(JSON.stringify({ outcome: 'already_or_invalid' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Idempotent : la contrainte unique(subscriber_id) absorbe un rejeu du POST
    // sans jamais renvoyer 500 — la 2ᵉ fois retombe simplement sur already_or_invalid.
    const { error: insertErr } = await supabase
      .from('newsletter_unsubscribes')
      .insert({ subscriber_id: subscriber.id });

    if (insertErr) {
      // 23505 = violation de contrainte unique = déjà désabonné, pas une panne.
      if (insertErr.code === '23505') {
        return new Response(JSON.stringify({ outcome: 'already_or_invalid' }), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      console.error('[newsletter-unsubscribe] insert failed:', insertErr.message);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ outcome: 'unsubscribed' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[newsletter-unsubscribe]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
