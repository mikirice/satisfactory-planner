import type { HandwrittenArticle } from '../types.ts'

export const fusedModularFrameNitrogenPipelineCapacityArticleEn = {
  "slug": "fused-modular-frame-nitrogen-pipeline-capacity",
  "title": "Size a Nitrogen Line for Fused Modular Frames",
  "description": "Convert the Fused Modular Frame recipe into nitrogen and co-input demand, then compare nominal pipe ratings.",
  "publishedDate": "2026-10-18",
  "versionNotice": "Planner bundled game data is Satisfactory 1.1.x. Its source record says the Docs mirror was retrieved 2026-08-07; the exact 1.1 patch is not established. No Update 1.2 recipe parity or live pipe behavior is asserted.",
  "sections": [
    {
      "heading": "Convert one machine's recipe into per-minute rates",
      "paragraphs": [
        "In the Satisfactory 1.1.x data bundled with the Planner, the Fused Modular Frame recipe makes one item every 40 seconds in a Blender. At 100% operation, that is 1.5 items per minute. Each cycle consumes one Heavy Modular Frame, 50 Aluminum Casings, and 25 units of Nitrogen Gas. Converted to per-minute rates, one Blender needs:",
        "For N machines, Nitrogen Gas demand is 37.5 × N m³/min. Aluminum Casing demand is 75 × N items/min, and Heavy Modular Frame demand is 1.5 × N items/min. These are not live in-game measurements; they convert the bundled recipe into continuous rates at 100% clock."
      ],
      "lists": [
        {
          "ordered": false,
          "items": [
            "Heavy Modular Frame: 1.5 items/min",
            "Aluminum Casing: 75 items/min",
            "Nitrogen Gas: 37.5 m³/min",
            "Fused Modular Frame: 1.5 items/min"
          ]
        }
      ]
    },
    {
      "heading": "Compare demand with nominal pipeline capacity",
      "paragraphs": [
        "The bundled data lists 300 m³/min for Pipeline Mk.1 and 600 m³/min for Pipeline Mk.2. Dividing each value by recipe demand gives these idealized ceilings:",
        "The calculation is pipe capacity ÷ 37.5. If all 16 machines use the nominal 600 m³/min of a Mk.2 line, calculated nitrogen demand is also 600 m³/min, leaving no nominal headroom. Fifteen machines use 562.5 m³/min, leaving 37.5 m³/min in the simple calculation. Eight machines on a Mk.1 line also use its full 300 m³/min.",
        "Do not treat a ceiling-rate machine count as a recommended count. Set a reserve based on actual supply, other consumers on the network, and machine operation. If other consumers share the supply, add their nitrogen demand before comparing it with pipe capacity."
      ],
      "tables": [
        {
          "headers": [
            "Nitrogen supply assumption",
            "Calculated Blender limit",
            "Fused Modular Frame",
            "Aluminum Casing",
            "Heavy Modular Frame"
          ],
          "rows": [
            [
              "Mk.1: 300 m³/min",
              "8 machines",
              "12 items/min",
              "600 items/min",
              "12 items/min"
            ],
            [
              "Mk.2: 600 m³/min",
              "16 machines",
              "24 items/min",
              "1,200 items/min",
              "24 items/min"
            ]
          ]
        }
      ]
    },
    {
      "heading": "Check the other recipe inputs too",
      "paragraphs": [
        "Securing nitrogen alone does not guarantee the planned production rate. For example, the 16-machine ceiling for the Mk.2 calculation also requires 1,200 Aluminum Casings and 24 Heavy Modular Frames per minute. When building the plan, enter each upstream supply as a per-minute rate and check whether shared resources can cover it.",
        "The Planner calculates per-minute inputs, machine equivalents, and item balances from its bundled recipes. It does not simulate finite nitrogen storage or live pipe flow, head lift, splits, or merges. A plan that fits the nominal pipeline rating does not, by itself, show that a real pipe network will deliver the same flow consistently."
      ]
    },
    {
      "heading": "How this differs from existing articles",
      "paragraphs": [
        "The published Aluminum Production and Aluminum Water Loop articles cover Alumina Solution production and water by-product use. This draft does not repeat those processes; it treats finished Aluminum Casing as an input rate for Fused Modular Frame production. Draft 010, “Pipeline Flow and Head Lift Troubleshooting,” isolates general flow problems. This article is a capacity-planning calculation: it works backward from the 1.1.x recipe to estimate a machine count from nitrogen supply and then checks the other input demands."
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
        "label": "Fused Modular Frame recipe",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "Pipeline ratings",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/logistics.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "pipeline-flow-head-lift-troubleshooting",
    "heavy-modular-frame-screw-belt-capacity-guide"
  ],
  "cta": {
    "kind": "sample",
    "label": "Check these rates in a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
