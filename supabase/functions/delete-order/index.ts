// supabase/functions/delete-order/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = Deno.env.get('ALLOWED_ORIGIN') || 'https://www.pessora.fr';
  const isLocalhost = origin != null &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  return {
    'Access-Control-Allow-Origin': isLocalhost ? origin : allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const cors = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'orderId requis' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Supprimer d'abord les order_items (FK constraint)
    const { error: itemsErr } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsErr) {
      throw new Error('Erreur suppression articles : ' + itemsErr.message);
    }

    // Puis supprimer la commande
    const { error: orderErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderErr) {
      throw new Error('Erreur suppression commande : ' + orderErr.message);
    }

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[delete-order]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Erreur serveur', detail: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
