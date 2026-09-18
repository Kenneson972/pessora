// supabase/functions/newsletter-request-resubscribe/index.ts
//
// Publique, verify_jwt = false. Règle dure (17/09) : aucun consentement ne s'écrit
// sans la personne — pas de fonction qui prend une adresse et pose consented_at.
// Cette fonction ne signe RIEN : elle envoie un e-mail avec un lien, et c'est le
// clic sur ce lien (newsletter-resubscribe) qui écrit le consentement.
//
// Distingue deux cas pour l'écran (brief §... messages validés) :
// - déjà inscrite (active) -> pas d'e-mail, juste l'info
// - désinscrite -> e-mail envoyé avec le lien de réinscription
// Ne révèle jamais si une adresse est totalement inconnue vs les deux cas ci-dessus
// au-delà de ce que l'UX demande explicitement (pas de PII au-delà de l'e-mail que
// l'utilisateur vient lui-même de saisir dans le formulaire).
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { checkRateLimitPg } from '../_shared/rate-limiter.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const Schema = z.object({ email: z.string().email() });

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ outcome: 'no_op' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRateLimitPg(supabase, `newsletter-request-resubscribe:${ip}`, 10, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Adresse invalide' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const email = parsed.data.email.trim().toLowerCase();

    const { data: subscriber, error: lookupErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();

    if (lookupErr) {
      console.error('[newsletter-request-resubscribe] lookup failed:', lookupErr.message);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriber || subscriber.unsubscribed_at === null) {
      // Inconnue OU déjà active : l'écran affiche « Cette adresse est déjà inscrite. »
      // dans les deux cas (le formulaire d'inscription a de toute façon déjà buté sur
      // un 23505, donc l'adresse existe forcément côté appelant).
      return new Response(JSON.stringify({ outcome: 'already_active' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Service d'envoi non configuré" }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const logoUrl = `${supabaseUrl}/storage/v1/object/public/asset/O.PNG`;
    const resubscribeUrl = `https://www.pessora.fr/newsletter/reinscription?token=${subscriber.unsubscribe_token}`;
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#f9f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f7f4;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:2px;overflow:hidden;"><tr><td style="background-color:#1E3529;padding:32px 40px 28px;text-align:center;"><img src="${logoUrl}" alt="PessÓra" style="max-width:100px;height:auto;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" /></td></tr><tr><td style="padding:36px 32px;"><h2 style="margin:0 0 16px;color:#1E3529;font-family:Georgia,serif;font-size:20px;font-weight:400;">Confirmez votre réinscription</h2><p style="margin:0 0 24px;color:#3a3a3a;font-size:15px;line-height:1.7;">Vous avez demandé à recevoir de nouveau la newsletter de PessÓra. Cliquez ci-dessous pour confirmer :</p><table cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#1E3529;border-radius:2px;padding:14px 32px;"><a href="${resubscribeUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Confirmer mon inscription</a></td></tr></table><p style="margin:24px 0 0;color:#6b6b6b;font-size:13px;line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : rien ne sera modifié.</p></td></tr><tr><td style="background-color:#f5f3f0;padding:20px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.04);"><p style="margin:0;color:#888;font-size:11px;">PessÓra — C.C. La Véranda – Cluny, 97200 Fort-de-France</p></td></tr></table></td></tr></table></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PessÓra <noreply@pessora.fr>',
        to: email,
        subject: 'Confirmez votre réinscription à la newsletter',
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[newsletter-request-resubscribe] Resend error:', res.status, errText);
      return new Response(JSON.stringify({ error: "Erreur lors de l'envoi" }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ outcome: 'confirmation_sent' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[newsletter-request-resubscribe]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
