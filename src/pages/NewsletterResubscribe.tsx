import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { supabase } from '../lib/supabaseClient';

type Screen = 'confirm' | 'sending' | 'resubscribed' | 'invalid';

const NewsletterResubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [screen, setScreen] = useState<Screen>(token ? 'confirm' : 'invalid');

  useEffect(() => {
    document.title = 'Confirmer votre réinscription — PessÓra';
  }, []);

  const confirmResubscribe = async () => {
    if (!token) return;
    setScreen('sending');
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-resubscribe', {
        method: 'POST',
        body: { token },
      });
      if (error || data?.outcome !== 'resubscribed') {
        setScreen('invalid');
        return;
      }
      setScreen('resubscribed');
    } catch {
      setScreen('invalid');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 pt-8 md:pt-12">
      <PageShell>
        <div className="mx-auto max-w-md text-center">
          {screen === 'confirm' && (
            <>
              <h1
                className="mb-4 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 32px)' }}
              >
                Confirmer votre réinscription
              </h1>
              <p className="mb-8 text-[14px] font-normal leading-relaxed text-black/70">
                Vous allez de nouveau recevoir la newsletter de PessÓra. Rien n&rsquo;a encore été
                modifié — confirmez ci-dessous.
              </p>
              <button
                type="button"
                onClick={confirmResubscribe}
                className="mb-3 inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-sapin px-6 text-[12px] font-normal uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-10"
              >
                Confirmer mon inscription
              </button>
              <div>
                <Link
                  to="/"
                  className="inline-flex h-11 min-h-[44px] items-center justify-center px-4 text-[12px] font-normal text-black/70 underline underline-offset-4 hover:text-black"
                >
                  Non merci
                </Link>
              </div>
            </>
          )}

          {screen === 'sending' && (
            <p className="text-[14px] font-normal text-black/70">Un instant…</p>
          )}

          {screen === 'resubscribed' && (
            <>
              <h1
                className="mb-4 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 32px)' }}
              >
                Vous êtes de nouveau inscrit·e
              </h1>
              <p className="mb-8 text-[14px] font-normal leading-relaxed text-black/70">
                Vous recevrez de nouveau la newsletter de PessÓra.
              </p>
              <Link
                to="/"
                className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-full border border-noir/[0.14] px-8 text-[12px] font-normal uppercase tracking-[0.14em] text-black/70 hover:border-noir/30 hover:text-black"
              >
                Retour au site
              </Link>
            </>
          )}

          {screen === 'invalid' && (
            <>
              <h1
                className="mb-4 font-display font-normal tracking-[-0.02em] text-black"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 32px)' }}
              >
                Ce lien n&rsquo;est plus valide
              </h1>
              <p className="mb-8 text-[14px] font-normal leading-relaxed text-black/70">
                Il a peut-être déjà été utilisé. Vous pouvez vous réinscrire depuis le site.
              </p>
              <Link
                to="/"
                className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-full border border-noir/[0.14] px-8 text-[12px] font-normal uppercase tracking-[0.14em] text-black/70 hover:border-noir/30 hover:text-black"
              >
                Retour au site
              </Link>
            </>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default NewsletterResubscribe;
