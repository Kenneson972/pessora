import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, Mail, ShoppingBag, User } from 'lucide-react';
import { cn } from '@heroui/react';
import { PageShell } from '../components/layout/PageShell';
import { BrandLogo } from '../components/common/BrandLogo';

/** Bandeau type carte du croquis — DA site : filets fins, typo Montserrat, labels uppercase. */
function SketchCard({
  label,
  header,
  children,
  className,
}: {
  label?: string;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-[24px] border border-noir/[0.08] bg-surface-card shadow-[0_4px_32px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      {label && (
        <p className="border-b border-noir/[0.06] bg-surface-muted px-4 py-2 text-[8px] font-normal uppercase tracking-[0.28em] text-black/40 md:px-5">
          {label}
        </p>
      )}
      {header != null && (
        <div className="flex min-h-[44px] items-center justify-between gap-3 border-b border-noir/[0.06] px-4 py-2.5 md:px-5">
          {header}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 md:p-5">{children}</div>
    </article>
  );
}

export default function ManagerSketchMockup() {
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
    <div className="min-h-screen bg-surface-page">
      <div className="border-b border-noir/[0.06] bg-surface-hero text-white">
        <PageShell className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between md:py-6">
          <div>
            <p className="text-[8px] font-normal uppercase tracking-[0.32em] text-white/45">Maquette interne</p>
            <h1 className="mt-2 font-display text-[clamp(1.25rem,3vw,1.75rem)] font-light tracking-wide text-white">
              Interprétation du croquis gérant
            </h1>
            <p className="mt-2 max-w-xl text-[12px] font-light leading-relaxed text-white/65">
              Disposition des modules (vitrine · espace client · abo · fiche · club · calendrier) sans modifier la direction
              artistique : mêmes surfaces, filets et hiérarchie typo que le site.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/mockup-luxe"
              className="inline-flex items-center rounded-full border border-white/25 px-4 py-2 text-[9px] font-normal uppercase tracking-[0.14em] text-white/90 transition-colors hover:bg-white hover:text-black"
            >
              Maquette luxe
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[9px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Site
            </Link>
          </div>
        </PageShell>
      </div>

      <PageShell className="py-10 md:py-14">
        {/* Titre marque — équivalent « PESSORA » souligné du croquis */}
        <div className="mb-10 flex flex-col items-center text-center md:mb-14">
          <BrandLogo height={40} />
          <div
            className="mt-4 h-px w-[min(200px,40vw)] bg-gradient-to-r from-transparent via-gold to-transparent"
            aria-hidden
          />
          <p className="mt-3 text-[8px] font-normal uppercase tracking-[0.38em] text-black/35">
            Schéma d’information — non contractuel
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
          {/* ── Rangée 1 : vitrine | base client ── */}
          <SketchCard
            label="Bloc public"
            header={
              <>
                <span className="text-[10px] font-light tracking-wide text-black/50">pessora.fr</span>
                <span className="text-[8px] font-normal uppercase tracking-[0.2em] text-black/35">Logo</span>
              </>
            }
          >
            <p className="text-[9px] font-normal uppercase tracking-[0.22em] text-black/40">Site vitrine</p>
            <h2 className="mt-3 font-display text-xl font-light tracking-tight text-black md:text-2xl">Visuel &amp; offre</h2>
            <p className="mt-2 text-[12px] font-light leading-relaxed text-black/55">
              Hero, storytelling, mise en avant des gammes — comme sur l’accueil actuelle.
            </p>
            <div className="mt-6 rounded-[20px] border border-noir/[0.06] bg-surface-muted p-4">
              <p className="text-[8px] font-normal uppercase tracking-[0.24em] text-black/38">Produits</p>
              <p className="mt-2 text-[11px] font-light text-black/60">
                Cartes boissons / compléments — zone <span className="font-medium text-gold-dim">« fait confiance »</span>{' '}
                (avis, labels, partenaires).
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-noir/[0.05] pt-5">
              {['Partenaire A', 'Partenaire B', 'Caribea…'].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-noir/[0.08] bg-white px-3 py-1.5 text-[9px] font-light uppercase tracking-[0.12em] text-black/45"
                >
                  {name}
                </span>
              ))}
            </div>
          </SketchCard>

          <SketchCard
            label="Base"
            header={
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-black/55">
                  <ShoppingBag size={16} strokeWidth={1.35} aria-hidden />
                  <div>
                    <p className="text-[9px] font-normal uppercase tracking-[0.16em] text-black/40">Panier</p>
                    <p className="text-[11px] font-light tabular-nums text-black/70">4 articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-noir/[0.1] px-3 py-1.5">
                  <User size={14} strokeWidth={1.35} className="text-black/40" aria-hidden />
                  <span className="text-[11px] font-light text-black/75">Nico</span>
                </div>
              </div>
            }
          >
            <h2 className="font-display text-xl font-light tracking-tight text-black md:text-2xl">Espace client</h2>
            <p className="mt-2 text-[12px] font-light text-black/50">Hub après connexion — résumé &amp; accès rapides.</p>
            <ul className="mt-6 space-y-3 border-t border-noir/[0.05] pt-5">
              <li className="flex items-start gap-3 text-[12px] font-light text-black/65">
                <Mail size={16} strokeWidth={1.35} className="mt-0.5 shrink-0 text-black/35" aria-hidden />
                <span>Messages / relances par e-mail (commandes, abonnement, événements).</span>
              </li>
              <li className="flex items-start gap-3 text-[12px] font-light text-black/65">
                <Bell size={16} strokeWidth={1.35} className="mt-0.5 shrink-0 text-black/35" aria-hidden />
                <span>Notifications (rappels club, bilan, promos ciblées).</span>
              </li>
            </ul>
          </SketchCard>

          {/* ── Rangée 2 : abo ORA+ | fiche produit ── */}
          <SketchCard label="Parcours abonnement">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[8px] font-normal uppercase tracking-[0.22em] text-black/38">Abonnement</p>
                <h2 className="mt-1 font-display text-lg font-light text-black md:text-xl">Óra+</h2>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 rounded-2xl border border-noir/[0.08] bg-surface-muted px-3 py-2 text-right">
                <span className="text-lg font-light tabular-nums text-black/80">10</span>
                <span className="text-lg font-light tabular-nums text-black/45">8</span>
                <span className="text-[7px] font-normal uppercase tracking-[0.18em] text-black/35">Options</span>
              </div>
            </div>
            <p className="mt-4 text-[11px] font-light text-black/45">
              Champs indicatifs du croquis — à valider métier (prix / paliers).
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-noir/[0.05] pt-5 text-[11px] font-light text-black/55">
              {['Nom', 'Prénom', 'Numéro', 'Contrat abonnement', 'Paiement régulier', 'CGV', 'Protection des données'].map(
                (row) => (
                  <li key={row} className="flex items-center justify-between border-b border-noir/[0.04] pb-2 last:border-0">
                    <span>{row}</span>
                    <span className="h-1.5 w-24 max-w-[40%] rounded-full bg-noir/[0.06]" aria-hidden />
                  </li>
                )
              )}
            </ul>
          </SketchCard>

          <SketchCard label="Fiche produit">
            <h2 className="font-display text-xl font-light tracking-tight text-black md:text-2xl">Spicy Mango</h2>
            <p className="mt-2 text-[10px] font-normal uppercase tracking-[0.18em] text-black/38">Exemple type menu</p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-noir/[0.06] pt-6">
              <div className="rounded-2xl border border-noir/[0.06] bg-surface-muted p-4">
                <p className="text-[8px] font-normal uppercase tracking-[0.2em] text-black/38">Prix</p>
                <p className="mt-2 text-2xl font-light tabular-nums text-black">6,50&nbsp;€</p>
              </div>
              <div className="rounded-2xl border border-noir/[0.06] bg-surface-muted p-4">
                <p className="text-[8px] font-normal uppercase tracking-[0.2em] text-black/38">Abonnement</p>
                <p className="mt-2 text-2xl font-light tabular-nums text-gold-dim">8&nbsp;€</p>
                <p className="mt-1 text-[10px] font-light text-black/40">/ mois — illustration</p>
              </div>
            </div>
          </SketchCard>

          {/* ── Rangée 3 : club | calendrier ── */}
          <SketchCard label="Événement">
            <h2 className="font-display text-lg font-light text-black md:text-xl">Inscription Run / Fit Club</h2>
            <p className="mt-3 text-[12px] font-light leading-relaxed text-black/55">
              Bloc dédié inscription à une session récurrente — même ton éditorial que la page Événements.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-noir/[0.05] pt-6">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-light text-black/65">
                <input type="checkbox" className="h-4 w-4 rounded border-noir/20 accent-noir" defaultChecked />
                Je participe !
              </label>
              <span className="rounded-full border border-noir/[0.1] bg-noir/[0.03] px-4 py-2 text-[9px] font-normal uppercase tracking-[0.14em] text-black/50">
                CTA principal
              </span>
            </div>
          </SketchCard>

          <SketchCard label="Calendrier">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-noir/[0.08] bg-surface-muted">
                <CalendarDays size={20} strokeWidth={1.25} className="text-black/45" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-light text-black md:text-xl">Calendrier</h2>
                <p className="text-[10px] font-normal uppercase tracking-[0.18em] text-black/38">Bilan bien-être</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-[12px] font-light text-black/60">
              <li className="flex gap-2">
                <span className="text-black/30">—</span>
                Prise de rendez-vous pour le bilan (créneaux, confirmation, rappel).
              </li>
            </ul>
            <div className="mt-8 grid grid-cols-7 gap-1 text-center text-[9px] font-normal uppercase tracking-[0.08em] text-black/35">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={`w-${i}`}>{d}</span>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-lg text-[10px] font-light tabular-nums',
                    i === 10 ? 'border border-gold/50 bg-surface-muted text-black' : 'text-black/25'
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[10px] font-light italic text-black/35">Grille décorative — pas un vrai calendrier fonctionnel.</p>
          </SketchCard>
        </div>

        <footer className="mt-14 border-t border-noir/[0.06] pt-8 text-center text-[10px] font-light text-black/40">
          Maquette de lecture pour le gérant — routes réelles :{' '}
          <Link to="/" className="underline underline-offset-2 hover:text-black">
            Accueil
          </Link>
          {' · '}
          <Link to="/ora-plus" className="underline underline-offset-2 hover:text-black">
            Óra+
          </Link>
          {' · '}
          <Link to="/bilan-bien-etre" className="underline underline-offset-2 hover:text-black">
            Bilan
          </Link>
          {' · '}
          <Link to="/evenements" className="underline underline-offset-2 hover:text-black">
            Événements
          </Link>
        </footer>
      </PageShell>
    </div>
  );
}
