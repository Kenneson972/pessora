// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { z } from 'npm:zod@3';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CartLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
  category: z.string(),
  optionsKey: z.string(),
  optionLabels: z.array(z.string()),
  image: z.string().optional(),
  // default 'gamme' : compatibilité panier localStorage antérieur au champ source
  source: z.enum(['bar', 'gamme']).optional().default('gamme'),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid(),
  pickup_time: z.string().nullable().optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Récupère le vrai prix unitaire depuis la base de données en ignorant
 * le unitPrice fourni par le client (fraud protection).
 * Pour les produits bar → lookup par slug dans products.price
 * Pour les produits gamme → lookup par id UUID dans gamme_products.price
 */
async function fetchVerifiedPrice(
  supabase: ReturnType<typeof createClient>,
  item: z.infer<typeof CartLineSchema>,
): Promise<{ verifiedUnitPrice: number; productId: string | null }> {
  if (item.source === 'gamme' && UUID_RE.test(item.productId)) {
    // Produit gamme : chercher par UUID
    const { data, error } = await supabase
      .from('gamme_products')
      .select('id, price, price_alt')
      .eq('id', item.productId)
      .eq('active', true)
      .single();
    if (error || !data) {
      throw new Error(`Produit gamme introuvable ou inactif : ${item.productId}`);
    }
    // price_alt existe pour certains produits (ex: Gel Nettoyant 29€/39€) ;
    // on prend price par défaut — si le client a un price_alt, le panier
    // aura un productId différent (un autre UUID), donc price suffit ici.
    return { verifiedUnitPrice: Number(data.price), productId: data.id };
  }

  // Produit bar : chercher par slug (productId = slug) ou par UUID
  let query = supabase
    .from('products')
    .select('slug, price')
    .eq('active', true);

  if (UUID_RE.test(item.productId)) {
    query = query.eq('id', item.productId);
  } else {
    query = query.eq('slug', item.productId);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    throw new Error(`Produit bar introuvable ou inactif : ${item.productId}`);
  }
  return { verifiedUnitPrice: Number(data.price), productId: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const siteUrl = (Deno.env.get('SITE_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurée' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Payload invalide', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { items, user_id, pickup_time } = parsed.data;
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'user_id ne correspond pas' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── P0: Vérifier les prix côté serveur (ignorer unitPrice du client) ──
    const verifiedLines = await Promise.all(
      items.map(async (item) => {
        const { verifiedUnitPrice, productId } = await fetchVerifiedPrice(supabase, item);
        return { ...item, verifiedUnitPrice, dbProductId: productId };
      }),
    );

    const total = verifiedLines.reduce(
      (sum, i) => sum + i.verifiedUnitPrice * i.quantity,
      0,
    );

    // Construire le pickup_time ISO complet (date d'aujourd'hui + créneau choisi)
    const orderPickupTime = pickup_time
      ? (() => {
          const [h, m] = pickup_time.split(':').map(Number);
          const d = new Date();
          d.setHours(h ?? 0, m ?? 0, 0, 0);
          return d.toISOString();
        })()
      : null;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id, total, status: 'pending', pickup_time: orderPickupTime })
      .select('id')
      .single();

    if (orderError || !order) {
      throw new Error('Impossible de créer la commande : ' + orderError?.message);
    }

    const orderItems = verifiedLines.map((item) => ({
      order_id: order.id,
      product_id: item.dbProductId ?? (UUID_RE.test(item.productId) ? item.productId : null),
      product_name: item.name,
      quantity: item.quantity,
      price_at_time: item.verifiedUnitPrice,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('[create-checkout-session] order_items insert error:', itemsError.message);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user_id)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      customer_email: profile?.email ?? user.email,
      phone_number_collection: { enabled: true },
      line_items: verifiedLines.map((item) => {
        const isImageUrl = typeof item.image === 'string' && item.image.startsWith('http');
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.name,
              description: item.optionLabels?.length > 0
                ? item.optionLabels.join(' · ')
                : undefined,
              images: isImageUrl ? [item.image] : undefined,
            },
            unit_amount: Math.round(item.verifiedUnitPrice * 100),
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
      metadata: {
        order_id: order.id,
      },
    });

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
