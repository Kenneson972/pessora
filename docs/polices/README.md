# La voix typographique de Pessóra — décision du 19/09/2026

**Décision de Ken** : **Libre Baskerville pour les titres + Inter pour le texte**, sur **tout le site** *et* sur
les visuels Instagram. Le spécimen qu'il a validé à l'œil :
`/opt/data/cache/lyra-typo-pessora/specimen-typo-pessora.png` (quatre blocs : le rendu d'aujourd'hui, puis les
trois propositions, aux tailles réelles du site rendues ×2).

## Pourquoi cette décision ferme un vrai défaut

Sur le site en ligne, les **4 `@font-face` de `src/index.css` ne contiennent que des `local(...)`** — donc
**aucun fichier de police n'est livré** : chaque visiteur voit la police de son appareil (SF sur iPhone, Roboto
sur Android, DejaVu sous Linux). Mesuré au navigateur (`CSS.getPlatformFontsForNode`) : le texte demandé en
`Akkurat Pro` est **peint en DejaVu Sans**, et celui demandé en `Berthold Baskerville Book` **en DejaVu Serif**.
La marque n'a pas de voix typographique — elle en aura une, identique pour tout le monde.

Deuxième raison, plus discrète : **`Inter` est déjà en 3ᵉ position de `--font-sans`** dans ce même fichier. On ne
livre donc pas une police étrangère au site, on lui livre **celle qu'il demande déjà**.

## Les fichiers (self-host, licence libre, zéro achat)

| Fichier servi | Famille / graisse | sha256 | Licence |
|---|---|---|---|
| `public/fonts/LibreBaskerville-Regular-400.ttf` | Libre Baskerville — 400 | `f5bc4341f15de5e877d8d95b6b14b33e9a3da1f8fef4ed0700ed407f096cffb6` | OFL |
| `public/fonts/LibreBaskerville-Bold-700.ttf` | Libre Baskerville — 700 | `8b008ffdae31b314657cb8e28d822da09893035d06bad9b1ab53ea762549cbd1` | OFL |
| `public/fonts/LibreBaskerville-Italic-400.ttf` | Libre Baskerville — 400 italique | `b2149da8101de6ecbc0d5ea9616a0a0a45fbd01701f012a0ae9b0d0ed733c070` | OFL |
| `public/fonts/Inter-Light-300.ttf` | Inter — 300 | `d0f4bc7faca468376e3db9b5e57afcdc2192134c9ac82a9511f32767b56853a4` | OFL |
| `public/fonts/Inter-Regular-400.ttf` | Inter — 400 | `1b08e7fc267a5c7e1d614100f604b83e7e8a0be241f0f288faa2b3ac93a683ba` | OFL |
| `public/fonts/Inter-SemiBold-600.ttf` | Inter — 600 | `e7a1aaf7eda9f2fad4131725fa556265ec75ca7b2d756260173a040363e8d4f7` | OFL |

Fichiers de licence joints dans ce dossier (`INTER-LICENCE-OFL.txt`, `LIBRE-BASKERVILLE-LICENCE-OFL.txt`) —
**SIL Open Font License**, redistribution autorisée, rien à payer, rien à déclarer à Catherine.

Provenance : Google Fonts (API `css2`, instances statiques TTF), téléchargées le 19/09/2026. Les empreintes
ci-dessus sont celles des fichiers **réellement posés**, pas celles annoncées par la source.

## Rôles typographiques réellement demandés par le site (relevés en ligne)

| Rôle | Aujourd'hui (déclaré) | Taille / graisse mesurées | Après la pose |
|---|---|---|---|
| Titres | `Berthold Baskerville Book` → Georgia → sérif de l'appareil | h1 **44 px / 400** ; h2-h3 **30 px / 400** | Libre Baskerville 400 |
| Texte | `Akkurat Pro` → Inter → sans de l'appareil | corps **14 px / 300** | Inter (graisse à trancher, voir ci-dessous) |
| Navigation / sur-titres | idem texte | **12 px / 600**, interlettrage **1,2 px**, majuscules | Inter 600 |

## Le point graisse, mesuré (à ne pas trancher au feeling)

Taux d'encre mesuré à la **taille réelle du site (14 px)**, sur la même phrase :

| Rendu | encre |
|---|---|
| Inter Light (300) | 0,61 px d'encre par colonne de texte |
| Inter Regular (400) | 0,67 — **×1,08** vs Light |
| Inter SemiBold (600) | 1,08 — ×1,76 vs Light |
| Aujourd'hui, sur une machine dont la police système n'a pas de Light (DejaVu, demande en 300) | 0,90 — **×1,46 vs Inter Light** |

Conséquence : sur les appareils dont la police système **n'a pas de graisse Light**, le texte d'aujourd'hui est
rendu en Regular — donc livrer Inter **Light** *éclaircit* le texte par rapport à ce que ces visiteurs voient
maintenant ; sur iPhone/Android (qui ont bien un Light) le rendu bouge peu. Recommandation pour la pose :
**Inter 400 pour le texte courant 12-14 px**, **300 réservé aux grands corps**, et la mesure avant/après sur le
déployé tranche. C'est la mesure que @elise a demandée pour ce lot.

## Le mot-symbole existe — il est sur son enseigne (constat du 19/09)

Ken a envoyé la photo de l'affiche d'horaires du bar : elle porte le **lockup réel de la marque** —
**l'emblème (feuille + fruit) avec « PESSÓRA » juste en dessous**, sérif, capitales, interlettrage serré. C'est la
première fois qu'on voit le mot-symbole de la marque, et il confirme ce qu'on avait mesuré sur le web : *en
ligne*, ce lockup n'existe nulle part (le site ne sert que l'emblème, la police déclarée n'étant jamais livrée).

⚠️ **Et le « O » central n'est pas une lettre** (@vela) : c'est **le fruit dessiné de l'emblème**, intégré au
mot-symbole (cercle ouvert avec sa feuille). Le lockup se lit donc *PESS + emblème + RA* : **aucune police, même
identifiée, ne le reproduira au clavier** — le mot-symbole s'utilise **comme un asset**, jamais retapé.

### Identification : ce qu'on peut mesurer, et ce qu'on ne peut pas

Méthode (`identifier_police.py`) : sur la photo lisible (marque bleu nuit sur fond clair), on mesure la **hauteur
de capitale** (73 px), la **largeur de P, E, S** rapportée à cette hauteur, le **taux d'encre** (contraste) et le
**recouvrement de forme** (IoU après mise à l'échelle) contre neuf candidates libres. Résultat :

| Candidate | largeurs P/E/S (source **0,795**) | encre (source **0,383**) | IoU |
|---|---|---|---|
| **Libre Baskerville 400** | **0,772** | **0,397** | **0,484** |
| Libre Baskerville 700 | 0,826 | 0,462 | 0,480 |
| Bodoni Moda 400 | 0,703 | 0,323 | 0,452 |
| Playfair Display 400 | 0,680 | 0,366 | 0,426 |
| Prata 400 | 0,740 | 0,351 | 0,414 |
| Gilda Display 400 | 0,708 | 0,316 | 0,370 |
| Cormorant 400 | 0,680 | 0,305 | 0,360 |
| Marcellus 400 | 0,548 | 0,413 | 0,336 |
| Italiana 400 | 0,635 | 0,258 | 0,319 |

**Conclusion, dans les limites de ce qu'une photo permet** : sur neuf candidates libres, **Libre Baskerville 400
est la plus proche**, sur la forme **et** sur la quantité d'encre — ce qui **valide la voix déjà figée** (on ne
nomme aucune police de fonderie : une photo ne le permet pas, et on compare des formes, pas des noms). Le mot-symbole
tel qu'il est composé est aussi **un peu plus étroit et serré** que Libre Baskerville → sur les titres, **un
interlettrage légèrement négatif** rapproche du matériel de la cliente.

⚠️ **Correction de mon propre relevé du 19/09** : sur la **première photo** (blanc sur verre, floue), j'avais
conclu que l'enseigne était **en graisse forte** et ajouté le Bold au kit pour cette raison. La photo propre
tranche l'inverse : l'encre de la marque (**0,383**) est celle du **400** (0,397), pas du **700** (0,462). Le Bold
reste utile au kit (grands titres), mais **la marque n'est pas en gras** — une mesure sur une photo floue avait
produit une conclusion fausse ; c'est la photo nette qui la corrige.

Montages pour l'œil, dans ce dossier : `enseigne-vs-bold.png`, `mot-symbole-vs-propositions.png`,
`identification-marque.png` (la photo face aux trois meilleures candidates).

### Ce qu'il nous manque toujours

Le **fichier vectoriel du logo** (SVG / AI / EPS, celui du graphiste) : le seul logo numérique dont on dispose
est un **raster 1024 × 1024** (`public/logo-pessora.webp`) — suffisant pour le web à 36 px, **insuffisant pour de
l'impression ou un visuel Instagram agrandi**. Tant qu'on ne l'a pas, le mot-symbole se reprend **depuis ce
raster**, jamais recomposé.

### Règle pour les visuels

Reprendre **le lockup de l'enseigne** — emblème, mot-symbole en dessous, capitales serrées — et **jamais un
mot-symbole recomposé** à la légère. Le kit contient **Bold 700 et Italique 400** (libres, même licence) pour les
grands titres et les citations.

## Les emoji dans nos rendus (mesuré, 19/09) — piège de production

Les deux familles livrées (comme les autres polices de texte) **n'ont aucun glyphe emoji** — c'est normal, et sans
effet sur le site : les emoji qu'on voit dans les textes publics sont fournis par la police emoji de l'appareil
du visiteur. Mais dans **nos** rendus, la règle dépend du pipeline, et elle est mesurée :

| Pipeline | Rendu d'un emoji tapé en texte | Conséquence |
|---|---|---|
| **HTML → PNG** (chromium headless) | **en couleur**, correct — test : 5 emoji posés dans une phrase, **2 410 pixels colorés** relevés dans l'image | on peut taper les emoji |
| **PIL / Pillow** (composition directe) | **case vide** (`.notdef`) — test : 5 emoji *différents* donnent **exactement la même encre** (497 px chacun en Inter, 456 en Libre Baskerville), c'est la signature du glyphe manquant | **jamais d'emoji tapé** : les poser en image |

Le repère qui ne trompe pas, pour toute police : si cinq emoji différents produisent la **même** quantité d'encre,
ce n'est pas un rendu, c'est un carré vide.

## Ce que ce lot doit encore faire

1. Remplacer les 4 `@font-face` `local()` par des `url('/fonts/…')` (self-host, `font-display: swap`).
2. Trancher la graisse du corps avec la mesure avant/après (ci-dessus).
3. Passe de **contraste** sur les pages réelles (le changement est global : il touche chaque texte du site).
4. Recette **sur le déployé** — ce repo ne se builde pas en local (`@heroui-pro/react` s'installe en stub vide).

## Ce que le go de Ken ne couvre pas

Le `noindex` (levée = ouverture officielle), la bascule **Stripe live** (le site n'encaisse rien aujourd'hui),
et le **banc d'essai** (il reste vivant, on ne fait que le retirer de la vitrine).
