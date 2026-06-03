// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { z } from 'npm:zod@3';
// Rate limiter in-memory (inlined to avoid import issues)
const rateStore = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

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
  barBasePublic: z.number().positive().optional(),
  // default 'gamme' : compatibilité panier localStorage antérieur au champ source
  source: z.enum(['bar', 'gamme']).optional().default('gamme'),
  scheduledPickupDate: z.string().optional(),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid().nullable(),
  pickup_time: z.string().nullable().optional(),
  client_name: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
});

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = Deno.env.get('ALLOWED_ORIGIN') || 'https://www.pessora.fr';
  const isLocalhost = origin != null &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  return {
    'Access-Control-Allow-Origin': isLocalhost ? origin : allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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
    const serverPrice = Number(data.price);
    // Option cuillère doseuse : +1€ (encodé dans optionsKey comme spoon:1)
    const spoonMatch = item.optionsKey?.match(/(?:^|\|)spoon:(\d+)(?:\||$)/);
    const spoonPrice = spoonMatch ? Number(spoonMatch[1]) : 0;
    const expectedPrice = serverPrice + spoonPrice;
    if (Math.abs(item.unitPrice - expectedPrice) > 0.02) {
      console.error(`[create-checkout-session] Écart prix gamme : client=${item.unitPrice}€, attendu=${expectedPrice}€ pour ${item.productId}`);
      throw new Error('Erreur de validation du panier. Veuillez le vider et réessayer.');
    }
    return { verifiedUnitPrice: expectedPrice, productId: data.id };
  }

  // Produit bar : chercher par slug (productId = slug) ou par UUID
  // Extraire la taille depuis optionsKey
  const sizeFromKey = item.optionsKey?.match(/(?:^|\|)size:(small|medium|large)(?:\||$)/)?.[1] ?? null;

  // Extraire le nombre de boosters depuis optionsKey
  const boostMatch = item.optionsKey?.match(/(?:^|\|)boost:([^|]*)/);
  const boosterCount = boostMatch?.[1] ? boostMatch[1].split(',').filter(Boolean).length : 0;

  // Colonne de prix selon la taille (fallback → price par défaut)
  const priceCol = sizeFromKey === 'small' ? 'price_small'
    : sizeFromKey === 'large' ? 'price_large'
    : 'price';

  let query = supabase
    .from('products')
    .select(`slug, price, price_small, price_large`)
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

  const baseProductPrice = Number(data[priceCol] ?? data.price);

  // Vérification anti-fraude : client base estimate vs serveur
  const clientBaseEstimate = item.barBasePublic ?? (item.unitPrice - boosterCount);
  if (Math.abs(clientBaseEstimate - baseProductPrice) > 0.02) {
    console.error(`[create-checkout-session] Écart prix bar : client=${clientBaseEstimate}€, serveur=${baseProductPrice}€ pour ${item.productId}`);
    throw new Error('Erreur de validation du panier. Veuillez le vider et réessayer.');
  }

  const verifiedUnitPrice = baseProductPrice + boosterCount;
  return { verifiedUnitPrice, productId: null };
}

type VerifiedLineItem = z.infer<typeof CartLineSchema> & { verifiedUnitPrice: number; dbProductId: string | null };

async function createOrder(
  supabase: ReturnType<typeof createClient>,
  params: {
    lines: VerifiedLineItem[],
    user_id: string | null,
    pickup_time: string | null,
    client_name: string | null,
    client_phone: string | null,
    order_type: 'bar' | 'gamme',
    scheduled_pickup_date: string | null,
    parent_payment_id?: string,
  },
): Promise<string> {
  const total = params.lines.reduce((sum, i) => sum + i.verifiedUnitPrice * i.quantity, 0);
  const accessToken = crypto.randomUUID().replace(/-/g, '');

  const orderPayload: Record<string, unknown> = {
    total,
    status: 'pending',
    order_type: params.order_type,
    access_token: accessToken,
  };
  if (params.user_id) orderPayload.user_id = params.user_id;
  if (params.client_name) orderPayload.client_name = params.client_name;
  if (params.client_phone) orderPayload.client_phone = params.client_phone;
  if (params.order_type === 'bar' && params.pickup_time) {
    orderPayload.pickup_time = params.pickup_time;
  }
  if (params.order_type === 'gamme' && params.scheduled_pickup_date) {
    orderPayload.scheduled_pickup_date = params.scheduled_pickup_date;
  }
  if (params.parent_payment_id) {
    orderPayload.parent_payment_id = params.parent_payment_id;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (error || !order) throw new Error('Impossible de créer la commande : ' + error?.message);

  const orderItems = params.lines.map((item) => ({
    order_id: order.id,
    // FK product_id → products.id (bar uniquement). Pour gamme → null.
    product_id: params.order_type === 'gamme' ? null : (item.dbProductId ?? (UUID_RE.test(item.productId) ? item.productId : null)),
    product_name: item.name,
    quantity: item.quantity,
    price_at_time: item.verifiedUnitPrice,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw new Error('Erreur articles : ' + itemsError.message);

  return order.id;
}

serve(async (req) => {
  const cors = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json", "Retry-After": "60" },
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const reqOrigin = req.headers.get('origin');
    const isLocalhostOrigin = reqOrigin && (reqOrigin.startsWith('http://localhost:') || reqOrigin.startsWith('http://127.0.0.1:'));
    const rawSiteUrl = Deno.env.get('SITE_URL');
    const siteUrl = (isLocalhostOrigin
      ? reqOrigin
      : (rawSiteUrl && rawSiteUrl.startsWith('http') ? rawSiteUrl : 'https://www.pessora.fr')
    ).replace(/\/+$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurée' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Payload invalide', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { items, user_id, pickup_time, client_name, client_phone } = parsed.data;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── P0: Vérifier les prix côté serveur (ignorer unitPrice du client) ──
    const verifiedLines = await Promise.all(
      items.map(async (item) => {
        const { verifiedUnitPrice, productId } = await fetchVerifiedPrice(supabase, item);
        return { ...item, verifiedUnitPrice, dbProductId: productId };
      }),
    );

    // ── Óra+ : appliquer -50% sur les boissons bar (boosters exclus) ──
    if (user_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user_id)
        .maybeSingle();
      if (sub?.plan === 'ora_plus' && sub?.status === 'active') {
        for (const item of verifiedLines) {
          if (item.source !== 'gamme' && item.barBasePublic != null) {
            const boosterAdd = item.verifiedUnitPrice - item.barBasePublic;
            const discountedBase = Math.round(item.barBasePublic * 0.5 * 100) / 100;
            item.verifiedUnitPrice = discountedBase + boosterAdd;
          }
        }
      }
    }

    // Construire le pickup_time ISO complet (date d'aujourd'hui + créneau choisi)
    const orderPickupTime = pickup_time
      ? (() => {
          const [h, m] = pickup_time.split(':').map(Number);
          const d = new Date();
          d.setHours(h ?? 0, m ?? 0, 0, 0);
          return d.toISOString();
        })()
      : null;

    // Split ou non : bar vs gamme → 2 orders partagent 1 Stripe session
    const barLines = verifiedLines.filter((i) => i.source !== 'gamme');
    const gammeLines = verifiedLines.filter((i) => i.source === 'gamme');
    const gammePickupDate = gammeLines[0]?.scheduledPickupDate ?? null;

    let orderIds: string[] = [];

    if (barLines.length > 0 && gammeLines.length > 0) {
      // Split : 2 orders, 1 Stripe, même parent_payment_id
      const parentPaymentId = crypto.randomUUID();
      if (gammeLines.length > 0) {
        const gammeId = await createOrder(supabase, {
          lines: gammeLines, user_id, pickup_time: null, client_name, client_phone,
          order_type: 'gamme', scheduled_pickup_date: gammePickupDate, parent_payment_id: parentPaymentId,
        });
        orderIds.push(gammeId);
      }
      if (barLines.length > 0) {
        const barId = await createOrder(supabase, {
          lines: barLines, user_id, pickup_time: orderPickupTime, client_name, client_phone,
          order_type: 'bar', scheduled_pickup_date: null, parent_payment_id: parentPaymentId,
        });
        orderIds.push(barId);
      }
    } else {
      // Homogène (tout bar ou tout gamme)
      const theType = gammeLines.length > 0 ? 'gamme' : 'bar';
      const thePickup = theType === 'bar' ? orderPickupTime : null;
      const theScheduled = theType === 'gamme' ? gammePickupDate : null;
      const theId = await createOrder(supabase, {
        lines: verifiedLines,
        user_id,
        pickup_time: thePickup,
        client_name,
        client_phone,
        order_type: theType,
        scheduled_pickup_date: theScheduled,
      });
      orderIds.push(theId);
    }

    // Email client : uniquement si user_id présent
    let customerEmail: string | undefined;
    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user_id)
        .single();
      customerEmail = profile?.email ?? undefined;
    }

    const successUrl = `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/commande/annulee?order_id=${orderIds[0]}`;

    // Appel direct à l'API Stripe (contourne le SDK npm:stripe en Deno)
    const stripeBody = new URLSearchParams();
    stripeBody.append('mode', 'payment');
    stripeBody.append('locale', 'fr');
    stripeBody.append('success_url', successUrl);
    stripeBody.append('cancel_url', cancelUrl);
    stripeBody.append('metadata[order_ids]', orderIds.join(','));
    if (customerEmail) stripeBody.append('customer_email', customerEmail);
    stripeBody.append('phone_number_collection[enabled]', 'true');

    verifiedLines.forEach((item, i) => {
      const isImageUrl = typeof item.image === 'string' && item.image.startsWith('http');
      stripeBody.append(`line_items[${i}][price_data][currency]`, 'eur');
      stripeBody.append(`line_items[${i}][price_data][product_data][name]`, item.name);
      if (item.optionLabels?.length > 0) {
        stripeBody.append(`line_items[${i}][price_data][product_data][description]`, item.optionLabels.join(' · '));
      }
      if (isImageUrl) {
        stripeBody.append(`line_items[${i}][price_data][product_data][images][0]`, item.image!);
      }
      stripeBody.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.verifiedUnitPrice * 100)));
      stripeBody.append(`line_items[${i}][quantity]`, String(item.quantity));
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeBody.toString(),
    });

    const stripeJson = await stripeRes.json() as { id?: string; url?: string; error?: { message: string } };

    if (!stripeRes.ok || !stripeJson.url) {
      throw new Error(stripeJson.error?.message ?? 'Stripe session creation failed');
    }

    for (const oid of orderIds) {
      await supabase
        .from('orders')
        .update({ stripe_session_id: stripeJson.id ?? null })
        .eq('id', oid);
    }

    return new Response(JSON.stringify({ url: stripeJson.url, version: '2026-06-02-v2' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Erreur serveur', detail: msg, v: '2026-06-02-v2' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
