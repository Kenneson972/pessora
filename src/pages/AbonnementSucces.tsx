// src/pages/AbonnementSucces.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/layout/PageShell';

type Status = 'loading' | 'processed' | 'pending' | 'error';

const AbonnementSucces = () => {
  useEffect(() => { document.title = 'Abonnement confirmé — PessÓra'; }, []);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    supabase.functions
      .invoke('verify-subscription-session', { body: { session_id: sessionId } })
      .then(({ data, error }) => {
        if (error || !data) { setStatus('pending'); return; }
        setStatus(data.status === 'active' ? 'processed' : 'pending');
      })
      .catch(() => setStatus('pending'));
  }, [sessionId]);

  return (
    <PageShell className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        {status === 'loading' && (
          <p className="text-[13px] text-[#1E3529]/60 animate-pulse">Activation en cours…</p>
        )}

        {status === 'processed' && (
          <>
            <CheckCircle
              className="mx-auto mb-8 h-12 w-12 text-[#1E3529]/70"
              strokeWidth={1}
              aria-hidden
            />
            <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.22em] text-[#1E3529]/60">
              Bienvenue dans
            </p>
            <h1
              className="font-display font-normal leading-none text-[#1E3529]"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
            >
              Óra+
            </h1>
            <p className="mt-6 text-[14px] font-light leading-relaxed text-black/55">
              Votre abonnement est confirmé. Un email vous a été envoyé —
              cliquez sur le lien pour accéder à votre espace membre.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-noir/15 px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-black"
            >
              Retour à l'accueil
            </Link>
          </>
        )}

        {(status === 'pending' || status === 'error') && (
          <>
            <h1 className="font-display text-[32px] font-normal leading-none text-[#1E3529]">
              Merci !
            </h1>
            <p className="mt-4 text-[13px] font-light leading-relaxed text-black/55">
              Paiement reçu. L'activation de votre Óra+ peut prendre quelques minutes.
              Vérifiez votre email.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-noir/15 px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-black"
            >
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default AbonnementSucces;
