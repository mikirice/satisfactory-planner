import type { HandwrittenArticle } from '../types.ts'

export const alternateRecipeMetricsArticleEn = {
  slug: 'alternate-recipe-metrics',
  title: 'How to Compare Alternate Recipes — Output, Power and Ingredients on the Same Basis',
  description:
    'Separate output per machine, per MW and per ingredient with a 100%-clock Iron Plate comparison, then check the same target across the whole factory.',
  sections: [
    {
      heading: 'Set the comparison conditions first',
      paragraphs: [
        'There is no universal ranking of “strong” alternate recipes. Start by using the same rate basis and clock, then decide what you want to compare. The per-minute rate in the recipe list is for the direct step at 100% clock. It does not include mining, upstream ingredients, transport or construction cost.',
        'For the same product, compare the building, cycle time, inputs and outputs together. A one-machine recipe comparison is different from a whole factory making the same target quantity. Keep unlocked recipes and any stocked intermediates consistent when you compare plans.',
      ],
    },
    {
      heading: 'What each of the three metrics tells you',
      paragraphs: [
        'Output per machine is how much one machine makes in a minute at 100% clock: output per cycle × 60 ÷ cycle time in seconds. It helps compare machine count and floor space, but says nothing about power draw or ingredient scarcity.',
        'Output per MW divides the direct step’s output per minute by the building’s base power draw. Actual building power depends on the machine and its clock; miners and upstream production also need power. Treat this as a step-level comparison, not whole-factory power efficiency.',
        'Output per ingredient divides output rate by the consumption rate of each ingredient separately. Read it as one ratio per ingredient, not as a combined score. Fluids and gases are divided by cubic metres, so their ratios are not directly comparable to a solid-item ratio.',
      ],
    },
    {
      heading: 'Compare the three Iron Plate recipes on one basis',
      paragraphs: [
        'At 100% clock, the standard Iron Plate recipe makes 20/min in a Constructor at 4 MW and uses 30 Iron Ingot/min. That is 5 plates/MW and about 0.67 plates per Iron Ingot. Coated Iron Plate makes 75/min in an Assembler at 15 MW from 37.5 Iron Ingot/min and 7.5 Plastic/min. It is also 5 plates/MW, but gives 2 plates per Iron Ingot. Steel Cast Plate makes 45/min in a Foundry at 16 MW from 15 Iron Ingot and 15 Steel Ingot per minute: about 2.81 plates/MW and 3 plates per unit of either ingot.',
        'On this direct-step comparison, Coated Iron Plate has high throughput and more plates per Iron Ingot. The conclusion can change once the Oil, buildings and power behind Plastic are included, or the Steel chain behind Steel Cast Plate. Use these metrics to narrow the options; make the final decision with the whole factory solving for the same Iron Plate target.',
      ],
    },
    {
      heading: 'Check the whole-factory result in the planner',
      paragraphs: [
        '1. Open the Iron Plate item page. In its recipe list, compare the direct rate, building, inputs and power for the standard and alternate recipes. Leave out any alternate you have not unlocked.',
        '2. Open the 60/min plan at the end of this article. Keep its target fixed and enable one available alternate at a time. Solve separately for “minimize resources,” “minimize power” and “minimize buildings,” then note what changes in raw resources, total power and building count.',
        '3. If you change a setting during the comparison, return to the baseline before trying the next candidate. Do not compare a result that brings in Oil or Water as stocked material with one that produces all ingredients on site. Before building, check throughput against the nodes and power you actually have.',
        'If ore use falls but power is short or a different ingredient stalls the line, follow that ingredient upstream in the result. Do not read the objectives as one combined ranking; choose the result that fits your actual constraint.',
      ],
    },
  ],
  references: {
    heading: 'References',
    links: [
      { label: 'Satisfactory Planner — game-data source and version (1.1.x)', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Planner — bundled recipe data', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/data/recipes.json' },
      { label: 'Satisfactory Planner — recipe-list metrics implementation', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/scripts/static-pages/item-insights.ts' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C', 'Desc_Plastic_C', 'Desc_SteelIngot_C'],
  relatedArticleSlugs: ['strong-alternate-recipes', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: 'Compare Iron Plate alternates against the same target rate',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 60,
    alternateRecipeIds: [
      'Recipe_Alternate_CoatedIronPlate_C',
      'Recipe_Alternate_SteelCastedPlate_C',
    ],
  },
} as const satisfies HandwrittenArticle
