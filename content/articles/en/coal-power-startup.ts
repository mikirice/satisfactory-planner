import type { HandwrittenArticle } from '../types.ts'

export const coalPowerStartupArticleEn = {
  slug: 'coal-power-startup',
  title: 'Getting Coal Power Running — Building Around a 600 MW Block of Eight',
  description:
    'The fuel and water ratios of the Coal-Powered Generator, how to size mining, water and belts around a block of eight generators, and how the numbers shift when you switch to Compacted Coal or Petroleum Coke.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Start from what a single generator eats',
      paragraphs: [
        'One Coal-Powered Generator produces 75 MW. Running it on Coal, a single unit at 100% clock burns 15 Coal/min and 45 m³/min of Water. Every ratio in a coal plant falls out of those two numbers. Once you pick a generator count, Coal comes in multiples of 15 and Water in multiples of 45, and there is nothing else to work out. There is no byproduct either, so unlike nuclear you never need a downstream consumer.',
        'Water is the half people forget. A starved coal belt is obvious, but a starved pipe is quiet: the generators simply idle at partial load while everything looks connected. Decide the generator count first, then confirm you can actually deliver 45 m³/min per unit.',
      ],
    },
    {
      heading: 'Treat eight generators as one block',
      paragraphs: [
        'Eight Coal-Powered Generators are 600 MW, 120 Coal/min and 360 m³/min of Water. That combination is convenient on the logistics side too: 120 Coal/min is exactly the throughput of a Conveyor Belt Mk.2 (120 items/min). Water at 360 m³/min does not fit a Pipeline Mk.1 (300 m³/min) but fits a single Pipeline Mk.2 (600 m³/min). If Mk.2 pipes are not unlocked yet, split the supply into two runs.',
        'You can also read it backwards. If you want one Mk.2 belt to carry the Coal, eight generators is your ceiling; with a Mk.3 belt (270 items/min) a single run feeds 18 generators, or 1,350 MW. Choosing the belt and pipe tier before the generator count saves you from re-routing later.',
      ],
    },
    {
      heading: 'Count the mining and pumping hardware',
      paragraphs: [
        '120 Coal/min matches exactly one Miner Mk.2 on a Normal purity node at 100% clock (120 items/min). A Miner Mk.1 gives 60 items/min, so you would need two; a Miner Mk.3 gives 240 items/min, so half of one covers it. Node purity is a straight multiplier: Impure is 0.5x and Pure is 2x. Put a Miner Mk.2 on a Pure node and one machine delivers 240 items/min, enough for 16 generators.',
        '360 m³/min of Water takes three Water Extractors at 120 m³/min each. This is where the support hardware starts to matter: a Water Extractor draws 20 MW and a Miner Mk.2 draws 15 MW. For the eight-generator block that is 75 MW just for water and mining, or 12.5% of the 600 MW you generate. Coal power is not 600 MW of usable output, and it helps to budget that from the start.',
      ],
    },
    {
      heading: 'Changing fuel changes the ratios',
      paragraphs: [
        'The Coal-Powered Generator also burns Compacted Coal and Petroleum Coke. Water stays at 45 m³/min per unit either way, but fuel consumption does not. Compacted Coal burns at roughly 7.14 items/min per generator, so seven generators come to exactly 50 items/min. Compacted Coal is made in an Assembler from 25 Coal/min and 25 Sulfur/min into 25 items/min, so 50 items/min means two Assemblers plus 50 Coal/min and 50 Sulfur/min. Coal consumption drops to less than half of burning it directly, at the cost of Sulfur nodes and 15 MW per Assembler.',
        'Petroleum Coke burns at 25 items/min per generator, and a Refinery turns 40 m³/min of Heavy Oil Residue into 120 items/min of it. If your oil line has Heavy Oil Residue to spare, this sends it somewhere useful instead of clogging a pipe. Note that the higher burn rate means eight generators need 200 items/min, which a Mk.2 belt cannot carry — revisit the belt tier whenever you change fuel.',
      ],
    },
    {
      heading: 'Working it out in the planner',
      paragraphs: [
        'To plan coal power here, enable the Coal-Powered Generator in the settings, pick which fuels it may use (Coal, Compacted Coal, Petroleum Coke), then enter a target power output in MW. Choosing Compacted Coal or Petroleum Coke pulls their production steps into the same item balance, so the Sulfur or Crude Oil requirement appears in the same result. Leaving fuels you do not intend to build switched off keeps the output readable.',
        'With Compacted Coal selected, the solver may propose making Sulfur in a Converter from Iron Ore rather than mining it. The default objective weights each raw resource by the map cap, and Sulfur is capped at 10,800 items/min against 92,100 items/min for Iron Ore. If you have Sulfur nodes secured, switching the objective to "minimise power" or "minimise buildings" brings the direct route back.',
        'Turning on "cover the factory power draw" adds the manufacturing buildings to the self-sufficiency constraint. That constraint does not include extraction hardware, though. The three Water Extractors and the miners counted above have to be added by hand from the extraction power shown in the results. Generator overclocking is not modelled, so a fractional generator count is reported as partial load.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_CompactedCoal_C',
    'Desc_Sulfur_C',
    'Desc_PetroleumCoke_C',
    'Desc_HeavyOilResidue_C',
  ],
  relatedArticleSlugs: ['power-generation-planning', 'oil-products-basics', 'turbofuel-power'],
  cta: {
    kind: 'item',
    label: 'Open a plan for 50 Compacted Coal/min (enough for seven generators)',
    itemId: 'Desc_CompactedCoal_C',
    ratePerMin: 50,
  },
} as const satisfies HandwrittenArticle
