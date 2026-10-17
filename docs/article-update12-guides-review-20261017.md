# Satisfactory Planner candidate screen — three Update 1.2 guides

**Date:** 2026-10-17  
**Scope:** Re-evaluate the existing three narrow draft topics after the user clarified that lack of hands-on testing should not itself block a sourced guide. Separate official, documented mechanics from behavior that would need in-game measurement. No traffic analytics or search-volume data were available.

## Candidate assessment

| Topic | Evidence of a reader question | Unique scope and evidence | Decision |
|---|---|---|---|
| Fluid Truck delivery planning | Questions ask how Fluid Truck capacity compares with other transport and why a 1.2 truck cannot find a station: <https://www.reddit.com/r/SatisfactoryGame/comments/1rxesmu/with_the_introduction_of_fluid_trucks/> and <https://www.reddit.com/r/SatisfactoryGame/comments/1v216l0/12_fluid_truck_failing_to_find_station_its/> | Official 1.2 announcement states truck and station capacity and unlock point. The guide distinguishes stored volume from per-minute throughput, works a 3,200 m³ / 60 m³ per minute inventory conversion, and does not claim tested cycle times or station transfer rates. It is distinct from the existing packaged-fuel recipe loop. | Publish as a bounded reference and planning guide. |
| Vehicle Paths | A reader asks how to understand the new paths: <https://www.reddit.com/r/SatisfactoryGame/comments/1tzf936/what_am_i_not_understanding_about_the_new_vehicle/> | Official 1.2 announcement describes selecting and placing Vehicle Paths, placing a vehicle, straight build mode, vehicle-specific paths, Vehicle Menu, Stations and Routes, and the expected continuity of legacy routes. Official 1.2.4.0 notes list narrow path-related corrections. The guide does not infer undocumented slopes, spacing, collision guarantees, or current UI details from a screenshot. | Publish a sourced basic workflow and distinguish old routes from new Paths. |
| Power Connector Daisy Chaining | A reader asks about the unlock requirement: <https://www.reddit.com/r/SatisfactoryGame/comments/1ry0rkx/how_to_get_daisy_chaining_from_the_start/> | Official 1.2 announcement gives Caterium MAM research costs and the two-connector building behavior. The guide explains direct building connections and a short chain while avoiding undocumented range, exception, capacity, or failure claims. It is distinct from generator-output planning and the coal startup guide. | Publish a sourced wiring guide with its limit clearly stated. |

These examples establish identifiable questions, not broad or measured demand. No market-size, ranking, traffic, or conversion claims are made. No competitor images are used.

## Primary evidence and patch scope

- Official 1.2 announcement: <https://store.steampowered.com/news/app/526870/view/695387676933621085>
- Official 1.2.4.0 patch notes: <https://store.steampowered.com/news/app/526870/view/716786751176181501>
- Official announcement feed (includes v1.2.4.1): <https://steamcommunity.com/app/526870/announcements/?l=english>

The official 1.2.4.1 announcement was checked for later changes to these mechanics; it lists audio/mod compatibility and crash fixes rather than changing these three guides' documented mechanics. This is a dated source review, not a claim that future patches cannot change them. The copy keeps explicit Update 1.2 notices and asks readers to follow the current in-game display if it differs.

## Published pages and visual assets

- Fluid Trucks: <https://satisfactory-planner.net/articles/fluid-truck-delivery/> and <https://satisfactory-planner.net/en/articles/fluid-truck-delivery/>
- Vehicle Paths: <https://satisfactory-planner.net/articles/vehicle-paths/> and <https://satisfactory-planner.net/en/articles/vehicle-paths/>
- Daisy chaining: <https://satisfactory-planner.net/articles/power-connector-daisy-chain/> and <https://satisfactory-planner.net/en/articles/power-connector-daisy-chain/>
- All six localized covers use inspected official Satisfactory Press Kit or official Update 1.2 gameplay imagery, the established 1280×720 GameRoamer template, bold titles, high-contrast orange labels, source/creator links, and captions that state what the screenshot does not demonstrate. No AI-generated image was used.
- On 2026-10-17, each page was reviewed in a local browser at 1440px desktop and 390px mobile widths. The document width matched the viewport at all sizes; titles and covers stayed within the content column. The cover images were also inspected at 1280×720. Current UI or measured transport/electrical performance is not implied by the decorative screenshots.
- Automated verification after page integration: 43 test files, 917 tests passing; TypeScript check passed; production build generated 198 item pages and 28 article pages per locale (463 sitemap URLs).
- Cloudflare Pages production deployment succeeded: <https://c72b6679.satisfactory-planner-3je.pages.dev>; custom domain: <https://satisfactory-planner.net/>. The six article URLs, the article index, and the already published floor-area page returned HTTP 200. All six new localized cover URLs returned HTTP 200 with `image/webp`. Production browser review at 1440px and 390px confirmed viewport width equals page scroll width for every page; titles and image captions fit without clipping.

## Editorial boundary

The lack of a hands-on measurement is separated from mechanics that the developer did document. Official announcements support capacity, costs, unlock timing, and the stated feature workflow; they do **not** establish actual vehicle cycle time, station throughput, traffic behavior, arbitrary path geometry limits, maximum building-to-building wire distance, or universal electrical behavior. The guides state those boundaries rather than invent values or imply that the authored example was tested in a save.
