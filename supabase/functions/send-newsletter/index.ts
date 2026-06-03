// supabase/functions/send-newsletter/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.pessora.fr",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NewsletterSchema = z.object({
  subject: z.string().min(1, 'Sujet requis').max(200),
  body: z.string().min(1, 'Contenu requis').max(50000),
  image_url: z.string().url().optional().or(z.literal('')),
});

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!await verifyAdmin(req)) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = NewsletterSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Données invalides', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, body: textBody, image_url } = parsed.data;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Service d\'envoi non configuré' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les abonnés
    const { data: subscribers, error: dbError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .order('created_at', { ascending: true });

    if (dbError) {
      return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscribers?.length) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emails = subscribers.map((s: { email: string }) => s.email);
    const safeBody = textBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const imageBlock = image_url
      ? `<img src="${image_url}" alt="" style="width:100%;max-width:520px;height:auto;display:block;margin:0 auto 24px;border-radius:2px;" />`
      : '';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#f9f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f7f4;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:2px;overflow:hidden;"><tr><td style="background-color:#1E3529;padding:32px 40px 28px;text-align:center;"><img src="https://tulhiipucrnyejheuitv.supabase.co/storage/v1/object/public/asset/O.PNG" alt="PessÓra" style="max-width:100px;height:auto;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" /><p style="margin:0;color:rgba(255,255,255,0.55);font-size:12px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;">Bar Protéiné & Bien-Être</p></td></tr>${image_url ? `<tr><td style="padding:0;">${imageBlock}</td></tr>` : ''}<tr><td style="padding:36px 32px;"><h2 style="margin:0 0 16px;color:#1E3529;font-family:Georgia,serif;font-size:20px;font-weight:400;">${subject}</h2><p style="margin:0;color:#3a3a3a;font-size:15px;line-height:1.7;">${safeBody}</p></td></tr><tr><td style="background-color:#f5f3f0;padding:20px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.04);"><p style="margin:0 0 4px;color:#1E3529;font-family:Georgia,serif;font-size:13px;font-weight:600;">PessÓra</p><p style="margin:0;color:#888;font-size:11px;">C.C. La Véranda – Cluny, 97200 Fort-de-France</p><p style="margin:4px 0 0;color:#888;font-size:11px;">Vous recevez cet email car vous êtes inscrit à la newsletter. <a href="https://www.pessora.fr" style="color:#1E3529;">pessora.fr</a></p></td></tr></table></td></tr></table></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PessÓra <noreply@pessora.fr>',
        to: 'noreply@pessora.fr',
        bcc: emails,
        subject,
        text: textBody,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[send-newsletter] Resend error:', res.status, errBody);
      return new Response(JSON.stringify({ error: 'Erreur lors de l\'envoi' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, count: emails.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-newsletter]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
