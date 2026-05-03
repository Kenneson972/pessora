import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { fetchActiveSiteAnnouncement } from '../../lib/siteAnnouncement';
import type { SiteAnnouncement } from '../../types/database';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Pages où l’annonce plein écran peut s’afficher (accueil + tunnel événements). */
export function isAnnouncementPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/evenements') return true;
  if (pathname.startsWith('/evenements/')) return true;
  return false;
}

function isDismissed(a: SiteAnnouncement): boolean {
  if (typeof window === 'undefined') return false;
  if (a.dismiss_mode === 'once_session') {
    return Boolean(sessionStorage.getItem(`pessora_popup_seen_${a.id}`));
  }
  return localStorage.getItem(`pessora_popup_dismissed_${a.id}`) === getTodayStr();
}

function markDismissed(a: SiteAnnouncement): void {
  if (a.dismiss_mode === 'once_session') {
    sessionStorage.setItem(`pessora_popup_seen_${a.id}`, '1');
  } else {
    localStorage.setItem(`pessora_popup_dismissed_${a.id}`, getTodayStr());
  }
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm backdrop-blur-sm transition-colors hover:bg-neutral-100"
      aria-label="Fermer"
    >
      <X size={18} strokeWidth={1.5} />
    </button>
  );
}

function FeaturedLayout({ a, onClose, onCta }: { a: SiteAnnouncement; onClose: () => void; onCta: () => void }) {
  return (
    <div
      className="relative flex max-h-[min(85dvh,640px)] w-full flex-col overflow-hidden rounded-[2px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.2)] md:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      <CloseBtn onClose={onClose} />
      <div className="relative h-56 w-full shrink-0 overflow-hidden bg-neutral-100 md:h-auto md:min-h-[300px] md:w-[46%]">
        {a.image_url ? (
          <img src={a.image_url} alt={a.title} width={800} height={600} loading="lazy" className="h-full w-full object-cover" style={{ filter: 'brightness(0.98) saturate(0.98)' }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-30"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M17 10H7l-1 12h12l-1-12z"/><path d="M9 10V3h6v7"/></svg></div>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-r from-transparent to-white md:block" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 md:py-12">
        <p className="mb-4 text-[10px] font-normal uppercase tracking-[0.35em] text-black/50">
          {a.subtitle || 'Pessóra · Coup de projecteur'}
        </p>
        <div className="mb-6 h-px w-8 bg-black/15" />
        <h2 className="mb-4 font-display text-3xl font-normal leading-tight text-black sm:text-4xl">{a.title}</h2>
        {a.message && (
          <p className="mb-6 max-w-xl text-sm sm:text-base leading-relaxed text-black/60 line-clamp-4">{a.message}</p>
        )}
        {a.price != null && (
          <p className="mb-6 font-display text-3xl text-black">
            {a.price.toFixed(2).replace('.', ',')}&thinsp;€
          </p>
        )}
        {a.cta_label && (
          <button
            type="button"
            onClick={onCta}
            className="mb-4 w-full max-w-xs rounded-[2px] bg-black py-3.5 min-h-12 text-[11px] font-normal uppercase tracking-[0.14em] text-white transition-opacity hover:bg-black/85"
          >
            {a.cta_label}
          </button>
        )}
        <button type="button" onClick={onClose} className="inline-flex items-center min-h-[44px] text-left text-[11px] font-light tracking-wide text-black/40 hover:text-black/60">
          Pas maintenant
        </button>
      </div>
    </div>
  );
}

function PromoLayout({ a, onClose, onCta }: { a: SiteAnnouncement; onClose: () => void; onCta: () => void }) {
  return (
    <div
      className="relative flex max-h-[min(85dvh,600px)] w-full flex-col overflow-hidden rounded-[2px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.2)] md:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      <CloseBtn onClose={onClose} />
      {a.image_url && (
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-neutral-100 md:h-auto md:min-h-[260px] md:w-[44%]">
          <img src={a.image_url} alt={a.title} width={800} height={600} loading="lazy" className="h-full w-full object-cover" style={{ filter: 'brightness(0.98) saturate(0.98)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-r from-transparent to-white md:block" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 md:py-12">
        {a.subtitle && (
          <span className="mb-4 inline-block self-start rounded-full border border-black/12 bg-black/[0.04] px-3 py-1 text-[9px] font-normal uppercase tracking-[0.2em] text-black/70">
            {a.subtitle}
          </span>
        )}
        <div className="mb-5 h-px w-8 bg-black/15" />
        <h2 className="mb-4 font-display text-3xl font-normal leading-tight text-black sm:text-4xl">{a.title}</h2>
        {a.message && <p className="mb-6 max-w-xl text-sm sm:text-base leading-relaxed text-black/60 line-clamp-4">{a.message}</p>}
        {a.expires_at && (
          <p className="mb-6 text-[11px] tracking-wide text-black/45">
            Jusqu&apos;au{' '}
            {new Date(`${a.expires_at}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        )}
        {a.cta_label && (
          <button
            type="button"
            onClick={onCta}
            className="mb-4 w-full max-w-xs rounded-[2px] bg-black py-3.5 min-h-12 text-[11px] font-normal uppercase tracking-[0.14em] text-white transition-opacity hover:bg-black/85"
          >
            {a.cta_label}
          </button>
        )}
        <button type="button" onClick={onClose} className="inline-flex items-center min-h-[44px] text-left text-[11px] font-light tracking-wide text-black/40 hover:text-black/60">
          Pas maintenant
        </button>
      </div>
    </div>
  );
}

function EventLayout({ a, onClose, onCta }: { a: SiteAnnouncement; onClose: () => void; onCta: () => void }) {
  return (
    <div
      className="relative flex max-h-[min(85dvh,600px)] w-full flex-col overflow-hidden rounded-[2px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.2)] md:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      <CloseBtn onClose={onClose} />
      {a.image_url && (
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-neutral-100 md:h-auto md:min-h-[260px] md:w-[44%]">
          <img src={a.image_url} alt={a.title} width={800} height={600} loading="lazy" className="h-full w-full object-cover" style={{ filter: 'brightness(0.98) saturate(0.98)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-r from-transparent to-white md:block" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 md:py-12">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xl text-black/35" aria-hidden>
            ✦
          </span>
          {a.subtitle && (
            <span className="text-[10px] font-normal uppercase tracking-[0.28em] text-black/50">{a.subtitle}</span>
          )}
        </div>
        <div className="mb-5 h-px w-8 bg-black/15" />
        <h2 className="mb-4 font-display text-3xl font-normal leading-tight text-black sm:text-4xl">{a.title}</h2>
        {a.message && <p className="mb-6 max-w-xl text-sm sm:text-base leading-relaxed text-black/60 line-clamp-4">{a.message}</p>}
        {a.expires_at && (
          <p className="mb-6 text-sm font-light text-black/65">
            {new Date(`${a.expires_at}T12:00:00`).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}
        {a.cta_label && (
          <button
            type="button"
            onClick={onCta}
            className="mb-4 w-full max-w-xs rounded-[2px] bg-black py-3.5 min-h-12 text-[11px] font-normal uppercase tracking-[0.14em] text-white transition-opacity hover:bg-black/85"
          >
            {a.cta_label}
          </button>
        )}
        <button type="button" onClick={onClose} className="inline-flex items-center min-h-[44px] text-left text-[11px] font-light tracking-wide text-black/40 hover:text-black/60">
          Pas maintenant
        </button>
      </div>
    </div>
  );
}

function AlertLayout({ a, onClose }: { a: SiteAnnouncement; onClose: () => void }) {
  return (
    <div
      className="relative w-full max-w-[min(520px,94vw)] overflow-hidden rounded-[2px] border border-black/10 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.2)]"
      onClick={(e) => e.stopPropagation()}
    >
      <CloseBtn onClose={onClose} />
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-black/[0.04]">
          <AlertTriangle size={28} className="text-black/75" aria-hidden />
        </div>
        <div className="mb-6 h-px w-8 bg-black/15" />
        <h2 className="mb-4 font-display text-2xl font-normal text-black sm:text-3xl">{a.title}</h2>
        {a.message && <p className="mb-8 max-w-[340px] text-sm leading-relaxed text-black/60">{a.message}</p>}
        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-xs rounded-[2px] bg-black py-3.5 text-[11px] font-normal uppercase tracking-[0.14em] text-white transition-opacity hover:bg-black/85"
        >
          {a.cta_label || 'Compris'}
        </button>
      </div>
    </div>
  );
}

export function AnnouncementPopup() {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAnnouncementPath(location.pathname)) {
      setShow(false);
      return;
    }
    let cancelled = false;
    fetchActiveSiteAnnouncement().then((row) => {
      if (cancelled || !row) return;
      if (isDismissed(row)) return;
      setAnnouncement(row);
      setShow(true);
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const handleClose = () => {
    if (announcement) markDismissed(announcement);
    setShow(false);
  };

  const handleCta = () => {
    if (!announcement?.cta_url) return;
    handleClose();
    const url = announcement.cta_url.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(url.startsWith('/') ? url : `/${url}`);
  };

  if (!isAnnouncementPath(location.pathname)) return null;

  return (
    <AnimatePresence>
      {show && announcement && (
        <motion.div
          key="overlay"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.32 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8"
          style={{ background: 'rgba(8, 6, 5, 0.82)', backdropFilter: 'blur(4px)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
          onClick={handleClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[min(60rem,94vw)] min-w-0"
          >
            {announcement.type === 'featured' && (
              <FeaturedLayout a={announcement} onClose={handleClose} onCta={handleCta} />
            )}
            {announcement.type === 'promo' && (
              <PromoLayout a={announcement} onClose={handleClose} onCta={handleCta} />
            )}
            {announcement.type === 'event' && (
              <EventLayout a={announcement} onClose={handleClose} onCta={handleCta} />
            )}
            {announcement.type === 'alert' && <AlertLayout a={announcement} onClose={handleClose} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
