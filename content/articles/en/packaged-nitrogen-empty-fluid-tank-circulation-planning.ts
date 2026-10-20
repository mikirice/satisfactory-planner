import type { HandwrittenArticle } from '../types.ts'

export const packagedNitrogenEmptyFluidTankCirculationPlanningArticleEn = {
  "slug": "packaged-nitrogen-empty-fluid-tank-circulation-planning",
  "title": "Plan the Empty Fluid Tank Pool for Packaged Nitrogen",
  "description": "Estimate the circulating Empty Fluid Tank count from the full packaging, transport, unpackaging, and return time.",
  "publishedDate": "2026-10-19",
  "versionNotice": "Recipes and item names use the Planner’s bundled Satisfactory 1.1.x data. Update 1.2 parity and current UI labels are unverified.",
  "sections": [
    {
      "heading": "Check the container used by both recipes",
      "paragraphs": [
        "In the Planner's bundled Satisfactory 1.1.x data, the base Packaged Nitrogen Gas recipe uses 4 m³ of Nitrogen Gas and 1 Empty Fluid Tank every second to make 1 packaged item. The base Unpackage Nitrogen Gas recipe returns 4 m³ of Nitrogen Gas and 1 Empty Fluid Tank from 1 packaged item each second. The English item name follows the data; the current Japanese UI label has not been verified.",
        "At 100% continuous operation, each Packager processes 60 items per minute. Packaging uses 240 m³ of Nitrogen Gas per minute and unpackaging returns 240 m³ per minute. Each packaging cycle uses one tank and each unpackaging cycle returns one, so the recipe balance has zero net tank demand in a loop with no loss or diversion. These are per-minute calculations from the 1.1.x data, not a test of the current build or a transport route."
      ]
    },
    {
      "heading": "Measure the full time from tank use to tank return",
      "paragraphs": [
        "Let T be the complete time in minutes from when the packaging recipe starts using an Empty Fluid Tank for one packaged item until that tank has been unpackaged, returned, and is ready for another packaging cycle. Include the 1-second packaging cycle, transport of the packaged item, unpackaging, and the empty tank's return. Let R be the packaged-item rate in items per minute. The minimum whole-number tank pool is ceil(R × T).",
        "For example, if the complete interval from packaging start to reuse is 4 minutes at a packaging rate of 60 items per minute, the ideal minimum is ceil(60 × 4) = 240 tanks. Four minutes is illustrative, not a default route time or measured result. If timing from when the packaged item leaves the Packager, add the 1-second packaging cycle (1/60 minute) before calculating. If the route alone takes 4 minutes in this example, use ceil(60 × (4 + 1/60)) = 241 tanks."
      ]
    },
    {
      "heading": "Plan startup stock and sustained rates separately",
      "paragraphs": [
        "At startup, provide at least the calculated circulation pool of Empty Fluid Tanks at the packaging end, plus any endpoint stock or interruption reserve you want. The first tank takes a full T to return. The minimum formula contains no extra reserve for delays or interruptions.",
        "To sustain R items per minute, packaging, packaged-item transport, unpackaging, and empty-tank return must each handle at least R per minute. Nitrogen Gas supply must also provide at least 4R m³ per minute. At R = 60, that is 240 m³ per minute. A larger circulating pool cannot sustain the planned rate if any process stage is slower or Nitrogen Gas is insufficient.",
        "Continuing losses or diversion leave fewer tanks to return than the packaging process uses. A one-time startup reserve only delays depletion; it cannot sustain a long-running loop with ongoing losses. Replace continuing losses or reduce the packaging rate. Check actual machine operation, transport speed, blocked buffers, and waits in game."
      ]
    },
    {
      "heading": "How this differs from existing articles",
      "paragraphs": [
        "The published Packaged Diluted Fuel loop guide covers recipe balance, 120 containers per minute, and a four-container startup example. This draft measures a container's full turnaround and uses that interval with the packaging rate to calculate a whole-item circulation pool. It answers a different question from draft 019's direct-pipe nitrogen flow calculation and the Fluid Truck transport-capacity guide."
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
        "label": "Packaged Nitrogen recipes",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "packaged-nitrogen-empty-fluid-tank-circulation-planning",
    "resource-throughput-capacity-guide"
  ],
  "cta": {
    "kind": "sample",
    "label": "Open a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
