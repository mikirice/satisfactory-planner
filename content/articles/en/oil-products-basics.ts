import type { HandwrittenArticle } from '../types.ts'

export const oilProductsBasicsArticleEn = {
  slug: 'oil-products-basics',
  title: 'Oil Products, From the Ground Up — Plastic, Rubber, Fuel and Where the Residue Goes',
  description:
    'The ratios of the standard Crude Oil chains for Plastic, Rubber and Fuel, and a side-by-side comparison of the three outlets for the Heavy Oil Residue you cannot avoid producing.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Crude Oil splits three ways',
      paragraphs: [
        'There are three standard Crude Oil recipes and all of them run in a Refinery (30 MW each). Plastic takes 30 m³/min of Crude Oil and returns 20 Plastic/min plus 10 m³/min of Heavy Oil Residue. Rubber takes the same 30 m³/min and returns 20 Rubber/min plus 20 m³/min of Heavy Oil Residue. Fuel takes 60 m³/min and returns 40 m³/min of Fuel plus 30 Polymer Resin/min. Plastic and Rubber cost identical Crude Oil but leave you twice as much residue in one case as the other.',
        'Oil lines almost always fail the same way: a byproduct has nowhere to go, the pipe fills, and the refineries upstream stall. So the design problem is not really "how much Plastic do I want" — it is "where do the Heavy Oil Residue and the Polymer Resin go", and that should be settled first.',
      ],
    },
    {
      heading: 'Send the residue to a generator',
      paragraphs: [
        'The clearest starting layout is one Plastic refinery and one Rubber refinery side by side, with the residue burned for power. Two Refineries consume 60 m³/min of Crude Oil and yield 20 Plastic/min, 20 Rubber/min and 30 m³/min of Heavy Oil Residue. Feed that residue into Residual Fuel (60 m³/min of Heavy Oil Residue into 40 m³/min of Fuel) and half a Refinery gives you 20 m³/min of Fuel — exactly what one Fuel-Powered Generator consumes.',
        'So this one block turns 60 m³/min of Crude Oil (half an Oil Extractor on a Normal purity node) into 20 Plastic/min, 20 Rubber/min and 250 MW. The 2.5 Refineries draw 75 MW, leaving 175 MW net. Producing Plastic and Rubber while your power budget goes up rather than down is what makes oil worth building early.',
      ],
    },
    {
      heading: 'Compare the three outlets for the residue',
      paragraphs: [
        'Heavy Oil Residue has three main destinations, and feeding the same 30 m³/min into each gives visibly different results. Residual Fuel converts 60 m³/min of residue into 40 m³/min of Fuel, a ratio of 0.67. Petroleum Coke converts 40 m³/min of residue into 120 items/min. The alternate recipe Diluted Fuel runs in a Blender (75 MW) and turns 50 m³/min of residue plus 100 m³/min of Water into 100 m³/min of Fuel — a ratio of 2, exactly three times better than Residual Fuel.',
        'Follow it through to power and the gap widens. 30 m³/min of residue through Residual Fuel is 20 m³/min of Fuel, one Fuel-Powered Generator, 250 MW. Through Diluted Fuel it is 60 m³/min of Fuel, three generators, 750 MW, and it only costs 0.6 of a Blender (45 MW). Through Petroleum Coke it is 90 items/min, which feeds 3.6 Coal-Powered Generators (25 Petroleum Coke/min each, 75 MW each) for 270 MW — but those generators also want 45 m³/min of Water each, so you need 162 m³/min of supply. Whether you have water nearby decides that one.',
      ],
    },
    {
      heading: 'Polymer Resin and the recycling recipes',
      paragraphs: [
        'Running the Fuel recipe also produces 30 Polymer Resin/min. It is not something to stockpile: convert it with Residual Plastic (60 Polymer Resin/min plus 20 m³/min of Water into 20 Plastic/min) or Residual Rubber (40 Polymer Resin/min plus 40 m³/min of Water into 20 Rubber/min). Both are standard recipes, so they are available even if you have not unlocked a single alternate.',
        'With alternates unlocked you also get Recycled Plastic (30 Rubber/min plus 30 m³/min of Fuel into 60 Plastic/min) and Recycled Rubber (30 Plastic/min plus 30 m³/min of Fuel into 60 Rubber/min). Those two feed each other, so neither has a meaningful ratio on its own — they only make sense as a closed loop starting from Crude Oil. The loop template guide covers that build with solved numbers.',
      ],
    },
    {
      heading: 'Checking it in the planner',
      paragraphs: [
        'Set the product you actually want (Plastic or Rubber) as the target, solve, then read the production steps to see where the Heavy Oil Residue and Polymer Resin end up. Anything left over as surplus is the pipe that will back up in your real factory. Then switch on Diluted Fuel and the recycling alternates one at a time and watch how the Crude Oil requirement and the building count move.',
        'If you want power in the same plan, enable the Fuel-Powered Generator, allow Fuel, and set a target output in MW. Crude Oil is capped at 12,600 m³/min across the whole map, so when a build gets large it is worth checking what fraction of that cap you are claiming before you commit to expanding.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_LiquidOil_C',
    'Desc_Plastic_C',
    'Desc_Rubber_C',
    'Desc_HeavyOilResidue_C',
    'Desc_PolymerResin_C',
    'Desc_LiquidFuel_C',
    'Desc_PetroleumCoke_C',
  ],
  relatedArticleSlugs: [
    'oil-loop-complete',
    'packaged-diluted-fuel-loop',
    'coal-power-startup',
    'power-generation-planning',
  ],
  cta: {
    kind: 'item',
    label: 'Open a 60 Plastic/min plan and see where the residue goes',
    itemId: 'Desc_Plastic_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
