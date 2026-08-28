import type { HandwrittenArticle } from '../types.ts'

export const aluminumProductionGuideArticleEn = {
  slug: 'aluminum-production-guide',
  title: 'The Aluminum Chain — Three Stages, and Balancing Water Against Silica',
  description:
    'The three-stage chain from Bauxite to Aluminum Ingot broken down into per-minute rates, what to do with the Water the line gives back, where to source Silica, and how to read the power and resource caps.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Three stages, written as per-minute rates',
      paragraphs: [
        'Aluminum is three stages. A Refinery makes Alumina Solution (120 Bauxite/min plus 180 m³/min of Water into 120 m³/min of Alumina Solution and 50 Silica/min). A second Refinery makes Aluminum Scrap (240 m³/min of Alumina Solution plus 120 Coal/min into 360 Aluminum Scrap/min and 120 m³/min of Water). A Foundry makes the ingot (90 Aluminum Scrap/min plus 75 Silica/min into 60 Aluminum Ingot/min).',
        'What makes aluminum different from other metals is that stage one drinks a lot of Water and stage two hands some of it back. Design those two independently and you end up short on supply at one end while flooding a pipe at the other. Getting the water balance right is most of the work.',
      ],
    },
    {
      heading: 'Breaking down 60 Aluminum Ingot/min',
      paragraphs: [
        'Take one full Foundry, 60 Aluminum Ingot/min. That needs 90 Aluminum Scrap/min, which is 0.25 of a scrap Refinery, consuming 60 m³/min of Alumina Solution and 30 Coal/min and giving back 30 m³/min of Water. The 60 m³/min of Alumina Solution is 0.5 of an Alumina Solution Refinery, consuming 60 Bauxite/min and 90 m³/min of Water and producing 25 Silica/min as a byproduct.',
        'The Foundry wants 75 Silica/min, so the 25 Silica/min byproduct leaves you 50 short. Covering that with the standard Silica recipe (a Constructor turning 22.5 Raw Quartz/min into 37.5 Silica/min) takes 1.333 Constructors and 30 Raw Quartz/min. On the water side you put in 90 m³/min and get 30 m³/min back, so only 60 m³/min has to come from outside.',
        'Altogether, 60 Aluminum Ingot/min costs 60 Bauxite/min, 30 Coal/min, 30 Raw Quartz/min and a net 60 m³/min of Water, built from 0.75 Refineries, one Foundry and 1.333 Constructors. At 100% clock that is 22.5 MW of Refineries plus 16 MW of Foundry plus 5.33 MW of Constructors, about 43.8 MW. Underclocking the fractional machines brings it below that.',
      ],
    },
    {
      heading: 'Return the byproduct Water instead of dumping it',
      paragraphs: [
        'The Water the scrap Refinery produces can go straight back into the Alumina Solution supply. In the example above that covers 30 of the 90 m³/min needed. In a real build you have to lay the return pipe first, otherwise the scrap refinery has nowhere to push its Water and stalls. Pipe junctions are sensitive to head lift and elevation changes, so keep the return line short and at the same height.',
        'One thing to watch: the planner\'s default objective assigns no cost to Water. Water is treated as uncapped on the map, so a "minimise raw resources" objective sees no downside to using more of it. The solved numbers will not push you towards a closed loop on their own — that is a decision you make. Opening one of the existing loop templates is the quickest way to see which recipe combinations actually close the water balance.',
      ],
    },
    {
      heading: 'Where to get Silica',
      paragraphs: [
        'There are three sources. The standard Silica recipe runs in a Constructor, 22.5 Raw Quartz/min into 37.5 Silica/min. The alternate Cheap Silica runs in an Assembler, 22.5 Raw Quartz/min plus 37.5 Limestone/min into 52.5 Silica/min — 1.4 times as much Silica per unit of Raw Quartz. Limestone is capped at 69,300 items/min across the map against 13,500 items/min for Raw Quartz, so trading quartz for limestone is usually the cheaper direction.',
        'The third source is the 50 Silica/min that comes out of Alumina Solution for free. That free Silica disappears if you switch to the alternate Sloppy Alumina (200 Bauxite/min plus 200 m³/min of Water into 240 m³/min of Alumina Solution). Sloppy Alumina gets 1.2 times as much Alumina Solution per Bauxite, but you then have to make all your Silica separately. Pick based on whether Bauxite or Raw Quartz is the tighter constraint at your site.',
      ],
    },
    {
      heading: 'Why the planner reaches for the Converter',
      paragraphs: [
        'Set Aluminum Ingot as a target here and the solver may propose making Bauxite in a Converter from Copper Ore and Reanimated SAM rather than mining it. The default objective, "minimise raw resources", weights each resource by how much of it the map can supply. Bauxite tops out at 12,300 items/min against 92,100 items/min for Iron Ore, so a unit of Bauxite is scored as expensive.',
        'If you have the Bauxite nodes secured, switch the objective to "minimise power" or "minimise buildings". That lowers the weight on resource cost and the solution returns to the direct Bauxite route broken down above. Resource caps can also be overridden in the settings, so entering the node count you actually control gives you a comparison that matches your own base.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_OreBauxite_C',
    'Desc_AluminaSolution_C',
    'Desc_AluminumScrap_C',
    'Desc_AluminumIngot_C',
    'Desc_Silica_C',
    'Desc_RawQuartz_C',
    'Desc_Water_C',
  ],
  relatedArticleSlugs: [
    'aluminum-water-loop',
    'battery-water-loop',
    'alternate-recipe-metrics',
    'awesome-sink-points',
  ],
  cta: {
    kind: 'item',
    label: 'Open a plan for 60 Aluminum Ingot/min',
    itemId: 'Desc_AluminumIngot_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
