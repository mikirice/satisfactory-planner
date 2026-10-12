# Accuracy-first pass handoff — 2026-10-12

## Source and published artifact

- Worktree: `/Users/mik/Claude/projects/satisfactory-planner-wt`
- Branch to continue from and use for any next deployment: `codex/accuracy-first-pass`
- Implementation commit: `8dcb2ad99a48a7263d07425da1886bbe2d7e1d86` (`fix: enforce whole-generator power planning`)
- Cloudflare Pages project: `satisfactory-planner` (production branch metadata: `main`)
- Production deployment ID: `780a6742-3cf1-4cf3-bb35-5967a58fe345`
- Deployment URL: <https://780a6742.satisfactory-planner-3je.pages.dev>
- Custom domain: <https://satisfactory-planner.net>
- Upload was an authorized direct upload with Wrangler 4.149.0. Cloudflare records base commit `66c12bff61959954c87ed587c12525b333a7d2f9` and `commit_dirty=true`, since the artifact was built from this worktree before its local implementation commit.

The implementation commit is local and has not been pushed. The production artifact contains this implementation, but the configured production branch still says `main`; a later deployment from main/CI could replace it. Continue from `codex/accuracy-first-pass` at the implementation commit, or first bring that commit through the chosen source-control release path before deploying from another branch.

## What changed

- Generator counts are whole machines at 100% output. Manual in-game underclocking remains supported by the game but is outside the planner model.
- Sink eligibility is restricted to solid sinkable items; Somersloop allocation accounts for integral physical buildings.
- English and Japanese articles were corrected or expanded for coal power, power planning, Sink, clock examples, alternate recipes, Sloppy Alumina, Somersloops, and nuclear/radiation explanations.
- GLPK no-presolve retries are limited to LPs. A continuous relaxation now identifies exact byproduct balances that require fractional generator counts and returns a clear infeasible result instead of entering slow generic MIP diagnosis.

## Verification

- `npm test`: **42 test files, 900 tests passed**.
- `npm run lint`: passed; existing React fast-refresh and one unnecessary-escape warning remain.
- `npm run build`: passed, including TypeScript checking and static-page generation (198 item pages and 22 article pages per locale; 451 sitemap URLs).
- `git diff --check`: passed.
- Desktop and 393 × 852 mobile UI were checked. On the live planner, a 100 MW coal target returns 2 generators, 150 MW capacity, and Coal 30/min. The UI states that manual underclocking is not modeled.
- Live checks returned HTTP 200 for the custom-domain root and `/app/`, and for the corresponding root and `/app/` on the deployment URL. The live English coal-power article displayed the matching 100 MW example and a planner deep link.
- Regression diagnosis compared with clean `main`: its former 10 pellets/min case passed when fractional generators were allowed. Under the corrected whole-generator model it requires 3⅓ nuclear generators and is correctly infeasible when uranium waste must balance exactly. The adjusted 15 pellets/min case uses 5 full-output reactors; the full coproduct suite passes.

## Data version and remaining limits

- The bundled game data is labeled **Satisfactory 1.1.x**. Version 1.2.x data has not been verified against a complete current export; do not describe the bundle as current/latest until that comparison is completed.
- The planner balances recipe and fluid quantities. It does not simulate in-game pipe layout, flow behavior, startup sequences, or transient nuclear operation.
- Do not infer or promise the target of 10,000 daily visits from this release.

## Evidence URLs

- Official Satisfactory 1.2 announcement: <https://coffeestain.com/news/satisfactory-1-2-update-out-now/>
- Power mechanics: <https://satisfactory.wiki.gg/wiki/Power>
- Coal generator: <https://satisfactory.wiki.gg/wiki/Coal-Powered_Generator>
- AWESOME Sink: <https://satisfactory.wiki.gg/wiki/AWESOME_Sink>
- Alumina Solution: <https://satisfactory.wiki.gg/wiki/Alumina_Solution>
- Radiation: <https://satisfactory.wiki.gg/wiki/Radiation>
