# 2026-10-14 article release handoff

## Scope and source version

- Prepared for the Satisfactory Planner repository from `origin/main` (`5d60a7d`), isolated on `codex/article-oct14`.
- The repository's verified game-data scope is Satisfactory **1.1.x** (`src/data/meta.json`, `data-source/DATA_SOURCES.md`). No newer game data was imported or claimed.
- The latest Library operation note was read in full. The article uses an original calculation example and an original editorial illustration; it does not present a fake game screen or claim hands-on gameplay.
- Existing PR #1 and the other active worktrees were left unchanged.

## Candidate selection

Search-volume data was unavailable, so these are qualitative topic and overlap judgments, not traffic estimates.

1. **Miner output by node purity, miner tier, clock, power, and belt cap** — fills a specific gap between the existing clock/power guide and build checklist; supports a reproducible planner link. Chosen.
2. Belt capacity guide — overlaps the build checklist; better handled as a focused update if its current belt table needs expanding.
3. Train throughput — route length, signals, and train configuration make a general rate table easy to overstate.
4. Pipe flow and head lift — needs careful separation of material-balance rates from in-game fluid behavior and startup conditions.
5. General clock and electricity guide — overlaps `clock-and-efficiency`; update that page instead of duplicating it.

## Article and calculation

- Japanese: `/articles/miner-rate-by-purity/`
- English: `/en/articles/miner-rate-by-purity/`
- Both pages state their 1.1.x data scope, provide 100% and 250% miner tables, explain the 250% power exponent, and distinguish calculated flow from transport or startup simulation.
- Reproducible example: standard Iron Plate 160/min → 240 Iron Ingot/min → 240 Iron Ore/min. One Miner Mk.2 on a Pure Iron node at 100% supplies 240 ore/min. Shared planner CTA restores the 160/min target and Mk.2 selection.
- References: [Miner](https://satisfactory.wiki.gg/wiki/Miner), [Resource Node](https://satisfactory.wiki.gg/wiki/Resource_Node), [Conveyor Belt](https://satisfactory.wiki.gg/wiki/Conveyor_Belt), [repository data provenance](https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md), and [independent miner-rate comparison](https://satisfactorycalculator.net/miner-calculator).

## Verification

- `npm run test`: 902 tests passed across 42 files.
- `npm run build`: passed TypeScript, Vite, and static-page generation; generated 198 item pages and 23 article pages per locale (453 sitemap URLs).
- `npm run lint`: passed with existing warnings in `src/i18n/runtime.tsx` and `tests/build-pages.test.ts`.
- Desktop local preview: article image, tables, Japanese and English links, source links, internal links, and planner CTA were visible. SEO output has reciprocal `hreflang` and self-canonical URLs; the public article has no `noindex` directive.
- Mobile-specific visual rendering was not captured. Existing responsive CSS switches at 760px and wraps article tables in horizontal scrolling containers.
- New cover source is an original text-free SVG; generated WebP is 1280×720 and 24 KB.

## Release state

This handoff records the requested first article and verification scope. Publish/deploy status must be updated after the release action; no traffic target is guaranteed.
