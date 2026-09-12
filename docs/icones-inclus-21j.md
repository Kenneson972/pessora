# Les 6 pictogrammes « inclus » — Challenge 21 jours

**Livré le 12/09/2026.** À câbler dans `ChallengeProgramCard.tsx` : un `icon` par item de `INCLUS`,
rendu **inconditionnellement** — centré dans l'état de repli, en petit au-dessus du libellé dans l'état illustré.

**Correction assumée** : la maquette portait **le même check répété six fois** (lignes 280-285) —
ce n'étaient pas six pictogrammes. Ils sont dessinés ici.

## Taille de rendu — décision du 12/09 (mesurée par @vela à taille réelle)

Les 6 pictogrammes ont été rendus à **15 px**, **24 px**, **48 px** et sur fond sombre.
À **15 px**, deux se dégradent : **communauté** (les deux personnes fusionnent en une tache)
et **séances de sport** (l'haltère devient un tiret à deux points). Les quatre autres sont nets.

**Décision : on ne redessine rien, on fixe la taille de l'état illustré à 20 px.**
À 20 px les six passent — et une seule règle vaut pour les six, au lieu de deux dessins retouchés.

| État | Taille | Position |
|---|---|---|
| **Illustré** (bannière livrée) | **20 px** | petite, **au-dessus** du libellé |
| **Repli** (pas encore d'image) | **grande** (48-56 px) | **centrée** sur le dégradé |

🔴 **Et le piège à ne pas recréer** : la taille de l'état illustré est **fixée en px**, jamais en `em`,
en `%` ou dérivée de la carte. Sinon l'icône rétrécit avec les cartes étroites et on **retombe
sous 15 px à 390 px de large** — c'est-à-dire exactement là où le visiteur est sur mobile.

## Style (à respecter, c'est ce qui les rend cohérents entre eux)

- `viewBox="0 0 24 24"`, **trait seul** — `fill="none"`, `stroke="currentColor"`, `stroke-width 1.4`,
  `stroke-linecap="round"`, `stroke-linejoin="round"`.
- 🔴 **Le SVG ne porte JAMAIS de couleur en dur** (`currentColor` obligatoire) — c'est la règle de fond.
- 🔴 **La couleur du CSS est du CLAIR (blanc / ivoire), pas du sapin** — corrigé le 12/09 après une
  erreur de ma part : le libellé **et** l'icône sont **superposés au voile sombre** de la carte
  (le libellé est en `text-white` aujourd'hui — s'il était sur le fond clair de la carte, il serait
  **déjà** invisible). Du sapin sur ce voile = **1,24 à 1,45:1**, soit six icônes invisibles dès le
  premier commit, avant même la première bannière.
- ⚠️ **Et le voile doit être étendu d'environ 24 px** pour couvrir l'icône : elle se place **au-dessus**
  du libellé (~50 px du bas), là où le dégradé s'estompe. Mesure du pire cas (photo blanche sous
  l'icône, carte de 244 px) : **3,07:1** — ça passe, mais une carte **5 % plus courte** passerait
  **sous 3:1**, et cela arriverait le jour où quelqu'un ajuste un `max-w` sans penser aux icônes.
  Avec les 24 px en plus, on remonte à **~4,4:1**.
- Grille de 24, formes géométriques, **aucun détail décoratif** — même grammaire que les
  icônes déjà présentes dans le site.

---

## 1 · Application GetFitNow

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <rect x="6.2" y="2.6" width="11.6" height="18.8" rx="2.6" />
  <path d="M9.4 12h1.5l1.1-2.1 1.4 4.2 1-2.1h1.6" />
  <path d="M10.6 18.6h2.8" />
</svg>
```
*Le téléphone est un objet, pas une interface : aucun cadre d'écran, aucune liste.*

## 2 · Communauté 24FIT PESSORA

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <circle cx="9.3" cy="7.6" r="3.1" />
  <path d="M3.6 20v-1.2a4 4 0 0 1 4-4h3.4a4 4 0 0 1 4 4V20" />
  <circle cx="17" cy="9" r="2.5" />
  <path d="M16.6 20v-1.1a4.2 4.2 0 0 0-2-3.5" />
</svg>
```

## 3 · Séances de sport

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M6.6 8.4v7.2M17.4 8.4v7.2M3.4 10.6v2.8M20.6 10.6v2.8M6.6 12h10.8" />
</svg>
```
*Un haltère — le geste, pas la salle de sport.*

## 4 · Idées recettes

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M8.2 4.2h7.6l-1 15.2a1.5 1.5 0 0 1-1.5 1.4h-2.6a1.5 1.5 0 0 1-1.5-1.4L8.2 4.2Z" />
  <path d="M8.6 9.6h6.8" />
  <path d="M14.2 7.1c1-1.3 2.5-1.8 3.8-1.4.2 1.3-.6 2.6-1.8 3.1" />
</svg>
```
*Un verre et une feuille — la fraîcheur, jamais une assiette dressée.*

## 5 · Conseils & accompagnement

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M20.4 11.8c0 3.9-3.7 7-8.3 7-1 0-2-.15-2.9-.42L4.2 20l1.2-3.5a6.6 6.6 0 0 1-1.8-4.7c0-3.9 3.7-7 8.3-7s8.5 3.1 8.5 7Z" />
  <path d="m9.6 11.9 1.8 1.8 3.4-3.6" />
</svg>
```
*Une parole et une validation — l'écoute, pas un conseil générique.*

## 6 · Suivi de tes objectifs

```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="8.4" />
  <circle cx="12" cy="12" r="4.1" />
  <circle cx="12" cy="12" r="0.9" />
</svg>
```
*Une cible. Surtout pas une balance, un mètre ruban ou une courbe de poids : la cible dit l'objectif,
elle ne promet aucun résultat.*

---

## Libellés (fiche, mot pour mot — `docs/fiche-papier-challenge-21j.md` l.31)

| # | Libellé | `icon` |
|---|---|---|
| 1 | Application **GetFitNow** | téléphone + tracé d'activité |
| 2 | communauté **24FIT PESSORA** | deux personnes |
| 3 | séances de sport | haltère |
| 4 | idées recettes | verre + feuille |
| 5 | conseils & accompagnement | bulle + validation |
| 6 | suivi de tes objectifs | cible |

**Règle de rendu, une seule pour les deux états** : l'icône est **toujours** dans le DOM.
Centrée seule dans l'état de repli · en petit au-dessus du libellé dans l'état illustré.
C'est ce qui évite la grille à deux vitesses pendant la livraison des bannières
(3 images sur 6, puis 5, jusqu'à la dernière).
