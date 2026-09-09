// supabase/functions/update-order-status/index.ts
// Endpoint PATCH — met à jour le statut d'une commande (service role bypass RLS)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyAdmin } from '../_shared/verifyAdmin.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Mutation de statut réservée aux admins (service role bypass RLS sinon ouvert)
  const { isAdmin, error: authErr } = await verifyAdmin(req);
  if (!isAdmin) return authErr!;

  try {
    const { orderId, status } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'orderId requis' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const validStatuses = ['paid', 'scheduled', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'status invalide' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier que la commande existe et n'est pas déjà payée (idempotent)
    const { data: existing, error: lookupErr } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (lookupErr || !existing) {
      return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Idempotent : ne pas repasser de paid → paid (évite double update)
    if (existing.status === status) {
      return new Response(JSON.stringify({ updated: false, status: existing.status }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Mettre à jour le statut
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateErr) {
      throw new Error('Erreur mise à jour : ' + updateErr.message);
    }

    return new Response(JSON.stringify({ updated: true, status }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[update-order-status]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Erreur serveur', detail: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
