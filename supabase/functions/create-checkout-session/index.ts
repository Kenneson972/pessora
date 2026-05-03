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

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

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

    const orderItems = items.map((item) => ({
      order_id: order.id,
      // N'insérer un product_id que si c'est un vrai UUID Supabase (pas un slug statique)
      product_id: UUID_RE.test(item.productId) ? item.productId : null,
      product_name: item.name,
      quantity: item.quantity,
      price_at_time: item.unitPrice,
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
      line_items: items.map((item) => {
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
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
      metadata: {
        order_id: order.id,
        customer_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '',
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
