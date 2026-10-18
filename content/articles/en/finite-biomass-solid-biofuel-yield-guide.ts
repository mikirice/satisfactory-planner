import type { HandwrittenArticle } from '../types.ts'

export const finiteBiomassSolidBiofuelYieldGuideArticleEn = {
  "slug": "finite-biomass-solid-biofuel-yield-guide",
  "title": "Calculate Solid Biofuel from Finite Biomass",
  "description": "Calculate fuel yield from finite Biomass stock and ideal processing time by machine count.",
  "publishedDate": "2026-10-18",
  "versionNotice": "Recipe values use the Planner bundled Satisfactory 1.1.x data. No Update 1.2 recipe or current UI claim is made.",
  "sections": [
    {
      "heading": "Count whole recipe cycles first",
      "paragraphs": [
        "In the Satisfactory 1.1.x data bundled with the Planner, the Constructor recipe “Solid Biofuel” processes 8 Biomass into 4 Solid Biofuel in 4 seconds. For a finite stock of B Biomass, the number of complete cycles is:",
        "complete cycles = floor(B ÷ 8)",
        "Solid Biofuel produced = complete cycles × 4",
        "Biomass left over = B − complete cycles × 8",
        "For example, 3,008 Biomass supports 376 complete cycles. That produces 1,504 Solid Biofuel with none left over. With 3,009 Biomass, there are still 376 complete cycles and 1,504 Solid Biofuel, with 1 Biomass left. Do not count a partial batch as another recipe cycle."
      ]
    },
    {
      "heading": "Estimate ideal processing time from machine count",
      "paragraphs": [
        "One cycle takes 4 seconds. For one machine at 100% clock, the ideal processing time is:",
        "processing time on one machine = complete cycles × 4 seconds",
        "For 376 cycles, that is 1,504 seconds, or 25 minutes 4 seconds. If two machines at 100% clock split the 376 cycles evenly, with 188 cycles each, the total completion time is 752 seconds, or 12 minutes 32 seconds. With three machines, split the work into 126, 125, and 125 cycles. The machine assigned 126 cycles takes 504 seconds (8 minutes 24 seconds), so the ideal total completion time is also 504 seconds.",
        "Keep quantity and time separate. In this simple parallel calculation, more machines shorten processing time, but they do not change the number of complete cycles or total fuel obtainable from the finite Biomass stock. All examples assume Constructors at 100% clock. They exclude power interruptions, transport, manual input and collection, and actual in-game start timing.",
        "For a plan using a different clock, read the machine's processing time and production rate for that setting. The examples here do not model clock changes or claim exact elapsed-time behavior across different clocks."
      ]
    },
    {
      "heading": "This is a different question from the Space Elevator batch plan",
      "paragraphs": [
        "Existing draft 006 uses Space Elevator requirements and a deadline to plan per-minute rates for multiple items. This article calculates how many cycles one recipe can run from a finite amount of Biomass and how ideal processing time changes with machine count. It does not cover delivery targets or Space Elevator quantities and rules.",
        "The Planner solver finds a continuous production plan from per-minute targets. It does not consume finite warehouse inventory as discrete recipe cycles or predict an in-game completion time. The finite-count and time arithmetic here is a separate calculation based on the bundled recipe data."
      ]
    },
    {
      "heading": "Check before using the calculation",
      "paragraphs": [],
      "lists": [
        {
          "ordered": false,
          "items": [
            "Set B to the Biomass actually available for this recipe. If it is not divisible by 8, the remainder cannot be processed by this recipe.",
            "The output is the quantity after completed cycles. It does not account for a machine in the middle of a cycle or competition with other consumers.",
            "Time examples are ideal values assuming continuous operation at 100% clock. Stops or missing input make actual elapsed time longer.",
            "If using a different game version, verify the ingredient count, output count, and duration against the primary data for that version."
          ]
        }
      ]
    }
  ],
  "references": {
    "heading": "Recipe and calculation scope",
    "links": [
      {
        "label": "Planner data-version record",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "Solid Biofuel recipe",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "Planner rate input",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/solver/index.ts"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "space-elevator-project-assembly-batch-planning-guide"
  ],
  "cta": {
    "kind": "sample",
    "label": "Check these rates in a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
