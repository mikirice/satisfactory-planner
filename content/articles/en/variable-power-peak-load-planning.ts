import type { HandwrittenArticle } from '../types.ts'

export const variablePowerPeakLoadPlanningArticleEn = {
  "slug": "variable-power-peak-load-planning",
  "title": "Plan Peak Load for Variable-Power Recipes",
  "description": "Estimate a conservative power budget from variable-recipe maximum MW and other peak loads.",
  "publishedDate": "2026-10-19",
  "versionNotice": "Planner bundled game data is Satisfactory 1.1.x. The exact patch, Update 1.2 parity, and simultaneous variable-recipe peaks are unverified.",
  "sections": [
    {
      "heading": "Budget with maximum draw, not an average",
      "paragraphs": [
        "Adding every consumer as though it had one fixed power value can underestimate the headroom needed when a variable-power recipe draws more. In the Planner's bundled Satisfactory 1.1.x data, Converter recipes are listed at 100–400 MW, the Particle Accelerator's Nuclear Pasta recipe at 500–1,500 MW, and the Quantum Encoder's Alien Power Matrix recipe at 0–2,000 MW.",
        "For a plan with one of each machine operating at the same time, the three recipes total 600 MW at their listed minima and 3,900 MW at their maxima. If the rest of the factory can draw up to 500 MW, the combined upper-bound budget is 4,400 MW. This adds the listed data maxima as a conservative design case; it is not a measured in-game peak."
      ]
    },
    {
      "heading": "Include machine counts and operating conditions",
      "paragraphs": [
        "For each recipe, multiply the planned machine count by that recipe's maximum MW, then add the maximum load from other equipment that may run at the same time.",
        "Peak planning value = Σ (machine count for each recipe × recipe maximum MW) + other maximum load",
        "For example, two Particle Accelerators, one Converter, and one Quantum Encoder need up to 2 × 1,500 + 400 + 2,000 = 5,400 MW for the variable-recipe portion. If the Quantum Encoder does not reach its maximum during your operation, the difference can be treated as additional reserve in an upper-bound plan. The data alone does not establish how often or for how long all machines reach their maxima together.",
        "The recipe examples assume the standard clock. If you change clock settings, add production amplification with Somersloops, change active recipes, or change loads elsewhere on the grid, check the actual maximum consumption on the in-game power graph and revise the budget. The listed maximum is an upper-bound planning value; it is not an average draw or energy consumed per item."
      ]
    },
    {
      "heading": "Separate steady generation totals from recipe peak load",
      "paragraphs": [
        "The existing power-generation guide organizes generator capacity, fuel rates, and power used by generation equipment. This article adds a separate consumer-side check: read the min-to-max range for variable-power recipes and ask whether the grid has enough headroom for the peak case."
      ]
    }
  ],
  "references": {
    "heading": "Calculation and source limits",
    "links": [
      {
        "label": "Planner data-version record",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "Variable-power recipes",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "Building power data",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/buildings.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "power-generation-planning",
    "power-grid-recovery"
  ],
  "cta": {
    "kind": "sample",
    "label": "Open a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
