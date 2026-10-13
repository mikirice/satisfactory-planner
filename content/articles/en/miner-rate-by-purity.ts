import type { HandwrittenArticle } from '../types.ts'

export const minerRateByPurityArticleEn = {
  slug: 'miner-rate-by-purity',
  title: 'Satisfactory Miner Rates by Node Purity — Mk.1 to Mk.3, Clocks, and Power',
  description:
    'Compare Miner Mk.1–Mk.3 output by node purity, calculate the 250% ceiling, and check power and belt limits with a reproducible 160 Iron Plate/min example.',
  publishedDate: '2026-10-14',
  sections: [
    {
      heading: 'Output depends on miner, purity, and clock speed',
      paragraphs: [
        'These tables and examples use the repository data verified for Satisfactory 1.1.x; newer game data has not been checked. For a solid resource node, multiply the miner’s baseline rate by the purity multiplier and the clock multiplier. At 100% on a Normal node, Miner Mk.1 extracts 60 items/min, Mk.2 extracts 120/min, and Mk.3 extracts 240/min. Impure nodes use half the baseline rate; Pure nodes double it. That makes a Miner Mk.2 on a Pure node 120 × 2 = 240 items/min.',
        'Purity changes the extraction rate, not a finite stockpile that gets used up. This guide covers solid nodes such as Iron Ore and Coal. Crude Oil, Water Extractors, and Resource Wells use different buildings and calculations, so they are outside these tables.',
      ],
      tables: [
        {
          caption: 'Solid-resource output at 100% clock (items/min)',
          headers: ['Node purity', 'Miner Mk.1', 'Miner Mk.2', 'Miner Mk.3'],
          rows: [
            ['Impure (×0.5)', '30', '60', '120'],
            ['Normal (×1)', '60', '120', '240'],
            ['Pure (×2)', '120', '240', '480'],
          ],
        },
      ],
    },
    {
      heading: 'Maximum output at 250% clock',
      paragraphs: [
        'Each Power Shard raises the miner’s clock ceiling by 50%; three shards reach 250%. Extraction scales linearly with clock, so multiply the 100% values by 2.5 to get the 250% ceiling. For example, a Miner Mk.3 on a Pure node produces 480 × 2.5 = 1,200 items/min.',
        'The outgoing belt still has its own limit. A Mk.6 Conveyor Belt is rated for 1,200 items/min, exactly the rate in this example. If the belt cannot carry the output, the miner cannot move the planned amount. Check extraction and transport capacity separately in the actual build.',
      ],
      tables: [
        {
          caption: 'Solid-resource output at 250% clock (items/min)',
          headers: ['Node purity', 'Miner Mk.1', 'Miner Mk.2', 'Miner Mk.3'],
          rows: [
            ['Impure (×0.5)', '75', '150', '300'],
            ['Normal (×1)', '150', '300', '600'],
            ['Pure (×2)', '300', '600', '1,200'],
          ],
        },
      ],
    },
    {
      heading: 'A 160 Iron Plate/min plan needs 240 ore/min',
      paragraphs: [
        'With the standard recipe and no alternates, 160 Iron Plate/min uses eight Constructors and needs 240 Iron Ingot/min. Eight Smelters make those ingots from 240 Iron Ore/min. One Miner Mk.2 on a Pure Iron node supplies exactly 240 ore/min at 100% clock. Miner Mk.2 uses 15 MW at its baseline clock; Miner Mk.3 uses 45 MW, so the miner tier and node purity change both the power cost and the equipment needed for the same rate.',
        'This example assumes one Pure node is available. The planner’s automatic extraction allocation uses the map-wide inventory of nodes by purity; it does not check whether a Pure node is near the factory, whether a miner can be placed there, or how to route the belts and power lines. The shared plan restores the target rate and miner settings, not a specific map location or a built factory.',
      ],
    },
    {
      heading: 'Clocking up also increases power',
      paragraphs: [
        'The game data gives miners a power rule of baseline draw × clock speed raised to 1.321929. At 250%, extraction is 2.5 times higher, but power is about 3.36 times higher. A Miner Mk.2 therefore rises from 15 MW at 100% to about 50.4 MW at 250%. Check that the power grid has room before adding Power Shards.',
        'If the factory needs less than a node can supply, a belt sized for the miner’s maximum will not increase the target rate. Start with the required rate, choose an extractor, then compare the assigned buildings, power, and belt capacity to avoid mining far more than the line uses.',
      ],
    },
    {
      heading: 'Reproduce the plan in the calculator',
      paragraphs: [
        'Open the linked plan at the end of this guide and check that the target is 160 Iron Plate/min, the miner is Mk.2, and the extraction clock is 100%. The raw-resource table should show 240 Iron Ore/min. To compare another setup, change the miner and extraction clock in the settings and compare the extraction list’s machine count, purity allocation, and power.',
        'The displayed extraction rate is a material-balance calculation. It does not simulate a belt backing up, power being disconnected, building placement, or startup order. Check belt capacity and power connections separately in the game.',
      ],
    },
  ],
  references: {
    heading: 'Sources',
    links: [
      { label: 'Official Satisfactory Wiki — Miner', href: 'https://satisfactory.wiki.gg/wiki/Miner' },
      { label: 'Official Satisfactory Wiki — Resource Node', href: 'https://satisfactory.wiki.gg/wiki/Resource_Node' },
      { label: 'Official Satisfactory Wiki — Conveyor Belt', href: 'https://satisfactory.wiki.gg/wiki/Conveyor_Belt' },
      { label: 'Satisfactory Planner — game-data source and version notes', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Calculator — Miner Calculator (independent rate comparison)', href: 'https://satisfactorycalculator.net/miner-calculator' },
    ],
  },
  relatedItemIds: ['Desc_OreIron_C', 'Desc_IronIngot_C', 'Desc_IronPlate_C'],
  relatedArticleSlugs: ['clock-and-efficiency', 'build-checklist-guide', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: 'Open the 160 Iron Plate/min plan with Miner Mk.2 selected',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 160,
    minerId: 'Build_MinerMk2_C',
  },
} as const satisfies HandwrittenArticle
