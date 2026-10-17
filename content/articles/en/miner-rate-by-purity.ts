import type { HandwrittenArticle } from '../types.ts'

export const minerRateByPurityArticleEn = {
  slug: 'miner-rate-by-purity',
  title: 'Satisfactory Miner Rates by Node Purity — Mk.1 to Mk.3, Clocks and Belts',
  description:
    'Compare Miner Mk.1–Mk.3 rates by purity using the planner’s Satisfactory 1.1.x data. Check the 250% ceiling, belt capacity and mining power with a 160 Iron Plate/min example.',
  publishedDate: '2026-10-17',
  sections: [
    {
      heading: 'Solid-node output depends on miner, purity and clock',
      paragraphs: [
        'These values use the planner’s game data for Satisfactory 1.1.x and the solid-resource purity multipliers. The game data for Update 1.2 has not been checked, so do not read these as 1.2 values. At 100% clock, the base rates are 60 items/min for Miner Mk.1, 120/min for Mk.2 and 240/min for Mk.3. An Impure node halves the rate, a Normal node uses the base rate, and a Pure node doubles it. Changing the clock scales extraction by the same proportion.',
        'This table covers solid nodes such as Iron Ore and Coal. Resource nodes provide an ongoing supply rather than a finite stockpile that is mined empty. Crude Oil, Water Extractors and Resource Wells use different extraction buildings and are outside this table. Rates assume the miner and its output can keep running; they do not account for a blocked belt or stopped power.',
      ],
      tables: [
        {
          caption: 'Solid-resource extraction at 100% clock (items/min, Satisfactory 1.1.x)',
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
      heading: 'At 250%, extraction is 2.5 times higher; check the belt',
      paragraphs: [
        'Each Power Shard raises the clock ceiling by 50 percentage points, up to 250% with three shards. Extraction scales with clock, so multiply the 100% value by 2.5. Miner Mk.3 on a Pure node at 250% produces 480 × 2.5 = 1,200 items/min.',
        'A Mk.6 Conveyor Belt is rated for 1,200 items/min, exactly the rate in this example. Check the miner output and transport capacity separately, including mergers, splitters and downstream space. The planner assigns extractors from resource demand; it does not simulate a blocked belt or confirm that a particular layout can be built.',
      ],
      tables: [
        {
          caption: 'Solid-resource extraction at 250% clock (items/min, Satisfactory 1.1.x)',
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
      heading: 'Work backward from 160 Iron Plate/min',
      paragraphs: [
        'The standard recipe needs eight Constructors to make 160 Iron Plate/min. They consume 240 Iron Ingot/min, which takes eight Smelters and 240 Iron Ore/min. One Miner Mk.2 on a Pure Iron node supplies exactly 240 ore/min at 100% clock: 120 × 2. The Mk.2 uses 15 MW at its base clock.',
        'This is a rate example, not a claim that a Pure node is available beside your factory. The planner’s automatic extraction allocation uses the map-wide number of nodes by purity. It does not check distance, terrain, placement, or the route for belts and power lines. Check local 1.1.x data separately from the nodes available at your actual site.',
      ],
    },
    {
      heading: 'Mining at 250% takes about 3.36 times the power',
      paragraphs: [
        'Miner power draw follows base power × (clock / 100%)^1.321929. At 250%, extraction is 2.5 times higher but power is about 3.36 times higher. A Miner Mk.2 rises from 15 MW at 100% to about 50.4 MW. Include the increased draw in the power plan, not just the added ore.',
        'You do not need to mine at maximum rate when the factory needs less than the node can produce. Set the required items per minute first, then choose a miner and clock and compare belt rating, building power and locally available nodes. This avoids extracting far more than the production line can use.',
      ],
    },
    {
      heading: 'Recreate the plan and diagnose a shortfall',
      paragraphs: [
        'Open the linked plan and check for a 160 Iron Plate/min target, Miner Mk.2 and a 100% extraction clock. The resource result should list 240 Iron Ore/min. To compare another setup, change the miner and extraction clock in Settings, then compare the extractor count, purity allocation and power in the resource results. Changing the miner does not change the target rate.',
        'If the in-game line receives less than expected, check for a power trip, the selected miner and clock, node purity, belt rating, mergers or splitters, and a full destination. The displayed rate is a material-balance calculation; it does not simulate belt blockage, power loss, placement or startup order.',
      ],
    },
  ],
  references: {
    heading: 'Sources',
    links: [
      { label: 'Satisfactory Wiki — Miner', href: 'https://satisfactory.wiki.gg/wiki/Miner' },
      { label: 'Satisfactory Wiki — Resource Node', href: 'https://satisfactory.wiki.gg/wiki/Resource_Node' },
      { label: 'Satisfactory Wiki — Conveyor Belt', href: 'https://satisfactory.wiki.gg/wiki/Conveyor_Belt' },
      { label: 'Planner game-data source and version notes', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: ['Desc_OreIron_C', 'Desc_IronIngot_C', 'Desc_IronPlate_C'],
  relatedArticleSlugs: ['clock-and-efficiency', 'build-checklist-guide', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: 'Open the 160 Iron Plate/min plan and check the Mk.2 miner’s 240 Ore/min',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 160,
    minerId: 'Build_MinerMk2_C',
  },
} as const satisfies HandwrittenArticle
