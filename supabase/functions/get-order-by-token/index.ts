// supabase/functions/get-order-by-token/index.ts
// Edge Function pour récupérer une commande par token d'accès (guest)
// Utilise la service_role key pour bypasser RLS — seule source fiable
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
    const { access_token } = await req.json();

    if (!access_token || typeof access_token !== 'string') {
      return new Response(JSON.stringify({ error: 'Token requis' }), {
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
      .select('*, order_items(*)')
      .eq('access_token', access_token)
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
    console.error('[get-order-by-token]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
