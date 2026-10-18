import type { HandwrittenArticle } from '../types.ts'

export const factoryFloorAreaArticleEn = {
  slug: 'factory-floor-area',
  publishedDate: '2026-10-17',
  title: 'Estimate Factory Floor Area with Satisfactory Planner',
  description:
    'Use Satisfactory Planner’s 1.1.x estimate to calculate floor area from machine counts. Follow a 60 Iron Plates/min example, then account for layout, height, logistics, and site boundaries.',
  sections: [
    {
      heading: 'Know the estimate—and what it does not promise',
      paragraphs: [
        'With Satisfactory Planner’s bundled 1.1.x data, the 60 Iron Plates/min example uses three Smelters and three Constructors. Their building footprints total 390 m²; applying the 1.5 aisle factor gives an estimate of 585 m², or ten 8 m × 8 m Foundation equivalents. This is an area conversion. It does not guarantee that the machines and logistics will fit on ten Foundations.',
        'This guide explains Planner’s area estimate. It does not show a factory layout tested in game or verified Update 1.2 building dimensions. The footprint data comes from the bundled 1.1.x building-clearance data. Its equivalence with Update 1.2 has not been confirmed, so use the current in-game placement information if it differs.',
      ],
    },
    {
      heading: 'Planner applies an aisle factor to building footprints',
      paragraphs: [
        'For each building type, Planner multiplies the number of buildings to place by one building’s clearance width and depth. It totals production/generation and extraction areas separately, applies its own 1.5 aisle factor to their combined building area, then rounds up after dividing by 64 m² (8 m × 8 m) per Foundation.',
        'The 1.5 factor is not an in-game placement rule. It is Planner’s rough allowance for access and belt/pipe routing space. The layout changes how much clearance you need, so do not use the result as a measured blueprint footprint.',
      ],
      tables: [
        {
          caption: 'Production footprint example: 60 Iron Plates/min, no alternate recipes, standard clock',
          headers: ['Building', 'Count', 'Footprint per building', 'Subtotal'],
          rows: [
            ['Smelter', '3', '5 m × 10 m = 50 m²', '150 m²'],
            ['Constructor', '3', '8 m × 10 m = 80 m²', '240 m²'],
            ['Building footprint area', '—', '—', '390 m²'],
            ['After aisle factor', '—', '390 m² × 1.5', '585 m²'],
            ['Foundation equivalents', '—', '585 m² ÷ 64 m²', '10 by area (rounded up)'],
          ],
        },
      ],
    },
    {
      heading: 'Do not turn ten area-equivalents into a rectangular floor plan',
      paragraphs: [
        '585 ÷ 64 = 9.14…, so the area rounds up to ten Foundation equivalents. But machines have different widths and depths. Their orientation, number of rows, row ends, input/output directions, power connections, and access corridors change the outer dimensions. Ten Foundations does not mean the Smelters and Constructors fit in a 10-tile square or a single row.',
        'The estimate does not model belts, pipes, lifts, poles, splitters, mergers, input/output clearance, walls, doors, stairs, terrain, cliffs, water, or the edge of an available platform. Stacking machines can reduce ground footprint, but inter-floor logistics, access, floor areas, and height still need planning. Depending on the layout, the build can need more or less than 585 m².',
      ],
    },
    {
      heading: 'Turn the result into your own layout',
      paragraphs: [
        '1. Set the target rate, allowed alternate recipes, and manufacturing clock limit to match your plan. Changing these settings changes the building counts and area.',
        '2. Read the estimated area and its production/extraction breakdown. If miners are at remote resource nodes, do not add their footprint to one central factory floor; treat extraction as a separate group of on-site buildings.',
        '3. In game, place a temporary Foundation area, then lay out machine rows and their input/output routes. Check the platform perimeter, access paths, logistics, and room to expand before adding walls and decoration. Widen the temporary area or split the build across floors if routes feel cramped or cross a boundary.',
        'Planner does not return rectangular dimensions, a completed layout, or an in-game placement check. Use the estimate to size the required equipment and rough scale, then resolve shape, height, inputs/outputs, and site boundaries in your build.',
      ],
    },
    {
      heading: 'How this guide differs from the related pages',
      paragraphs: [
        'Getting Started with Production Planning covers entering targets and reading result tabs. The Build List guide covers machine counts and transport rates. The Excel Export guide focuses on exporting tables and construction costs. This page avoids repeating those walkthroughs and focuses on the area formula, a worked example, and the layout constraints the estimate cannot guarantee. It is not a floor-plan or blueprint placement guide.',
      ],
    },
  ],
  references: {
    heading: 'Data and calculation references',
    links: [
      { label: 'Game data provenance and 1.1.x identification', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md' },
      { label: 'Building-clearance data type', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/types.ts' },
      { label: 'Area and Foundation-equivalent implementation', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/plan/aggregate.ts' },
      { label: 'Footprint calculation regression tests', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/tests/footprint.test.ts' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  relatedArticleSlugs: ['production-planning-tutorial', 'build-checklist-guide', 'excel-export-guide'],
  cta: {
    kind: 'sample',
    label: 'Open the 60 Iron Plates/min plan in Planner',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
