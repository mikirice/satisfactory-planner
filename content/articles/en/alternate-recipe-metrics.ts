import type { HandwrittenArticle } from '../types.ts'

export const alternateRecipeMetricsArticleEn = {
  slug: 'alternate-recipe-metrics',
  title: 'Choosing Alternate Recipes — Reading Output per Machine, per MW and per Ingredient',
  description:
    'Compare output per machine, output per MW and output per ingredient using the real numbers behind the standard and alternate Iron Plate recipes.',
  sections: [
    {
      heading: 'Three metrics, three different questions',
      paragraphs: [
        'An alternate recipe is not automatically the right pick just because it produces more per minute. It usually changes the building, the power draw and the ingredients as well, so the metric you should trust depends on what is actually limiting your factory. Recipe mode puts the standard and alternate recipes of an item side by side on the same basis.',
        'Output rate per machine is what one machine at 100% clock produces per minute, calculated as output per cycle times 60 divided by the cycle time in seconds. It is the first thing to look at when floor space or building count is the constraint, but it says nothing about the extra steps an unusual ingredient may add upstream.',
      ],
    },
    {
      heading: 'Reading output per MW',
      paragraphs: [
        'Output per MW divides that per-minute output by the power draw of one machine. The higher the value, the more the step produces for each megawatt it consumes. Recipes with a variable draw, such as those in the particle accelerator, are shown as a minimum-to-maximum range, and the comparison uses the midpoint. This metric also excludes mining and upstream production, so confirm the final decision against the total power of the whole plan.',
      ],
    },
    {
      heading: 'Reading output per ingredient',
      paragraphs: [
        'Output per ingredient divides the per-minute output of the target item by the per-minute consumption of each ingredient. Solids are shown per item, fluids and gases per cubic metre. Each ingredient gets its own ratio — these are not added into a single score. Decide first which is the real problem, a scarce ingredient, a byproduct you already have too much of, or belt throughput, and then read the matching row.',
      ],
    },
    {
      heading: 'Comparing the three Iron Plate recipes',
      paragraphs: [
        'Take Iron Plate as the example. The standard recipe gives 20 per minute from one Constructor at 4 MW, using 30 Iron Ingot per minute: 5 plates per MW, and about 0.67 plates per ingot. Coated Iron Plate gives 75 per minute at 15 MW, which is the same 5 plates per MW, but it turns 37.5 Iron Ingot per minute into 75 plates — 2 plates per ingot. In exchange it needs 7.5 Plastic per minute and an Assembler. Steel Cast Plate gives 45 per minute at 16 MW from 15 Iron Ingot and 15 Steel Ingot per minute. Its ingredient ratio looks strong, but the judgement has to include the steel chain it pulls in upstream.',
      ],
    },
    {
      heading: 'Decide at the factory level',
      paragraphs: [
        'Once the field is narrowed down, enable only the alternate recipes you have unlocked and solve the same target rate under each objective in turn: minimize resources, minimize power, minimize buildings. Adopt the layout whose raw resources, total power and building count fit the constraint you are actually under.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_IronPlate_C',
    'Desc_IronIngot_C',
    'Desc_Plastic_C',
    'Desc_SteelIngot_C',
  ],
  cta: {
    kind: 'item',
    label: 'Compare the Iron Plate alternates across a whole plan',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 60,
    alternateRecipeIds: [
      'Recipe_Alternate_CoatedIronPlate_C',
      'Recipe_Alternate_SteelCastedPlate_C',
    ],
  },
} as const satisfies HandwrittenArticle
