# Campagne Instagram PessÓra — brief (19/09/2026)

Décision de Ken : **la carte d'invitation A6 est abandonnée** (« les gens vivent sur Insta ») au profit
d'une campagne Instagram. Ce brief fige ce qui a été tranché aujourd'hui et **borne les promesses** ;
il ne remplace pas les consignes de production de la DA.

## 1. Ce que la campagne promet — et ce qu'elle ne promet pas

| | |
|---|---|
| ✅ **Promis** | **l'inscription au Challenge 21 jours** — parcours mesuré en ligne (page rendue, formulaire, 0 erreur console) |
| ❌ **Interdit** | **l'achat en ligne.** Le site est en **mode Stripe TEST** (documenté dans le repo : `CLAUDE.md`, `docs/brief-tests-paiement-2026-09-09.md`, `docs/CHECKLIST-GO-LIVE-PESSORA.md`) → **aucune vente réelle possible**. Aucun visuel ne montre « PAYER », ni un panier, ni une commande |

Règles du site qui s'appliquent aussi aux visuels : **aucun résultat promis, aucun témoignage inventé,
aucun chiffre inventé.** Les prix qui apparaissent sont ceux du catalogue validé par Catherine.

## 2. La voix typographique (figée le 19/09, validée à l'œil par Ken)

**Libre Baskerville (titres) + Inter (texte)**, sur **tout le site** et sur **tous les visuels**.
Les deux sont **libres (SIL OFL, zéro achat)** et **réellement livrées en fichiers** :

- **Inter** est déjà dans la pile de polices du site (3ᵉ position) ;
- **Libre Baskerville** est la libre la plus proche de la « Berthold Baskerville Book » que le CSS déclare déjà.

Ce que ça répare, au passage : le site **ne livrait aucun fichier** de police → aujourd'hui **aucun visiteur
ne voit la police de sa marque**, chacun voit celle de son téléphone. La même voix servira aux visuels.

**L'emblème est le seul élément de marque verrouillé** (`logo-pessora.webp`, l'image servie dans l'en-tête).
**Aucun mot-symbole typographique ne se réinvente** : on n'écrit pas « PESSÓRA » dans une police trouvée pour
l'occasion — on utilise l'emblème, ou rien.

## 3. La destination

- **Route stable** `/evenements/challenge-21-jours` — **jamais un slug d'événement** : un lien publié doit
  survivre entre deux vagues (bio Instagram, favoris, QR d'un ancien support).
- **Lien de bio marqué** (`?utm_source=instagram`) : mécanisme côté @alcyone, lu par les analytics déjà montés
  sur le site (`@vercel/analytics` + `<Analytics />`), relevé par @vela → **on saura dire en un chiffre** si la
  campagne a ramené du monde, au lieu d'une impression.
- ⚠️ **La page ne doit annoncer que le challenge de Catherine.** Tant que le banc d'essai de Ken est la seule
  vague à venir, le lien tomberait sur le banc (ou sur une page vide). Le lot « invisible du public » est en
  cours : le banc reste vivant pour Ken, il sort de la vitrine.

## 4. Quand

**La campagne attend la période de Catherine** (demande ③ du message médiateur + période, déjà écrit).
Rien ne part avant : c'est sa date qui rend la page publique utilisable et qui déclenche la production finale.
La **pose des polices sur le site** est un **lot à part** (graisse 300 à mesurer avant/après + passe de
contraste), il peut arriver après les visuels — **la voix, elle, est figée maintenant**, sinon les visuels
sont à refaire.

## 5. Qui

| Qui | Quoi |
|---|---|
| @lyra | les visuels, et le lot « polices » avec @alcyone (fichiers livrés, graisse, contraste) |
| @alcyone | le lien marqué, et le lot « banc invisible du public » |
| @vela | la recette : page publique sans « TEST », clics de la campagne, contraste après pose |
| @nova | ce brief, la cohérence cliente, et l'envoi (via Ken — aucun canal client direct) |

**Hors de ce brief** (à ne pas élargir en silence) : la levée du `noindex`, la bascule Stripe live, la
désactivation du banc d'essai. Aucun des trois n'est couvert par le go du 19/09.
