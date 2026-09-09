// supabase/functions/_shared/sendOrderConfirmation.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

type OrderRow = {
  id: string
  client_name: string | null
  order_type: string | null
  pickup_time: string | null
  scheduled_pickup_date: string | null
  access_token: string | null
  total: number | string | null
  order_items: { product_name: string; quantity: number; price_at_time: number | string }[] | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatEuro(amount: number): string {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatPickup(order: OrderRow): string {
  if (order.order_type === 'gamme') {
    if (order.scheduled_pickup_date) {
      const d = new Date(order.scheduled_pickup_date)
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) +
        ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    return 'Date de retrait en attente de confirmation'
  }
  if (order.pickup_time) {
    return 'Retrait à ' + new Date(order.pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return 'Retrait au comptoir'
}

function buildItemsRows(order: OrderRow): string {
  const items = order.order_items ?? []
  return items.map((it) => {
    const lineTotal = Number(it.price_at_time) * it.quantity
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1E3529;font-size:14px;">${it.quantity}× ${escapeHtml(it.product_name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1E3529;font-size:14px;text-align:right;white-space:nowrap;">${formatEuro(lineTotal)}</td>
      </tr>`
  }).join('')
}

function buildEmailHtml(orders: OrderRow[], siteUrl: string): string {
  const firstOrder = orders[0]
  const clientName = firstOrder.client_name?.trim() || 'vous'
  const total = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const orderNumbers = orders.map((o) => o.id.slice(0, 8)).join(', ')
  const trackingOrder = orders.find((o) => o.access_token) ?? firstOrder
  const trackingUrl = trackingOrder.access_token
    ? `${siteUrl}/suivi-commande?token=${trackingOrder.access_token}`
    : `${siteUrl}/suivi-commande?order=${trackingOrder.id}`
  const itemsRows = orders.map(buildItemsRows).join('')
  const pickupLines = orders.map((o) => formatPickup(o)).join(' · ')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#F7F5F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5F1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:#1E3529;padding:32px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:22px;letter-spacing:0.04em;color:#ffffff;font-weight:600;">PessÓra</p>
              <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Bar protéiné · Fort-de-France</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1E3529;opacity:0.5;">Paiement confirmé</p>
              <h1 style="margin:0 0 12px;font-size:24px;color:#1E3529;font-weight:600;">Merci ${escapeHtml(clientName)} !</h1>
              <p style="margin:0 0 4px;font-size:13px;color:#555;">Commande n° ${escapeHtml(orderNumbers)}</p>
              <p style="margin:0;font-size:13px;color:#555;">${escapeHtml(pickupLines)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemsRows}
                <tr>
                  <td style="padding:14px 0 0;font-size:14px;font-weight:700;color:#1E3529;">Total</td>
                  <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:#1E3529;text-align:right;">${formatEuro(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;text-align:center;">
              <a href="${trackingUrl}" style="display:inline-block;background-color:#1E3529;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Suivre ma commande</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;border-top:1px solid #f0efeb;">
              <p style="margin:20px 0 4px;font-size:12px;color:#888;">Des questions ? Répondez directement à cet e-mail ou écrivez-nous sur WhatsApp.</p>
              <a href="https://wa.me/596696440404" style="color:#1E3529;font-size:12px;text-decoration:underline;">+596 696 44 04 04</a>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#999;">© PessÓra · Fort-de-France, Martinique</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOrderConfirmationEmail(
  supabase: SupabaseClient,
  orderIds: string[],
  email: string | null | undefined,
  siteUrl: string,
): Promise<void> {
  if (!email || orderIds.length === 0) return

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('[sendOrderConfirmationEmail] RESEND_API_KEY not configured, skipping email')
    return
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, client_name, order_type, pickup_time, scheduled_pickup_date, access_token, total, order_items(product_name, quantity, price_at_time)')
    .in('id', orderIds)

  if (error || !orders || orders.length === 0) {
    console.error('[sendOrderConfirmationEmail] failed to fetch orders', error)
    return
  }

  try {
    const html = buildEmailHtml(orders as OrderRow[], siteUrl.replace(/\/+$/, ''))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PessÓra <noreply@pessora.fr>',
        to: email,
        subject: `Commande confirmée n° ${orders[0].id.slice(0, 8)} — PessÓra`,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[sendOrderConfirmationEmail] Resend error:', res.status, errBody)
    }
  } catch (err) {
    // Un échec d'envoi d'email ne doit jamais faire retomber le webhook Stripe
    // (sinon Stripe retry indéfiniment un paiement déjà traité correctement).
    console.error('[sendOrderConfirmationEmail] unexpected error:', err)
  }
}
