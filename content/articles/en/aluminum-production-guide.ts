import type { HandwrittenArticle } from '../types.ts'

/** Per-minute figures are scaled directly from src/data/recipes.json and buildings.json. */
export const aluminumProductionGuideArticleEn = {
  slug: 'aluminum-production-guide',
  title: 'Aluminum Production Basics — Three Stages, Water and Silica',
  description:
    'Follow the standard chain from Bauxite to Aluminum Ingot with per-minute balances, a 60/min worked example, and practical steps for Water, Silica, start-up and troubleshooting.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Turn Bauxite into Ingots in three stages',
      paragraphs: [
        'The standard chain has three stages: (1) a Refinery makes Alumina Solution from Bauxite and Water, (2) another Refinery turns the solution and Coal into Aluminum Scrap, and (3) a Foundry combines Scrap and Silica into Aluminum Ingots. The table gives per-minute rates at 100% clock for each machine.',
        'The first stage also makes Silica, and the second returns Water. You can feed that Water back to stage one, but outside Water is still needed to prime the line. If the return Water has nowhere to go, the Scrap step stalls and the blockage can stop Alumina Solution production upstream.',
      ],
      tables: [
        {
          caption: 'Standard Aluminum chain rates per minute (repository 1.1.x data)',
          headers: ['Stage and machine', 'Inputs', 'Outputs'],
          rows: [
            ['Alumina Solution · Refinery', '120 Bauxite + 180 m³ Water', '120 m³ solution + 50 Silica'],
            ['Aluminum Scrap · Refinery', '240 m³ solution + 120 Coal', '360 Scrap + 120 m³ Water'],
            ['Aluminum Ingot · Foundry', '90 Scrap + 75 Silica', '60 Ingots'],
          ],
        },
      ],
    },
    {
      heading: 'Work backward from 60 Aluminum Ingots/min',
      paragraphs: [
        'Start with one Foundry at 100% clock. It makes 60 Aluminum Ingots/min and needs 90 Scrap/min plus 75 Silica/min. A quarter of a Scrap Refinery supplies 90 Scrap/min, using 60 m³/min of Alumina Solution and 30 Coal/min while returning 30 m³/min of Water.',
        'The 60 m³/min of solution is half of an Alumina Solution Refinery. It uses 60 Bauxite/min and 90 m³/min of Water, and also produces 25 Silica/min. Make the remaining 50 Silica/min with the standard recipe and you need 30 Raw Quartz/min and one and one-third Constructors. Altogether, 60 Aluminum Ingots/min takes 60 Bauxite/min, 30 Coal/min, 30 Raw Quartz/min and a net 60 m³/min of Water.',
        'The fractional line uses 0.75 Refineries, one Foundry and 1⅓ Constructors. At 100% machine power rates, that is 22.5 MW for Refineries, 16 MW for the Foundry and about 5.33 MW for Constructors, for a total of about 43.83 MW. You can underclock the fractional machines instead of running full machines at 100%.',
      ],
      tables: [
        {
          caption: 'A standard-recipe build for 60 Aluminum Ingots/min',
          headers: ['Requirement', 'Per minute'],
          rows: [
            ['Bauxite', '60 items'],
            ['Coal', '30 items'],
            ['Raw Quartz', '30 items'],
            ['Outside Water (after reusing return Water)', '60 m³ net'],
            ['Machine power', 'about 43.83 MW'],
          ],
        },
      ],
    },
    {
      heading: 'Reuse the byproduct Water once the line is running',
      paragraphs: [
        'In the 60 Ingots/min example, the Alumina Solution step uses 90 m³/min of Water, while the Scrap step returns 30 m³/min. Feed that return upstream in steady operation and the outside supply only has to cover a net 60 m³/min. The [Aluminum Water Loop guide](/en/articles/aluminum-production-guide/) covers the return-pipe layout, priming and overflow route. When adding batteries to the same site, use the separate [Battery Water Loop guide](/en/articles/aluminum-production-guide/) for the additional return stream.',
        'This is a steady-state material balance. When you first build the line, supply outside Water to fill the pipes and solution step; check the return path after Scrap production begins. Even if the Planner shows a balanced plan, a high return pipe, insufficient head lift or a backed-up receiving pipe can prevent flow in game. If you add an emergency outlet, confirm that it will not drain inputs or product during normal operation.',
      ],
    },
    {
      heading: 'Source Silica from the byproduct, Quartz or an alternate',
      paragraphs: [
        'The standard Silica recipe turns 22.5 Raw Quartz/min into 37.5 Silica/min. The Cheap Silica alternate adds 37.5 Limestone/min to the same 22.5 Raw Quartz/min and returns 52.5 Silica/min. To make the extra 50 Silica/min in the 60 Ingot example with Cheap Silica alone, you need about 21.43 Raw Quartz/min and 35.71 Limestone/min. It uses an Assembler instead of a Constructor, so compare the Limestone supply and whether the recipe is unlocked.',
        'The standard Alumina Solution step supplies some Silica as a byproduct. By contrast, the Sloppy Alumina alternate uses 200 Bauxite/min and 200 m³/min of Water to make 240 m³/min of solution and produces no Silica. It makes more solution per unit of Bauxite than the standard recipe, but you must supply all Silica separately. Choose based on which resource is constrained at your site and how far it must be transported.',
      ],
    },
    {
      heading: 'Match the Planner result to your site and trace a stoppage',
      paragraphs: [
        'Set Aluminum Ingot to 60/min in the Planner and review the recipes, buildings and resource limits. Under the default “minimise raw resources” objective, the solver may make Bauxite in a Converter instead of mining it because Bauxite is scarcer across the whole map. Enter limits for the nodes you can actually use, or compare objectives that prioritize power or building count to find a plan closer to your site. See [How to Compare Alternate Recipes](/en/articles/strong-alternate-recipes/) for choosing among recipe trade-offs.',
        'If production stops, check in this order: (1) whether Alumina Solution reaches the Scrap Refineries, (2) whether Silica reaches the Foundries in the needed amount, (3) whether the return Water pipe and receiving point are clear, and (4) whether Bauxite, Coal and Quartz mining and belts meet the required rates. The Planner solves selected recipes and steady-state balances; it does not lay out pipe height, head lift or start-up filling for you.',
      ],
    },
  ],
  references: {
    heading: 'Data and recipe sources',
    links: [
      {
        label: 'Planner game-data source and version record (1.1.x)',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      { label: 'Alumina Solution — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Alumina_Solution' },
      { label: 'Aluminum Scrap — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Aluminum_Scrap' },
      { label: 'Aluminum Ingot — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Aluminum_Ingot' },
      { label: 'Silica — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Silica' },
      { label: 'Recipes — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Recipes' },
      { label: 'Pipelines — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Pipeline' },
      { label: 'Head lift — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Head_lift' },
    ],
  },
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
    'aluminum-production-guide',
    'aluminum-production-guide',
    'strong-alternate-recipes',
    'awesome-sink-points',
  ],
  cta: {
    kind: 'item',
    label: 'Open a plan for 60 Aluminum Ingots/min',
    itemId: 'Desc_AluminumIngot_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
