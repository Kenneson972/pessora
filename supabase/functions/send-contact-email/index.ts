// supabase/functions/send-contact-email/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { z } from 'npm:zod@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ContactSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  message: z.string().min(1, 'Message requis'),
  type: z.string().optional().default('info'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Données invalides', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, message, type } = parsed.data;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('[send-contact-email] RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service d\'envoi non configuré' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        from: 'PessÓra <noreply@pessora.mq>',
        to: 'pessora.mq@gmail.com',
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-contact-email]', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
