# Carte d'invitation A6 — Challenge 21 jours

**v1 — emplacement : NON imprimable en l'état.** Le fichier le dit à l'écran.
Source : `docs/brief-claude-2026-09-16.md` § « La carte d'invitation (A6, imprimable) ».

| Fichier | Rôle |
|---|---|
| `carte-invitation-challenge-21j-a6.pdf` | fichier d'impression (A6, 105 × 148 mm) |
| `carte-invitation-challenge-21j-a6-300dpi.png` | contrôle visuel / secours imprimeur |
| `build_carte_a6.py` | la source unique : un jeu de constantes (mm) → les deux sorties |

## Ce qu'elle porte, et rien de plus

- **Mot-symbole** `PESSÓRA` — sérif, majuscules espacées (61,2 mm de large, zone utile 75 mm).
- **Un filet or de 0,3 mm**, `--color-gold` (oklch 75 % 0,085 68 → `#D2A473`). **L'or n'est jamais du texte** (2,26:1).
- **Une ligne** — aujourd'hui un **emplacement** : la phrase appartient à Catherine, on n'en fabrique aucune.
- **Le QR seul**, noir sur blanc, **44 mm** (33 modules, module ≈ 1,33 mm, correction **Q**, bord 4 modules).
- **L'URL imprimée sous le QR** — repli si le QR échoue sur papier mat (un QR lisible à l'écran peut échouer sur un papier mat).
- Aucune photo, aucun résultat promis.

## Mesuré (pas déduit)

- Page PDF = **105,0 × 148,0 mm** exactement.
- QR **décodé depuis le PDF** (image embarquée extraite, `cv2.QRCodeDetector`) →
  `https://www.pessora.fr/evenements/challenge-21-jours` — **52 caractères, match exact**.

## Ce qui manque, et qui n'est pas à nous

1. **La phrase** (une ligne, ses mots) — seule chose qui bloque le texte.
2. **La fonte de marque.** `src/index.css` ne déclare que des `local(...)` : **aucun fichier de police dans le repo**.
   Le mot-symbole est donc rendu en **DejaVu Serif (substitut)**. Le PDF d'impression doit porter la vraie fonte,
   sinon l'imprimeur compose autre chose que ce que Ken a validé à l'œil.

## Règle d'impression (mesurée le 17/09/2026)

La route stable `/evenements/challenge-21-jours` (`src/App.tsx:177`) **ne porte aucun slug** : elle sert le **premier
challenge à venir** — `type='challenge'`, `active=true`, `date >= aujourd'hui` (heure Martinique), **ordre date
croissante, limit 1** (`src/pages/ChallengeLandingPage.tsx`).

En base ce jour : **un seul challenge** — `TEST-KEN-Challenge 21 jours`, date **2026-09-24**, `active=true`,
`registration_open=true` (relevé live, lecture seule). **Donc scanner la carte aujourd'hui ouvre le banc d'essai de Ken.**

→ La carte s'imprime quand le **premier challenge à venir est celui de Catherine** :
soit le sien est daté **avant le 24/09**, soit **après le 24/09** le banc sort **seul** du filtre par sa date
— sans rien supprimer, sans fermer ses inscriptions (décision du 14/09 : le filet est le `noindex`, jamais la suppression).

## Régénérer

```bash
uv venv /tmp/a6env --python 3.13
uv pip install --python /tmp/a6env/bin/python pillow qrcode reportlab pypdf opencv-python-headless
/tmp/a6env/bin/python build_carte_a6.py
```

Le contrôle de sortie : extraire l'image du PDF (`pypdf`) et décoder le QR (`cv2.QRCodeDetector`) — il doit rendre
l'URL **caractère pour caractère**, pas « un QR qui a l'air bon ».

## Recette du tirage (pas de l'écran)

Scanner le **PDF imprimé** — pas le fichier — avec **deux téléphones (iOS + Android)**, et vérifier que ça ouvre la
route stable **sur le site en ligne**. Un QR lisible sur un écran peut échouer sur un papier mat : taille et contraste
se valident sur le scan.
