// supabase/functions/admin-portal-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'npm:zod@3'
import { verifyAdmin } from '../_shared/verifyAdmin.ts'

const BodySchema = z.object({
  stripe_customer_id: z.string().min(1),
  return_url: z.string().url(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.pessora.mq",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { isAdmin, error } = await verifyAdmin(req)
    if (!isAdmin) return error!
    if (!authResult.ok) return authResult.response

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe non configuré' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'stripe_customer_id et return_url requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
    const session = await stripe.billingPortal.sessions.create({
      customer: parsed.data.stripe_customer_id,
      return_url: parsed.data.return_url,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[admin-portal-session]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
