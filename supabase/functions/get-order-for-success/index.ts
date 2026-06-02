// supabase/functions/get-order-for-success/index.ts
// Résout une commande après redirection Stripe (session_id → order + token)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const { stripe_session_id } = await req.json();

    if (!stripe_session_id || typeof stripe_session_id !== 'string') {
      return new Response(JSON.stringify({ error: 'session_id requis' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('orders')
      .select('id, access_token, total, status, client_name')
      .eq('stripe_session_id', stripe_session_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[get-order-for-success]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
