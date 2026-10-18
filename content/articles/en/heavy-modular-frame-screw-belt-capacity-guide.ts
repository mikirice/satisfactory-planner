import type { HandwrittenArticle } from '../types.ts'

export const heavyModularFrameScrewBeltCapacityGuideArticleEn = {
  "slug": "heavy-modular-frame-screw-belt-capacity-guide",
  "title": "Size the Screw Feed for Heavy Modular Frames",
  "description": "Calculate screw demand from Manufacturer count, compare belt ratings, and estimate Constructor supply.",
  "publishedDate": "2026-10-18",
  "versionNotice": "Planner bundled game data is Satisfactory 1.1.x. Its source record says the Docs mirror was retrieved 2026-08-07; the exact 1.1 patch is not established. No Update 1.2 recipe parity or live belt behavior is asserted.",
  "sections": [
    {
      "heading": "Screw demand per Manufacturer",
      "paragraphs": [
        "In the base Heavy Modular Frame recipe in the Planner's bundled Satisfactory 1.1.x data, a Manufacturer makes one item every 30 seconds, or 2 per minute at 100% operation. Each cycle uses 5 Modular Frames, 20 Steel Pipes, 5 Encased Industrial Beams, and 120 Screws. A Manufacturer planned at 100% therefore needs 240 Screws per minute.",
        "For N Manufacturers, screw demand is 240 × N items/min. For example, two machines need 480 Screws per minute and produce 4 Heavy Modular Frames per minute. The other inputs for those two machines are 20 Modular Frames, 80 Steel Pipes, and 20 Encased Industrial Beams per minute."
      ]
    },
    {
      "heading": "Compare demand with conveyor ratings",
      "paragraphs": [
        "Compare the screw demand for two machines with the belt rates in the included 1.1.x data:",
        "If one input belt is meant to feed both machines, the Mk.3 nominal rate is insufficient. A Mk.4 matches calculated demand exactly, leaving no margin for other consumers or variation in supply. A Mk.5 has 300 items/min of nominal capacity to spare. This compares listed belt rates with recipe demand; it is not a test of live flow or blockage behavior.",
        "After choosing the machine count, calculate screw demand with 240 × N. Add demand from any other consumers that share the belt. If multiple item types use the same belt, compare their combined rate with its rating so Screws do not use the full capacity by themselves."
      ],
      "tables": [
        {
          "headers": [
            "Belt",
            "Data rate",
            "Can it carry 480 Screws/min for two machines?"
          ],
          "rows": [
            [
              "Conveyor Belt Mk.3",
              "270 items/min",
              "No; short by 210 items/min"
            ],
            [
              "Conveyor Belt Mk.4",
              "480 items/min",
              "Matches the calculation exactly; no headroom"
            ],
            [
              "Conveyor Belt Mk.5",
              "780 items/min",
              "Has nominal headroom"
            ]
          ]
        }
      ]
    },
    {
      "heading": "Check the equivalent machine count for screw supply",
      "paragraphs": [
        "The base Screw recipe uses 1 Iron Rod to make 4 Screws every 6 seconds in a Constructor. At 100%, that is 40 Screws/min and 10 Iron Rods/min per Constructor. The 480 Screws/min needed by two Heavy Modular Frame Manufacturers equals twelve Constructors running the base recipe at 100%. Those twelve machines consume 120 Iron Rods/min. This whole-machine example assumes no clock adjustment.",
        "The Planner uses per-minute rates to calculate recipes, building equivalents, balances, and transport requirements. It does not reproduce finite stock, a live belt jam, stopped machines, or the exact timing of in-game arrivals and consumption. Confirm stable delivery in the factory even when the planned rate fits the listed belt rating."
      ]
    },
    {
      "heading": "How this differs from existing articles",
      "paragraphs": [
        "The published Motor Production Recipes article covers recipes for Rotors, Stators, and other motor parts. Draft 006, the Space Elevator batch plan, builds per-minute targets for multiple parts from delivery requirements and a deadline. This draft is limited to converting the number of base Heavy Modular Frame Manufacturers into screw demand and selecting a conveyor rating. It does not compare alternate recipes or plan a delivery quantity or completion deadline for Heavy Modular Frames."
      ]
    }
  ],
  "references": {
    "heading": "Recipes, transport ratings, and version scope",
    "links": [
      {
        "label": "Planner data-version record",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "Heavy Modular Frame and Screw recipes",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "Conveyor ratings",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/logistics.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "motor-production-recipes",
    "fused-modular-frame-nitrogen-pipeline-capacity"
  ],
  "cta": {
    "kind": "sample",
    "label": "Check these rates in a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
