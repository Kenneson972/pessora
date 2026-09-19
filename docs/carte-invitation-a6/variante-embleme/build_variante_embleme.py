#!/usr/bin/env python3
"""Carte A6 — variantes DA (Lyra) + GARDE DE LARGEUR/HAUTEUR qui refuse à voix haute.

Ce fichier n'écrit PAS dans le lot en relecture : il vit dans le cache de @lyra.

Ce qu'il corrige par rapport à la v1 du lot :
  1) le mot-symbole typographique (DejaVu Serif, substitut absent de toutes les
     surfaces de la marque) est remplacé par l'emblème réel du site (/logo-pessora.webp) ;
  2) la phrase est mise à la ligne dans une LARGEUR (71 mm), plus jamais posée sur une ligne ;
  3) la garde refuse explicitement une phrase qui produit plus de lignes que le gabarit
     n'en accepte, au lieu de laisser le QR effacer le texte en silence (défaut relevé par @vela) ;
  4) deux sorties : le fichier INTERNE (porte la mention « emplacement ») et l'APERÇU
     qui part chez Catherine (aucune mention interne dessus).

Usage : python build_variante_embleme.py            -> rend normalement
        python build_variante_embleme.py --phrase "…"     -> teste une phrase
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import Color
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

W_MM, H_MM = 105.0, 148.0
DPI = 300
ZONE_MM = 75.0                 # zone utile (marges 15 mm)
LARGEUR_TEXTE_MM = 71.0        # largeur maximale d'une ligne de phrase (mesurée)
INTERLIGNE_MM = 5.2
PH = 3.6                       # corps de la phrase, mm
URL = "https://www.pessora.fr/evenements/challenge-21-jours"
PHASE_INTERNE = "v1 — emplacement, NON imprimable"
LIGNE_VIDE = "[ phrase de Catherine — à insérer ]"

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
# l'emblème est lu DANS le dépôt : aucun asset externe, rien à copier
_DEPOT = Path(__file__).resolve().parents[3]
EMBLEME_SRC = _DEPOT / "public" / "logo-pessora.webp"
if not EMBLEME_SRC.exists():
    EMBLEME_SRC = Path("/opt/data/cache/lyra-fontcheck/logo-pessora.webp")
OUT = Path(__file__).resolve().parent
OUT.mkdir(exist_ok=True)

QR_TOP_MM, QR_MM = 68.0, 44.0
MARGE_SOUS_TEXTE_MM = 2.0      # respiration exigée entre la dernière ligne et le QR

# gabarits : le nombre de lignes que la phrase peut prendre est DÉDUIT du gabarit,
# jamais supposé — et la dernière ligne doit finir 2 mm avant le QR.
LAYOUTS = {
    "A-embleme-seul": dict(emb_w=22.0, emb_top=14.0, filet=45.0, phrase_top=49.5, mot=False),
    "B-embleme-mot-symbole": dict(emb_w=16.0, emb_top=14.0, mot_y=38.5, filet=49.0,
                                 phrase_top=53.5, mot=True),
}


def px(v: float) -> int:
    return int(round(v / 25.4 * DPI))


def oklch_to_srgb(L: float, C: float, h_deg: float) -> tuple[int, int, int]:
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


GOLD = oklch_to_srgb(0.75, 0.085, 68)
NOIR = (10, 10, 10)
GREY = (110, 110, 110)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4, box_size=10)
qr.add_data(URL)
qr.make(fit=True)
QR_PX = px(QR_MM)
qr_img = qr.make_image(fill_color="black", back_color="white").convert("L").resize((QR_PX, QR_PX), Image.NEAREST)

_emb = Image.open(EMBLEME_SRC).convert("RGBA")
_bg = Image.new("RGBA", _emb.size, (255, 255, 255, 255)); _bg.alpha_composite(_emb)
_emb = _bg.convert("RGB")
emb_ink = _emb.crop(_emb.convert("L").point(lambda v: 0 if v > 245 else 255).getbbox())

f_phrase = ImageFont.truetype(SANS, px(PH))
f_url = ImageFont.truetype(SANS, px(2.5))
f_phase = ImageFont.truetype(SANS, px(2.2))
f_mot = ImageFont.truetype(SERIF, px(7.0))
LARGEUR_TEXTE_PX = px(LARGEUR_TEXTE_MM)

# DEUX moteurs de rendu, donc DEUX jeux de métriques : le PNG est peint par PIL,
# le PDF par reportlab. Enregistrés ici parce que la garde mesure avant tout rendu.
pdfmetrics.registerFont(TTFont("Sans", SANS))
pdfmetrics.registerFont(TTFont("Serif", SERIF))


def largeur_mm(texte: str) -> tuple[float, float]:
    """Largeur d'une ligne dans les deux moteurs : (PIL pour le PNG, reportlab pour le PDF)."""
    return (f_phrase.getlength(texte) / DPI * 25.4,
            pdfmetrics.stringWidth(texte, "Sans", PH * mm) / mm)


def wrap(texte: str, limite_mm: float = LARGEUR_TEXTE_MM) -> list[str]:
    """Mise à la ligne sur la mesure la PLUS LARGE des deux moteurs.

    Le découpage est ainsi le même pour les deux sorties, et une ligne acceptée est
    acceptée dans les deux — sinon on remplace une divergence écrite par un échec muet
    sur le fichier qui sert de contrôle visuel et de secours imprimeur (relevé @vela).
    """
    lignes, cur = [], ""
    for mot in texte.split():
        essai = f"{cur} {mot}".strip()
        if max(largeur_mm(essai)) <= limite_mm or not cur:
            cur = essai
        else:
            lignes.append(cur)
            cur = mot
    if cur:
        lignes.append(cur)
    return lignes


def gabarit(cle: str) -> dict:
    L = dict(LAYOUTS[cle])
    emb_h = L["emb_w"] * emb_ink.size[1] / emb_ink.size[0]
    L["emb_h"] = emb_h
    # nombre de lignes que la zone sûre accepte, DÉDUIT du gabarit
    place = (QR_TOP_MM - MARGE_SOUS_TEXTE_MM) - L["phrase_top"]
    L["lignes_max"] = int(place // INTERLIGNE_MM)
    return L


def verifier(phrase: str, cle: str) -> list[str]:
    """Garde : refuse à voix haute si la phrase ne rentre pas dans le gabarit.

    Les deux moteurs sont vérifiés séparément APRÈS la mise à la ligne : une ligne est
    acceptée seulement si elle est assez étroite pour le PNG **et** pour le PDF.
    """
    L = gabarit(cle)
    lignes = wrap(phrase)
    dernier_bas = L["phrase_top"] + (len(lignes) - 1) * INTERLIGNE_MM + PH * 1.17
    trop_large = []
    for ln in lignes:
        pil, rl = largeur_mm(ln)
        if max(pil, rl) > LARGEUR_TEXTE_MM:
            trop_large.append((ln, pil, rl))
    if len(lignes) > L["lignes_max"] or dernier_bas > QR_TOP_MM - MARGE_SOUS_TEXTE_MM or trop_large:
        msg = [
            f"REFUS — gabarit {cle} : la phrase ne rentre pas.",
            f"  phrase de {len(phrase)} signes -> {len(lignes)} lignes "
            f"(maximum du gabarit : {L['lignes_max']})",
            f"  dernière ligne : {L['phrase_top'] + (len(lignes) - 1) * INTERLIGNE_MM:.1f} mm "
            f"-> {dernier_bas:.1f} mm ; le QR commence à {QR_TOP_MM:.1f} mm "
            f"(il effacerait tout ce qui dépasse).",
            f"  ligne(s) trop large(s) (> {LARGEUR_TEXTE_MM:.0f} mm) : {len(trop_large)}"
            + (f" — PNG {trop_large[0][1]:.1f} mm / PDF {trop_large[0][2]:.1f} mm" if trop_large else ""),
            "  Ce n'est pas une erreur de rendu : c'est le gabarit qui est trop court pour cette phrase.",
        ]
        raise SystemExit("\n".join(msg))
    ecarts = [abs(a - b) for a, b in (largeur_mm(ln) for ln in lignes)]
    if ecarts:
        print(f"  [moteurs] {cle} : écart PIL/reportlab max {max(ecarts):.2f} mm "
              f"sur {len(lignes)} ligne(s) — garde = la plus large des deux")
    return lignes


def rendu(cle: str, phrase: str, avec_mention: bool) -> None:
    L = gabarit(cle)
    lignes = verifier(phrase, cle)
    suffixe = "" if avec_mention else "-APERCU"
    EMBLEME_PNG = OUT / "_embleme-fond-blanc.png"
    if not EMBLEME_PNG.exists():
        _emb.save(EMBLEME_PNG)
    emb_rs = emb_ink.resize((px(L["emb_w"]), px(L["emb_h"])), Image.LANCZOS)

    # ---- PNG 300 dpi
    img = Image.new("RGB", (px(W_MM), px(H_MM)), (255, 255, 255))
    d = ImageDraw.Draw(img)
    img.paste(emb_rs, (px((W_MM - L["emb_w"]) / 2), px(L["emb_top"])))
    if L.get("mot"):
        track, large = px(2.2), None
        large = sum(d.textlength(c, font=f_mot) for c in "PESSÓRA") + track * 6
        x = (px(W_MM) - large) / 2
        for c in "PESSÓRA":
            d.text((x, px(L["mot_y"])), c, font=f_mot, fill=NOIR)
            x += d.textlength(c, font=f_mot) + track
    d.rectangle([px(W_MM / 2 - 15.0), px(L["filet"]), px(W_MM / 2 + 15.0),
                 px(L["filet"]) + max(1, px(0.3))], fill=GOLD)
    for i, ln in enumerate(lignes):
        d.text((px(W_MM) / 2, px(L["phrase_top"] + i * INTERLIGNE_MM)), ln,
               font=f_phrase, fill=GREY, anchor="ma")
    img.paste(qr_img, (px((W_MM - QR_MM) / 2), px(QR_TOP_MM)))
    d.text((px(W_MM) / 2, px(QR_TOP_MM + QR_MM + 3.0)),
           "www.pessora.fr/evenements/challenge-21-jours", font=f_url, fill=GREY, anchor="ma")
    if avec_mention:
        d.text((px(W_MM) / 2, px(H_MM - 8.0)), PHASE_INTERNE, font=f_phase, fill=GREY, anchor="ma")
    png = OUT / f"carte-A6-{cle}{suffixe}-300dpi.png"
    img.save(png, dpi=(DPI, DPI))

    # ---- PDF A6
    pdfmetrics.registerFont(TTFont("Sans", SANS))
    pdfmetrics.registerFont(TTFont("Serif", SERIF))
    qr_p = OUT / f"_qr{cle}.png"
    qr_img.convert("RGB").save(qr_p, dpi=(DPI, DPI))
    pdf = OUT / f"carte-A6-{cle}{suffixe}.pdf"
    c = canvas.Canvas(str(pdf), pagesize=(W_MM * mm, H_MM * mm))
    c.setTitle(f"PESSORA — carte A6 {cle}{'' if avec_mention else ' (apercu, emplacement)'}")
    c.drawImage(str(EMBLEME_PNG), (W_MM - L["emb_w"]) / 2 * mm,
                (H_MM - L["emb_top"] - L["emb_h"]) * mm, L["emb_w"] * mm, L["emb_h"] * mm)
    if L.get("mot"):
        c.setFillColor(Color(*[v / 255 for v in NOIR]))
        c.setFont("Serif", 7.0 * mm)
        gap = 2.2 * mm
        tot = sum(pdfmetrics.stringWidth(ch, "Serif", 7.0 * mm) for ch in "PESSÓRA") + gap * 6
        x = (W_MM * mm - tot) / 2
        for ch in "PESSÓRA":
            c.drawString(x, H_MM * mm - (L["mot_y"] + 7.0) * mm, ch)
            x += pdfmetrics.stringWidth(ch, "Serif", 7.0 * mm) + gap
    c.setFillColor(Color(*[v / 255 for v in GOLD]))
    c.rect((W_MM / 2 - 15.0) * mm, H_MM * mm - (L["filet"] + 0.3) * mm, 30.0 * mm, 0.3 * mm, stroke=0, fill=1)
    c.setFillColor(Color(*[v / 255 for v in GREY]))
    c.setFont("Sans", PH * mm)
    for i, ln in enumerate(lignes):
        c.drawCentredString(W_MM / 2 * mm, H_MM * mm - (L["phrase_top"] + PH * 0.9 + i * INTERLIGNE_MM) * mm, ln)
    c.drawImage(str(qr_p), (W_MM - QR_MM) / 2 * mm, H_MM * mm - (QR_TOP_MM + QR_MM) * mm, QR_MM * mm, QR_MM * mm)
    c.setFont("Sans", 2.5 * mm)
    c.drawCentredString(W_MM / 2 * mm, H_MM * mm - (QR_TOP_MM + QR_MM + 4.0) * mm,
                        "www.pessora.fr/evenements/challenge-21-jours")
    if avec_mention:
        c.setFont("Sans", 2.2 * mm)
        c.drawCentredString(W_MM / 2 * mm, 8.0 * mm, PHASE_INTERNE)
    c.showPage()
    c.save()
    qr_p.unlink()
    bas = L["phrase_top"] + (len(lignes) - 1) * INTERLIGNE_MM + PH * 1.17
    print(f"{png.name} : {len(lignes)} ligne(s), dernière finit à {bas:.1f} mm "
          f"(limite {QR_TOP_MM - MARGE_SOUS_TEXTE_MM:.1f}) | emblème {L['emb_w']:.0f} mm "
          f"= {emb_ink.size[0] / L['emb_w'] * 25.4:.0f} dpi")


if __name__ == "__main__":
    phrase = LIGNE_VIDE
    if "--phrase" in sys.argv:
        phrase = sys.argv[sys.argv.index("--phrase") + 1]
    print(f"--- garde --- gabarits : " +
          " | ".join(f"{k} = {gabarit(k)['lignes_max']} lignes max "
                     f"(dernière ligne doit finir avant {QR_TOP_MM - MARGE_SOUS_TEXTE_MM:.0f} mm)" for k in LAYOUTS))
    for cle in LAYOUTS:
        for avec_mention in (True, False):
            rendu(cle, phrase, avec_mention)
