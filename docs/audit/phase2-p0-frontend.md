# Phase 2 — P0 UX Bloquant (Frontend) — Pessora

---

## 🔴 P0-01 : PickupTimePicker — créneaux périmés

**Fichier** : `src/components/cart/PickupTimePicker.tsx:44,66`

**Problème** : `useMemo([businessHours])` ne se réévalue jamais. `new Date()` appelé dedans mais le memo ne change pas avec le temps. Slots expirés restent affichés.

**À faire** :
- Remplacer `useMemo` par un `useState` recalculé via `useEffect` + `setInterval` (toutes les 60s)
- OU ajouter `Date.now()` comme clé de dépendance dans useMemo (recalcul à chaque render)

---

## 🔴 P0-02 : DrinkOptionsModal — bouton "Ajouté" invisible

**Fichier** : `src/components/cart/DrinkOptionsModal.tsx:267-274`

**Problème** : `text-sapin` + `bg-sapin` = texte vert sur fond vert, totalement invisible.

**À faire** :
```tsx
// Remplacer par :
<Check className="h-4 w-4 text-white" strokeWidth={2} />
<span className="text-white">Ajouté</span>
```

---

## 🔴 P0-03 : OrderDetail — statuts en anglais

**Fichier** : `src/pages/member/OrderDetail.tsx:8-12`

**Problème** : `STATUS_LABEL` manque `paid`, `preparing`, `ready`. Tombent en fallback anglais brut.

**À faire** :
```ts
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
```

---

## 🔴 P0-04 : CartDrawer — pickupTime non réinitialisé

**Fichier** : `src/components/cart/CartDrawer.tsx:28,249-256`

**Problème** : `clearCart()` vide le panier mais `pickupTime` garde sa valeur. Ancien créneau pré-sélectionné silencieusement.

**À faire** : Ajouter `setPickupTime('')` dans le handler `clearCart`.

---

**Contexte** : Projet Pessora, /opt/data/repos/pessora. Stack React+TS+Tailwind+Supabase.
