// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'
import { activateOraPlus } from '../_shared/activateOraPlus.ts'

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] invalid signature:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── P0-2: Idempotence — INSERT ON CONFLICT DO NOTHING (atomique) ──
  const { error: insertError } = await supabase
    .from('stripe_events_processed')
    .insert({ id: event.id, type: event.type })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.error(`[stripe-webhook] failed to mark event ${event.id}:`, insertError)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          await activateOraPlus(supabase, stripe, session)
        } else if (session.mode === 'payment') {
          // Commande classique : pending → paid (statut intermédiaire,
          // le passage à completed sera fait manuellement quand la commande
          // est préparée/remise au client)
          const orderIds = session.metadata?.order_ids
            ? session.metadata.order_ids.split(',')
            : session.metadata?.order_id
              ? [session.metadata.order_id]
              : [];

          if (orderIds.length > 0) {
            await supabase
              .from('orders')
              .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent as string })
              .in('id', orderIds);
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!stripeSubId) break
        const periodEnd = invoice.lines?.data[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
          : null
        await supabase
          .from('subscriptions')
          .update({ status: 'active', ...(periodEnd ? { current_period_end: periodEnd } : {}) })
          .eq('stripe_subscription_id', stripeSubId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (!stripeSubId) break
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('stripe_subscription_id', stripeSubId)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.cancel_at_period_end) {
          await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: true })
            .eq('stripe_subscription_id', sub.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancel_at_period_end: false })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment') {
          const orderIds = session.metadata?.order_ids
            ? session.metadata.order_ids.split(',')
            : session.metadata?.order_id
              ? [session.metadata.order_id]
              : [];

          if (orderIds.length > 0) {
            await supabase
              .from('orders')
              .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent as string })
              .in('id', orderIds);
          }
        }
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.error('[stripe-webhook] async payment failed for session', session.id)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', event.type, err)
    return new Response(JSON.stringify({ error: 'Handler error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
