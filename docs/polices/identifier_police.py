#!/usr/bin/env python3
"""Identifier la police du mot-symbole PESSÓRA — par la MESURE, pas à l'œil.

Source : la photo fournie par Ken (marque bleu nuit sur fond clair).
On ne devine pas : on mesure sur l'image lisible (P, E, S) trois choses
comparables à un rendu de police —
  - la largeur de chaque lettre rapportée à la hauteur de capitale ;
  - la forme (recouvrement pixel à pixel après mise à l'échelle) ;
  - le taux d'encre, qui trahit un contraste plein/délié faible ou fort.
Puis on classe des candidates libres et on montre la meilleure à l'œil.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path("/opt/data/cache/lyra-typo-pessora")
KIT = "/opt/data/home/.fonts/pessora-typo/"
SRC = "/opt/data/profiles/lyra/images/upload_20260919_161217_2.png"

# --- 1. extraire les lettres de la photo -------------------------------------
a = np.array(Image.open(SRC).convert("L"))
_, bw = cv2.threshold(a, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
bw = cv2.morphologyEx(bw, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
ys, xs = np.where(bw > 0)
crop = bw[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
cols = (crop > 0).sum(axis=0)
runs, start = [], None
for i, c in enumerate(cols):
    if c > 0 and start is None:
        start = i
    elif c == 0 and start is not None:
        runs.append((start, i - 1)); start = None
if start is not None:
    runs.append((start, len(cols) - 1))

# hauteur de capitale = celle du P (premier groupe)
def boite(masque):
    yy, xx = np.where(masque > 0)
    return masque[yy.min():yy.max() + 1, xx.min():xx.max() + 1]

lettres_src = {}
for nom, (x0, x1) in zip("PESS", runs[:4]):
    lettres_src[nom] = boite(crop[:, x0:x1 + 1])
CAP = lettres_src["P"].shape[0]
print(f"hauteur de capitale relevée sur la photo : {CAP} px")
for nom, m in lettres_src.items():
    print(f"  {nom} : largeur {m.shape[1]} px -> largeur/capitale = {m.shape[1]/CAP:.3f}")

# --- 2. rendus candidats -----------------------------------------------------
CANDIDATS = [
    ("Libre Baskerville 400", KIT + "LibreBaskerville-2.ttf"),
    ("Libre Baskerville 700", KIT + "LibreBaskerville-3.ttf"),
    ("Playfair Display 400", KIT + "PlayfairDisplay-1.ttf"),
    ("Cormorant 400", KIT + "Cormorant-2.ttf"),
    ("Bodoni Moda 400", KIT + "cand-BodoniModa.ttf"),
    ("Prata 400", KIT + "cand-Prata.ttf"),
    ("Marcellus 400", KIT + "cand-Marcellus.ttf"),
    ("Italiana 400", KIT + "cand-Italiana.ttf"),
    ("Gilda Display 400", KIT + "cand-GildaDisplay.ttf"),
]


def taille_pour_caps(chemin, cap):
    lo, hi = 8, 600
    for _ in range(40):
        mid = (lo + hi) // 2
        f = ImageFont.truetype(chemin, mid)
        im = Image.new("L", (900, 900), 0)
        ImageDraw.Draw(im).text((40, 200), "H", font=f, fill=255)
        b = im.getbbox()
        h = (b[3] - b[1]) if b else 0
        lo, hi = (mid + 1, hi) if h < cap else (lo, mid)
    return hi


def rendu_lettre(chemin, lettre, t):
    f = ImageFont.truetype(chemin, t)
    im = Image.new("L", (1200, 1200), 0)
    ImageDraw.Draw(im).text((80, 200), lettre, font=f, fill=255)
    b = im.getbbox()
    return boite(np.array(im.crop(b)))


def recouvrement(A, B):
    """IoU après mise à la même boîte (échelle + alignement)."""
    h = 200
    A2 = cv2.resize(A, (max(1, int(A.shape[1] * h / A.shape[0])), h), interpolation=cv2.INTER_AREA) > 127
    B2 = cv2.resize(B, (max(1, int(B.shape[1] * h / B.shape[0])), h), interpolation=cv2.INTER_AREA) > 127
    w = max(A2.shape[1], B2.shape[1])
    P = np.zeros((h, w), bool); Q = np.zeros((h, w), bool)
    P[:, :A2.shape[1]] = A2; Q[:, :B2.shape[1]] = B2
    inter = (P & Q).sum(); union = (P | Q).sum()
    return inter / union if union else 0


print("\ncandidate                    P        E        S     largeur/cap P/E/S      encre moy.   IoU moy.")
lignes_visu = []
for nom, chemin in CANDIDATS:
    t = taille_pour_caps(chemin, CAP)
    largeurs, ious, encres = [], [], []
    for lettre in "PES":
        m = rendu_lettre(chemin, lettre, t)
        largeurs.append(m.shape[1] / CAP)
        ious.append(recouvrement(lettres_src[lettre], m))
        encres.append((m > 0).sum() / m.size)
    src_enc = np.mean([(lettres_src[l] > 0).sum() / lettres_src[l].size for l in "PES"])
    print(f"{nom:26s} {largeurs[0]:.3f}    {largeurs[1]:.3f}    {largeurs[2]:.3f}   "
          f"{np.mean(largeurs):.3f} (source {np.mean([lettres_src[l].shape[1]/CAP for l in 'PES']):.3f})   "
          f"{np.mean(encres):.3f} (source {src_enc:.3f})   {np.mean(ious):.3f}")
    lignes_visu.append((nom, np.mean(ious), t, np.mean(largeurs), np.mean(encres)))

# --- 3. montage visuel : la source au-dessus des 3 meilleures -----------------
classement = sorted(lignes_visu, key=lambda x: -x[1])[:3]
src_strip = Image.fromarray(255 - crop[:, runs[0][0]:runs[3][1] + 1])
src_strip = src_strip.resize((int(src_strip.width * 200 / src_strip.height), 200), Image.LANCZOS)
blocs = [("LA PHOTO (PESS)", src_strip.convert("RGB"))]
for nom, iou, t, larg, enc in classement:
    f = ImageFont.truetype(dict(CANDIDATS)[nom], t)
    im = Image.new("L", (3000, 900), 255); d = ImageDraw.Draw(im); x = 60
    for c in "PESS":
        d.text((x, 150), c, font=f, fill=0)
        x += d.textlength(c, font=f) + t * 0.10
    b = im.point(lambda v: 255 if v < 128 else 0).getbbox()
    st = im.crop(b).convert("RGB")
    st = st.resize((int(st.width * 200 / st.height), 200), Image.LANCZOS)
    blocs.append((f"{nom}   (IoU {iou:.3f})", st))
W = max(b.width for _, b in blocs) + 120
H = sum(b.height + 60 for _, b in blocs) + 60
out = Image.new("RGB", (W, H), (255, 255, 255))
d = ImageDraw.Draw(out)
fl = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
y = 30
for nom, b in blocs:
    d.text((60, y), nom, font=fl, fill=(110, 110, 110)); y += 34
    out.paste(b, (60, y)); y += b.height + 26
out.save(OUT / "identification-marque.png")
print("\nmeilleures :", [(n, round(i, 3)) for n, i, _, _, _ in classement])
print("écrit :", OUT / "identification-marque.png", out.size)
