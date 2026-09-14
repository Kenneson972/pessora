// supabase/functions/send-contact-email/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const ContactSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  message: z.string().min(1, 'Message requis'),
  type: z.string().optional().default('info'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get("origin")) });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json", "Retry-After": "60" },
      })
    }

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Données invalides', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
      });
    }

    const { name, email, message, type } = parsed.data;

    // Trace en base AVANT la tentative d'envoi — un Resend qui échoue ou une clé API absente ne
    // doit jamais faire disparaître le message. Best-effort : si l'insert échoue, on log et on
    // continue quand même vers l'email (mieux vaut un email sans trace qu'aucun des deux).
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: insertError } = await supabase
        .from('contact_requests')
        .insert({ type, nom: name, email, message });
      if (insertError) {
        console.error('[send-contact-email] insert contact_requests failed:', insertError.message);
      }
    } catch (e) {
      console.error('[send-contact-email] insert contact_requests threw:', e);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('[send-contact-email] RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service d\'envoi non configuré' }), {
        status: 503,
        headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
      });
    }

    const typeLabels: Record<string, string> = {
      info: 'Information',
      reservation: 'Réservation',
      partenariat: 'Partenariat',
      autre: 'Autre',
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PessÓra <noreply@pessora.fr>',
        to: Deno.env.get("ADMIN_EMAIL") ?? "pessora.fr@gmail.com",
        reply_to: email,
        subject: `[PessÓra Contact] ${typeLabels[type] ?? 'Information'} — ${name}`,
        text: `Nouveau message depuis le formulaire de contact PessÓra

Type : ${typeLabels[type] ?? type}
Nom : ${name}
Email : ${email}

Message :
${message}`,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[send-contact-email] Resend error:', res.status, errBody);
      return new Response(JSON.stringify({ error: 'Erreur lors de l\'envoi' }), {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-contact-email]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get("origin")), 'Content-Type': 'application/json' },
    });
  }
});
