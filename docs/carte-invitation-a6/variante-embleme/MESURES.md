# Aperçus d'emplacement de la carte A6 + garde de phrase

Branche `lot/lyra-apercu-carte-a6`, posée sur `90106a5` (le lot `lot/nova-carte-a6` n'est **pas** touché).
Auteur : direction artistique (@lyra). Rien ici n'est envoyé à la cliente sans le mot de Ken.

## Les deux fichiers qui peuvent être joints au message

| Fichier | Ce que c'est |
|---|---|
| `apercu-A-embleme-seul.png` | emblème seul. **La phrase de Catherine y tient sur 3 lignes.** |
| `apercu-B-embleme-mot-symbole.png` | emblème + « PESSÓRA » écrit. La phrase n'y tient que sur **2 lignes**. |

Les deux sont l'**aperçu d'emplacement** : la phrase est représentée par son emplacement, et **aucune mention
interne** n'est dessinée dessus (vérifié dans les pixels du fichier, pas seulement à l'œil) — la v1 portait
`v1 — emplacement, NON imprimable` **dans son propre dessin**, ce qui ne peut pas partir chez une cliente.

Le PDF d'impression définitif vient après : phrase de Catherine reçue + arbitrage A/B.

## Pourquoi l'emblème et pas un mot-symbole typographique

Mesuré sur le site en ligne : le mot-symbole n'y est **pas du texte**, c'est l'image `public/logo-pessora.webp`
(l'emblème), et les deux `@font-face` d'`src/index.css` (`Akkurat Pro`, `Berthold Baskerville Book`) rendent
`error` chez un visiteur réel — la police qui peint le texte du site est celle de l'appareil du visiteur.
La marque n'a donc **aucun mot-symbole typographique** à retrouver : l'emblème est le seul élément verrouillé.
Il est lu **dans le dépôt** (`public/logo-pessora.webp`) — aucun asset externe.

## Deux moteurs de rendu, donc deux jeux de mesures

Le PNG est peint par **PIL**, le PDF par **reportlab** — et leurs métriques divergent (relevé : **0,62 à 0,77 mm**
par ligne sur les phrases testées). La garde retient donc **la plus large des deux** : une ligne n'est acceptée
que si elle rentre dans les deux moteurs, et le découpage en lignes est calculé avec cette même mesure, donc il
est **identique pour les deux sorties**. Sans ça, on remplaçait une divergence écrite par un échec muet —
précisément sur le PNG, qui sert de contrôle visuel et de secours imprimeur.

## Capacité mesurée par gabarit (c'est ce qui décide du budget d'écriture)

- Largeur maximale d'une ligne : **71 mm** (zone utile 75 mm).
- La dernière ligne doit finir **2 mm avant le QR**, soit avant **66 mm**.
- **Gabarit A : 3 lignes. Gabarit B : 2 lignes** (le mot-symbole décale la phrase 4 mm plus bas).

Repères en caractères, **mesurés sur deux familles de phrase** (ce ne sont que des ordres de grandeur) :

| Gabarit | français courant | lettres larges (M, W, O) |
|---|---|---|
| **A** | jusqu'à **113 signes** | jusqu'à **80 signes** |
| **B** | jusqu'à **73 signes** | jusqu'à **57 signes** |

⚠️ **Les deux colonnes sont des BORDS, pas des planchers sûrs.** Une composition plus défavorable passe le refus
quelques signes avant : sur une phrase qui n'est que des capitales M/W/O, @vela mesure **A refuse à 79** et
**B refuse à 54** — juste sous mon 80 et mon 57. Même chose côté français courant (sa fourchette de refus tombe
3 à 10 signes au-dessus de mon maximum). Donc **aucun de ces nombres ne s'écrit dans un écrit**, ni comme
budget, ni comme plafond garanti : ce qui engage est **71 mm de large × le nombre de lignes du gabarit**. Ces
chiffres ne servent qu'à se parler entre nous.

Le PNG de ce dossier a été régénéré **à l'identique** par @vela dans un environnement neuf (mêmes empreintes) :
si quelqu'un doute du fichier, il relance le script et retombe dessus. Les empreintes épinglées pour l'envoi
vivent dans le message de @nova — **un seul lieu pour un même chiffre**.

## Preuve rouge / vert (rejouée, pas déclarée)

| Phrase testée | Gabarit A | Gabarit B |
|---|---|---|
| emplacement (32 signes) | accepté, 1 ligne | accepté, 1 ligne |
| 84 signes | **accepté**, 3 lignes, finit à 64,1 mm | **REFUSÉ** — 3ᵉ ligne à 68,1 mm, dans le QR |
| 122 signes | **REFUSÉ** — 4 lignes, 69,3 mm | **REFUSÉ** |

Le refus est **bruyant** : le script s'arrête en nommant le gabarit, le nombre de lignes, la hauteur atteinte
et le fait que ce n'est pas une erreur de rendu mais un gabarit trop court. C'est exactement le défaut relevé
par @vela : la v1 posait la phrase sur une seule ligne sans garde, et le QR (posé après le texte) **effaçait**
la ligne de trop — un trou de 44,1 mm au milieu de la phrase, sans aucune erreur.

## À porter dans le lot

La garde et la mise à la ligne doivent vivre **dans le script du lot**, pas ici : ce dossier est une
proposition, pas une seconde source de vérité. À trancher après l'arbitrage A/B, avec @nova.

Les deux aperçus de ce dossier ont été re-rendus après le changement de moteur de mesure : **fichiers
identiques au bit près** (empreintes inchangées), donc l'aperçu relu à l'œil reste celui-ci.

## Régénérer

```bash
uv venv /tmp/a6 --python 3.13
uv pip install --python /tmp/a6/bin/python pillow qrcode reportlab
/tmp/a6/bin/python build_variante_embleme.py                        # emplacement
/tmp/a6/bin/python build_variante_embleme.py --phrase "ta phrase"    # teste une phrase, refuse si trop longue
```

Le contrôle de sortie reste celui du lot : extraire l'image du PDF et décoder le QR — il doit rendre
l'URL caractère pour caractère. Vérifié sur les deux gabarits : `https://www.pessora.fr/evenements/challenge-21-jours`,
52 caractères, page 105,0 × 148,0 mm.
