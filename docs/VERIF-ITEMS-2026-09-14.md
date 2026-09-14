# VÉRIFICATION ITEM PAR ITEM — PLAN-13-09

**Fait le 14/09/2026 au matin, par @elise, sur `origin/main` = `6bc79e2`.**
Méthode : `git grep` sur le code **déployé** (pas sur la doc, pas sur une branche).

> **But** : dire lesquels des 6 items du `PLAN-13-09.md` sont fermés, lesquels sont ouverts, et
> **qui les porte** — pour que Ken sache ce qui est vraiment sur lui.

---

## Le tableau

| # | Item | État | Qui |
|---|---|---|---|
| ① | Formulaire d'inscription | 🔴 **Ouvert** — et sa prémisse était fausse (voir correction ci-dessous) | @elise / @lyra |
| ② | Complément de revenus | 🔴 **Ouvert** — rien ne le collecte | @elise / @lyra / @alcyone |
| ③ | Rubrique noire `/evenements` | 🔴 **Ouvert** — l'aplat noir est toujours en ligne | @lyra / @elise |
| ④ | Rouge `conseils` (2 jetons) | 🔴 **Ouvert** — les 2 valeurs d'origine intactes | @elise |
| ⑤ | Accroche de la fiche | 🔴 **Ouvert** — la phrase n'est nulle part | @elise |
| ⑥ | Newsletter par événement | 🔴 **Ouvert** — aucun câblage, et pas de désabonnement | @alcyone / @elise |

**Aucun item n'est terminé. Aucun n'est cassé non plus** : le site tourne, c'est l'état attendu à J+2
du plan.

---

## ① Le formulaire — 🔴 OUVERT, et c'est l'inverse de ce que j'avais écrit

> ### ⚠️ CORRECTION — 14/09/2026, consigne de Ken
> **« Pour l'unification du formulaire, j'ai bien précisé que ça doit être DIFFÉRENT des events habituels. »**
>
> **La première version de ce relevé disait : « l'unification est faite ✅, c'est réglé. » C'EST FAUX.**
> Le fait que le challenge et l'événement normal **partagent le même composant est le PROBLÈME**,
> pas la solution. L'item ⒜ du plan (« on unifie la partie commune ») **part d'une conclusion que
> personne n'a validée** — il doit être **réécrit, pas exécuté**.

**✅ Ce qui est FAIT, et qui reste vrai** : il n'y a **qu'un seul** formulaire dans le code.
`getPostRegistrationSteps(eventType)` (`src/data/postRegistrationSurvey.ts:5`) est monté **à un seul
endroit** — la carte challenge. Le formulaire d'événement normal (`EvenementDetail.tsx`) n'en porte
aucune trace. **Donc la question ⒜ « deux formulaires ou un seul ? » n'a pas lieu d'être : il y en a un.**

**⚠️ D'où vient la confusion** — et elle est instructive : la consigne de Ken du 12/09 était
**« pareil pour tous les événements »**. Relue dans son contexte (`docs/RESTES-2026-09-12.md`, item 4),
elle porte sur **l'auto-remplissage** — *« déjà présent pour nom + prénom → à étendre : téléphone +
tous les événements »*. **Elle ne dit pas « le challenge doit être comme un événement normal ».**
Elle a été relue comme telle, et c'est ce qui a produit « on unifie ».

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
Corriger la seule version exportée laisserait **`AdminHomeBanner` cassé**.

**⚠️ LA QUESTION À TRANCHER AVANT TOUTE LIGNE** : *le formulaire de la carte challenge doit être
différent d'un événement habituel — sur quoi exactement ?*
- **les champs affichés** (le challenge demande-t-il autre chose) ?
- **l'ordre des étapes** (`formulaire → créneau → questionnaire`) ?
- **les messages** (`duplicate` / `full`) ?

**Tant que ce n'est pas dit, la team ne doit pas toucher au formulaire** — parce que la réponse
« on unifie » et la réponse « il doit différer » produisent **des correctifs opposés**.

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

> ### Ce que le relevé de ce matin avait manqué — et que la salle avait pourtant écrit
> **Le lot ⑥ n'est pas seulement « le câblage ».** `docs/RESTES-2026-09-12.md` porte **quatre autres
> morceaux de la newsletter** qui n'étaient pas dans ma première version :

**⒜ Le pop-up et l'e-mail sont des SURFACES VISUELLES, pas juste de la mécanique** *(item 22)* :
- **pas de noir** (règle de la surface sombre unique — le hero seulement) ;
- **pop-up fermable en un clic, et qui ne se réaffiche pas** ;
- **l'e-mail** : palette Pessóra, pas de bandeau noir, **aucune promesse de résultat** — et il doit
  être **validé avant le premier envoi**.

**⒝ ⚠️ Le libellé du champ newsletter du formulaire est FAUX dans un cas** *(mesuré en salle)* :
il promet *« être prévenu·e de **l'ouverture des inscriptions** »*. Or **si tous les créneaux sont
pris**, les inscriptions **sont déjà ouvertes** → la promesse est fausse.
**Correctif** : *« être prévenu·e du **prochain challenge** »* — vrai dans **les deux cas
indistinguables**. *(Même défaut que le décompte : le mensonge se déplace de trois centimètres.)*

**⒞ Le premier envoi dépend de la PURGE** *(item 26)* : `TEST-% = 0` **et** destinataires relus
**avant** le premier envoi. **Pas parce qu'un yopmail dérange** — parce que **les rebonds abîment la
réputation du domaine qui porte aussi les e-mails administratifs de Pessora.** *(Recoupe le go n°2
« ce qui est sur Ken » : c'est le même geste.)*

**⒟ `contact@pessora.fr` — à identifier avant tout envoi** *(item 32)* : le site **publie cette
adresse** (pied de page, mentions), le MX existe — mais **personne n'a prouvé que la boîte existe.**
⚠️ Limite à écrire : `delivered` = « accepté », **pas** « quelqu'un la lit » (un catch-all rend le
même résultat).

**⒠ Le `rua` du DMARC** *(item 34)* : le DMARC est posé (`v=DMARC1; p=none;`), mais **sans `rua` il
ne rapportera jamais rien**. Le `rua` doit pointer sur une boîte **Karibloom**, jamais la Gmail de
Catherine.

---

**Ce qui existe côté code** : `supabase/functions/send-newsletter/index.ts` ✅, et **la table**
`newsletter_subscribers` (`20260419150000_newsletter_site_announcements.sql:75`, `email` + `UNIQUE`) ✅.

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
