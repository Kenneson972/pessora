import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { EmptyState } from '@heroui-pro/react';
import { barInfo } from '../data/infoData';

const NotFound = () => {
  useEffect(() => {
    document.title = 'Page introuvable — PessÓra';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'La page demandée n’existe pas ou a été déplacée. Retournez à l’accueil PessÓra.');
  }, []);

  return (
    <div className="min-h-[70vh] bg-surface-page px-4 py-16 sm:py-24">
      <EmptyState size="lg" className="mx-auto max-w-lg text-center">
        <EmptyState.Header>
          <p className="text-editorial-section-title text-black/40">404</p>
          <EmptyState.Title
            className="font-display font-normal leading-[1.05] tracking-[-0.02em] text-noir"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 5vw, 2.25rem)' }}
          >
            Cette page n’existe pas
          </EmptyState.Title>
          <EmptyState.Description className="mx-auto max-w-md text-[14px] font-light leading-relaxed text-black/45">
            L’adresse a peut-être changé, ou le lien est incomplet. Retournez à l’accueil ou écrivez-nous.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content className="flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-noir px-8 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
          >
            <Home size={16} strokeWidth={1.5} aria-hidden />
            Accueil
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-noir/15 px-8 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/30 hover:text-noir"
          >
            Contact
          </Link>
        </EmptyState.Content>
      </EmptyState>

      <div className="mx-auto mt-12 max-w-lg text-center">
        <p className="text-[10px] font-light uppercase tracking-[0.2em] text-black/30">
          {barInfo.name} · {barInfo.address.city}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-[11px] font-light text-black/40 transition-colors hover:text-noir"
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
          Retour au site
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
