# Challenge 21 jours — landing page + route stable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir la page `/evenements/:slug` quand `type='challenge'` avec la charpente validée par Lyra (hero, réassurance, encadré programme, parcours d'inscription existant), et ajouter une route stable `/evenements/challenge-21-jours` qui vit toute l'année (état ouvert si une vague existe, état fermé sinon).

**Architecture:** Un composant partagé `<ChallengeLanding>` assemble les blocs de la charpente et le parcours d'inscription (extrait de `EvenementDetail.tsx`, jamais dupliqué). Il est monté par la route existante (`EvenementDetail.tsx`, quand `type==='challenge'`) et par la nouvelle route stable (`ChallengeLandingPage.tsx`, qui trouve elle-même le prochain challenge). Tous les tokens visuels viennent de `src/index.css` (`@theme`) via les classes Tailwind déjà utilisées ailleurs dans le repo — jamais de CSS ou de valeur `oklch(...)` en dur copiée depuis la maquette HTML.

**Tech Stack:** React + TypeScript + Vite, Tailwind v4 (`@theme` dans `src/index.css`), React Router v6.22, react-hook-form + zod, Supabase JS, Vitest pour les tests unitaires.

## Global Constraints

- **Fuseau horaire** : toute comparaison de date sur cette page utilise `todayInMartinique()` (nouveau helper) — jamais `toISOString()`, jamais `toLocaleDateString()` sans `timeZone` explicite. Même règle que la base (`(now() AT TIME ZONE 'America/Martinique')::date`).
- **Aucune date qui ne soit une ligne en base** — pas de rythme de vagues en dur, pas de calendrier codé. L'état fermé se limite au titre + newsletter.
- **Aucun pointillé en production** — le hero utilise le dégradé de repli codé (jamais un cadre "à produire" visible) ; les blocs de preuve (chiffres, avant/après, témoignages) sont **absents du DOM** quand ils n'ont pas de contenu, jamais un cadre vide ou en pointillés.
- **Un seul écrivain du parcours d'inscription** — la logique d'inscription/bilan (formulaire, mutation, `PostRegistrationWizard`, `BilanBookingWidget`) vit dans un seul composant, réutilisé par les deux routes.
- **Zéro nouvelle table, zéro nouveau champ** sur `events`/`bilan_bookings`. Le challenge continue de se créer/modifier via `/admin/evenements`, sans changement.
- **Zéro mention Herbalife / "Complément de revenus"**, nulle part dans le code de cette page.
- **Zéro promesse de résultat chiffré** (pas de poids, pas de délai, pas de "perds X kg") dans les textes ajoutés.
- **Thème Pessóra uniquement** : toutes les couleurs/polices/rayons passent par les classes Tailwind déjà en place (`bg-noir`, `text-noir`, `bg-sapin`, `bg-surface-hero`, `bg-surface-muted`, `bg-surface-card`, `text-gold-dim`, `font-display`, `rounded-[2px]`, `rounded-full`) — jamais une valeur `oklch(...)` inline copiée de la maquette de Lyra.
- **Ordre de route** : `/evenements/challenge-21-jours` déclarée avant `/evenements/:slug` dans `App.tsx` (React Router v6 classe déjà les routes statiques avant les routes à paramètre indépendamment de l'ordre de déclaration, mais on le rend explicite pour la lisibilité).
- Référence : `docs/superpowers/specs/2026-09-11-challenge-21j-landing-design.md` (spec de build, source des décisions ci-dessus) et `docs/fiche-papier-challenge-21j.md` (contenu verrouillé, mot pour mot).

---

## File Structure

**Nouveaux fichiers :**
- `src/lib/martiniqueDate.ts` — `todayInMartinique()`.
- `src/lib/eventDateFormat.ts` — `formatDate`, `formatDateShort` (extraits de `EvenementDetail.tsx`, utilisés par les deux pages).
- `src/components/events/ChallengeRegistrationCard.tsx` — carte "Je m'inscris" + wizard + widget bilan (extraite de `EvenementDetail.tsx`).
- `src/components/events/ChallengeHero.tsx` — hero sombre.
- `src/components/events/ChallengeTrustBadges.tsx` — 3 puces de réassurance.
- `src/components/events/ChallengeProgramCard.tsx` — encadré "Challenge 21 jours" (6 inclus + 3 timings).
- `src/components/events/ChallengeStatsBlock.tsx`, `ChallengeBeforeAfterBlock.tsx`, `ChallengeTestimonialsBlock.tsx` — blocs de preuve, retournent `null` dans ce lot.
- `src/components/events/ChallengeLanding.tsx` — orchestrateur (assemble les blocs ci-dessus + `ChallengeRegistrationCard`).
- `src/components/events/ChallengeClosedState.tsx` — état "aucune vague".
- `src/pages/ChallengeLandingPage.tsx` — route stable, cherche le prochain challenge et choisit l'état.

**Fichiers modifiés :**
- `src/components/layout/NewsletterSignup.tsx` — ajout du prop `theme`.
- `src/pages/EvenementDetail.tsx` — extraction de la carte d'inscription, branchement de `<ChallengeLanding>` pour `type==='challenge'`.
- `src/App.tsx` — nouvelle route.
- `src/pages/Evenements.tsx` — lecture de `location.hash`, fix fuseau horaire sur `todayStr`.
- `src/pages/admin/AdminBilans.tsx` — `slotChallengeLabel` distingue désactivé / hors fenêtre.

---

## Task 1: Helper de fuseau horaire Martinique

**Files:**
- Create: `src/lib/martiniqueDate.ts`
- Test: `src/__tests__/martiniqueDate.test.ts`

**Interfaces:**
- Produces: `todayInMartinique(): string` — retourne une date `YYYY-MM-DD` (format `fr-CA`), toujours calculée sur le fuseau `America/Martinique`, indépendamment du fuseau de la machine qui exécute le code.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/martiniqueDate.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayInMartinique } from '../lib/martiniqueDate';

describe('todayInMartinique', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne la date du jour au format YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    expect(todayInMartinique()).toBe('2026-09-11');
  });

  it('reste sur le jour Martinique à 20h30 heure locale (23h30 UTC) — ne bascule pas au lendemain UTC', () => {
    vi.useFakeTimers();
    // 2026-09-11 23:30 UTC = 2026-09-11 19:30 heure de Martinique (UTC-4) : encore le 11.
    vi.setSystemTime(new Date('2026-09-11T23:30:00Z'));
    expect(todayInMartinique()).toBe('2026-09-11');
  });

  it('bascule au jour suivant seulement après minuit heure de Martinique (04h00 UTC)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T04:00:00Z'));
    expect(todayInMartinique()).toBe('2026-09-12');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/martiniqueDate.test.ts`
Expected: FAIL — `Cannot find module '../lib/martiniqueDate'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/martiniqueDate.ts

/**
 * "Aujourd'hui" côté front, calculé sur le fuseau America/Martinique —
 * jamais toISOString() (bascule au jour suivant dès 20h00 heure locale, en
 * plein milieu de soirée) ni le fuseau du visiteur. Même règle que la base
 * : (now() AT TIME ZONE 'America/Martinique')::date.
 */
export function todayInMartinique(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/martiniqueDate.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/martiniqueDate.ts src/__tests__/martiniqueDate.test.ts
git commit -m "feat(challenge): helper todayInMartinique pour la borne de date front"
```

---

## Task 2: Extraire les formatteurs de date partagés

**Files:**
- Create: `src/lib/eventDateFormat.ts`
- Modify: `src/pages/EvenementDetail.tsx:54-63` (supprime les deux fonctions locales, importe depuis le nouveau fichier)
- Test: `src/__tests__/eventDateFormat.test.ts`

**Interfaces:**
- Produces: `formatDate(dateStr: string): string` (ex. "vendredi 11 septembre 2026"), `formatDateShort(dateStr: string): string` (ex. "vendredi 11 septembre").
- Consumes: rien (fonctions pures).

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/eventDateFormat.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from '../lib/eventDateFormat';

describe('formatDate', () => {
  it('formate une date ISO en date longue française', () => {
    expect(formatDate('2026-09-15')).toBe('mardi 15 septembre 2026');
  });
});

describe('formatDateShort', () => {
  it('formate une date ISO sans année', () => {
    expect(formatDateShort('2026-09-15')).toBe('mardi 15 septembre');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/eventDateFormat.test.ts`
Expected: FAIL — `Cannot find module '../lib/eventDateFormat'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/eventDateFormat.ts

// Append T00:00:00 pour que JS parse en heure locale (Martinique UTC-4),
// pas en UTC minuit — sinon une date affichée peut reculer d'un jour.
export const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export const formatDateShort = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/eventDateFormat.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Update `EvenementDetail.tsx` to use the shared helpers**

Remove lines 54-63 (les deux fonctions `formatDate`/`formatDateShort` locales) et ajoute l'import :

```typescript
// En haut du fichier, avec les autres imports
import { formatDate, formatDateShort } from '../lib/eventDateFormat';
```

Le reste du fichier n'a pas besoin de changer : `formatDate(event.date)` (ligne 285) et `formatDateShort(event.date)` (ligne 345) continuent d'appeler les mêmes signatures.

- [ ] **Step 6: Verify no regression**

Run: `npx tsc --noEmit`
Expected: aucune erreur (les deux fonctions ont exactement la même signature qu'avant).

- [ ] **Step 7: Commit**

```bash
git add src/lib/eventDateFormat.ts src/__tests__/eventDateFormat.test.ts src/pages/EvenementDetail.tsx
git commit -m "refactor(events): extrait formatDate/formatDateShort en helper partagé"
```

---

## Task 3: `NewsletterSignup` — variante claire

**Files:**
- Modify: `src/components/layout/NewsletterSignup.tsx`

**Interfaces:**
- Produces: prop `theme?: 'dark' | 'light'` (défaut `'dark'`) sur `NewsletterSignupProps`.
- Consumes: rien de nouveau côté données — insère toujours dans `newsletter_subscribers` (aucun changement de schéma).

Le composant existant est stylé pour un fond sombre (`text-ivory`, `text-white/45`, `bg-white/[0.06]`, bordures `--color-footer-border-soft`). Sur fond clair, ces couleurs sont invisibles. On bascule un jeu de classes selon `theme`.

- [ ] **Step 1: Ajouter le prop et les classes conditionnelles**

Dans `src/components/layout/NewsletterSignup.tsx`, modifier la signature et les classes texte/fond :

```typescript
export type NewsletterSignupProps = {
  className?: string;
  align?: 'left' | 'center';
  compact?: boolean;
  minimal?: boolean;
  /** 'dark' (défaut, fond sombre type footer) ou 'light' (carte claire type ChallengeClosedState). */
  theme?: 'dark' | 'light';
  /** Valeur libre pour tracer l'origine de l'inscription (colonne `source`). */
  source?: string;
};

export function NewsletterSignup({
  className,
  align = 'left',
  compact = false,
  minimal = false,
  theme = 'dark',
  source = 'footer',
}: NewsletterSignupProps) {
```

Dans `onSubmit`, remplacer la valeur codée en dur `source: 'footer'` par le prop :

```typescript
    const { error } = await (supabase as any).from('newsletter_subscribers').insert({
      email: data.email.trim().toLowerCase(),
      consent: data.acceptPrivacy,
      source,
    });
```

Ajouter la variable dérivée et l'utiliser sur les éléments texte/bordure/fond concernés (heading, description, input, checkbox, messages de statut) :

```typescript
  const isCenter = align === 'center';
  const isLight = theme === 'light';
  const showVisibleNewsletterHeading = !(compact && minimal);
```

Remplacer chaque classe conditionnée au fond sombre par un choix `isLight ? '...' : '...'`, par exemple pour le heading :

```tsx
      {showVisibleNewsletterHeading ? (
        <p
          className={cn(
            'text-[9px] font-light uppercase tracking-[0.42em]',
            isLight
              ? (compact ? 'mb-1.5 text-black/40' : 'mb-3 text-black/40')
              : (compact ? 'mb-1.5 text-footer-text-quiet' : 'mb-3 text-white/42'),
          )}
        >
          Newsletter
        </p>
      ) : null}
```

et pour l'input :

```tsx
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder={compact && minimal ? 'Votre e-mail' : 'votre@email.com'}
            className={cn(
              'min-w-0 flex-1 rounded-[2px] border py-2 font-light placeholder:text-black/30',
              isLight
                ? 'border-noir/10 bg-transparent text-noir placeholder:text-black/30'
                : 'border-[color:var(--color-footer-border-soft)] bg-white/[0.06] text-ivory placeholder:text-footer-text-subtle',
              compact && minimal ? 'min-h-12 px-4 text-[13px]' : compact ? 'min-h-11 px-4 text-[12px]' : 'min-h-[48px] px-4 text-[12px]',
            )}
            {...register('email')}
          />
```

et pour le bouton :

```tsx
          <Button
            type="submit"
            isIconOnly
            isDisabled={status === 'loading'}
            className={cn(
              'shrink-0 rounded-[2px] transition-colors disabled:opacity-50',
              isLight ? 'bg-noir text-white hover:bg-anthracite' : 'bg-ivory text-noir hover:bg-ivory-warm',
              compact && minimal ? 'min-h-12 min-w-12' : compact ? 'min-h-11 min-w-11' : 'min-h-12 min-w-12',
            )}
            aria-label="S’inscrire à la newsletter"
          >
```

et pour les messages de statut (success/duplicate/error), remplacer `text-ivory/90` / `text-white/50` / `text-red-300/90` par `isLight ? 'text-noir/80' : '...'`, `isLight ? 'text-black/45' : '...'`, `isLight ? 'text-red-600' : '...'` respectivement. Le texte de la checkbox et le lien "politique de confidentialité" suivent la même bascule (`text-black/55`/`text-noir` au lieu de `text-white/50`/`text-ivory/90`).

- [ ] **Step 2: Vérifier que le comportement par défaut (dark) est inchangé**

Run: `npx tsc --noEmit`
Expected: aucune erreur — `theme` a une valeur par défaut, tous les appels existants (`<NewsletterSignup />` dans `Footer.tsx`) continuent de rendre exactement le même HTML/classes qu'avant (chemin `!isLight`).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/NewsletterSignup.tsx
git commit -m "feat(newsletter): variante claire (theme='light') + prop source"
```

---

## Task 4: Extraire la carte d'inscription challenge

**Files:**
- Create: `src/components/events/ChallengeRegistrationCard.tsx`
- Modify: `src/pages/EvenementDetail.tsx` (remplace le bloc lignes 327-517 par `<ChallengeRegistrationCard event={event} />`, garde tout le reste identique)

**Interfaces:**
- Consumes : `Event` (`src/types/database.ts`), `PostRegistrationWizard` (`registrationId, telephone, eventType, eventTitle, onComplete?`), `BilanBookingWidget` (`challengeEventId: string`), `formatDateShort` (Task 2), `isValidPhone` (`src/lib/phone.ts`).
- Produces: `<ChallengeRegistrationCard event={EventWithCount} />` — composant auto-suffisant (état interne, mutation d'inscription), aucune prop de retour attendue par l'appelant.

Ce composant est une extraction **à l'identique** du bloc "Formulaire d'inscription" actuel (`EvenementDetail.tsx:327-517`) — même schéma zod, mêmes champs, même appel `event_registrations.insert`, même rendu du wizard et du widget bilan. On ne change ni le comportement ni le style dans cette tâche : seulement l'emplacement du code, pour qu'il soit réutilisable par la route stable (Task 9).

- [ ] **Step 1: Créer le composant en copiant le bloc existant**

```typescript
// src/components/events/ChallengeRegistrationCard.tsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import type { Event } from '../../types/database';
import { PostRegistrationWizard } from './PostRegistrationWizard';
import { BilanBookingWidget } from './BilanBookingWidget';
import { isValidPhone } from '../../lib/phone';
import { formatDateShort } from '../../lib/eventDateFormat';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().refine(isValidPhone, 'Vérifiez votre numéro de téléphone'),
  nb_personnes: z.string(),
  souhait_info: z.string(),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter le traitement de vos données pour vous inscrire.',
  }),
});

type FormData = z.infer<typeof schema>;

const NB_OPTIONS = [
  { value: 'Je viens seul', label: 'Je viens seul(e)' },
  { value: '+1 personne', label: '+1 personne' },
  { value: '+2 personnes', label: '+2 personnes' },
  { value: '+3 personnes ou plus', label: '+3 personnes ou plus' },
];

const INFO_OPTIONS = [
  { value: 'Oui avec plaisir', label: 'Oui avec plaisir' },
  { value: 'Non merci', label: 'Non merci' },
];

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-4 text-[14px] text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

export interface ChallengeRegistrationCardProps {
  event: Event & { registrationCount: number };
}

export function ChallengeRegistrationCard({ event }: ChallengeRegistrationCardProps) {
  const { user } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');
  const [postRegistration, setPostRegistration] = useState<{ id: string; telephone: string } | null>(null);
  const [registrationCount, setRegistrationCount] = useState(event.registrationCount);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      nb_personnes: 'Je viens seul',
      souhait_info: 'Non merci',
      privacyAccepted: false,
    },
  });

  const placesDispo = event.places_max ? event.places_max - registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  const onSubmit = async (data: FormData) => {
    if (event.registration_open === false) {
      setSubmitStatus('error');
      return;
    }
    if (event.places_max && registrationCount >= event.places_max) {
      setSubmitStatus('full');
      return;
    }

    const registrationId = crypto.randomUUID();
    const { error } = await supabase
      .from('event_registrations')
      .insert({
        id: registrationId,
        event_id: event.id,
        user_id: user?.id ?? null,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        nb_personnes: data.nb_personnes,
        souhait_info: data.souhait_info,
      });

    if (error) {
      setSubmitStatus(error.code === '23505' ? 'duplicate' : 'error');
      return;
    }

    setPostRegistration({ id: registrationId, telephone: data.telephone });
    setSubmitStatus('success');
    setRegistrationCount((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-[2px] p-5 sm:p-8 md:p-10 border border-noir/[0.06]" id="inscription">
      <h2
        className="font-display font-light text-noir mb-8"
        style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}
      >
        {submitStatus === 'success' ? 'Inscription confirmée !' : "Je m'inscris"}
      </h2>

      {submitStatus === 'success' && (
        <div className="w-full">
          <div aria-live="polite" className="flex flex-col items-center text-center gap-4 py-8">
            <CheckCircle size={48} strokeWidth={1} className="text-gold-dim" aria-hidden="true" />
            <p className="text-[13px] text-black/60">
              Tu es inscrit(e) au <strong className="text-noir">{event.title}</strong>.
            </p>
            <p className="text-[12px] text-black/40">
              RDV le{' '}
              <span className="capitalize">{formatDateShort(event.date)}</span>
              {event.heure && <> à {event.heure.slice(0, 5)}</>}.
            </p>
          </div>
          {Array.isArray(event.gallery) && event.gallery.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
                Avant / après — challengers précédents
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.gallery.map((url: string) => (
                  <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <BilanBookingWidget challengeEventId={event.id} />
          </div>

          {postRegistration && (
            <PostRegistrationWizard
              registrationId={postRegistration.id}
              telephone={postRegistration.telephone}
              eventType={event.type}
              eventTitle={event.title}
            />
          )}
        </div>
      )}

      {submitStatus === 'duplicate' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-orange-200/80 bg-orange-50/90 p-4 text-[12px] text-orange-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Ce numéro est déjà inscrit à cet événement. Tu es déjà dans la liste !
        </div>
      )}

      {submitStatus === 'full' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Cet événement est complet. Suis-nous sur Instagram pour les prochaines dates.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
        </div>
      )}

      {event.registration_open === false ? (
        <div className="text-center py-8">
          <p className="text-[13px] font-normal text-black mb-2">Inscriptions fermées</p>
          <p className="text-[11px] font-light text-black/40">
            Les inscriptions pour cet événement ne sont plus disponibles.
          </p>
        </div>
      ) : submitStatus !== 'success' && !isFull && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller name="prenom" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="prenom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Prénom *</label>
                <input id="prenom" {...field} placeholder="Jean" className={inputClass} />
                {errors.prenom?.message && <p className="text-[11px] text-red-600">{errors.prenom.message}</p>}
              </div>
            )} />
            <Controller name="nom" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="nom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Nom *</label>
                <input id="nom" {...field} placeholder="Dupont" className={inputClass} />
                {errors.nom?.message && <p className="text-[11px] text-red-600">{errors.nom.message}</p>}
              </div>
            )} />
          </div>

          <Controller name="telephone" control={control} render={({ field }) => (
            <div className="space-y-1">
              <label htmlFor="telephone" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                Téléphone * <span className="normal-case text-black/25">(WhatsApp de préférence)</span>
              </label>
              <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
              {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
            </div>
          )} />

          <Controller name="nb_personnes" control={control} render={({ field }) => (
            <div className="space-y-1">
              <label htmlFor="nb_personnes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                Combien de personnes ?
              </label>
              <select
                id="nb_personnes"
                {...field}
                className="w-full border-0 border-b border-noir/10 bg-transparent py-4 text-[14px] text-noir focus:outline-none focus:border-noir transition-colors"
              >
                {NB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )} />

          <div className="space-y-3">
            <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
              Souhaites-tu rester informé(e) des prochains événements ?
            </p>
            <Controller name="souhait_info" control={control} render={({ field }) => (
              <div className="space-y-2" role="radiogroup" aria-label="Souhait d'information">
                {INFO_OPTIONS.map(o => (
                  <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="souhait_info"
                      value={o.value}
                      checked={field.value === o.value}
                      onChange={() => field.onChange(o.value)}
                      className="accent-sapin"
                    />
                    <span className="text-[13px] text-black/60 group-hover:text-noir transition-colors">{o.label}</span>
                  </label>
                ))}
              </div>
            )} />
          </div>

          <Controller
            name="privacyAccepted"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label htmlFor="event-privacy-accepted" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="event-privacy-accepted"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-sapin"
                  />
                  <span className="text-[11px] font-light leading-relaxed text-black/55">
                    J’accepte que mes données (nom, prénom, téléphone) soient utilisées pour gérer mon inscription
                    et me contacter concernant cet événement, conformément à la{' '}
                    <Link
                      to="/politique-confidentialite"
                      className="text-gold-dim underline decoration-gold-dim/30 underline-offset-2 hover:opacity-80"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                {errors.privacyAccepted?.message && (
                  <p className="text-[11px] text-red-600">{errors.privacyAccepted.message}</p>
                )}
              </div>
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-noir text-white py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[11px] hover:bg-anthracite transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Inscription en cours…' : (event.is_free ? "Je m'inscris gratuitement" : `Je m'inscris — ${event.price?.toLocaleString('fr-FR', {minimumFractionDigits: 2})}€`)}
          </button>
        </form>
      )}
    </div>
  );
}
```

Notes sur les différences volontaires avec le code d'origine :
- `id="inscription"` ajouté sur le conteneur racine — c'est l'ancre visée par le CTA du hero (Task 5) et par le lien `#inscription` de la maquette.
- `registrationCount` est désormais un état local initialisé depuis `event.registrationCount`, plutôt qu'une mutation du parent — ce composant est maintenant autonome, il n'a plus besoin d'un `setEvent` remonté par le parent.
- Suppression du `if (event.type === 'challenge' && ...)` autour de la galerie et du widget bilan : ce composant n'est monté **que** pour des challenges (voir Task 6/7), la condition est donc toujours vraie et n'a plus lieu d'être.

- [ ] **Step 2: Remplacer le bloc dans `EvenementDetail.tsx`**

Dans `src/pages/EvenementDetail.tsx`, supprimer :
- Les imports devenus inutiles à cet endroit précis : `z`, `zodResolver`, `Controller`/`useForm` restent nécessaires seulement s'ils sont encore utilisés ailleurs dans le fichier — **ils ne le sont plus** après cette extraction (le fichier n'a plus qu'un seul formulaire, celui-ci déplacé), donc supprimer aussi `schema`, `FormData`, `NB_OPTIONS`, `INFO_OPTIONS`, `inputClass`, `PostRegistrationWizard`, `BilanBookingWidget`, `isValidPhone`, et les imports `z`/`zodResolver`/`Controller`/`useForm` en tête de fichier.
- L'état `submitStatus`, `postRegistration`, le hook `useForm`, la fonction `onSubmit` (lignes 76-89, 146-185).
- Le bloc JSX lignes 327-517 (toute la carte "Formulaire d'inscription").

Remplacer ce bloc JSX par :

```tsx
          {/* Formulaire d'inscription */}
          <ChallengeRegistrationCard event={event} />
```

Ajouter l'import en tête de fichier :

```typescript
import { ChallengeRegistrationCard } from '../components/events/ChallengeRegistrationCard';
```

⚠️ Cette étape rend `EvenementDetail.tsx` **temporairement incorrect pour les événements non-challenge** (la carte suppose maintenant toujours un contexte challenge — bilan, wizard). C'est corrigé dans Task 7, qui sépare explicitement le rendu par type. Ne pas déployer entre Task 4 et Task 7 sans Task 7.

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/components/events/ChallengeRegistrationCard.tsx src/pages/EvenementDetail.tsx
git commit -m "refactor(challenge): extrait la carte d'inscription en composant partagé"
```

---

## Task 5: Blocs statiques de la charpente (hero, réassurance, encadré, preuve)

**Files:**
- Create: `src/components/events/ChallengeHero.tsx`
- Create: `src/components/events/ChallengeTrustBadges.tsx`
- Create: `src/components/events/ChallengeProgramCard.tsx`
- Create: `src/components/events/ChallengeStatsBlock.tsx`
- Create: `src/components/events/ChallengeBeforeAfterBlock.tsx`
- Create: `src/components/events/ChallengeTestimonialsBlock.tsx`

**Interfaces:**
- `ChallengeHero` — Produces: `<ChallengeHero eventDate={string} />` (reçoit `event.date` en ISO, affiche le mois de la vague).
- `ChallengeTrustBadges`, `ChallengeProgramCard` — Produces: composants sans props (contenu figé depuis la fiche papier).
- `ChallengeStatsBlock`, `ChallengeBeforeAfterBlock`, `ChallengeTestimonialsBlock` — Produces: chacun retourne `null` (aucune prop).

- [ ] **Step 1: `ChallengeHero`**

```tsx
// src/components/events/ChallengeHero.tsx

function frenchMonth(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' });
}

export interface ChallengeHeroProps {
  /** Date ISO (YYYY-MM-DD) du challenge affiché. */
  eventDate: string;
}

export function ChallengeHero({ eventDate }: ChallengeHeroProps) {
  return (
    <header className="relative overflow-hidden bg-surface-hero text-white">
      {/* Dégradé de repli — rendu définitif tant qu'aucun visuel réel n'est fourni.
          Jamais de cadre pointillé "à produire" en production (règle Lyra). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 18%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 62%), linear-gradient(160deg, oklch(15% .01 55) 0%, oklch(9% .006 55) 55%, oklch(7% .004 55) 100%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-32 lg:px-[72px]">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-white/70">
          <i aria-hidden="true" className="block h-[5px] w-[5px] rounded-full bg-gold" />
          Challenge 21 jours · Vague de {frenchMonth(eventDate)}
        </span>
        <h1
          className="font-display font-light leading-[1.04]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.6vw, 54px)', maxWidth: '19ch' }}
        >
          Quel est ton <em className="italic text-white/60">prochain objectif&nbsp;?</em>
        </h1>
        <p className="mt-6 max-w-[44ch] text-[15px] font-light leading-relaxed text-white/90">
          21 jours pour reprendre la main sur ton énergie, ta forme et tes habitudes.
          Encadré, en collectif, avec un suivi réel — pas un défi à tenir seul.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a
            href="#inscription"
            className="inline-flex items-center gap-2 rounded-full bg-ivory px-8 py-4 text-[10px] uppercase tracking-[0.2em] text-noir transition-colors hover:bg-gold"
          >
            Je veux mon bilan
          </a>
          <a
            href="#programme"
            className="border-b border-white/25 pb-0.5 text-[9px] uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Ce qui est inclus
          </a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `ChallengeTrustBadges`**

```tsx
// src/components/events/ChallengeTrustBadges.tsx
import { Check, Clock, Users } from 'lucide-react';

const ITEMS = [
  {
    Icon: Check,
    title: 'Bilan obligatoire',
    description: 'Chaque participant fait son bilan bien-être avant de commencer.',
  },
  {
    Icon: Clock,
    title: '21 jours accompagnés',
    description: 'Séances, recettes et conseils — du premier au dernier jour.',
  },
  {
    Icon: Users,
    title: 'Communauté 24FIT PESSORA',
    description: 'On avance ensemble : c’est ce qui fait tenir les 21 jours.',
  },
];

export function ChallengeTrustBadges() {
  return (
    <section className="border-b border-noir/[0.06] bg-surface-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-11 md:grid-cols-3 md:gap-12 md:px-10 lg:px-[72px]">
        {ITEMS.map(({ Icon, title, description }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-sapin/30">
              <Icon size={14} strokeWidth={1.3} className="text-sapin" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-noir">{title}</p>
              <p className="text-[13px] leading-relaxed text-black/58">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `ChallengeProgramCard`**

```tsx
// src/components/events/ChallengeProgramCard.tsx
import { Check } from 'lucide-react';

const INCLUS = [
  'Application GetFitNow',
  'Communauté 24FIT PESSORA',
  'Séances de sport',
  'Idées recettes',
  'Conseils & accompagnement',
  'Suivi de tes objectifs',
];

const TIMINGS = ['Ce mois-ci', 'Le mois prochain', 'Je souhaite en savoir plus'];

export function ChallengeProgramCard() {
  return (
    <section id="programme" className="sec bg-surface-muted py-16 md:py-[6.5rem]">
      <div className="mx-auto max-w-6xl px-4 md:px-10 lg:px-[72px]">
        <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Le programme</p>
        <h2
          className="mb-10 font-display font-normal"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
        >
          Ce que tu ne fais pas seul
        </h2>

        <div className="rounded-[2px] border border-sapin/45 bg-surface-card p-6 md:p-12">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-sapin/20 pb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-noir">Challenge 21 jours</h3>
            <span className="text-[8px] uppercase tracking-[0.2em] text-gold-dim">Places limitées</span>
          </div>

          <ul className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-black/78">
                <Check size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-sapin" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 border-t border-noir/[0.07] pt-7">
            <span className="mr-2 text-[9px] uppercase tracking-[0.2em] text-black/45">
              Quand souhaites-tu commencer ?
            </span>
            {TIMINGS.map((t, i) => (
              <span
                key={t}
                className={
                  i === 0
                    ? 'rounded-full bg-sapin px-4 py-2.5 text-[9px] uppercase tracking-[0.16em] text-white'
                    : 'rounded-full border border-noir/15 px-4 py-2.5 text-[9px] uppercase tracking-[0.16em] text-black/62'
                }
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Blocs de preuve — retournent `null`**

```tsx
// src/components/events/ChallengeStatsBlock.tsx

/**
 * Chiffres réels du challenge (participants, résultats) — fournis par
 * Catherine. Tant qu'aucune source de contenu n'existe, ce bloc ne
 * s'affiche pas : un bloc de preuve vide ne se publie jamais (règle Lyra).
 * Ne pas remplacer par un cadre vide/pointillé "en attendant" — retourner
 * null est le comportement voulu, pas un oubli.
 */
export function ChallengeStatsBlock() {
  return null;
}
```

```tsx
// src/components/events/ChallengeBeforeAfterBlock.tsx

/**
 * Photos avant/après des participants — droits à l'image gérés par
 * Catherine, jamais de photo de banque d'images. Retourne null tant
 * qu'aucun contenu réel n'est fourni (voir ChallengeStatsBlock).
 */
export function ChallengeBeforeAfterBlock() {
  return null;
}
```

```tsx
// src/components/events/ChallengeTestimonialsBlock.tsx

/**
 * Témoignages de participants — jamais inventés, jamais un visage de
 * banque d'images. Retourne null tant qu'aucun contenu réel n'est fourni
 * (voir ChallengeStatsBlock).
 */
export function ChallengeTestimonialsBlock() {
  return null;
}
```

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (ces composants ne sont pas encore importés nulle part, donc pas d'effet visible — c'est attendu).

- [ ] **Step 6: Commit**

```bash
git add src/components/events/ChallengeHero.tsx src/components/events/ChallengeTrustBadges.tsx src/components/events/ChallengeProgramCard.tsx src/components/events/ChallengeStatsBlock.tsx src/components/events/ChallengeBeforeAfterBlock.tsx src/components/events/ChallengeTestimonialsBlock.tsx
git commit -m "feat(challenge): blocs hero, réassurance, programme et blocs de preuve (vides)"
```

---

## Task 6: Orchestrateur `ChallengeLanding`

**Files:**
- Create: `src/components/events/ChallengeLanding.tsx`

**Interfaces:**
- Consumes: `ChallengeHero`, `ChallengeTrustBadges`, `ChallengeStatsBlock`, `ChallengeProgramCard`, `ChallengeBeforeAfterBlock`, `ChallengeTestimonialsBlock`, `ChallengeRegistrationCard` (Tasks 4-5).
- Produces: `<ChallengeLanding event={Event & { registrationCount: number }} />`.

- [ ] **Step 1: Écrire le composant**

```tsx
// src/components/events/ChallengeLanding.tsx
import type { Event } from '../../types/database';
import { ChallengeHero } from './ChallengeHero';
import { ChallengeTrustBadges } from './ChallengeTrustBadges';
import { ChallengeStatsBlock } from './ChallengeStatsBlock';
import { ChallengeProgramCard } from './ChallengeProgramCard';
import { ChallengeBeforeAfterBlock } from './ChallengeBeforeAfterBlock';
import { ChallengeTestimonialsBlock } from './ChallengeTestimonialsBlock';
import { ChallengeRegistrationCard } from './ChallengeRegistrationCard';

export interface ChallengeLandingProps {
  event: Event & { registrationCount: number };
}

/**
 * Expérience complète "Challenge 21 jours" — ordre imposé par
 * docs/superpowers/specs/2026-09-11-challenge-21j-landing-design.md §2.
 * Montée par EvenementDetail.tsx (/evenements/:slug, type='challenge') et
 * par ChallengeLandingPage.tsx (/evenements/challenge-21-jours, état
 * "ouvert") — un seul composant, jamais deux implémentations.
 */
export function ChallengeLanding({ event }: ChallengeLandingProps) {
  return (
    <div className="bg-white">
      <ChallengeHero eventDate={event.date} />
      <ChallengeTrustBadges />
      <ChallengeStatsBlock />
      <ChallengeProgramCard />
      <ChallengeBeforeAfterBlock />
      <ChallengeTestimonialsBlock />
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-10 md:py-[6.5rem] lg:px-[72px]">
        <ChallengeRegistrationCard event={event} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/ChallengeLanding.tsx
git commit -m "feat(challenge): orchestrateur ChallengeLanding"
```

---

## Task 7: Brancher `ChallengeLanding` dans `EvenementDetail.tsx`

**Files:**
- Modify: `src/pages/EvenementDetail.tsx`

**Interfaces:**
- Consumes: `ChallengeLanding` (Task 6).

Après Task 4, `EvenementDetail.tsx` appelle `<ChallengeRegistrationCard>` pour **tous** les types d'événements, ce qui est incorrect (le wizard/widget bilan n'a de sens que pour un challenge). Cette tâche sépare explicitement les deux rendus.

- [ ] **Step 1: Séparer le rendu par type**

Dans `src/pages/EvenementDetail.tsx`, remplacer tout le `return` du composant (à partir de `return ( <div className="min-h-screen bg-white"> ... )`, après les gardes `loading`/`notFound`/`fetchError`) :

```tsx
  const placesDispo = event.places_max ? event.places_max - event.registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  if (event.type === 'challenge') {
    return (
      <>
        <EventJsonLd
          name={event.title}
          description={event.description}
          startDate={event.date}
          location={event.location}
          image={event.image_url}
          url={window.location.href}
        />
        <ChallengeLanding event={event} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <EventJsonLd
        name={event.title}
        description={event.description}
        startDate={event.date}
        location={event.location}
        image={event.image_url}
        url={window.location.href}
      />

      {/* Hero image */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-anthracite to-noir" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-10 lg:px-[72px] pb-10 md:pb-[48px]">
          <Link
            to="/evenements"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-normal uppercase tracking-[0.15em] mb-6 transition-colors"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Tous les événements
          </Link>
          <div>
            <span className="inline-block text-[8px] font-normal tracking-[0.2em] uppercase bg-noir text-white px-[10px] py-[4px] rounded-[3px] mb-4">
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h1
              className="font-display font-light text-white leading-[1.0]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 52px)' }}
            >
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 lg:px-[72px] py-10 md:py-[64px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-black/55">
                <Calendar size={15} strokeWidth={1.5} aria-hidden="true" />
                <span className="capitalize text-[13px]">{formatDate(event.date)}</span>
              </div>
              {event.heure && (
                <div className="flex items-center gap-3 text-black/55">
                  <Clock size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.heure.slice(0, 5)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-black/55">
                  <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">{event.location}</span>
                </div>
              )}
              {event.meeting_point && (
                <div className="flex items-center gap-3 text-black/55">
                  <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">Point de RDV : {event.meeting_point}</span>
                </div>
              )}
              {event.places_max && (
                <div className="flex items-center gap-3 text-black/55">
                  <Users size={15} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[13px]">
                    {event.registrationCount} inscrit{event.registrationCount > 1 ? 's' : ''}
                    {placesDispo !== null && (
                      <span className={`ml-2 ${placesDispo <= 5 ? 'text-orange-500' : 'text-black/35'}`}>
                        · {placesDispo} place{placesDispo > 1 ? 's' : ''} restante{placesDispo > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-[14px] text-black/55 leading-[1.8]">
                {event.description}
              </p>
            )}
          </div>

          <ChallengeRegistrationCard event={event} />
        </div>
      </div>
      {Array.isArray(event.gallery) && event.gallery.length > 0 && (
        <section className="border-t border-noir/[0.05]">
          <div className="mx-auto w-full max-w-6xl py-12">
            <h2 className="mb-6 font-display text-[22px] font-normal text-black">Photos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {event.gallery.map((url: string) => (
                <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
                  <img src={url} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EvenementDetail;
```

⚠️ Le rendu "autre type" ci-dessus utilise encore `<ChallengeRegistrationCard event={event} />` pour ne pas dupliquer le formulaire générique — **ce n'est pas idéal sémantiquement** (le nom du composant dit "Challenge") mais c'est le comportement du code d'origine (le même formulaire d'inscription servait déjà tous les types). Ne pas renommer dans ce lot (hors périmètre) ; si une confusion de nom gêne plus tard, un renommage en `EventRegistrationCard` est un refactor sûr et isolé.

Ajouter l'import :

```typescript
import { ChallengeLanding } from '../components/events/ChallengeLanding';
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Vérification manuelle (dev server)**

Run: `npm run dev`, puis dans le navigateur :
1. Ouvrir un événement existant `type != 'challenge'` (ex. `/evenements/run-club-marin` ou le slug réel présent en base) → le rendu doit être identique à avant (hero image, colonne infos, formulaire).
2. Créer un challenge de test dans `/admin/evenements` (préfixe `TEST-`, cf. `docs/test-e2e-challenge-2026-09-11.md`) et ouvrir `/evenements/{son-slug}` → doit afficher la nouvelle charpente (hero sombre, réassurance, encadré, formulaire).
3. Nettoyer les données de test créées.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EvenementDetail.tsx
git commit -m "feat(challenge): branche ChallengeLanding sur /evenements/:slug pour type=challenge"
```

---

## Task 8: État "aucune vague ouverte"

**Files:**
- Create: `src/components/events/ChallengeClosedState.tsx`

**Interfaces:**
- Consumes: `NewsletterSignup` (Task 3, prop `theme='light'`).
- Produces: `<ChallengeClosedState />` — sans props.

- [ ] **Step 1: Écrire le composant**

```tsx
// src/components/events/ChallengeClosedState.tsx
import { NewsletterSignup } from '../layout/NewsletterSignup';

/**
 * Aucune date sur cette page qui ne soit une ligne en base (règle
 * équipe, 11/09) : pas de rythme de vagues codé en dur. Le jour où
 * Catherine crée son prochain challenge dans l'admin, il apparaît sans
 * qu'on touche à ce composant.
 */
export function ChallengeClosedState() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28 lg:px-[72px]">
        <div className="rounded-[2px] border border-noir/10 bg-surface-card p-8 md:p-14">
          <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-black/42">Prochaine vague</p>
          <h1
            className="mb-5 font-display font-normal"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(21px, 2.4vw, 30px)' }}
          >
            Le prochain Challenge 21 jours <em className="italic text-black/55">ouvre bientôt</em>
          </h1>
          <p className="mb-8 max-w-[56ch] text-[14px] leading-relaxed text-black/62">
            Les créneaux de bilan s’ouvrent deux semaines avant le début de chaque challenge.
            Laisse ton e-mail : tu seras prévenu·e le jour de l’ouverture, avant tout le monde.
          </p>
          <NewsletterSignup theme="light" source="challenge-closed" align="left" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/ChallengeClosedState.tsx
git commit -m "feat(challenge): état fermé (aucune vague ouverte) sans rythme codé en dur"
```

---

## Task 9: Route stable `/evenements/challenge-21-jours`

**Files:**
- Create: `src/pages/ChallengeLandingPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `todayInMartinique` (Task 1), `ChallengeLanding` (Task 6), `ChallengeClosedState` (Task 8), `Event` (`src/types/database.ts`).
- Produces: route `/evenements/challenge-21-jours`.

- [ ] **Step 1: Écrire la page**

```tsx
// src/pages/ChallengeLandingPage.tsx
import { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/database';
import { todayInMartinique } from '../lib/martiniqueDate';
import { ChallengeLanding } from '../components/events/ChallengeLanding';
import { ChallengeClosedState } from '../components/events/ChallengeClosedState';

type EventWithCount = Event & { registrationCount: number };

const ChallengeLandingPage = () => {
  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Challenge 21 jours — PessÓra';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchNextChallenge = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, event_registrations!event_registrations_event_id_fkey(count)')
        .eq('type', 'challenge')
        .eq('active', true)
        .gte('date', todayInMartinique())
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle() as { data: (Event & { event_registrations: { count: number | string }[] }) | null; error: { code?: string } | null };

      if (cancelled) return;

      if (error) {
        setFetchError('Impossible de charger le challenge.');
      } else if (data) {
        setEvent({
          ...data,
          registrationCount: Number(data.event_registrations?.[0]?.count ?? 0),
        });
      }
      // Pas de challenge à venir : `event` reste `null`, ce qui rend
      // l'état fermé plus bas — ce n'est pas une erreur.
      setLoading(false);
    };
    fetchNextChallenge();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Chargement…</span>
        <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-32 text-center md:px-10 lg:px-[72px]">
          <p className="mb-4 text-[14px] text-black/50">{fetchError}</p>
        </div>
      </div>
    );
  }

  return event ? <ChallengeLanding event={event} /> : <ChallengeClosedState />;
};

export default ChallengeLandingPage;
```

- [ ] **Step 2: Enregistrer la route dans `App.tsx`**

Ajouter le lazy import avec les autres pages (à côté de `Evenements`/`EvenementDetail`) :

```typescript
const ChallengeLandingPage = lazy(() => import('./pages/ChallengeLandingPage'));
```

Ajouter la route **avant** `/evenements/:slug` :

```tsx
            <Route path="/evenements" element={<Evenements />} />
            <Route path="/evenements/challenge-21-jours" element={<ChallengeLandingPage />} />
            <Route path="/evenements/:slug" element={<EvenementDetail />} />
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérification manuelle (dev server)**

Run: `npm run dev`, puis :
1. S'assurer qu'aucun challenge actif à venir n'existe en base (baseline habituelle du projet), ouvrir `http://localhost:3000/evenements/challenge-21-jours` → état fermé (titre + newsletter), pas d'erreur console, **aucun élément avec `border-dashed`** inspecté dans le DOM.
2. Créer un challenge de test (`active=true`, date future, préfixe `TEST-`) dans `/admin/evenements`, recharger **la même URL** → état ouvert, hero + encadré + formulaire, la barre d'adresse reste `/evenements/challenge-21-jours` (aucune redirection).
3. Nettoyer la donnée de test créée.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChallengeLandingPage.tsx src/App.tsx
git commit -m "feat(challenge): route stable /evenements/challenge-21-jours"
```

---

## Task 10: `Evenements.tsx` — ancre au chargement + fuseau horaire

**Files:**
- Modify: `src/pages/Evenements.tsx:241` (fuseau horaire de `todayStr`)
- Modify: `src/pages/Evenements.tsx:292-294` (ajout d'un id d'ancre)
- Modify: `src/pages/Evenements.tsx` (nouvel effet de scroll au montage)

**Interfaces:**
- Consumes: `todayInMartinique` (Task 1).

- [ ] **Step 1: Corriger le fuseau horaire de `todayStr`**

`Evenements.tsx:241` utilise aujourd'hui `new Date().toISOString().slice(0, 10)` — exactement le bug de fuseau que la règle équipe interdit (bascule 4h trop tôt en soirée heure de Martinique). Remplacer :

```typescript
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
```

par :

```typescript
  const todayStr = useMemo(() => todayInMartinique(), []);
```

Ajouter l'import en tête de fichier :

```typescript
import { todayInMartinique } from '../lib/martiniqueDate';
```

- [ ] **Step 2: Ajouter l'ancre sur la rubrique challenge**

`Evenements.tsx:292-294` :

```tsx
      {/* ── Rubrique dédiée : Challenge 21 jours (pas de page séparée) ── */}
      {!loading && upcomingChallenges.length > 0 && (
        <section className="border-b border-noir/[0.06] bg-noir px-4 py-14 text-white md:px-10 md:py-16 lg:px-[72px]">
```

devient :

```tsx
      {/* ── Rubrique dédiée : Challenge 21 jours (pas de page séparée) ── */}
      {!loading && upcomingChallenges.length > 0 && (
        <section id="challenge-21-jours" className="border-b border-noir/[0.06] bg-noir px-4 py-14 text-white md:px-10 md:py-16 lg:px-[72px]">
```

- [ ] **Step 3: Lire `location.hash` au chargement et scroller**

Ajouter l'import `useLocation` (déjà `react-router-dom` est importé pour `Link`/`useSearchParams`, ajouter `useLocation` à côté) :

```typescript
import { Link, useLocation, useSearchParams } from 'react-router-dom';
```

Dans le corps du composant, après le chargement des événements (`upcomingChallenges` dépend de `loading`), ajouter un effet qui scrolle une fois que le contenu est là :

```typescript
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash]);
```

(Placer cet effet après la déclaration de `loading`/`events`, avant le `return`.)

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérification manuelle**

Avec un challenge à venir en base (créer un `TEST-` si besoin), ouvrir en navigation privée `http://localhost:3000/evenements#challenge-21-jours` → la page doit défiler jusqu'à la rubrique challenge, sans recharger en haut. Nettoyer la donnée de test si créée pour ce test.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Evenements.tsx
git commit -m "fix(evenements): lit location.hash au chargement + fuseau Martinique pour todayStr"
```

---

## Task 11: `AdminBilans.tsx` — libellé désactivé / hors fenêtre

**Files:**
- Modify: `src/pages/admin/AdminBilans.tsx:63-75`
- Test: `src/__tests__/slotChallengeLabel.test.ts`

**Interfaces:**
- Produces: `slotChallengeLabel(slot: BilanSlot, challenges: ChallengeEvent[], todayStr: string): string` (signature étendue avec `todayStr` pour être testable sans dépendre de `Date.now()`).

`slotChallengeLabel` est actuellement définie **dans** `AdminBilans.tsx` (pas exportée). Pour la tester unitairement sans monter tout le composant, elle est extraite dans un module dédié.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/slotChallengeLabel.test.ts
import { describe, it, expect } from 'vitest';
import { slotChallengeLabel, type BilanSlotLike, type ChallengeEventLike } from '../lib/slotChallengeLabel';

const TODAY = '2026-09-11';

function slot(overrides: Partial<BilanSlotLike> = {}): BilanSlotLike {
  return { challenge_event_id: 'c1', ...overrides };
}

function challenge(overrides: Partial<ChallengeEventLike> = {}): ChallengeEventLike {
  return { id: 'c1', title: 'TEST-KEN Challenge', date: '2026-09-15', active: true, ...overrides };
}

describe('slotChallengeLabel', () => {
  it('créneau orphelin', () => {
    expect(slotChallengeLabel(slot({ challenge_event_id: null }), [], TODAY))
      .toBe('Orphelin — hors de la fenêtre d’un challenge actif (J-14 → J)');
  });

  it('challenge introuvable (id orphelin de fait)', () => {
    expect(slotChallengeLabel(slot({ challenge_event_id: 'inconnu' }), [challenge()], TODAY))
      .toBe('Rattaché (challenge introuvable)');
  });

  it('challenge actif, dans la fenêtre J-14 → J', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-09-15' })], TODAY))
      .toBe('→ TEST-KEN Challenge');
  });

  it('challenge désactivé', () => {
    expect(slotChallengeLabel(slot(), [challenge({ active: false })], TODAY))
      .toBe('→ TEST-KEN Challenge (désactivé — invisible publiquement)');
  });

  it('challenge actif mais hors fenêtre J-14 → J (trop tôt)', () => {
    expect(slotChallengeLabel(slot(), [challenge({ date: '2026-12-25' })], TODAY))
      .toBe('→ TEST-KEN Challenge (hors fenêtre — pas encore réservable)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/slotChallengeLabel.test.ts`
Expected: FAIL — `Cannot find module '../lib/slotChallengeLabel'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/slotChallengeLabel.ts

export interface BilanSlotLike {
  challenge_event_id: string | null;
}

export interface ChallengeEventLike {
  id: string;
  title: string;
  date: string;
  active: boolean;
}

/** Fenêtre de recevabilité d'un challenge : J-14 → J (même règle que fn_bilan_slot_bookable en base). */
function isWithinBookingWindow(challengeDate: string, todayStr: string): boolean {
  const challenge = new Date(challengeDate + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const windowStart = new Date(challenge);
  windowStart.setDate(windowStart.getDate() - 14);
  return today >= windowStart && today <= challenge;
}

/**
 * État lisible du rattachement d'un créneau — un créneau orphelin ne doit
 * jamais disparaître en silence (exigence cliente). Distingue désormais
 * "désactivé" (active=false) de "hors fenêtre" (actif mais la date du
 * challenge ne couvre pas encore/plus ce créneau), au lieu d'un seul
 * libellé `→ titre` qui ne disait pas si le créneau était réellement
 * réservable côté public.
 */
export function slotChallengeLabel(
  slot: BilanSlotLike,
  challenges: ChallengeEventLike[],
  todayStr: string,
): string {
  if (!slot.challenge_event_id) {
    return 'Orphelin — hors de la fenêtre d’un challenge actif (J-14 → J)';
  }

  const challenge = challenges.find((c) => c.id === slot.challenge_event_id);
  if (!challenge) {
    return 'Rattaché (challenge introuvable)';
  }

  if (!challenge.active) {
    return `→ ${challenge.title} (désactivé — invisible publiquement)`;
  }

  if (!isWithinBookingWindow(challenge.date, todayStr)) {
    return `→ ${challenge.title} (hors fenêtre — pas encore réservable)`;
  }

  return `→ ${challenge.title}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/slotChallengeLabel.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Brancher dans `AdminBilans.tsx`**

Dans `src/pages/admin/AdminBilans.tsx`, supprimer la définition locale de `slotChallengeLabel` (lignes 63-75) et importer la version testée :

```typescript
import { slotChallengeLabel } from '../../lib/slotChallengeLabel';
import { todayInMartinique } from '../../lib/martiniqueDate';
```

Mettre à jour le seul appel du composant (dans le rendu de la liste des créneaux du jour sélectionné) pour passer `todayInMartinique()` :

```tsx
                          <p
                            className={`mt-1.5 text-[9px] uppercase tracking-[0.1em] ${
                              slot.challenge_event_id ? 'text-black/35' : 'text-amber-600'
                            }`}
                          >
                            {slotChallengeLabel(slot, challenges, todayInMartinique())}
                          </p>
```

⚠️ La classe de couleur (`text-black/35` vs `text-amber-600`) ne dépend aujourd'hui que de la présence d'un `challenge_event_id`. Un créneau "désactivé" ou "hors fenêtre" est **aussi** invisible publiquement — il mérite le même traitement visuel amber que l'orphelin. Mettre à jour la condition :

```tsx
                          <p
                            className={`mt-1.5 text-[9px] uppercase tracking-[0.1em] ${
                              slot.challenge_event_id && challenges.find((c) => c.id === slot.challenge_event_id)?.active
                                ? 'text-black/35'
                                : 'text-amber-600'
                            }`}
                          >
```

Cette expression est volontairement simple (pas de recalcul de la fenêtre ici) : le cas "hors fenêtre" reste sur `text-black/35` par cette condition à elle seule — c'est un choix délibéré pour ce lot (le texte du libellé porte déjà l'information "pas encore réservable", la couleur ambre est réservée aux cas où *rien* ne rattache visuellement le créneau à un challenge ou où il est franchement désactivé). Si une distinction visuelle plus fine est demandée à la recette, elle se fera dans un correctif de suivi.

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Vérification manuelle**

Dans `/admin/bilans`, onglet Créneaux : créer un challenge `active=false` avec un créneau rattaché → le libellé doit afficher "(désactivé — invisible publiquement)". Créer un challenge `active=true` avec une date à plus de 14 jours et un créneau rattaché → "(hors fenêtre — pas encore réservable)". Nettoyer les données de test.

- [ ] **Step 8: Commit**

```bash
git add src/lib/slotChallengeLabel.ts src/__tests__/slotChallengeLabel.test.ts src/pages/admin/AdminBilans.tsx
git commit -m "fix(admin): distingue créneau désactivé vs hors fenêtre dans slotChallengeLabel"
```

---

## Task 12: Vérification finale et non-régression

**Files:** aucun fichier nouveau — vérification transverse.

- [ ] **Step 1: Suite de tests complète**

Run: `npx vitest run`
Expected: tous les nouveaux tests passent ; les échecs pré-existants de `cartStore.test.ts` (connus, documentés dans `docs/CONSIGNES-CLAUDE.md`) sont les seuls échecs.

- [ ] **Step 2: Build complet**

Run: `npx tsc --noEmit && npm run build` (ou vérifier via le build Vercel de la PR — le build local peut échouer sur le postinstall `@heroui-pro/react`, cas documenté et attendu).
Expected: `tsc` vert. Si le build local échoue au postinstall, s'appuyer sur le build Vercel de la preview.

- [ ] **Step 3: Grep de contrôle Herbalife**

Run: `grep -ri "herbalife\|complément de revenus" src/`
Expected: aucun résultat.

- [ ] **Step 4: Grep de contrôle fuseau horaire**

Run: `grep -rn "toISOString().slice(0, ?10)" src/pages/ChallengeLandingPage.tsx src/components/events/`
Expected: aucun résultat.

- [ ] **Step 5: Grep de contrôle pointillés (porte ① @vela)**

Run: `grep -rn "dashed" src/components/events/ src/pages/ChallengeLandingPage.tsx`
Expected: aucun résultat — aucun cadre en pointillés n'a été introduit dans les composants de production (`ChallengeHero` utilise le dégradé de repli, pas un cadre "à produire").

- [ ] **Step 6: Relecture manuelle — aucune promesse de résultat chiffré**

Relire le texte de `ChallengeHero.tsx` et `ChallengeTrustBadges.tsx` (les seuls endroits avec du texte de vente sur cette page) : aucune mention de poids, de délai de résultat, ou de formule type "perds X kg" / "résultats garantis". Le texte actuel ("21 jours accompagnés", "reprendre la main sur ton énergie, ta forme et tes habitudes") décrit le service, jamais son effet — conforme à la règle @vela.

- [ ] **Step 7: Test e2e manuel complet (non-régression du 11/09)**

Rejouer `docs/test-e2e-challenge-2026-09-11.md` étapes 1 à 5 sur `/evenements/challenge-21-jours` **au lieu de** `/evenements/{slug}` pour l'étape 3 (parcours public) — vérifier que l'inscription, l'étape bilan, la réservation de créneau et le message "demande envoyée" fonctionnent identiquement. Nettoyer les données de test (préfixe `TEST-`) à la fin, conformément à l'étape 7 du scénario.

- [ ] **Step 8: Commit final si des ajustements ont été faits pendant la vérification**

```bash
git add -A
git commit -m "chore(challenge): ajustements de recette finale"
```

(Ne committer que s'il y a effectivement eu des changements — sinon, passer directement à l'ouverture de la PR.)
