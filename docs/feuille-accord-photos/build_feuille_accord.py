#!/usr/bin/env python3
"""Feuille d'accord photos — PESSÓRA (avant/après).

Une seule source de texte -> deux sorties : le PDF à imprimer (A4) et son .md jumeau.
Source du fond : brief du 16/09 §« L'avant/après » (3 volontaires minimum, accord écrit,
mêmes lumière / angle / distance, légende = le protocole, jamais un résultat).
"""
from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import Color
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

OUT = Path(__file__).resolve().parent
PDF = OUT / "feuille-accord-photos-pessora.pdf"
MD = OUT / "feuille-accord-photos-pessora.md"

W, H = 210.0, 297.0          # A4
M = 20.0                     # marge
CW = W - 2 * M               # largeur utile

NOIR = Color(0.04, 0.04, 0.04)
GREY = Color(0.42, 0.42, 0.42)
GOLD = Color(0.824, 0.643, 0.451)   # --color-gold oklch(75% 0.085 68) = #D2A473
LINE = Color(0.72, 0.72, 0.72)

TITRE = "Autorisation de publication de photos"
SOUS = "Feuille à remplir et à signer par la personne photographiée — à conserver par PESSÓRA."
INTRO = ("Dans le cadre du challenge 21 jours et de la gamme Skin, des photos « avant / après » "
         "sont publiées sur le site de PESSÓRA. Votre accord est nécessaire, et il peut être "
         "retiré à tout moment.")

S1 = "1. La personne photographiée"
CHAMPS = ["Prénom et nom", "Téléphone (facultatif)"]

S2 = "2. Autorisation"
AUT_P1 = "J'autorise Catherine EDOUARD (PESSÓRA) à publier les deux photos me représentant — l'une avant, l'autre après — sur :"
CASES = ["le site pessora.fr (pages Skin et Challenge)",
         "les réseaux sociaux de PESSÓRA (Instagram, Facebook)"]
AUT_P2 = "Je peux demander le retrait de ces photos à tout moment, sans avoir à me justifier : elles seront retirées."
AUT_P4 = ("La légende publiée avec ces photos décrit le protocole suivi ; elle ne promet aucun résultat. "
          "Elle est écrite par PESSÓRA.")
AUT_P3 = "Si la personne a moins de 18 ans, cette autorisation est signée par son parent ou son tuteur."

S3 = "3. Les deux photos"
PHOTOS = ["Même lumière, même angle, même distance, même cadrage.",
          "Une photo « avant », une photo « après » — sans filtre : c'est ce qui rend la comparaison lisible.",
          "Les deux photos vont ensemble : si l'une des deux manque, rien n'est publié sur le site.",
          "La légende décrit le protocole suivi, jamais un résultat promis."]

PIED = ("PESSÓRA — Catherine EDOUARD, entrepreneur individuel, Fort-de-France (Cluny). "
        "Pour demander le retrait d'une photo : pessora.mq@gmail.com")

pdfmetrics.registerFont(TTFont("Serif", SERIF))
pdfmetrics.registerFont(TTFont("Serif-B", SERIF_B))
pdfmetrics.registerFont(TTFont("Sans", SANS))
pdfmetrics.registerFont(TTFont("Sans-B", SANS_B))


def wrap(text: str, font: str, size: float, width_mm: float) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if pdfmetrics.stringWidth(trial, font, size) / mm <= width_mm:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


c = canvas.Canvas(str(PDF), pagesize=(W * mm, H * mm))
c.setTitle("PESSÓRA — Autorisation de publication de photos (avant / après)")


def y(ytop: float) -> float:
    return (H - ytop) * mm


# ---------------------------------------------------------------- en-tête
c.setFillColor(NOIR)
c.setFont("Serif", 7.0 * mm)
gap = 2.0 * mm
total = sum(pdfmetrics.stringWidth(ch, "Serif", 7.0 * mm) for ch in "PESSÓRA") + gap * 6
x = (W * mm - total) / 2
for ch in "PESSÓRA":
    c.drawString(x, y(24.0), ch)
    x += pdfmetrics.stringWidth(ch, "Serif", 7.0 * mm) + gap

c.setFillColor(GOLD)
c.rect((W / 2 - 20.0) * mm, y(28.0), 40.0 * mm, 0.3 * mm, stroke=0, fill=1)

c.setFillColor(NOIR)
c.setFont("Serif-B", 5.6 * mm)
c.drawString(M * mm, y(41.0), TITRE)

c.setFillColor(GREY)
c.setFont("Sans", 2.9 * mm)
c.drawString(M * mm, y(48.0), SOUS)

cur = 58.0
c.setFillColor(NOIR)
c.setFont("Sans", 3.3 * mm)
for line in wrap(INTRO, "Sans", 3.3 * mm, CW):
    c.drawString(M * mm, y(cur), line)
    cur += 5.0

# ---------------------------------------------------------------- 1. la personne
cur += 4.0


def section(titre: str, ytop: float) -> float:
    c.setFillColor(NOIR)
    c.setFont("Sans-B", 3.6 * mm)
    c.drawString(M * mm, y(ytop), titre)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.2 * mm)
    c.line(M * mm, y(ytop + 2.0), (W - M) * mm, y(ytop + 2.0))
    return ytop + 11.0


cur = section(S1, cur)
for champs in CHAMPS:
    c.setFillColor(GREY)
    c.setFont("Sans", 3.0 * mm)
    c.drawString(M * mm, y(cur), champs)
    x0 = M + 46.0
    c.setStrokeColor(LINE)
    c.setDash(0.6 * mm, 0.6 * mm)
    c.line(x0 * mm, y(cur + 0.4), (W - M) * mm, y(cur + 0.4))
    c.setDash()
    cur += 9.0

# ---------------------------------------------------------------- 2. autorisation
cur = section(S2, cur)
c.setFillColor(NOIR)
c.setFont("Sans", 3.3 * mm)
for line in wrap(AUT_P1, "Sans", 3.3 * mm, CW):
    c.drawString(M * mm, y(cur), line)
    cur += 5.0
cur += 1.5
for case in CASES:
    c.setStrokeColor(NOIR)
    c.setLineWidth(0.3 * mm)
    c.rect((M + 3.0) * mm, y(cur + 0.6), 3.4 * mm, 3.4 * mm, stroke=1, fill=0)
    c.setFillColor(NOIR)
    c.setFont("Sans", 3.3 * mm)
    c.drawString((M + 10.0) * mm, y(cur), case)
    cur += 8.0
cur += 1.0
for para in (AUT_P2, AUT_P4):
    c.setFillColor(NOIR)
    c.setFont("Sans", 3.3 * mm)
    for line in wrap(para, "Sans", 3.3 * mm, CW):
        c.drawString(M * mm, y(cur), line)
        cur += 5.0
cur += 1.5
c.setFillColor(GREY)
c.setFont("Sans", 2.9 * mm)
for line in wrap(AUT_P3, "Sans", 2.9 * mm, CW):
    c.drawString(M * mm, y(cur), line)
    cur += 4.4

# ---------------------------------------------------------------- 3. les deux photos
cur = section(S3, cur + 4.0)
BOX_H = 31.0
c.setStrokeColor(LINE)
c.setLineWidth(0.25 * mm)
c.rect(M * mm, y(cur + BOX_H), CW * mm, BOX_H * mm, stroke=1, fill=0)
cur += 6.5
for p in PHOTOS:
    c.setFillColor(NOIR)
    c.setFont("Sans", 3.2 * mm)
    for line in wrap("· " + p, "Sans", 3.2 * mm, CW - 8):
        c.drawString((M + 4.0) * mm, y(cur), line)
        cur += 5.0
    cur += 1.0

# ---------------------------------------------------------------- signature
cur = 246.0
c.setFillColor(GREY)
c.setFont("Sans", 3.0 * mm)
c.drawString(M * mm, y(cur), "Date :")
c.line((M + 14.0) * mm, y(cur + 0.4), (M + 70.0) * mm, y(cur + 0.4))
c.drawString((M + 78.0) * mm, y(cur), "Signature :")
c.line((M + 96.0) * mm, y(cur + 0.4), (W - M) * mm, y(cur + 0.4))

# ---------------------------------------------------------------- pied
c.setFillColor(GREY)
c.setFont("Sans", 2.6 * mm)
c.drawCentredString(W / 2 * mm, y(H - 14.0), PIED)
c.showPage()
c.save()

# ---------------------------------------------------------------- .md jumeau
MD.write_text(
    "\n".join([
        "# Feuille d'accord photos — PESSÓRA (avant / après)",
        "",
        "> **Jumeau texte du PDF `feuille-accord-photos-pessora.pdf`** — c'est le PDF qui part, "
        "c'est ce fichier qu'on corrige, puis on régénère (`build_feuille_accord.py`).",
        "",
        f"_{SOUS}_",
        "",
        INTRO,
        "",
        f"## {S1}",
        "",
        *[f"- {ch} : ......................................" for ch in CHAMPS],
        "",
        f"## {S2}",
        "",
        AUT_P1,
        "",
        *[f"- [ ] {case}" for case in CASES],
        "",
        AUT_P2,
        "",
        AUT_P4,
        "",
        f"_{AUT_P3}_",
        "",
        f"## {S3}",
        "",
        *[f"- {p}" for p in PHOTOS],
        "",
        "Date : ......................   Signature : ......................",
        "",
        "---",
        "",
        PIED,
        "",
        "## Notes d'usage (internes, pas sur la feuille)",
        "",
        "- **Qui signe** : la personne photographiée (ou son parent/tuteur si mineure). Catherine fait signer "
        "**au bar**, sur papier, et **garde la feuille**.",
        "- **Pourquoi écrite** : le brief du 16/09 pose trois conditions à l'avant/après — **3 volontaires minimum**, "
        "**accord écrit**, **mêmes lumière / angle / distance**. La phrase affichée à l'écran "
        "(« Publiées avec l'accord des personnes photographiées. ») ne **prouve** rien : c'est cette feuille qui prouve.",
        "- **Retrait** : à la première demande, la photo sort de la galerie (l'admin sait la retirer) — pas de délai, "
        "pas de justification à exiger.",
        "- **Ce que la feuille ne fait pas** : elle n'autorise aucun résultat annoncé. La légende décrit le protocole.",
        "",
    ]),
    encoding="utf-8",
)

print(f"PDF : {PDF} ({PDF.stat().st_size} octets)")
print(f"MD  : {MD} ({MD.stat().st_size} octets)")
print(f"page : {W:.0f} x {H:.0f} mm · bloc signature à {cur:.0f} mm du haut")
