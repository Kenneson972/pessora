# Fiche admin inscrits Challenge 21j + fix auto-remplissage membre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'admin une fiche détail + suppression pour chaque inscrit au Challenge 21 jours, et corriger l'auto-remplissage nom/prénom/téléphone pour les visiteurs connectés sur tous les formulaires d'inscription événement.

**Architecture:** Réutilisation stricte des patterns existants — `deleteRegistrant` calqué sur `useAdminEventRegistrations`, modale calquée sur le `Sheet` HeroUI Pro déjà utilisé par `ConfirmDialog`. L'auto-remplissage passe d'un `defaultValues` figé (react-hook-form) à un `useEffect` + `setValue` réactif au chargement asynchrone du profil (`AuthContext`).

**Tech Stack:** React 18, TypeScript, react-hook-form + zod, Supabase JS client, HeroUI Pro (`Sheet`), Vitest.

## Global Constraints

- Pas d'édition ni d'ajout manuel d'inscrit Challenge 21j (exclu explicitement par le client).
- L'auto-remplissage ne doit jamais écraser un champ que le visiteur a déjà rempli/modifié — vérifier que le champ est vide avant d'écrire.
- Ne rien casser du rapprochement bilan existant (`matchBilanBooking` par téléphone) lors de la suppression d'un inscrit.
- Suivre le style Tailwind existant du fichier modifié (classes utilitaires en dur, pas de nouveau design system).

---

## Task 1: Helper pur — formatage des réponses du questionnaire

**Files:**
- Create: `src/lib/challengeRegistrantDetails.ts`
- Test: `src/__tests__/challengeRegistrantDetails.test.ts`

**Interfaces:**
- Consumes: rien (fonction pure, prend le `post_registration_details` brut stocké en JSON sur `event_registrations`).
- Produces: `formatSurveyDetails(details: unknown): { key: string; label: string; value: string }[]` — utilisé par Task 3 (modale) pour l'affichage.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/challengeRegistrantDetails.test.ts
import { describe, it, expect } from 'vitest';
import { formatSurveyDetails } from '../lib/challengeRegistrantDetails';

describe('formatSurveyDetails', () => {
  it('formate les 4 champs connus quand ils sont présents', () => {
    const result = formatSurveyDetails({
      bilan_offert: 'Oui',
      objectif_principal: 'Perte de poids',
      objectif_autre: '',
      complement_revenus: 'pas_pour_le_moment',
    });
    expect(result).toEqual([
      { key: 'bilan_offert', label: 'Bilan offert', value: 'Oui' },
      { key: 'objectif_principal', label: 'Objectif principal', value: 'Perte de poids' },
      { key: 'complement_revenus', label: 'Complément de revenus', value: 'Pas pour le moment' },
    ]);
  });

  it('inclut objectif_autre uniquement si objectif_principal vaut Autre', () => {
    const result = formatSurveyDetails({
      objectif_principal: 'Autre',
      objectif_autre: 'Reprendre le sport après une blessure',
    });
    expect(result).toContainEqual({
      key: 'objectif_autre',
      label: 'Précision objectif',
      value: 'Reprendre le sport après une blessure',
    });
  });

  it('ignore objectif_autre si objectif_principal ne vaut pas Autre', () => {
    const result = formatSurveyDetails({
      objectif_principal: 'Perte de poids',
      objectif_autre: 'Ne devrait pas apparaître',
    });
    expect(result.find((r) => r.key === 'objectif_autre')).toBeUndefined();
  });

  it('traduit la valeur complement_revenus vers un libellé lisible', () => {
    const result = formatSurveyDetails({
      complement_revenus: 'decouvrir_opportunite_herbalife',
    });
    expect(result[0].value).toBe("Intéressé(e) — à recontacter");
  });

  it('rend un tableau vide si details est null ou pas un objet', () => {
    expect(formatSurveyDetails(null)).toEqual([]);
    expect(formatSurveyDetails('pas un objet')).toEqual([]);
    expect(formatSurveyDetails(undefined)).toEqual([]);
  });

  it('ignore les champs vides ou absents', () => {
    const result = formatSurveyDetails({ objectif_principal: '', bilan_offert: undefined });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/challengeRegistrantDetails.test.ts`
Expected: FAIL — `Cannot find module '../lib/challengeRegistrantDetails'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/challengeRegistrantDetails.ts

const COMPLEMENT_REVENUS_LABELS: Record<string, string> = {
  decouvrir_opportunite_herbalife: 'Intéressé(e) — à recontacter',
  pas_pour_le_moment: 'Pas pour le moment',
};

const FIELD_LABELS: Record<string, string> = {
  bilan_offert: 'Bilan offert',
  objectif_principal: 'Objectif principal',
  objectif_autre: 'Précision objectif',
  complement_revenus: 'Complément de revenus',
};

const FIELD_ORDER = ['bilan_offert', 'objectif_principal', 'objectif_autre', 'complement_revenus'];

export interface SurveyDetailEntry {
  key: string;
  label: string;
  value: string;
}

function readString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Formate `event_registrations.post_registration_details` (JSON) pour affichage admin. */
export function formatSurveyDetails(details: unknown): SurveyDetailEntry[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
  const obj = details as Record<string, unknown>;
  const objectifPrincipal = readString(obj, 'objectif_principal');

  const entries: SurveyDetailEntry[] = [];
  for (const key of FIELD_ORDER) {
    if (key === 'objectif_autre' && objectifPrincipal !== 'Autre') continue;
    const raw = readString(obj, key);
    if (raw === '') continue;
    const value = key === 'complement_revenus' ? (COMPLEMENT_REVENUS_LABELS[raw] ?? raw) : raw;
    entries.push({ key, label: FIELD_LABELS[key], value });
  }
  return entries;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/challengeRegistrantDetails.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/challengeRegistrantDetails.ts src/__tests__/challengeRegistrantDetails.test.ts
git commit -m "feat: helper de formatage des réponses questionnaire Challenge 21j"
```

---

## Task 2: `deleteRegistrant` + `post_registration_details` brut dans le hook

**Files:**
- Modify: `src/hooks/useAdminChallengeRegistrants.ts`

**Interfaces:**
- Consumes: rien de nouveau (garde la signature `useAdminChallengeRegistrants(challengeEventId: string | null)`).
- Produces: `ChallengeRegistrantRow` gagne un champ `details: unknown` (le `post_registration_details` brut). Le hook retourne en plus `deleteRegistrant(id: string): Promise<void>`. Consommé par Task 3 (modale) et Task 4 (page admin).

- [ ] **Step 1: Modifier l'interface et le mapping**

Dans `src/hooks/useAdminChallengeRegistrants.ts`, ajouter le champ `details` à l'interface :

```typescript
export interface ChallengeRegistrantRow {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  created_at: string;
  objectif: string | null;
  complementRevenus: string | null;
  bilan: { date: string; heure: string } | null;
  details: unknown;
}
```

Dans le `.map()` de `refetch`, ajouter `details` à l'objet retourné (juste après `const details = (r as any).post_registration_details;`) :

```typescript
          return {
            id: r.id,
            prenom: r.prenom,
            nom: r.nom,
            telephone: r.telephone,
            created_at: r.created_at,
            objectif: readDetail(details, 'objectif_principal'),
            complementRevenus: readDetail(details, 'complement_revenus'),
            bilan: match ? { date: match.date_rdv, heure: match.heure_rdv } : null,
            details,
          };
```

- [ ] **Step 2: Ajouter `deleteRegistrant`**

Toujours dans `src/hooks/useAdminChallengeRegistrants.ts`, après la définition de `refetch` et avant le `return` final :

```typescript
  const deleteRegistrant = useCallback(async (id: string) => {
    await (supabase as any).from('event_registrations').delete().eq('id', id);
    refetch();
  }, [refetch]);

  return { rows, loading, error, refetch, deleteRegistrant };
```

(Remplace le `return { rows, loading, error, refetch };` existant.)

- [ ] **Step 3: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p .`
Expected: aucune nouvelle erreur liée à `useAdminChallengeRegistrants.ts` (le hook n'est pas encore consommé avec `details`/`deleteRegistrant` ailleurs à ce stade — c'est attendu).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAdminChallengeRegistrants.ts
git commit -m "feat: deleteRegistrant + post_registration_details brut dans useAdminChallengeRegistrants"
```

---

## Task 3: Modale de fiche détail — `ChallengeRegistrantDetailModal`

**Files:**
- Create: `src/components/admin/ChallengeRegistrantDetailModal.tsx`

**Interfaces:**
- Consumes: `formatSurveyDetails` de `src/lib/challengeRegistrantDetails.ts` (Task 1), type `ChallengeRegistrantRow` de `src/hooks/useAdminChallengeRegistrants.ts` (Task 2).
- Produces: composant `ChallengeRegistrantDetailModal` avec props :
  ```typescript
  export interface ChallengeRegistrantDetailModalProps {
    registrant: ChallengeRegistrantRow | null;
    onClose: () => void;
    onDelete: (id: string) => Promise<void>;
  }
  ```
  Consommé par Task 4 (`AdminChallenge21j.tsx`).

- [ ] **Step 1: Écrire le composant**

```typescript
// src/components/admin/ChallengeRegistrantDetailModal.tsx
import { useState } from 'react';
import { Sheet } from '@heroui-pro/react';
import { Trash2 } from 'lucide-react';
import { formatSurveyDetails } from '../../lib/challengeRegistrantDetails';
import { ConfirmDialog } from '../dashboard/ConfirmDialog';
import type { ChallengeRegistrantRow } from '../../hooks/useAdminChallengeRegistrants';

export interface ChallengeRegistrantDetailModalProps {
  registrant: ChallengeRegistrantRow | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const rowClass = 'flex items-baseline justify-between gap-4 border-b border-noir/[0.05] py-2.5 last:border-0';
const labelClass = 'text-[10px] uppercase tracking-[0.14em] text-black/40';
const valueClass = 'text-[12px] text-black text-right';

export function ChallengeRegistrantDetailModal({ registrant, onClose, onDelete }: ChallengeRegistrantDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOpen = registrant !== null;
  const surveyEntries = registrant ? formatSurveyDetails(registrant.details) : [];

  const handleDelete = async () => {
    if (!registrant) return;
    setDeleting(true);
    try {
      await onDelete(registrant.id);
      setConfirmDelete(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet isOpen={isOpen} onOpenChange={(next) => { if (!next) onClose(); }} isDetached shouldAutoFocus>
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="mx-auto max-w-lg">
            <Sheet.Dialog className="rounded-[2px] border border-noir/[0.08] bg-white p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]">
              {registrant && (
                <>
                  <Sheet.Header className="p-0">
                    <Sheet.Heading className="text-[15px] font-normal tracking-[0.02em] text-noir">
                      {registrant.prenom} {registrant.nom}
                    </Sheet.Heading>
                  </Sheet.Header>

                  <div className="mt-4">
                    <div className={rowClass}>
                      <span className={labelClass}>Téléphone</span>
                      <span className={valueClass}>{registrant.telephone}</span>
                    </div>
                    <div className={rowClass}>
                      <span className={labelClass}>Inscription</span>
                      <span className={valueClass}>{new Date(registrant.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className={rowClass}>
                      <span className={labelClass}>Bilan réservé</span>
                      <span className={valueClass}>
                        {registrant.bilan ? `${registrant.bilan.date} à ${registrant.bilan.heure.slice(0, 5)}` : 'Pas encore réservé'}
                      </span>
                    </div>
                    {surveyEntries.map((entry) => (
                      <div key={entry.key} className={rowClass}>
                        <span className={labelClass}>{entry.label}</span>
                        <span className={valueClass}>{entry.value}</span>
                      </div>
                    ))}
                    {surveyEntries.length === 0 && (
                      <p className="pt-2 text-[11px] text-black/30">Questionnaire pas encore rempli.</p>
                    )}
                  </div>

                  <Sheet.Footer className="mt-6 flex justify-between p-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-light text-red-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 size={13} strokeWidth={1.6} />
                      Supprimer l'inscription
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-[2px] border border-noir/15 text-[10px] font-light uppercase tracking-[0.12em] text-black/55 transition-colors hover:text-noir hover:border-noir/25"
                    >
                      Fermer
                    </button>
                  </Sheet.Footer>
                </>
              )}
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette inscription ?"
        description={registrant ? `${registrant.prenom} ${registrant.nom} sera retiré(e) définitivement de la liste des inscrits.` : undefined}
        confirmLabel="Supprimer"
        loading={deleting}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p .`
Expected: aucune erreur de type dans `ChallengeRegistrantDetailModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ChallengeRegistrantDetailModal.tsx
git commit -m "feat: modale fiche détail inscrit Challenge 21j"
```

---

## Task 4: Brancher la modale dans `AdminChallenge21j.tsx`

**Files:**
- Modify: `src/pages/admin/AdminChallenge21j.tsx`

**Interfaces:**
- Consumes: `ChallengeRegistrantDetailModal` (Task 3), `registrantsHook.deleteRegistrant` (Task 2).

- [ ] **Step 1: Importer le composant**

En haut de `src/pages/admin/AdminChallenge21j.tsx`, avec les autres imports de `../../components/` :

```typescript
import { ChallengeRegistrantDetailModal } from '../../components/admin/ChallengeRegistrantDetailModal';
```

- [ ] **Step 2: Ajouter l'état de sélection**

Dans le corps du composant, à côté des autres `useState` liés aux inscrits (juste après la ligne `const registrantsHook = useAdminChallengeRegistrants(selected?.id ?? null);`, ligne ~253) :

```typescript
  const [selectedRegistrantId, setSelectedRegistrantId] = useState<string | null>(null);
  const selectedRegistrant = registrantsHook.rows.find((r) => r.id === selectedRegistrantId) ?? null;
```

- [ ] **Step 3: Rendre les lignes du tableau cliquables**

Dans le `<tbody>` de la section "Brique C — inscrits" (ligne ~539), remplacer :

```typescript
                    {registrantsHook.rows.map((r) => (
                      <tr key={r.id} className="border-b border-noir/[0.03]">
```

par :

```typescript
                    {registrantsHook.rows.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRegistrantId(r.id)}
                        className="cursor-pointer border-b border-noir/[0.03] transition-colors hover:bg-noir/[0.02]"
                      >
```

- [ ] **Step 4: Monter la modale**

Juste avant la fermeture du composant (après le dernier `<ConfirmDialog ... />` existant, avant le `</div>` / `);` final de la fonction — chercher la fin du fichier), ajouter :

```typescript
      <ChallengeRegistrantDetailModal
        registrant={selectedRegistrant}
        onClose={() => setSelectedRegistrantId(null)}
        onDelete={registrantsHook.deleteRegistrant}
      />
```

- [ ] **Step 5: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 6: Test manuel dans le navigateur**

Run: `npm run dev` (si pas déjà lancé), ouvrir `http://localhost:3000/admin/challenge-21j` (ou route équivalente listée dans `src/App.tsx` / le routeur), sélectionner un challenge ayant des inscrits.
Expected: cliquer sur une ligne ouvre la modale avec toutes les infos ; le bouton "Supprimer l'inscription" déclenche la confirmation, puis retire la ligne du tableau après confirmation.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminChallenge21j.tsx
git commit -m "feat: ouvrir la fiche détail au clic sur un inscrit Challenge 21j"
```

---

## Task 5: Auto-remplissage réactif — `ChallengeRegistrationCard`

**Files:**
- Modify: `src/components/events/ChallengeRegistrationCard.tsx`

**Interfaces:**
- Consumes: `useAuth()` (existant), `useForm` de react-hook-form (existant).
- Produces: rien de nouveau exposé — comportement interne du composant.

- [ ] **Step 1: Importer `useEffect` et récupérer `getValues`/`setValue`**

En haut du fichier, la ligne d'import React existe déjà (`import { useState } from 'react';`) — la remplacer par :

```typescript
import { useEffect, useState } from 'react';
```

Modifier la déstructuration du hook `useForm` (actuellement `const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({`) pour ajouter `getValues` et `setValue` :

```typescript
  const { control, handleSubmit, getValues, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
```

- [ ] **Step 2: Ajouter l'effet d'auto-remplissage**

Juste après le bloc `useForm(...)`, avant `const placesDispo = ...` :

```typescript
  useEffect(() => {
    if (!user) return;
    if (getValues('nom') === '' && user.lastName) setValue('nom', user.lastName, { shouldValidate: false });
    if (getValues('prenom') === '' && user.firstName) setValue('prenom', user.firstName, { shouldValidate: false });
    if (getValues('telephone') === '' && user.phone) setValue('telephone', user.phone, { shouldValidate: false });
  }, [user, getValues, setValue]);
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 4: Test manuel dans le navigateur**

Se connecter avec un compte membre ayant nom/prénom/téléphone renseignés (voir `docs/auto-learn/` ou mémoire pour un compte de test), naviguer vers un événement standard (type != challenge), recharger la page (Cmd+R) pour forcer le rechargement asynchrone du profil.
Expected: les champs nom/prénom/téléphone du formulaire d'inscription se remplissent automatiquement, même si la page a mis un instant à charger le profil.

- [ ] **Step 5: Commit**

```bash
git add src/components/events/ChallengeRegistrationCard.tsx
git commit -m "fix: auto-remplissage réactif nom/prénom/téléphone pour visiteur connecté (événements standards)"
```

---

## Task 6: Auto-remplissage réactif — `Challenge21jRegistrationCard`

**Files:**
- Modify: `src/components/events/Challenge21jRegistrationCard.tsx`

**Interfaces:**
- Consumes: `useAuth()` (existant), `useForm` de react-hook-form (existant, déjà déstructuré avec `setValue` à la ligne ~231 — `getValues` doit être ajouté).

- [ ] **Step 1: Vérifier l'import de `useEffect`**

Le fichier importe déjà `useMemo` depuis `react` (visible dans le `watch`/`useMemo` autour de la ligne 245). Vérifier l'import en tête de fichier et s'assurer que `useEffect` y figure — l'ajouter sinon :

```typescript
import { useEffect, useMemo, useState } from 'react';
```

- [ ] **Step 2: Ajouter `getValues` à la déstructuration `useForm`**

Ligne ~231, remplacer :

```typescript
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
```

par :

```typescript
  const { control, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
```

- [ ] **Step 3: Ajouter l'effet d'auto-remplissage**

Juste après le bloc `useForm(...)` (après la fermeture `});` de la ligne ~243), avant `const professionValue = watch('profession');` :

```typescript
  useEffect(() => {
    if (!user) return;
    if (getValues('nom') === '' && user.lastName) setValue('nom', user.lastName, { shouldValidate: false });
    if (getValues('prenom') === '' && user.firstName) setValue('prenom', user.firstName, { shouldValidate: false });
    if (getValues('telephone') === '' && user.phone) setValue('telephone', user.phone, { shouldValidate: false });
  }, [user, getValues, setValue]);
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit -p .`
Expected: aucune erreur.

- [ ] **Step 5: Test manuel dans le navigateur**

Se connecter avec le même compte membre de test, naviguer vers `/evenements/challenge-21-jours` (ou la landing Challenge 21j), recharger la page.
Expected: les champs nom/prénom/téléphone se remplissent automatiquement dès que le profil est chargé.

- [ ] **Step 6: Commit**

```bash
git add src/components/events/Challenge21jRegistrationCard.tsx
git commit -m "fix: auto-remplissage réactif nom/prénom/téléphone pour visiteur connecté (Challenge 21j)"
```

---

## Task 7: Vérification finale

**Files:** aucun changement — validation seule.

- [ ] **Step 1: Suite de tests complète**

Run: `npx vitest run`
Expected: tous les tests passent, y compris les 6 nouveaux de Task 1.

- [ ] **Step 2: Typecheck complet**

Run: `npx tsc --noEmit -p .`
Expected: 0 erreur.

- [ ] **Step 3: Lint**

Run: `npx eslint src/lib/challengeRegistrantDetails.ts src/hooks/useAdminChallengeRegistrants.ts src/components/admin/ChallengeRegistrantDetailModal.tsx src/pages/admin/AdminChallenge21j.tsx src/components/events/ChallengeRegistrationCard.tsx src/components/events/Challenge21jRegistrationCard.tsx`
Expected: 0 erreur.

- [ ] **Step 4: Récap manuel dans le navigateur**

Avec `npm run dev` lancé sur `http://localhost:3000` :
1. `/admin/challenge-21j` → sélectionner un challenge avec inscrits → cliquer une ligne → fiche s'ouvre → supprimer → ligne disparaît.
2. Compte membre connecté → un événement standard → champs pré-remplis après rechargement.
3. Compte membre connecté → page Challenge 21j → champs pré-remplis après rechargement.
4. Visiteur non connecté (navigation privée) → les deux formulaires restent vides par défaut (pas de régression).

Ne pas commit à cette étape — c'est une vérification, pas un changement de code.
