#!/usr/bin/env python3
"""Carte d'invitation A6 — PESSÓRA / Challenge 21 jours.

Un seul jeu de constantes (mm) -> deux sorties : PNG 300 dpi (contrôle visuel)
et PDF A6 (fichier d'impression). Le QR porte EXACTEMENT l'URL stable.

Le texte de la ligne est un EMPLACEMENT (la phrase appartient à Catherine) :
le fichier n'est pas imprimable en l'état, et il le dit à l'écran.
"""
from __future__ import annotations

import math
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import Color
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------- constantes
W_MM, H_MM = 105.0, 148.0                 # A6 portrait
DPI = 300
URL = "https://www.pessora.fr/evenements/challenge-21-jours"
LIGNE = "[ phrase de Catherine — à insérer ]"
PHASE = "v1 — emplacement, NON imprimable"

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

OUT = Path(__file__).resolve().parent


def px(mm_val: float) -> int:
    return int(round(mm_val / 25.4 * DPI))


def oklch_to_srgb(L: float, C: float, h_deg: float) -> tuple[int, int, int]:
    """oklch -> sRGB (formules Oklab de Björn Ottosson)."""
    h = math.radians(h_deg)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gam(x: float) -> float:
        x = max(0.0, min(1.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return tuple(int(round(gam(v) * 255)) for v in (r, g, bl))  # type: ignore[return-value]


GOLD = oklch_to_srgb(0.75, 0.085, 68)     # --color-gold de src/index.css
NOIR = (10, 10, 10)                        # --color-noir ≈ oklch(8%)
GREY = (110, 110, 110)

# ---------------------------------------------------------------- QR
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4, box_size=10)
qr.add_data(URL)
qr.make(fit=True)
QR_PX = px(44.0)                            # 33 modules (25 + bord 4) -> module ≈ 1,33 mm
qr_img = qr.make_image(fill_color="black", back_color="white").convert("L").resize(
    (QR_PX, QR_PX), Image.NEAREST
)
QR_TOP_MM = 68.0
QR_TOTAL_MM = 44.0


def set_tracking(font, text: str, tracking_px: float, centred_at: float, draw, y: float,
                 fill) -> float:
    """Écrit `text` avec interlettrage ; retourne la largeur totale."""
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking_px * (len(text) - 1)
    x = centred_at - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking_px
    return total


# ---------------------------------------------------------------- PNG 300 dpi
img = Image.new("RGB", (px(W_MM), px(H_MM)), (255, 255, 255))
d = ImageDraw.Draw(img)

size_word = px(9.0)
f_word = ImageFont.truetype(SERIF, size_word)
track_word = px(2.6)
w_word = set_tracking(f_word, "PESSÓRA", track_word, px(W_MM) / 2,
                      d, px(20.0), NOIR)

# filet or — 0,3 mm (jamais de texte or : 2,26:1)
d.rectangle([px(W_MM / 2 - 15.0), px(38.0), px(W_MM / 2 + 15.0), px(38.0) + max(1, px(0.3))],
            fill=GOLD)

f_line = ImageFont.truetype(SANS, px(3.6))
d.text((px(W_MM) / 2, px(46.0)), LIGNE, font=f_line, fill=GREY, anchor="ma")

img.paste(qr_img, (px((W_MM - QR_TOTAL_MM) / 2), px(QR_TOP_MM)))

f_url = ImageFont.truetype(SANS, px(2.5))
d.text((px(W_MM) / 2, px(QR_TOP_MM + QR_TOTAL_MM + 3.0)),
       "www.pessora.fr/evenements/challenge-21-jours",
       font=f_url, fill=GREY, anchor="ma")

f_phase = ImageFont.truetype(SANS, px(2.2))
d.text((px(W_MM) / 2, px(H_MM - 8.0)), PHASE, font=f_phase, fill=GREY, anchor="ma")

png_path = OUT / "carte-invitation-challenge-21j-a6-300dpi.png"
img.convert("RGB").save(png_path, dpi=(DPI, DPI))

# ---------------------------------------------------------------- PDF A6
pdfmetrics.registerFont(TTFont("Serif", SERIF))
pdfmetrics.registerFont(TTFont("Sans", SANS))
qr_path = OUT / "_qr-tmp.png"
qr_img.convert("RGB").save(qr_path, dpi=(DPI, DPI))

pdf_path = OUT / "carte-invitation-challenge-21j-a6.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=(W_MM * mm, H_MM * mm))
c.setTitle("PESSÓRA — carte d'invitation Challenge 21 jours (v1, emplacement)")
c.setFillColor(Color(*[v / 255 for v in NOIR]))
c.setFont("Serif", 9.0 * mm)
gap = 2.6 * mm
total = sum(pdfmetrics.stringWidth(ch, "Serif", 9.0 * mm) for ch in "PESSÓRA") + gap * 6
x = (W_MM * mm - total) / 2
for ch in "PESSÓRA":
    c.drawString(x, H_MM * mm - 29.0 * mm, ch)
    x += pdfmetrics.stringWidth(ch, "Serif", 9.0 * mm) + gap

c.setFillColor(Color(*[v / 255 for v in GOLD]))
c.rect((W_MM / 2 - 15.0) * mm, H_MM * mm - 38.6 * mm, 30.0 * mm, 0.3 * mm, stroke=0, fill=1)

c.setFillColor(Color(*[v / 255 for v in GREY]))
c.setFont("Sans", 3.6 * mm)
c.drawCentredString(W_MM / 2 * mm, H_MM * mm - 47.5 * mm, LIGNE)

c.drawImage(str(qr_path), (W_MM - QR_TOTAL_MM) / 2 * mm,
            H_MM * mm - (QR_TOP_MM + QR_TOTAL_MM) * mm,
            QR_TOTAL_MM * mm, QR_TOTAL_MM * mm)

c.setFont("Sans", 2.5 * mm)
c.drawCentredString(W_MM / 2 * mm, H_MM * mm - (QR_TOP_MM + QR_TOTAL_MM + 4.0) * mm,
                    "www.pessora.fr/evenements/challenge-21-jours")
c.setFont("Sans", 2.2 * mm)
c.drawCentredString(W_MM / 2 * mm, 8.0 * mm, PHASE)
c.showPage()
c.save()
qr_path.unlink()

print(f"gold --color-gold -> #{GOLD[0]:02X}{GOLD[1]:02X}{GOLD[2]:02X}")
print(f"PNG : {png_path} ({img.size[0]}x{img.size[1]} px)")
print(f"PDF : {pdf_path} ({pdf_path.stat().st_size} octets)")
print(f"QR  : {QR_PX}px = {QR_PX / DPI * 25.4:.1f} mm, correction Q, bord 4 modules")
print(f"URL encodée : {URL}")
print(f"largeur mot-symbole : {w_word / DPI * 25.4:.1f} mm (zone utile 75 mm)")
