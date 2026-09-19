#!/usr/bin/env python3
"""Balayage large : 109 familles libres (serif + display les plus populaires de Google Fonts)
mesurées contre la photo du mot-symbole PESSÓRA — mêmes métriques que identifier_police.py.

But : falsifier ou confirmer la classe « Baskerville » et voir si une libre fait mieux que
Libre Baskerville. On ne nomme rien : on classe des mesures.
"""
import glob
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC = "/opt/data/profiles/lyra/images/upload_20260919_161217_2.png"
SWEEP = "/opt/data/home/.fonts/gf-sweep/"
OUT = Path("/opt/data/cache/lyra-typo-pessora")

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


def boite(m):
    yy, xx = np.where(m > 0)
    return m[yy.min():yy.max() + 1, xx.min():xx.max() + 1]


src = {n: boite(crop[:, x0:x1 + 1]) for n, (x0, x1) in zip("PESS", runs[:4])}
CAP = src["P"].shape[0]
SRC_LARG = np.mean([src[l].shape[1] / CAP for l in "PES"])
SRC_ENC = np.mean([(src[l] > 0).sum() / src[l].size for l in "PES"])
print(f"photo : capitale {CAP} px · largeur/capitale P/E/S {SRC_LARG:.3f} · encre {SRC_ENC:.3f}")


def taille_pour_caps(chemin, cap):
    lo, hi = 8, 700
    for _ in range(40):
        mid = (lo + hi) // 2
        try:
            f = ImageFont.truetype(chemin, mid)
        except OSError:
            return None
        im = Image.new("L", (1200, 1200), 0)
        ImageDraw.Draw(im).text((60, 250), "H", font=f, fill=255)
        b = im.getbbox()
        h = (b[3] - b[1]) if b else 0
        lo, hi = (mid + 1, hi) if h < cap else (lo, mid)
    return hi


def rendu(chemin, lettre, t):
    f = ImageFont.truetype(chemin, t)
    im = Image.new("L", (1600, 1600), 0)
    ImageDraw.Draw(im).text((100, 300), lettre, font=f, fill=255)
    return boite(np.array(im.crop(im.getbbox())))


def iou(A, B):
    h = 200
    A2 = cv2.resize(A, (max(1, int(A.shape[1] * h / A.shape[0])), h), interpolation=cv2.INTER_AREA) > 127
    B2 = cv2.resize(B, (max(1, int(B.shape[1] * h / B.shape[0])), h), interpolation=cv2.INTER_AREA) > 127
    w = max(A2.shape[1], B2.shape[1])
    P = np.zeros((h, w), bool); Q = np.zeros((h, w), bool)
    P[:, :A2.shape[1]] = A2; Q[:, :B2.shape[1]] = B2
    u = (P | Q).sum()
    return (P & Q).sum() / u if u else 0


resultats = []
for chemin in sorted(glob.glob(SWEEP + "*.ttf")):
    nom = Path(chemin).stem.replace("_", " ")
    t = taille_pour_caps(chemin, CAP)
    if not t:
        continue
    larg, enc, ious = [], [], []
    for l in "PES":
        try:
            m = rendu(chemin, l, t)
        except Exception:
            m = None
        if m is None or m.size == 0:
            break
        larg.append(m.shape[1] / CAP)
        enc.append((m > 0).sum() / m.size)
        ious.append(iou(src[l], m))
    if len(ious) != 3:
        continue
    # score : proximité des largeurs (poids fort) + encre + forme
    dl = abs(np.mean(larg) - SRC_LARG)
    de = abs(np.mean(enc) - SRC_ENC)
    score = np.mean(ious) - 2.0 * dl - 1.0 * de
    resultats.append((score, nom, np.mean(larg), np.mean(enc), np.mean(ious)))

resultats.sort(reverse=True)
print(f"\n{len(resultats)} familles mesurées. Classement (score = IoU − 2·écart largeur − écart encre) :")
print(f"{'famille':34s} {'larg/cap':>9s} {'encre':>7s} {'IoU':>7s}")
for s, nom, l, e, i in resultats[:15]:
    print(f"{nom:34s} {l:9.3f} {e:7.3f} {i:7.3f}   score {s:+.3f}")
print(f"\nrappel photo :            {SRC_LARG:9.3f} {SRC_ENC:7.3f}")
libre = [r for r in resultats if r[1].startswith("Libre Baskerville")]
print("Libre Baskerville :", libre[0][1:4] if libre else "absent", "rang",
      [n for _, n, _, _, _ in resultats].index(libre[0][1]) + 1 if libre else "-")
(OUT / "sweep-resultats.txt").write_text(
    "\n".join(f"{nom}\t{l:.3f}\t{e:.3f}\t{i:.3f}\t{s:+.3f}" for s, nom, l, e, i in resultats))
print("écrit :", OUT / "sweep-resultats.txt")
