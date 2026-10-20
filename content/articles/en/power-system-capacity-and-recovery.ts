import type { HandwrittenArticle } from '../types.ts'

export const powerSystemCapacityAndRecoveryArticleEn = {
  slug: 'power-system-capacity-and-recovery',
  title: 'Power Capacity and Recovery — From Headroom to Restart',
  description: 'Compare generation with real and peak loads, then plan coal startup, daisy chains, storage, and staged recovery in one operating procedure.',
  publishedDate: '2026-10-20',
  updatedDate: '2026-10-20',
  versionNotice: 'Numeric examples use the Planner’s bundled 1.1.x recipe and building data. They are not measurements of current in-game behavior in Update 1.2. Check the equipment and storage values in your save before using them.',
  sections: [
    { heading: 'Separate rating, average load, and peak load', paragraphs: [
      'A generator’s combined rating is not automatically the power available to the factory. Pumps, miners, refineries, fuel processing, and other equipment that keeps generation running draw power from the same grid. Track generator rating, normal displayed consumption, and startup or variable-load peaks in separate columns.',
      'Use headroom = available generation − all loads that can run at the same time. For example, eight generators rated at 75 MW each would total 600 MW. If auxiliaries and normal production draw 420 MW, apparent headroom is 180 MW. If a variable process can add a 240 MW peak, total demand becomes 660 MW and exceeds supply even when its average load is low. These fixed ratings are a 1.1.x model example.',
    ], tables: [{ caption: 'Power balance to fill before construction', headers: ['Part', 'Record', 'Check'], rows: [
      ['Supply', 'Generator rating and running count', 'Count only units with sustained fuel, water, and inputs'],
      ['Steady load', 'Mining, transport, manufacturing, pumps', 'Record display values while starting and stopping one area'],
      ['Peak load', 'Maximum clock, variable recipes, startup', 'Use recipe maximums; keep them separate from averages'],
      ['Reserve', 'Available generation − peak load', 'At zero or below, add supply or isolate loads'],
    ]}] },
    { heading: 'Start coal power from auxiliaries outward', paragraphs: [
      'In the Planner’s 1.1.x example, eight coal generators at 75 MW each use 120 coal/min and 360 m³/min of water. These are not measurements from an Update 1.2 save. Check in-game recipes and equipment displays before building, and include miners, pumps, and conveyors in the load plan.',
    ], lists: [{ ordered: true, items: [
      'Place a Power Switch where the manufacturing loads branch away from the generation equipment, then switch it off to isolate the factory. Keep only the miners, water extractors, required pumps, and conveyors on the generation-support circuit.',
      'With the factory-side Power Switch off, build a row of Power Poles for the support circuit. Fuel a temporary Biomass Burner, then connect its power connector through those poles to the miners, water extractors, pumps, and coal conveyors on the same circuit. The independent source must reach the equipment that starts generation during the outage.',
      'Turn on the support circuit. Run the miner to send coal by belt to the coal-generator inputs and run the water extractors to feed them through pipes. First confirm coal and water reach the actual belt and pipe endpoints for each generator.',
      'Connect each fueled and watered coal generator’s power connector to the same support-circuit pole line. Start with a small group, then add more after output remains steady. Keep the factory-side switch off until generation exceeds support demand.',
      'Once generation is stable, disconnect or stop the temporary burner and verify that the coal miners, water extractors, pumps, and conveyors keep running on the coal grid alone. If a support machine stops, restore temporary power and fix the connection from generation to the support circuit.',
      'Only after support loads remain stable, turn on the Power Switch and restore manufacturing areas one at a time. Split any area that trips the grid, and measure its peak and startup-support load before reconnecting the next one.',
    ]}] },
    { heading: 'Choose recovery order by what each load supports', paragraphs: [
      'After a fuse trips, divide loads into generation support, essential production, and deferrable production. Disconnect deferrable areas and restore only the equipment needed to keep generation alive. Reconnecting everything to one circuit at once can trip it again during startup. Enable one area at a time and record consumption and generator state before and after each connection.',
      'Update 1.2’s daisy-chaining feature is unlocked in the Caterium research tree. It gives the same building two power connections and lets buildings connect to each other so power flows building-to-building. This replaces the usual pole-to-building setup for those connections; it does not increase generation or grid capacity.',
    ] },
    { heading: 'Size storage from the deficit', paragraphs: [
      'For a temporary shortage, required energy is deficit MW × minutes ÷ 60. A 400 MW deficit lasting 10 minutes needs about 66.7 MWh. If you assume one unit can provide 100 MWh under the bundled 1.1.x data, one would be the theoretical minimum; check starting charge, discharge output limits, changing load, and recharge time. This is a calculation example, not a tested in-game recommendation.',
      'When measuring a deficit, record storage level and grid consumption at the same intervals. Do not count charging draw as generation headroom, and measure how long the battery actually supports the grid across an outage.',
    ], tables: [{ caption: 'Recovery checks', headers: ['Symptom', 'Compare first', 'Next action'], rows: [
      ['Generators stop', 'Time fuel, water, or material input stops', 'Keep only support loads on and trace the input upstream'],
      ['A production area trips the grid', 'Area peak load and simultaneous startup', 'Split the area and retry with a different order'],
      ['Storage empties sooner than expected', 'Measured deficit, remaining charge, elapsed time', 'Recalculate with peak deficit instead of average'],
      ['Grid fails only at load peaks', 'Variable maximum draw and headroom', 'Design for the maximum or isolate the variable process'],
    ]}] },
    { heading: 'Record a reproducible check in your save', paragraphs: [
      'Record game version, generator type and count, recipe, clock, normal and peak demand, storage starting charge, and outage-to-recovery time. Change one variable at a time and name the success condition: generator stability, no fuse trip, or successful area reconnection. These are proposed procedures; the author has not reproduced them in the current game.',
    ] },
  ],
  references: { heading: 'Sources and data scope', links: [
    { label: 'Satisfactory Planner: bundled data and calculation scope', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    { label: 'Satisfactory Wiki: Coal Generator', href: 'https://satisfactory.wiki.gg/wiki/Coal_Generator' },
    { label: 'Satisfactory Wiki: Power Storage', href: 'https://satisfactory.wiki.gg/wiki/Power_Storage' },
    { label: 'Coffee Stain Studios: Update 1.2 announcement', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    { label: 'Developer: Satisfactory 1.2 Update out now! (Steam)', href: 'https://store.steampowered.com/news/app/526870/view/695387676933621085' },
  ]},
  relatedItemIds: ['Desc_Water_C'],
  relatedArticleSlugs: ['production-planning-tutorial', 'oil-products-basics', 'somersloop-and-power-shards'],
} as const satisfies HandwrittenArticle
