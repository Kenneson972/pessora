// supabase/functions/newsletter-resubscribe/index.ts
//
// Publique, verify_jwt = false. Miroir de newsletter-unsubscribe : GET sans effet,
// POST idempotent, appelle fn_resubscribe(token) — seul chemin qui écrit
// consented_at, et seulement parce que la personne a cliqué depuis sa propre boîte
// mail (règle dure du 17/09, cf. migration).
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ outcome: 'no_op' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRateLimitPg(supabase, `newsletter-resubscribe:${ip}`, 20, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    const url = new URL(req.url);
    let token = url.searchParams.get('token');
    if (!token) {
      const body = await req.json().catch(() => null);
      token = typeof body?.token === 'string' ? body.token : null;
    }

    if (!token) {
      return new Response(JSON.stringify({ outcome: 'already_or_invalid' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('fn_resubscribe', { p_token: token });
    if (error) {
      console.error('[newsletter-resubscribe] fn_resubscribe failed:', error.message);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.found) {
      return new Response(JSON.stringify({ outcome: 'already_or_invalid' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ outcome: 'resubscribed' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[newsletter-resubscribe]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
