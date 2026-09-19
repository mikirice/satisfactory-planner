#!/usr/bin/env python3
"""Build the satisfactory-planner.net logo system.

Outputs (brand/dist/): outline-only SVG lockups, PNG exports, OGP images and a
review contact sheet. Text is converted to paths with fontTools, so the SVGs
carry no <text> and no @font-face. See brand/README.md.

Usage:  python3 brand/build_logo.py
"""
from __future__ import annotations

import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
DIST = HERE / "dist"
RSVG = "/opt/homebrew/bin/rsvg-convert"

CHARCOAL = "#14171c"
ORANGE = "#F0A13C"
WHITE = "#ffffff"

# --------------------------------------------------------------------------
# Font preparation (instantiate + subset Noto Sans JP once; Chakra is static)
# --------------------------------------------------------------------------
JA_PRIMARY_TEXT = "生産計画ツール"
JA_TAGLINE = "目標レートひとつから、生産ライン全体を計算"
EN_TAGLINE = "Plan a whole production line from one target rate"
SECONDARY_TEXT = "for Satisfactory"
EN_PRIMARY_TEXT = "PRODUCTION PLANNER"


def prepare_noto(weight: int, out_name: str, text: str) -> Path:
    out = FONTS / out_name
    if out.exists():
        return out
    src = FONTS / "NotoSansJP-var.ttf"
    if not src.exists():
        sys.exit(f"missing {src}: download NotoSansJP[wght].ttf (see README)")
    from fontTools import subset
    from fontTools.varLib import instancer

    font = TTFont(src)
    inst = instancer.instantiateVariableFont(font, {"wght": weight})
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(inst)
    inst.save(out)
    return out


# --------------------------------------------------------------------------
# Text outlining
# --------------------------------------------------------------------------
class Face:
    """Thin wrapper: glyph lookup, advances, best-effort GPOS pair kerning."""

    def __init__(self, path: Path):
        self.font = TTFont(path)
        self.upm = self.font["head"].unitsPerEm
        self.cmap = self.font.getBestCmap()
        self.glyphset = self.font.getGlyphSet()
        self.hmtx = self.font["hmtx"]
        self.kern = self._load_kern()

    def _load_kern(self) -> dict[tuple[str, str], int]:
        """Flatten GPOS PairPos (format 1 & 2) lookups under the 'kern' feature."""
        pairs: dict[tuple[str, str], int] = {}
        if "GPOS" not in self.font:
            return pairs
        gpos = self.font["GPOS"].table
        lookup_idx: set[int] = set()
        for fr in gpos.FeatureList.FeatureRecord:
            if fr.FeatureTag == "kern":
                lookup_idx.update(fr.Feature.LookupListIndex)
        for li in sorted(lookup_idx):
            lookup = gpos.LookupList.Lookup[li]
            subtables = []
            for st in lookup.SubTable:
                if st.LookupType == 9:  # extension
                    st = st.ExtSubTable
                if st.LookupType == 2:
                    subtables.append(st)
            for st in subtables:
                if st.Format == 1:
                    for gname, ps in zip(st.Coverage.glyphs, st.PairSet):
                        for pvr in ps.PairValueRecord:
                            v = pvr.Value1
                            adv = getattr(v, "XAdvance", 0) if v else 0
                            if adv:
                                pairs.setdefault((gname, pvr.SecondGlyph), adv)
                elif st.Format == 2:
                    cd1 = st.ClassDef1.classDefs
                    cd2 = st.ClassDef2.classDefs
                    cov = set(st.Coverage.glyphs)
                    # class 0 = every glyph not listed; only expand covered glyphs
                    all_g2 = set(self.glyphset.keys())
                    for g1 in cov:
                        c1 = cd1.get(g1, 0)
                        c1r = st.Class1Record[c1]
                        for g2 in all_g2:
                            c2 = cd2.get(g2, 0)
                            v = c1r.Class2Record[c2].Value1
                            adv = getattr(v, "XAdvance", 0) if v else 0
                            if adv:
                                pairs.setdefault((g1, g2), adv)
        return pairs

    def gname(self, ch: str) -> str:
        return self.cmap.get(ord(ch), ".notdef")

    def advance(self, g: str) -> int:
        return self.hmtx[g][0]

    def layout(self, text: str, size: float, tracking: float = 0.0):
        """Return (path_d, bbox) with text scaled to `size` px, baseline at y=0,
        y flipped (SVG down). tracking in em units (e.g. -0.02)."""
        scale = size / self.upm
        pen = SVGPathPen(self.glyphset, ntos=lambda v: f"{v:.2f}")
        bounds = BoundsPen(self.glyphset)
        x = 0.0
        names = [self.gname(c) for c in text]
        for i, g in enumerate(names):
            if g != "space":
                tp = TransformPen(pen, (scale, 0, 0, -scale, x, 0))
                self.glyphset[g].draw(tp)
                self.glyphset[g].draw(TransformPen(bounds, (scale, 0, 0, -scale, x, 0)))
            x += self.advance(g) * scale
            if i + 1 < len(names):
                x += self.kern.get((g, names[i + 1]), 0) * scale
                x += tracking * size
        return pen.getCommands(), bounds.bounds


# --------------------------------------------------------------------------
# The mark: pointy-top rounded hexagon, rim, three nodes, two connectors.
# All on a 1024 grid.
# --------------------------------------------------------------------------
M = 1024.0
RIM = 48.0          # ~4.7 % of width
CORNER_R = 40.0     # hexagon corner rounding
NODE = 184.0        # 18 %
NODE_R = 28.0       # ~15 % of node
CONN_T = 52.0       # ~5 %
GAP = 88.0          # space between nodes (connector length)


def rounded_hexagon_path(cx: float, cy: float, r: float, corner: float) -> str:
    """Pointy-top hexagon (vertices at 90deg offsets), corners rounded with arcs."""
    pts = []
    for i in range(6):
        a = math.radians(-90 + 60 * i)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    # interior angle of hexagon = 120deg ; tangent distance from vertex
    t = corner / math.tan(math.radians(60))
    d = []
    n = len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        v_in = (p1[0] - p0[0], p1[1] - p0[1])
        v_out = (p2[0] - p1[0], p2[1] - p1[1])
        li = math.hypot(*v_in)
        lo = math.hypot(*v_out)
        a = (p1[0] - v_in[0] / li * t, p1[1] - v_in[1] / li * t)
        b = (p1[0] + v_out[0] / lo * t, p1[1] + v_out[1] / lo * t)
        d.append(("L" if i else "M") + f"{a[0]:.2f},{a[1]:.2f}")
        d.append(f"A{corner:.2f},{corner:.2f} 0 0 1 {b[0]:.2f},{b[1]:.2f}")
    d.append("Z")
    return " ".join(d)


def mark_group(on_light: bool = False) -> str:
    """Mark as a <g> in 1024x1024 coordinates. Same shapes for both variants."""
    cx = cy = M / 2
    r = M / 2 - RIM / 2  # keep the stroke fully inside the 1024 box
    hexa = rounded_hexagon_path(cx, cy, r, CORNER_R)
    total = 3 * NODE + 2 * GAP
    x0 = cx - total / 2
    y0 = cy - NODE / 2
    parts = [
        f'<path d="{hexa}" fill="{CHARCOAL}" stroke="{ORANGE}" '
        f'stroke-width="{RIM:.0f}" stroke-linejoin="round"/>'
    ]
    # connectors (drawn under nodes)
    for i in range(2):
        x = x0 + NODE + i * (NODE + GAP)
        parts.append(
            f'<rect x="{x:.1f}" y="{cy - CONN_T / 2:.1f}" width="{GAP:.1f}" '
            f'height="{CONN_T:.1f}" fill="{ORANGE}"/>'
        )
    for i in range(3):
        x = x0 + i * (NODE + GAP)
        parts.append(
            f'<rect x="{x:.1f}" y="{y0:.1f}" width="{NODE:.0f}" height="{NODE:.0f}" '
            f'rx="{NODE_R:.0f}" fill="{ORANGE}"/>'
        )
    return "\n".join(parts)


def svg_doc(w: float, h: float, body: str, x0: float = 0, y0: float = 0, bg: str | None = None) -> str:
    bgrect = f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>\n' if bg else ""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {w:.2f} {h:.2f}" '
        f'width="{w:.0f}" height="{h:.0f}">\n{bgrect}{body}\n</svg>\n'
    )


# --------------------------------------------------------------------------
# Wordmark block
# --------------------------------------------------------------------------
PRIMARY_H = 0.60 * M        # visual height of primary text (cap height / ideograph)
SECONDARY_RATIO = 0.40      # secondary cap height relative to primary cap height
PRIMARY_TRACK_EN = -0.018   # em, "slightly tight"
PRIMARY_TRACK_JA = -0.02
LINE_GAP = 0.42             # gap between primary baseline and secondary cap top, x secondary cap height
MARK_TEXT_GAP = 0.26 * M    # horizontal lockup: gap between mark and text


class Wordmark:
    """Primary + secondary lines laid out as paths. Origin: primary left, primary top."""

    def __init__(self, lang: str, faces: dict, primary_fill: str, align: str = "left"):
        self.lang = lang
        if lang == "en":
            face = faces["chakra_bold"]
            size = PRIMARY_H / (face.font["OS/2"].sCapHeight / face.upm)
            p_d, p_bb = face.layout(EN_PRIMARY_TEXT, size, PRIMARY_TRACK_EN)
        else:
            face = faces["noto_black"]
            # scale by measured ideograph bbox so the visual height = PRIMARY_H
            _, bb = face.layout(JA_PRIMARY_TEXT, 1000.0, PRIMARY_TRACK_JA)
            size = 1000.0 * PRIMARY_H / (bb[3] - bb[1])
            p_d, p_bb = face.layout(JA_PRIMARY_TEXT, size, PRIMARY_TRACK_JA)
        sec = faces["chakra_medium"]
        sec_cap = SECONDARY_RATIO * PRIMARY_H
        sec_size = sec_cap / (sec.font["OS/2"].sCapHeight / sec.upm)
        s_d, s_bb = sec.layout(SECONDARY_TEXT, sec_size, 0.0)

        p_top = p_bb[1]                        # negative (above baseline)
        p_left = p_bb[0]
        p_w = p_bb[2] - p_bb[0]
        s_w = s_bb[2] - s_bb[0]
        sec_baseline = -p_top + LINE_GAP * sec_cap + sec_cap  # y of secondary baseline, from primary top
        self.width = max(p_w, s_w)
        self.height = sec_baseline               # primary top -> secondary baseline
        self.descent = s_bb[3]                   # secondary descender below baseline (>0)
        if align == "center":
            s_x = (p_w - s_w) / 2 - s_bb[0]
        else:
            s_x = -s_bb[0]
        self.body = (
            f'<path fill="{primary_fill}" transform="translate({-p_left:.2f},{-p_top:.2f})" d="{p_d}"/>\n'
            f'<path fill="{ORANGE}" transform="translate({s_x:.2f},{sec_baseline:.2f})" d="{s_d}"/>'
        )
        self.p_w = p_w
        self.sec_size = sec_size


def horizontal(lang: str, theme: str, faces: dict) -> str:
    on_light = theme == "light"
    wm = Wordmark(lang, faces, CHARCOAL if on_light else WHITE)
    tx = M + MARK_TEXT_GAP
    # vertically centre the text block (primary top .. secondary baseline) on the mark
    ty = (M - wm.height) / 2
    pad = 0.0
    w = tx + wm.width + pad
    h = M
    body = f'<g>{mark_group(on_light)}</g>\n<g transform="translate({tx:.2f},{ty:.2f})">\n{wm.body}\n</g>'
    return svg_doc(w, h, body)


STACK_GAP = 0.22 * M


def stacked(lang: str, theme: str, faces: dict) -> str:
    on_light = theme == "light"
    wm = Wordmark(lang, faces, CHARCOAL if on_light else WHITE, align="center")
    w = max(M, wm.width)
    mx = (w - M) / 2
    tx = (w - wm.width) / 2
    ty = M + STACK_GAP
    h = ty + wm.height + wm.descent
    body = (
        f'<g transform="translate({mx:.2f},0)">{mark_group(on_light)}</g>\n'
        f'<g transform="translate({tx:.2f},{ty:.2f})">\n{wm.body}\n</g>'
    )
    return svg_doc(w, h, body)


def mark_svg(on_light: bool) -> str:
    return svg_doc(M, M, mark_group(on_light))


# --------------------------------------------------------------------------
# OGP 1200x630
# --------------------------------------------------------------------------
def ogp(lang: str, faces: dict) -> str:
    """ja: horizontal lockup. en: stacked lockup (the horizontal EN wordmark is
    too wide and would shrink the mark to ~135 px on a 1200x630 canvas)."""
    W, H = 1200.0, 630.0
    if lang == "ja":
        face = faces["noto_medium"]
        tag_size = 38.0
        tag_d, tag_bb = face.layout(JA_TAGLINE, tag_size, 0.0)
    else:
        face = faces["chakra_medium"]
        tag_size = 40.0
        tag_d, tag_bb = face.layout(EN_TAGLINE, tag_size, 0.0)
    tag_w = tag_bb[2] - tag_bb[0]
    tag_h = tag_bb[3] - tag_bb[1]
    gap = 44.0
    if lang == "ja":
        wm = Wordmark(lang, faces, WHITE)
        lock_w = M + MARK_TEXT_GAP + wm.width
        lock_h = M
        scale = min(0.88 * W / lock_w, 250.0 / M)
        ty = (M - wm.height) / 2
        lock_body = (
            f'{mark_group(False)}\n'
            f'<g transform="translate({M + MARK_TEXT_GAP:.2f},{ty:.2f})">\n{wm.body}\n</g>'
        )
    else:
        # Stacked, but the mark and wordmark are scaled independently: the EN
        # wordmark is ~9x the mark's width, so a proportional stack would shrink
        # the mark to ~125 px. Mark ~210 px, wordmark fills ~88 % of the width.
        wm = Wordmark(lang, faces, WHITE, align="center")
        mark_px = 210.0
        wm_scale = 0.88 * W / wm.width
        stack_gap = 36.0
        lock_w = W
        scale = 1.0
        lock_h = mark_px + stack_gap + (wm.height + wm.descent) * wm_scale
        lock_body = (
            f'<g transform="translate({(W - mark_px) / 2:.2f},0) scale({mark_px / M:.4f})">{mark_group(False)}</g>\n'
            f'<g transform="translate({(W - wm.width * wm_scale) / 2:.2f},{mark_px + stack_gap:.2f}) '
            f'scale({wm_scale:.4f})">\n{wm.body}\n</g>'
        )
    block_h = lock_h * scale + gap + tag_h
    top = (H - block_h) / 2
    lx = (W - lock_w * scale) / 2
    tag_x = (W - tag_w) / 2 - tag_bb[0]
    tag_y = top + lock_h * scale + gap - tag_bb[1]
    body = (
        f'<g transform="translate({lx:.2f},{top:.2f}) scale({scale:.4f})">\n{lock_body}\n</g>\n'
        f'<path fill="{ORANGE}" transform="translate({tag_x:.2f},{tag_y:.2f})" d="{tag_d}"/>'
    )
    return svg_doc(W, H, body, bg=CHARCOAL)


# --------------------------------------------------------------------------
# Rasterisation + contact sheet
# --------------------------------------------------------------------------
def rsvg(src: Path, dst: Path, width: int | None = None, height: int | None = None, bg: str | None = None):
    cmd = [RSVG, str(src), "-o", str(dst)]
    if width:
        cmd += ["-w", str(width)]
    if height:
        cmd += ["-h", str(height)]
    if bg:
        cmd += ["-b", bg]
    subprocess.run(cmd, check=True)


def contact_sheet(faces_paths: dict):
    from PIL import Image, ImageDraw, ImageFont

    label_font = ImageFont.truetype(str(faces_paths["chakra_medium"]), 18)
    head_font = ImageFont.truetype(str(faces_paths["chakra_bold"]), 22)
    W = 1800
    sheet = Image.new("RGB", (W, 2600), "#2a2e35")
    draw = ImageDraw.Draw(sheet)
    y = 30

    def label(x, yy, text, color="#c9ccd1"):
        draw.text((x, yy), text, fill=color, font=label_font)

    def head(text):
        nonlocal y
        draw.text((30, y), text, fill="#ffffff", font=head_font)
        y += 40

    def place(path, x, yy, bg=None, scale_w=None):
        im = Image.open(path).convert("RGBA")
        if scale_w and im.width > scale_w:
            im = im.resize((scale_w, round(im.height * scale_w / im.width)), Image.LANCZOS)
        if bg:
            back = Image.new("RGBA", im.size, bg)
            back.alpha_composite(im)
            im = back
        sheet.paste(im, (x, yy), im)
        return im.size

    # 1. mark at sizes
    head("MARK  512 / 64 / 32 / 16 px  (dark, light)")
    x = 30
    for size in (512, 64, 32, 16):
        tmp = DIST / f"_mark-{size}.png"
        rsvg(DIST / "favicon.svg", tmp, width=size, height=size)
        place(tmp, x, y)
        label(x, y + size + 6, f"{size}px")
        tmp.unlink()
        x += size + 40
    # light versions on white panel
    px = x + 40
    draw.rectangle([px, y, px + 640, y + 330], fill="#f4f4f2")
    xx = px + 24
    for size in (256, 64, 32, 16):
        tmp = DIST / f"_markl-{size}.png"
        rsvg(DIST / "mark-on-light.svg", tmp, width=size, height=size)
        place(tmp, xx, y + 24)
        label(xx, y + 24 + size + 6, f"{size}px", "#333")
        tmp.unlink()
        xx += size + 40
    y += 512 + 50

    # 2. horizontal lockups
    head("HORIZONTAL  ja / en  on dark and light  (mark 64px, shown at 2x)")
    for lang in ("ja", "en"):
        for theme in ("dark", "light"):
            p = DIST / f"logo-horizontal-{lang}-{theme}@2x.png"
            bg = "#f4f4f2" if theme == "light" else "#14171c"
            im = Image.open(p)
            draw.rectangle([30, y, 30 + im.width + 80, y + im.height + 60], fill=bg)
            place(p, 70, y + 30)
            label(30 + im.width + 100, y + 30, f"logo-horizontal-{lang}-{theme}")
            y += im.height + 70
    y += 20

    # 3. stacked
    head("STACKED  ja / en  on dark and light  (mark 64px, 1x)")
    x = 30
    max_h = 0
    for lang in ("ja", "en"):
        for theme in ("dark", "light"):
            p = DIST / f"logo-stacked-{lang}-{theme}.png"
            bg = "#f4f4f2" if theme == "light" else "#14171c"
            im = Image.open(p)
            if x + im.width + 60 > W - 30:
                x = 30
                y += max_h + 110
                max_h = 0
            draw.rectangle([x, y, x + im.width + 60, y + im.height + 60], fill=bg)
            place(p, x + 30, y + 30)
            label(x, y + im.height + 66, f"logo-stacked-{lang}-{theme}")
            x += im.width + 90
            max_h = max(max_h, im.height)
    y += max_h + 110

    # 4. OGP
    head("OGP  1200x630 shown at 50 %")
    x = 30
    for lang in ("ja", "en"):
        p = DIST / f"ogp-{lang}.png"
        place(p, x, y, scale_w=600)
        label(x, y + 315 + 6, f"ogp-{lang}.png")
        x += 640
    y += 315 + 60

    sheet = sheet.crop((0, 0, W, y))
    sheet.save(DIST / "contact-sheet.png")


# --------------------------------------------------------------------------
def main():
    DIST.mkdir(exist_ok=True)
    noto_black = prepare_noto(900, "NotoSansJP-Black-subset.ttf", JA_PRIMARY_TEXT)
    noto_medium = prepare_noto(500, "NotoSansJP-Medium-subset.ttf", JA_TAGLINE)
    paths = {
        "chakra_bold": FONTS / "ChakraPetch-Bold.ttf",
        "chakra_medium": FONTS / "ChakraPetch-Medium.ttf",
        "noto_black": noto_black,
        "noto_medium": noto_medium,
    }
    faces = {k: Face(v) for k, v in paths.items()}
    print(f"kern pairs: chakra bold={len(faces['chakra_bold'].kern)} "
          f"medium={len(faces['chakra_medium'].kern)} noto={len(faces['noto_black'].kern)}")

    svgs: dict[str, str] = {
        "mark.svg": mark_svg(False),
        "mark-on-light.svg": mark_svg(True),
        "favicon.svg": mark_svg(False),
    }
    for lang in ("ja", "en"):
        for theme in ("dark", "light"):
            svgs[f"logo-horizontal-{lang}-{theme}.svg"] = horizontal(lang, theme, faces)
            svgs[f"logo-stacked-{lang}-{theme}.svg"] = stacked(lang, theme, faces)
    for name, content in svgs.items():
        (DIST / name).write_text(content, encoding="utf-8")

    # PNG exports: lockups at mark height 64 px (1x) and 128 px (2x)
    for name in svgs:
        if not name.startswith("logo-"):
            continue
        src = DIST / name
        for suffix, mark_px in (("", 64), ("@2x", 128)):
            # mark height is always M units in the viewBox -> scale so M -> mark_px
            vb = content_viewbox(src)
            h = round(vb[3] * mark_px / M)
            rsvg(src, DIST / f"{name[:-4]}{suffix}.png", height=h)

    rsvg(DIST / "mark.svg", DIST / "mark-512.png", 512, 512)
    rsvg(DIST / "mark.svg", DIST / "mark-192.png", 192, 192)
    rsvg(DIST / "mark.svg", DIST / "apple-touch-icon-180.png", 180, 180, bg=CHARCOAL)
    rsvg(DIST / "favicon.svg", DIST / "favicon-32.png", 32, 32)
    rsvg(DIST / "favicon.svg", DIST / "favicon-16.png", 16, 16)

    for lang in ("ja", "en"):
        tmp = DIST / f"_ogp-{lang}.svg"
        tmp.write_text(ogp(lang, faces), encoding="utf-8")
        rsvg(tmp, DIST / f"ogp-{lang}.png", 1200, 630)
        tmp.unlink()

    contact_sheet(paths)
    out_copy = Path("/Users/mik/開発/Satisfactory生産計画ツール/brand")
    out_copy.mkdir(parents=True, exist_ok=True)
    shutil.copy(DIST / "contact-sheet.png", out_copy / "contact-sheet.png")
    print("done ->", DIST)


def content_viewbox(svg_path: Path):
    head = svg_path.read_text(encoding="utf-8")[:400]
    i = head.index('viewBox="') + 9
    return [float(v) for v in head[i:head.index('"', i)].split()]


if __name__ == "__main__":
    os.chdir(HERE.parent)
    main()
