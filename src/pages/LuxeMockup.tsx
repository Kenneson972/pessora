import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowBtn } from '../components/ui/ArrowBtn';
import { PageShell } from '../components/layout/PageShell';
import { Button, cn } from '@heroui/react';
import { ArrowRight, Search, User, ShoppingBag } from 'lucide-react';
import { PRIMARY_NAV, isPrimaryNavActive } from '../data/headerNav';
import { BrandLogo } from '../components/common/BrandLogo';

/** Carte produit — alignée site live : clair + filet ; option « avant » = ancien bloc sombre (référence). */
function MockProductCardLux({
  tag,
  name,
  macros,
  price,
  variant = 'proposed',
}: {
  tag: string;
  name: string;
  macros: string;
  price: string;
  variant?: 'current' | 'proposed';
}) {
  const isLegacyDark = variant === 'current';
  return (
    <div className={cn('flex flex-col', !isLegacyDark && 'group')}>
      <div
        className={cn(
          'relative flex aspect-[3/4] items-center justify-center overflow-hidden',
          isLegacyDark
            ? 'bg-gradient-to-b from-anthracite to-surface-hero'
            : 'bg-gradient-to-b from-surface-muted to-surface-card transition-transform duration-500 ease-out group-hover:scale-[1.02]',
        )}
      >
        <div
          className={cn(
            'rounded-[48px] transition-transform duration-500',
            isLegacyDark
              ? 'h-[82px] w-[52px] bg-white/[0.07]'
              : 'h-[100px] w-[64px] bg-white/55 group-hover:scale-105',
          )}
        />
        {!isLegacyDark && (
          <span className="absolute left-3 top-3 text-[8px] font-normal uppercase tracking-[0.2em] text-black/45">
            {tag}
          </span>
        )}
      </div>
      <div className="pt-4">
        {isLegacyDark && (
          <p className="mb-1.5 text-[8px] font-light uppercase tracking-[0.35em] text-gold-dim">{tag}</p>
        )}
        <div className="flex min-h-[2.5rem] items-start justify-between gap-2">
          <p className="text-[13px] font-normal leading-tight text-black">{name}</p>
          <span className="flex-shrink-0 text-[13px] font-normal tabular-nums text-black">{price}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-[9px] font-light tracking-[0.04em] text-black/35">{macros}</p>
      </div>
    </div>
  );
}

const LuxeMockup = () => {
  const location = useLocation();

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    const prev = meta.getAttribute('content');
    meta.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (prev) meta.setAttribute('content', prev);
      else meta.remove();
    };
  }, []);

  return (
    <div className="bg-white">
      {/* Bandeau contexte */}
      <div className="border-b border-noir/[0.06] bg-noir text-white">
        <PageShell className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] font-normal uppercase tracking-[0.28em] text-white/50">Maquette interne</p>
            <p className="mt-1 text-[13px] font-light text-white/85">
              Direction visuelle — références type Nespresso · Le Tanneur (minimalisme, finitions, grilles).
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 self-start md:self-auto">
            <Link
              to="/mockup-croquis-gerant"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.12em] text-white/85 transition-colors hover:bg-white/10"
            >
              Croquis gérant
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Retour au site
            </Link>
          </div>
        </PageShell>
      </div>

      {/* Header maquette — rangée compacte + nav façon Nespresso (grandes sections icône + pastille) */}
      <div className="border-b border-noir/[0.06] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.04)]">
        <div className="border-b border-noir/[0.05] bg-noir/[0.02]">
          <PageShell className="py-2.5 text-center">
            <p className="text-[9px] font-light uppercase tracking-[0.32em] text-black/38">
              Fort-de-France · Martinique
            </p>
          </PageShell>
        </div>

        <PageShell className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:gap-8 md:py-8 lg:gap-10">
          <Link to="/" className="flex shrink-0 justify-center md:justify-start">
            <BrandLogo height={44} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="relative mx-auto w-full max-w-xl lg:max-w-2xl">
              <Search
                size={15}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/25"
                strokeWidth={1.25}
              />
              <div
                className="flex h-11 w-full items-center rounded-full border border-noir/[0.1] bg-noir/[0.02] pl-11 pr-4 text-[12px] text-black/35 md:h-12"
                role="presentation"
              >
                Rechercher…
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:justify-end md:gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-noir/[0.12] bg-white px-4 text-[10px] font-light tracking-[0.06em] text-black/55 md:h-11 md:px-5 md:text-[11px]">
              <User size={15} strokeWidth={1.25} aria-hidden />
              Mon espace
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-noir/[0.12] bg-white md:h-11 md:w-11">
              <ShoppingBag size={17} strokeWidth={1.25} aria-hidden />
            </span>
          </div>
        </PageShell>

        {/* Navigation principale — hauteur généreuse, style Nespresso */}
        <div className="border-t border-noir/[0.06] bg-white">
          <div className="mx-auto flex max-w-7xl items-stretch justify-center gap-0.5 overflow-x-auto px-2 py-1 lg:gap-1 lg:px-8">
            {PRIMARY_NAV.map((item) => {
              const isActive = isPrimaryNavActive(location.pathname, item.path, item.matchExact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex min-h-[76px] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 transition-colors lg:min-h-[84px] lg:gap-2.5 lg:px-3',
                    isActive ? 'bg-noir/[0.05]' : 'hover:bg-noir/[0.03]'
                  )}
                >
                  <item.icon
                    size={22}
                    strokeWidth={1.2}
                    className={cn('shrink-0', isActive ? 'text-black' : 'text-black/45')}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap text-center text-[9px] font-light uppercase leading-tight tracking-[0.12em] md:text-[10px]',
                      isActive ? 'text-black' : 'text-black/40'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero — aligné Home : surface-hero + même dégradé qu’en prod */}
      <section
        className="relative flex flex-col justify-end overflow-hidden bg-surface-hero px-4 pb-12 pt-16 md:px-10 md:pb-14 lg:px-[72px] lg:pb-16"
        style={{
          height: 'clamp(380px, 64vh, 680px)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 72% 32%, color-mix(in oklch, var(--color-noir) 35%, transparent) 0%, transparent 55%)',
              'linear-gradient(162deg, var(--color-anthracite) 0%, var(--color-surface-hero) 48%, color-mix(in oklch, var(--color-surface-hero) 55%, var(--color-noir)) 100%)',
            ].join(', '),
          }}
        />
        <div className="relative max-w-3xl">
          <p className="mb-5 text-[8px] font-light tracking-[0.55em] text-white/35">Bar protéiné · Martinique</p>
          <h2
            className="font-display font-normal leading-[0.9] tracking-[-0.03em] text-white"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 6.5vw, 76px)' }}
          >
            Nourris
            <br />
            <em className="text-white/45">l’essentiel</em>
          </h2>
          <div className="mt-8">
            <ArrowBtn onDark size="lg" ariaLabel="Découvrir" />
          </div>
        </div>
      </section>

      {/* Tokens — surfaces sémantiques + noirs de marque */}
      <section className="border-y border-noir/[0.06] bg-white py-16">
        <PageShell>
          <p className="mb-8 text-[9px] font-normal uppercase tracking-[0.24em] text-black/40">Palette & surfaces (@theme)</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'surface-hero', className: 'bg-surface-hero', fg: 'text-white' },
              { label: 'surface-page', className: 'bg-surface-page border border-noir/[0.08]', fg: 'text-black' },
              { label: 'surface-muted', className: 'bg-surface-muted border border-noir/[0.06]', fg: 'text-black' },
              { label: 'surface-card', className: 'bg-surface-card border border-noir/[0.08]', fg: 'text-black' },
              { label: 'noir (texte)', className: 'bg-noir', fg: 'text-white' },
              { label: 'muted copy', className: 'bg-noir/[0.08]', fg: 'text-black' },
            ].map((c) => (
              <div key={c.label} className="flex flex-col gap-2">
                <div className={cn('flex aspect-[4/3] items-end rounded-xl p-3', c.className, c.fg)}>
                  <span className="text-[10px] font-light opacity-90">{c.label}</span>
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* Typo */}
      <section className="py-16">
        <PageShell>
          <p className="mb-10 text-[9px] font-normal uppercase tracking-[0.24em] text-black/40">Typographie</p>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-[8px] uppercase tracking-[0.45em] text-black/35">Eyebrow</p>
              <p className="text-[11px] font-light tracking-[0.2em] text-black/55">Shakes protéinés</p>
            </div>
            <div>
              <p className="mb-3 text-[8px] uppercase tracking-[0.45em] text-black/35">Display — Montserrat</p>
              <p className="font-display text-[32px] font-normal leading-none text-black" style={{ fontFamily: 'var(--font-display)' }}>
                La carte
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mb-3 text-[8px] uppercase tracking-[0.45em] text-black/35">Corps — Montserrat 300</p>
              <p className="max-w-xl text-[14px] font-light leading-relaxed text-black/55">
                Peu de styles, beaucoup d’air : une hiérarchie nette entre le titre éditorial et le texte utile,
                comme sur une page collection maroquinerie ou une landing machine Nespresso.
              </p>
            </div>
          </div>
        </PageShell>
      </section>

      {/* Comparaison cartes */}
      <section className="border-t border-noir/[0.06] bg-surface-muted py-16">
        <PageShell>
          <p className="mb-2 text-[9px] font-normal uppercase tracking-[0.24em] text-black/40">Cartes produit</p>
          <h3 className="mb-10 font-display text-[26px] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
            Avant / après
          </h3>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/45">Ancien bloc sombre</p>
              <div className="group max-w-[220px]">
                <MockProductCardLux
                  variant="current"
                  tag="Shakes"
                  name="GLAM MATCHA"
                  macros="220 kcal · 18g protéines"
                  price="14€"
                />
              </div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-normal uppercase tracking-[0.14em] text-black/45">Site actuel (clair)</p>
              <div className="group max-w-[220px]">
                <MockProductCardLux
                  variant="proposed"
                  tag="Shakes"
                  name="GLAM MATCHA"
                  macros="220 kcal · 18g protéines"
                  price="14€"
                />
              </div>
              <p className="mt-4 max-w-xs text-[11px] font-light leading-relaxed text-black/45">
                Fond <strong className="font-normal text-black/70">surface-muted → surface-card</strong>, filet fin, tag lisible sur fond clair — moins de masse noire.
              </p>
            </div>
          </div>
        </PageShell>
      </section>

      {/* Grille 3 colonnes — univers */}
      <section className="py-16">
        <PageShell>
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[9px] font-normal uppercase tracking-[0.24em] text-black/40">Nos univers</p>
              <h3 className="font-display text-[clamp(28px,4vw,40px)] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
                Trois colonnes
              </h3>
            </div>
            <Button variant="ghost" className="h-10 rounded-full border border-noir/12 px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55">
              Tout explorer <ArrowRight size={12} className="ml-1" strokeWidth={1.25} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-[2px] md:grid-cols-3">
            {[
              { eyebrow: 'Nutrition', t: 'Shakes', em: '& gauffres' },
              { eyebrow: 'Communauté', t: 'Run', em: 'Club' },
              { eyebrow: 'Bien-être', t: 'Bilan', em: '30 min' },
            ].map((u) => (
              <div
                key={u.t}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden bg-gradient-to-br from-surface-muted to-surface-card transition-transform duration-700 ease-out hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-noir/[0.06] to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between px-7 pb-8 pt-6">
                  <p className="text-[7px] font-light uppercase tracking-[0.5em] text-black/38">{u.eyebrow}</p>
                  <div>
                    <p
                      className="mb-2.5 font-normal uppercase leading-[1.05] tracking-[0.06em] text-black"
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.6vw, 34px)' }}
                    >
                      {u.t}
                      <br />
                      <span className="text-black/50">{u.em}</span>
                    </p>
                    <span className="text-[8px] font-light uppercase tracking-[0.3em] text-black/50 transition-opacity group-hover:text-black/80">
                      Découvrir
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      {/* Filtres style menu */}
      <section className="border-t border-noir/[0.06] py-12">
        <PageShell>
          <p className="mb-4 text-[9px] font-normal uppercase tracking-[0.24em] text-black/40">Filtres discrets</p>
          <div className="flex flex-wrap gap-2">
            {['Tout', 'Protéine', 'Faible calories', 'Végétalien'].map((f, i) => (
              <button
                key={f}
                type="button"
                className={cn(
                  'h-11 rounded-full border px-4 text-[10px] font-light transition-colors',
                  i === 0 ? 'border-noir bg-noir text-white' : 'border-noir/12 text-black/45 hover:border-noir/25 hover:text-black'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </PageShell>
      </section>

      {/* CTA final — bande claire + filets (aligné Home) */}
      <section className="border-t border-noir/[0.06] bg-surface-muted py-20 text-center text-black">
        <PageShell>
          <p className="mb-4 text-[9px] font-normal uppercase tracking-[0.28em] text-black/40">Prochaine étape</p>
          <h3 className="mx-auto mb-8 max-w-lg font-display text-[clamp(26px,3.5vw,36px)] font-normal leading-tight text-black" style={{ fontFamily: 'var(--font-display)' }}>
            Valider les tokens & composants, puis déployer sur les pages live.
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center rounded-full bg-noir px-8 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite"
            >
              Voir la carte actuelle
            </Link>
            <a
              href="https://www.nespresso.com/fr/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-noir/[0.18] px-8 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-black/75 transition-colors hover:bg-noir hover:text-white"
            >
              Réf. Nespresso
            </a>
          </div>
        </PageShell>
      </section>
    </div>
  );
};

export default LuxeMockup;
