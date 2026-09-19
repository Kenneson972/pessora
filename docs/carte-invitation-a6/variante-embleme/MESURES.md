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

## Capacité mesurée par gabarit (c'est ce qui décide du budget d'écriture)

- Largeur maximale d'une ligne : **71 mm** (zone utile 75 mm).
- La dernière ligne doit finir **2 mm avant le QR**, soit avant **66 mm**.
- **Gabarit A : 3 lignes. Gabarit B : 2 lignes** (le mot-symbole décale la phrase 4 mm plus bas).

Le budget ne s'écrit donc **jamais en caractères** : 74 caractères de lettres larges (M, W, O) prennent
autant de place que 112 caractères de français courant. Ce qui est vrai est une **largeur** (71 mm) croisée
avec le **nombre de lignes du gabarit retenu**.

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
