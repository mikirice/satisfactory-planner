import type { HandwrittenArticle } from '../types.ts'

export const resourceThroughputCapacityGuideArticleEn = {
  slug: 'resource-throughput-capacity-guide',
  title: 'Set Factory Capacity from Shared Inputs and Transport Limits',
  description: 'Use one resource balance for shared recipes, belt ratings, and pipe demand to calculate a maximum machine count and diagnose shortages.',
  publishedDate: '2026-10-20',
  updatedDate: '2026-10-20',
  versionNotice: 'Recipe and transport values are calculations from the Planner’s bundled 1.1.x data. They are not measurements of current in-game throughput or blockage behavior. Record your game version and equipment display, then verify the installed layout.',
  sections: [
    { heading: 'Put each constraint in one balance', paragraphs: [
      'If multiple lines consume the same input, add their requirements and keep the total at or below the supply that actually reaches them. The general form is Σ (input per machine × operating machines) ≤ delivered supply. Treat supply as what reaches the consumer after miners, upstream production, and belt splits, not as a node or pipe’s nominal rating.',
      'For example, let A AI Limiter machines and H High-Speed Connector machines use quickwire at 20A and 56H per minute in the bundled 1.1.x recipes. If available shared supply is hypothetically 500/min, then 20A + 56H ≤ 500. With A=4, 420/min remains, so H can be at most 7 whole machines. Add every other consumer to the same equation. The 500/min supply is an illustrative assumption, not an in-game measurement.',
    ], tables: [{ caption: 'Shared-input worksheet', headers: ['Consumer', 'Per machine', 'Count', 'Total'], rows: [
      ['AI Limiters', '20 quickwire/min (1.1.x example)', 'A', '20A'],
      ['High-Speed Connectors', '56 quickwire/min (1.1.x example)', 'H', '56H'],
      ['Other uses', 'Actual input rate', 'Machines', 'rate × count'],
      ['Supply limit', 'Delivered rate', '—', 'must cover all rows'],
    ]}] },
    { heading: 'Work backward from upstream recipes to belt capacity', paragraphs: [
      'A Heavy Modular Frame example needs 240 screws/min in the bundled 1.1.x data. Compare that requirement with the belt’s displayed rating. If you assume a Mk.3 belt rated for 270/min, the nominal margin is 30/min. Subtract other consumers on that line. Meeting the nominal figure does not mean the layout has been throughput-tested.',
      'For a pipe, first calculate machine count × fluid input per machine. The Planner’s Fused Modular Frame example uses 37.5 m³/min of nitrogen per machine, so N machines require 37.5N m³/min before adding other draws on the shared trunk. Compare the total with the pipe’s displayed limit, but do not treat nominal capacity and observed flow as identical.',
    ] },
    { heading: 'Connect the calculation to the field symptom', paragraphs: [
      'Hold the output target and Planner inputs constant, then record flow before and after each transport segment in the world. This separates a total upstream shortage from uneven allocation after a shared split or a route operating too close to its nominal limit. Change one belt or pipe at a time so the cause remains identifiable.',
    ], lists: [{ ordered: true, items: [
      'Stop consumers one at a time and check whether upstream supply recovers. If it does, total supply or allocation is a candidate.',
      'If supply is sufficient but only the far end falls short, compare flow and blockage before and after each split.',
      'If a larger belt or pipe changes the symptom, recalculate headroom and inspect junctions and merges.',
      'Revert the change to see whether the symptom returns. If it does not, record other conditions such as recipe, clock, or input stock.',
    ]}] },
    { heading: 'Record the conditions that make the result reusable', paragraphs: [
      'Include game and Planner-data version, recipe, clock, input per machine, count, other shared consumers, supply point, and transport type. The 500/min supply and belt-rating calculations are conditional examples; the author has not placed and measured these layouts in the current game. If you do measure them, record the observation interval, idle periods, and meter units.',
    ] },
  ],
  references: { heading: 'Data sources', links: [
    { label: 'Satisfactory Planner: bundled recipes and data scope', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    { label: 'Satisfactory Wiki: Conveyor Belts', href: 'https://satisfactory.wiki.gg/wiki/Conveyor_Belt' },
    { label: 'Satisfactory Wiki: Pipelines', href: 'https://satisfactory.wiki.gg/wiki/Pipeline' },
  ]},
  relatedItemIds: [],
  relatedArticleSlugs: ['shared-circuit-board-computer-feedstock-budget', 'aluminum-production-guide', 'packaged-nitrogen-empty-fluid-tank-circulation-planning'],
} as const satisfies HandwrittenArticle
