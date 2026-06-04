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
      .select('id, access_token, total, status, client_name, order_type, order_items(*)')
      .eq('stripe_session_id', stripe_session_id)
      .order('order_type', { ascending: true });

    if (error || !data?.length) {
      return new Response(JSON.stringify({ error: 'Commande introuvable' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Récupère les images des produits bar (product_id → products.image_url)
    const productIds = [...new Set(
      data.flatMap((order: any) => order.order_items?.map((i: any) => i.product_id) ?? []).filter(Boolean),
    )] as string[];

    let imageMap = new Map<string, string | null>();
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, image_url')
        .in('id', productIds);
      if (products?.length) {
        for (const p of products) imageMap.set(p.id, p.image_url);
      }
    }

    // Ajoute l'image du premier produit pour chaque commande
    const enriched = data.map((order: any) => {
      const firstItem = order.order_items?.[0];
      const imageUrl = firstItem?.product_id ? imageMap.get(firstItem.product_id) ?? null : null;
      return { ...order, image_url: imageUrl };
    });

    // Retourne un tableau pour gérer le cas split (plusieurs orders par session)
    return new Response(JSON.stringify(data.length === 1 ? enriched[0] : { orders: enriched }), {
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
