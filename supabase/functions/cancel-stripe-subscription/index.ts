// supabase/functions/cancel-stripe-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'npm:zod@3'
import { verifyAdmin } from '../_shared/verifyAdmin.ts'

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.pessora.fr";
  const isLocalhost = origin != null && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  return { 'Access-Control-Allow-Origin': isLocalhost ? origin : allowed, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
}

const BodySchema = z.object({
  stripe_subscription_id: z.string().min(1),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req.headers.get("origin")) })

  try {
    const { isAdmin, error } = await verifyAdmin(req)
    if (!isAdmin) return error!

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), { status: 503, headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'stripe_subscription_id requis' }), { status: 400, headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const updated = await stripe.subscriptions.update(parsed.data.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    const { error: dbErr } = await supabaseAdmin
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('stripe_subscription_id', parsed.data.stripe_subscription_id)
    if (dbErr) console.error('[cancel-stripe-subscription] DB sync failed:', dbErr.message)

    return new Response(JSON.stringify({ success: true, cancel_at: updated.cancel_at }), {
      headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[cancel-stripe-subscription]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' } })
  }
})
