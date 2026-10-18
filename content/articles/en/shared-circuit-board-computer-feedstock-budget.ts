import type { HandwrittenArticle } from '../types.ts'

export const sharedCircuitBoardComputerFeedstockBudgetArticleEn = {
  slug: 'shared-circuit-board-computer-feedstock-budget',
  title: 'Trace Shared Inputs Through Circuit Boards and Computers',
  description: 'Combine the intermediate boards used by Computers with a separate Circuit Board output, then estimate Copper Sheet, Plastic, and Cable supply limits.',
  publishedDate: '2026-10-18',
  versionNotice: 'The fixed data bundled with the Planner is Satisfactory 1.1.x. The exact 1.1 patch is unknown, and recipe parity with Update 1.2 has not been established. Examples are continuous-rate calculations, not measurements of in-game machines or transport.',
  sections: [
    {
      heading: 'Separate direct Computer inputs from intermediate inputs',
      paragraphs: [
        'Consider a factory that makes Computers and a separate Circuit Board output while sharing Copper Sheets and Plastic. This guide uses only base recipes from the fixed Satisfactory 1.1.x data. Japanese names follow that snapshot and have not been checked against the current in-game UI.',
        'The base Computer recipe uses 4 Circuit Boards, 8 Cables, and 16 Plastic every 24 seconds in a Manufacturer to make 1 Computer. Each Computer directly uses 16 Plastic. The 4 Circuit Boards it consumes also need upstream Plastic when made with the base Circuit Board recipe.',
        'The base Circuit Board recipe uses 2 Copper Sheets and 4 Plastic every 8 seconds in an Assembler to make 1 board. If one base recipe makes boards for Computers and a separate use, add their upstream materials together.',
      ],
    },
    {
      heading: 'Write the demand for both shared materials',
      paragraphs: [
        'Let C be the Computer target in items per minute, and let B be Circuit Boards per minute sent to a separate output or consumer. The Computer line needs 4C boards per minute; the other use needs another B.',
        'Total Circuit Boards are 4C + B per minute. Board production needs 2(4C + B) = 8C + 2B Copper Sheets and 4(4C + B) = 16C + 4B Plastic per minute. Add the 16C Plastic used directly by the Computer recipe: total Plastic demand is 32C + 4B per minute.',
        'Cable = 8C per minute. This 8C is finished Cable used by the Computer line. Let K mean the supply of finished Cable available to that line; this example leaves Cable production outside the balance. If the same factory makes Cable with the base recipe, expand upstream demand through Wire and Copper Ingots and check those as additional supply constraints.',
      ],
    },
    {
      heading: 'Find the supply that runs out first in an example',
      paragraphs: [
        'Suppose the targets are 2 Computers per minute and 3 Circuit Boards per minute for another use. After other consumers are accounted for, assume supply ceilings of 25 Copper Sheets, 90 Plastic, and 20 finished Cable per minute. These are illustrative inputs, not fixed game specifications or measured values.',
        'The Computer line needs 8 boards per minute, and the separate output needs 3, for 11 total boards per minute. Making 11 boards with the base recipe requires 22 Copper Sheets and 44 Plastic per minute. Add 32 Plastic per minute used directly by the Computers: total Plastic is 76 per minute. Cable demand is 16 per minute.',
        'If the separate Circuit Board target B stays fixed while the Computer target increases by ΔC per minute, divide each remaining supply by the corresponding input per additional Computer and take the minimum: ΔC ≤ min(3 ÷ 8, 14 ÷ 32, 4 ÷ 8) = 0.375 per minute. Copper Sheets constrain this example first. This is a continuous-rate result; it does not guarantee machine timing or stable production in game.',
      ],
      tables: [{
        headers: ['Input', 'Example supply', 'Needed for targets', 'Remaining'],
        rows: [
          ['Copper Sheets', '25/min', '22/min', '3/min'],
          ['Plastic', '90/min', '76/min', '14/min'],
          ['Finished Cable', '20/min', '16/min', '4/min'],
        ],
      }],
    },
    {
      heading: 'Rebuild the balance when supply or recipes change',
      paragraphs: [
        'Let S be Copper Sheets, P Plastic, and K finished Cable available to these lines per minute, after subtracting other consumers. With the base recipes, the target fits when S ≥ 8C + 2B, P ≥ 32C + 4B, and K ≥ 8C.',
        'If any condition fails, use that shortage to adjust the Computer or separate Circuit Board target. An alternate Circuit Board or Computer recipe changes upstream inputs, so expand the selected recipe chain again instead of reusing these coefficients. These steady per-minute balances exclude carried inventory, startup time, interruptions, and reserve stock.',
      ],
    },
    {
      heading: 'How this differs from the published shared-Quickwire calculation',
      paragraphs: [
        'The published AI Limiter / High-Speed Connector article allocates Quickwire directly consumed by two products. This guide expands the intermediate Circuit Boards consumed by Computers and includes boards for a separate output. It combines direct Computer Plastic with the Plastic embedded in board production, so the task is a multi-stage material balance rather than another direct-input allocation.',
      ],
    },
  ],
  references: {
    heading: 'Recipe basis and version limits',
    links: [
      { label: 'Planner data-version record (1.1.x snapshot)', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md' },
      { label: 'Base Circuit Board and Computer recipe data', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json' },
      { label: 'Items and Japanese localization labels', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/items.json' },
      { label: 'Manufacturer and Assembler Japanese labels', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/buildings.json' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['shared-quickwire-allocation-ai-limiters-high-speed-connectors', 'alternate-recipe-metrics', 'production-planning-tutorial'],
  cta: { kind: 'item', label: 'Plan Computer production in the Planner', itemId: 'Desc_Computer_C', ratePerMin: 2 },
} as const satisfies HandwrittenArticle
