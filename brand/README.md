# Brand assets — satisfactory-planner.net

Logo system for the unofficial Satisfactory production planner. Original design:
the mark, lettering and lockups do not reproduce the official Satisfactory
wordmark, the FICSIT emblem or any Coffee Stain Studios asset; only the palette
and industrial mood are referenced.

## Rebuild

```
python3 brand/build_logo.py
```

Requirements: Python 3 with `fontTools` and `Pillow`, and `rsvg-convert`
(`/opt/homebrew/bin/rsvg-convert`). Everything in `brand/dist/` is regenerated
from `build_logo.py`; the contact sheet is also copied to
`/Users/mik/開発/Satisfactory生産計画ツール/brand/contact-sheet.png`.

## Fonts (used at build time only — outlined to paths, never shipped)

`brand/fonts/` is git-ignored (the Noto variable font is ~9.6 MB). Place these
files there before building:

- `ChakraPetch-Bold.ttf`, `ChakraPetch-Medium.ttf` — Chakra Petch, SIL OFL 1.1
  (`OFL-ChakraPetch.txt`). Source: https://github.com/google/fonts/tree/main/ofl/chakrapetch
- `NotoSansJP-var.ttf` — Noto Sans JP variable (`NotoSansJP[wght].ttf`), SIL OFL 1.1
  (`OFL-NotoSansJP.txt`). Source: https://github.com/google/fonts/tree/main/ofl/notosansjp

The build instantiates Noto Sans JP at wght 900 (primary) and 500 (OGP tagline)
and subsets it to the characters used (`NotoSansJP-*-subset.ttf`, generated,
also ignored). Output SVGs contain outlined `<path>` data only: no `<text>`,
no `@font-face`, so no font is distributed with the site.

Text is positioned by advance widths plus GPOS `kern` pair adjustments
(PairPos formats 1 and 2, flattened best-effort) and a small manual tracking.

## Palette

- Charcoal `#14171c`
- Orange `#F0A13C`
- White `#ffffff` (primary text on dark)

## Mark geometry (1024 grid)

Pointy-top hexagon with 40-unit rounded corners, 48-unit orange rim (4.7 %),
three 184-unit orange squares (18 %, corner radius 28) joined by two 88 x 52
connectors. Same shapes for `mark.svg` and `mark-on-light.svg`.

## Outputs (`brand/dist/`)

- `mark.svg`, `mark-on-light.svg`, `favicon.svg` (viewBox 0 0 1024 1024)
- `logo-horizontal-{ja,en}-{dark,light}.svg` + `.png` (mark 64 px) + `@2x.png`
- `logo-stacked-{ja,en}-{dark,light}.svg` + `.png` + `@2x.png`
- `mark-512.png`, `mark-192.png`, `apple-touch-icon-180.png` (opaque charcoal),
  `favicon-32.png`, `favicon-16.png`
- `ogp-{ja,en}.png` 1200 x 630
- `contact-sheet.png` review sheet
