import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCookieConsent } from '../../contexts/CookieConsentContext';

export function CookieConsentBanner() {
  const {
    consent,
    showBanner,
    showCustomize,
    setShowCustomize,
    acceptAll,
    rejectOptional,
    saveCustom,
  } = useCookieConsent();

  const [fn, setFn] = useState(consent?.functional ?? true);
  const [an, setAn] = useState(consent?.analytics ?? false);

  useEffect(() => {
    if (showCustomize && consent) {
      setFn(consent.functional);
      setAn(consent.analytics);
    }
  }, [showCustomize, consent]);

  if (!showBanner && !showCustomize) return null;

  const persistSave = () => {
    saveCustom(fn, an);
  };

  return (
    <>
      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-noir/[0.08] bg-white/95 px-4 py-4 shadow-[0_-8px_40px_rgba(0,0,0,0.08)] backdrop-blur-md md:px-8"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="min-w-0 flex-1">
              <p id="cookie-consent-title" className="text-[10px] font-normal uppercase tracking-[0.18em] text-black/40">
                Cookies & données
              </p>
              <p className="mt-1.5 text-[12px] font-light leading-relaxed text-black/60">
                Nous utilisons des cookies et le stockage local pour le panier et, avec votre accord, des mesures
                d’audience. Consultez notre{' '}
                <Link to="/politique-confidentialite" className="text-editorial-link-underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="h-10 min-h-10 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir/30 hover:text-black"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="h-10 min-h-10 rounded-full border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-colors hover:border-noir/30 hover:text-black"
              >
                Nécessaires uniquement
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="h-10 min-h-10 rounded-full bg-noir px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomize && (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-noir/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-custom-title"
        >
          <div className="relative w-full max-w-md rounded-[2px] border border-noir/[0.08] bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-noir/[0.06] hover:text-black"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <h2 id="cookie-custom-title" className="pr-10 font-display text-lg font-normal text-black">
              Paramètres des cookies
            </h2>
            <p className="mt-2 text-[11px] font-light leading-relaxed text-black/50">
              Détail dans la{' '}
              <Link to="/politique-confidentialite" className="text-editorial-link-underline" onClick={() => setShowCustomize(false)}>
                politique de confidentialité
              </Link>
              .
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex gap-3 border-b border-noir/[0.06] pb-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-normal text-black">Strictement nécessaires</span>
                  <span className="mt-0.5 block text-[10px] font-light text-black/45">
                    Sécurisation de la session, panier si vous l’activez ci-dessous.
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-normal uppercase tracking-[0.1em] text-black/35">Toujours actifs</span>
              </li>
              <li className="flex items-start gap-3">
                <input
                  id="cookie-fn"
                  type="checkbox"
                  checked={fn}
                  onChange={(e) => setFn(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-noir/25 accent-noir"
                />
                <label htmlFor="cookie-fn" className="min-w-0 cursor-pointer">
                  <span className="block text-[11px] font-normal text-black">Préférences & panier</span>
                  <span className="mt-0.5 block text-[10px] font-light text-black/45">
                    Mémoriser votre panier sur cet appareil.
                  </span>
                </label>
              </li>
              <li className="flex items-start gap-3">
                <input
                  id="cookie-an"
                  type="checkbox"
                  checked={an}
                  onChange={(e) => setAn(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-noir/25 accent-noir"
                />
                <label htmlFor="cookie-an" className="min-w-0 cursor-pointer">
                  <span className="block text-[11px] font-normal text-black">Statistiques</span>
                  <span className="mt-0.5 block text-[10px] font-light text-black/45">
                    Audience anonymisée — non utilisée tant qu’aucun outil n’est branché.
                  </span>
                </label>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="h-10 min-h-10 rounded-full border border-noir/12 px-4 text-[10px] font-normal uppercase tracking-[0.12em] text-black/50 hover:border-noir/25"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={persistSave}
                className="h-10 min-h-10 rounded-full bg-noir px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
