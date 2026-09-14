# VÉRIFICATION ITEM PAR ITEM — PLAN-13-09

**Fait le 14/09/2026 au matin, par @elise, sur `origin/main` = `6bc79e2`.**
Méthode : `git grep` sur le code **déployé** (pas sur la doc, pas sur une branche).

> **But** : dire lesquels des 6 items du `PLAN-13-09.md` sont fermés, lesquels sont ouverts, et
> **qui les porte** — pour que Ken sache ce qui est vraiment sur lui.

---

## Le tableau

| # | Item | État | Qui |
|---|---|---|---|
| ① | Formulaire d'inscription | 🟡 **Partiel** — l'architecture est faite, la lisibilité non | @elise / @lyra |
| ② | Complément de revenus | 🔴 **Ouvert** — rien ne le collecte | @elise / @lyra / @alcyone |
| ③ | Rubrique noire `/evenements` | 🔴 **Ouvert** — l'aplat noir est toujours en ligne | @lyra / @elise |
| ④ | Rouge `conseils` (2 jetons) | 🔴 **Ouvert** — les 2 valeurs d'origine intactes | @elise |
| ⑤ | Accroche de la fiche | 🔴 **Ouvert** — la phrase n'est nulle part | @elise |
| ⑥ | Newsletter par événement | 🔴 **Ouvert** — aucun câblage, et pas de désabonnement | @alcyone / @elise |

**Aucun item n'est terminé. Aucun n'est cassé non plus** : le site tourne, c'est l'état attendu à J+2
du plan.

---

## ① Le formulaire — 🟡 PARTIEL

**✅ Ce qui est FAIT** : l'unification est en place.
- `src/data/postRegistrationSurvey.ts:5` → `getPostRegistrationSteps(eventType)` existe ;
- `src/components/events/PostRegistrationWizard.tsx:95` l'utilise.
→ **La question ⒜ du plan (« deux formulaires ou un seul ? ») est tranchée dans le code.** Un seul
formulaire, deux types. C'est réglé.

**🔴 Ce qui RESTE** : la lisibilité sous le seuil, et elle est **mesurée** :

| Où | Ce qui est écrit | Seuil |
|---|---|---|
| `components/admin/eventEditorTypes.ts:57` | `labelBase = '… text-black/45'` | ❌ < 60 % |
| `pages/Evenements.tsx:426` | `text-[13px] … text-black/50` (état vide) | ❌ < 60 % |

⚠️ **DÉCOUVERTE — le token `labelBase` existe EN DOUBLE** :
```
src/components/admin/eventEditorTypes.ts:57   export const labelBase = '… text-black/45 …'
src/pages/admin/AdminHomeBanner.tsx:11        const labelBase = '… text-black/45 …'   ← COPIE LOCALE
```
Le plan dit *« 1 ligne = des dizaines d'écrans »*. **C'est faux : il y en a deux.**
Corriger la seule version exportée laisserait **`AdminHomeBanner` cassé** — et c'est **exactement
le défaut « deux implémentations de la même chose »** que l'équipe traque depuis le 12/09.
**Le correctif doit supprimer la copie locale et importer le token.**

---

## ② Le complément de revenus — 🔴 OUVERT

**Ce qui existe** :
- `src/hooks/useAdminChallengeRegistrants.ts:58` → `complementRevenus: readDetail(details, 'complement_revenus')` — **la lecture, côté admin** ;
- `src/pages/admin/AdminChallenge21j.tsx:319-320` → la pastille qui **affiche** la valeur.

**Ce qui manque** : **rien ne la remplit.**
- ❌ aucune constante d'options dans le code ;
- ❌ aucune étape de questionnaire (`postRegistrationSurvey.ts` ne la connaît pas) ;
- ❌ aucune des 5 portes du consentement.

**La forme de la valeur est déjà actée** (`docs/CONSIGNES-CLAUDE.md:153`) : on stocke **la clé**,
`'savoir_plus_activite_independante'` — **pas** `'Oui'`, parce que le libellé changera.

**Conséquence exacte de l'état actuel** : Catherine a un écran qui affiche une colonne **qui ne dira
jamais rien**.

---

## ③ La rubrique noire `/evenements` — 🔴 OUVERT

`src/pages/Evenements.tsx:304` :
```
<section id="challenge-21-jours" className="… bg-noir px-4 py-14 text-white …">
```
**L'aplat noir est toujours en ligne.** Le portage par accents (sapin + point doré) n'est pas fait.

---

## ④ Le rouge `conseils` — 🔴 OUVERT, et les valeurs exactes sont là

Fichier : `src/components/events/ChallengeInclusBanners.tsx`

| Ligne | Valeur en ligne | Valeur visée par le plan |
|---|---|---|
| `:67` | voile → `… / 0.32) 65%, transparent 85%` | **épaissir à 58 %** |
| `:101` | `w-[85%]` — **mobile** *(le `sm:w-[55%]` existe déjà)* | **55 %** |

⚠️ **Le défaut est donc bien sur mobile** : à 390 px, c'est `w-[85%]` qui s'applique — et **390 px est
précisément la largeur que le plan demande de contrôler.** Le correctif est **une classe** (`w-[85%]`
→ `w-[55%]`), mais **il exige le rendu devant** (le plan le dit : ~6 lignes dans 269 px, 7 px de marge).

---

## ⑤ L'accroche de la fiche — 🔴 OUVERT

`« Quel est ton prochain objectif ? »` n'apparaît **que** dans `src/data/seoConfig.ts:73 et 75`
(les métadonnées de partage).

**Aucune occurrence en titre de section.** La phrase n'est donc toujours **nulle part** sur la page —
le constat du plan tient toujours.

---

## ⑥ La newsletter par événement — 🔴 OUVERT

**Ce qui existe** : `supabase/functions/send-newsletter/index.ts` ✅, et **la table** `newsletter_subscribers` (`20260419150000_newsletter_site_announcements.sql:75`, `email` + `UNIQUE`) ✅.

**Ce qui manque** :
- ❌ **Le câblage.** Le seul appelant de `send-newsletter` est `AdminCommunications.tsx:85` — **un envoi manuel, depuis l'admin**. **`EventForm.tsx` ne l'appelle pas** → **publier un événement ne prévient toujours personne.**
- ❌ **Le désabonnement.** `git grep "unsubscribe"` ne remonte **que** `AuthContext.tsx:226` (un listener Supabase Auth, sans rapport). La table n'a **aucune colonne de refus**.
- ❌ Le pop-up, et le déclenchement **sur geste explicite**.

**Le désabonnement est le vrai blocage** : sans colonne de refus, l'annonce partirait **par le canal
même dont la personne s'est retirée**.

---

## ⚠️ CE QUI EST VRAIMENT SUR KEN

**Deux go, et rien d'autre** :

1. **Le go pour le test d'en-tête** de la newsletter (le 6ᵉ item — le seul geste **irréversible**) ;
2. **Le go pour la purge des créneaux legacy** (ce sont peut-être les vrais créneaux d'avril de Catherine).

**Les items ① ② ③ ④ ⑤ ne l'attendent pas.** Le plan le dit lui-même : *« les trois premiers peuvent se
faire sans toi »* — et les ④ ⑤ sont **des correctifs @elise**, pas des décisions.

---

*Relevé @elise — 14/09/2026. Source : `origin/main` = `6bc79e2`. Détail du plan : `docs/PLAN-13-09.md`.*
