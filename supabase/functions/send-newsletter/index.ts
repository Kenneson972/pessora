// supabase/functions/send-newsletter/index.ts
//
// Lit newsletter_sendable (jamais la table brute — arbitrage #4 du brief) : une
// exclusion (test-%, désinscrit, consent=false) posée uniquement dans la table
// serait purement décorative si cette fonction continuait de lire à côté.
//
// Une ligne par destinataire dans newsletter_sends (jamais un compteur agrégé) :
// c'est CETTE table qui fait foi sur qui a reçu quoi, jamais la réponse HTTP.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { getCorsHeaders } from '../_shared/cors.ts';

const NewSchema = z.object({
  subject: z.string().min(1, 'Sujet requis').max(200),
  body: z.string().min(1, 'Contenu requis').max(50000),
  image_url: z.string().url().optional().or(z.literal('')),
});
const ResumeSchema = z.object({ campaignId: z.string().uuid() });
const RequestSchema = z.union([NewSchema, ResumeSchema]);

const BATCH_SIZE = 100;

async function verifyAdmin(req: Request, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

async function idempotencyKeyFor(campaignId: string, subscriberIds: string[]): Promise<string> {
  const material = `${campaignId}:${subscriberIds.slice().sort().join(',')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `newsletter-${hex.slice(0, 40)}`;
}

function renderHtml(opts: { subject: string; body: string; imageUrl?: string | null; logoUrl: string; unsubscribeUrl: string }): string {
  const safeBody = opts.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  const imageBlock = opts.imageUrl
    ? `<tr><td style="padding:0;"><img src="${opts.imageUrl}" alt="" style="width:100%;max-width:520px;height:auto;display:block;margin:0 auto 24px;border-radius:2px;" /></td></tr>`
    : '';
  // "Se désinscrire" : #3a3a3a (~10:1 sur blanc) — jamais le #888 utilisé pour le
  // reste du pied de mail, cf. brief §4.3 (le lien de sortie ne peut pas être le
  // texte le plus pâle du mail).
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#f9f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f7f4;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:2px;overflow:hidden;"><tr><td style="background-color:#1E3529;padding:32px 40px 28px;text-align:center;"><img src="${opts.logoUrl}" alt="PessÓra" style="max-width:100px;height:auto;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" /><p style="margin:0;color:rgba(255,255,255,0.55);font-size:12px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;">Bar Protéiné & Bien-Être</p></td></tr>${imageBlock}<tr><td style="padding:36px 32px;"><h2 style="margin:0 0 16px;color:#1E3529;font-family:Georgia,serif;font-size:20px;font-weight:400;">${opts.subject}</h2><p style="margin:0;color:#3a3a3a;font-size:15px;line-height:1.7;">${safeBody}</p></td></tr><tr><td style="background-color:#f5f3f0;padding:20px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.04);"><p style="margin:0 0 4px;color:#1E3529;font-family:Georgia,serif;font-size:13px;font-weight:600;">PessÓra</p><p style="margin:0;color:#888;font-size:11px;">C.C. La Véranda – Cluny, 97200 Fort-de-France</p><p style="margin:8px 0 0;color:#3a3a3a;font-size:13px;line-height:1.6;">Vous recevez cet e-mail car vous vous êtes inscrit·e à la newsletter de PessÓra.</p><p style="margin:6px 0 0;font-size:13px;"><a href="${opts.unsubscribeUrl}" style="color:#3a3a3a;text-decoration:underline;">Se désinscrire</a></p></td></tr></table></td></tr></table></body></html>`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!await verifyAdmin(req, supabase)) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Données invalides', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Service d'envoi non configuré" }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let campaignId: string;
    let subject: string;
    let campaignBody: string;
    let imageUrl: string | null;

    if ('campaignId' in parsed.data) {
      // Reprise : le sujet/corps/image viennent de la campagne existante, jamais
      // redemandés au client (source unique de vérité).
      campaignId = parsed.data.campaignId;
      const { data: campaign, error: campaignErr } = await supabase
        .from('newsletter_campaigns')
        .select('subject, body, image_url')
        .eq('id', campaignId)
        .single();
      if (campaignErr || !campaign) {
        return new Response(JSON.stringify({ error: 'Campagne introuvable' }), {
          status: 404,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      subject = campaign.subject;
      campaignBody = campaign.body;
      imageUrl = campaign.image_url;
    } else {
      subject = parsed.data.subject;
      campaignBody = parsed.data.body;
      imageUrl = parsed.data.image_url || null;

      const { data: campaign, error: campaignErr } = await supabase
        .from('newsletter_campaigns')
        .insert({ subject, body: campaignBody, image_url: imageUrl })
        .select('id')
        .single();
      if (campaignErr || !campaign) {
        console.error('[send-newsletter] insert campaign failed:', campaignErr?.message);
        return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      campaignId = campaign.id;

      // La vue est LE plan de travail figé au lancement — pas une re-sélection à la
      // volée pendant la boucle d'envoi.
      const { data: sendable, error: sendableErr } = await supabase
        .from('newsletter_sendable')
        .select('id');
      if (sendableErr) {
        console.error('[send-newsletter] read newsletter_sendable failed:', sendableErr.message);
        return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      if (sendable?.length) {
        const rows = sendable.map((s: { id: string }) => ({ campaign_id: campaignId, subscriber_id: s.id }));
        // onConflict : la contrainte unique(campaign_id, subscriber_id) empêche tout
        // doublon même en cas de double appel concurrent sur une campagne neuve.
        const { error: insertSendsErr } = await supabase
          .from('newsletter_sends')
          .upsert(rows, { onConflict: 'campaign_id,subscriber_id', ignoreDuplicates: true });
        if (insertSendsErr) {
          console.error('[send-newsletter] insert newsletter_sends failed:', insertSendsErr.message);
          return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
            status: 500,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // À traiter : pending/failed/unknown — jamais les lignes déjà `sent` (reprise
    // idempotente, cf. contrainte unique ci-dessus).
    const { data: toSend, error: toSendErr } = await supabase
      .from('newsletter_sends')
      .select('id, subscriber_id, newsletter_subscribers!inner(email, token)')
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'failed', 'unknown']);

    if (toSendErr) {
      console.error('[send-newsletter] read newsletter_sends failed:', toSendErr.message);
      return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const logoUrl = `${supabaseUrl}/storage/v1/object/public/asset/O.PNG`;
    const siteUrl = 'https://www.pessora.fr';

    type Recipient = { sendId: string; subscriberId: string; email: string; token: string };
    const recipients: Recipient[] = (toSend ?? []).map((row: any) => ({
      sendId: row.id,
      subscriberId: row.subscriber_id,
      email: row.newsletter_subscribers.email,
      token: row.newsletter_subscribers.token,
    }));

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const idempotencyKey = await idempotencyKeyFor(campaignId, chunk.map((r) => r.subscriberId));

      const payload = chunk.map((r) => {
        const unsubscribeUrl = `${siteUrl}/newsletter/desinscription?token=${r.token}`;
        return {
          from: 'PessÓra <noreply@pessora.fr>',
          to: r.email,
          subject,
          text: campaignBody,
          html: renderHtml({ subject, body: campaignBody, imageUrl, logoUrl, unsubscribeUrl }),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        };
      });

      let outcome: 'sent' | 'failed' | 'unknown';
      let resendIds: (string | null)[] = chunk.map(() => null);
      let errorMessage: string | null = null;

      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json().catch(() => null);
          const data = json?.data;
          if (Array.isArray(data) && data.length === chunk.length) {
            outcome = 'sent';
            resendIds = data.map((d: { id?: string }) => d?.id ?? null);
          } else {
            // Réponse 2xx mais forme inattendue : on ne peut pas confirmer — jamais
            // classé "sent" sans un id de message lisible.
            outcome = 'unknown';
          }
        } else {
          // Erreur HTTP lisible (4xx/5xx avec corps) : rejet explicite du lot entier,
          // rien n'est parti — c'est un vrai `failed`, pas un `unknown`.
          const errText = await res.text().catch(() => '');
          outcome = 'failed';
          errorMessage = `Resend ${res.status}: ${errText.slice(0, 500)}`;
        }
      } catch (e) {
        // Timeout, coupure réseau, réponse illisible : jamais un échec confirmé.
        outcome = 'unknown';
        errorMessage = e instanceof Error ? e.message : String(e);
      }

      await Promise.all(
        chunk.map((r, idx) =>
          supabase
            .from('newsletter_sends')
            .update({
              status: outcome,
              resend_id: resendIds[idx],
              error: outcome === 'failed' || outcome === 'unknown' ? errorMessage : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', r.sendId)
        )
      );
    }

    // Recompté en base juste avant de répondre — jamais accumulé en mémoire pendant
    // la boucle (un crash à mi-parcours ne doit pas fausser la réponse).
    const { data: counts, error: countsErr } = await supabase
      .from('newsletter_sends')
      .select('status')
      .eq('campaign_id', campaignId);

    if (countsErr) {
      console.error('[send-newsletter] recount failed:', countsErr.message);
      return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tally = { total: counts?.length ?? 0, sent: 0, failed: 0, unknown: 0, pending: 0 };
    for (const row of counts ?? []) {
      const key = row.status as 'sent' | 'failed' | 'unknown' | 'pending';
      if (key in tally) tally[key as 'sent' | 'failed' | 'unknown' | 'pending']++;
    }

    return new Response(
      JSON.stringify({ campaignId, total: tally.total, sent: tally.sent, failed: tally.failed, unknown: tally.unknown }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-newsletter]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
