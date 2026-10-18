import type { HandwrittenArticle } from '../types.ts'

export const sharedQuickwireAllocationArticleEn = {
  "slug": "shared-quickwire-allocation-ai-limiters-high-speed-connectors",
  "title": "Allocate Shared Quickwire Between AI Limiters and High-Speed Connectors",
  "description": "Estimate how much of a shared Quickwire supply each production line can use.",
  "publishedDate": "2026-10-18",
  "versionNotice": "Planner bundled game data is Satisfactory 1.1.x; exact patch and Update 1.2 recipe parity are not established. All examples are continuous-rate arithmetic, not live belt or machine tests.",
  "sections": [
    {
      "heading": "Establish the available Quickwire supply",
      "paragraphs": [
        "In the base recipes in the Planner's bundled Satisfactory 1.1.x data, one Constructor makes 5 Quickwire every 5 seconds from 1 Caterium Ingot. At 100% operation, that is 60 Quickwire per minute. In this example, six Constructors at 100% provide 360 per minute to be divided between two production lines.",
        "This is a per-minute conversion of recipe cycles. It does not verify that six machines produce in sync in game or that a conveyor actually delivers 360 items per minute."
      ]
    },
    {
      "heading": "Check whether both lines fit at 100%",
      "paragraphs": [
        "The base AI Limiter recipe uses 5 Copper Sheets and 20 Quickwire every 12 seconds in an Assembler to make 1 AI Limiter. At 100%, one machine makes 5 AI Limiters and uses 100 Quickwire per minute. Two machines are planned to make 10 AI Limiters per minute and use 200 Quickwire per minute.",
        "The base High-Speed Connector recipe uses 56 Quickwire, 10 Cable, and 1 Circuit Board every 16 seconds in a Manufacturer to make 1 High-Speed Connector. At 100%, it makes 3.75 per minute and needs 210 Quickwire per minute.",
        "Running two AI Limiter Assemblers and one High-Speed Connector Manufacturer all at 100% therefore requires 410 Quickwire per minute. The example supply is 360 per minute, a shortfall of 50. The plan cannot run all three machines at 100% from that supply alone."
      ]
    },
    {
      "heading": "Choose a priority and allocate what remains",
      "paragraphs": [
        "If the two AI Limiter Assemblers stay at 100%, they use 200 of the 360 Quickwire per minute, leaving 160. High-Speed Connectors use 56 each, so the remaining supply supports a calculated maximum of about 2.86 per minute (160 ÷ 56). That is below the 3.75 per minute from one base-recipe Manufacturer at 100%. In continuous-rate terms, reduce its clock or add another supply source.",
        "If High-Speed Connectors stay at 3.75 per minute, allocate 210 Quickwire per minute to that line first. The remaining 150 supports 7.5 AI Limiters per minute (150 ÷ 20), below the 10 per minute planned for two Assemblers at 100%. Reduce the other machines' clocks or increase supply.",
        "To choose an allocation, add the input needs of both lines and compare them with supply. Let S be shared supply in items per minute, A the planned AI Limiters per minute, and H the planned High-Speed Connectors per minute. The base recipes require 20A + 56H Quickwire per minute. Any allocation that satisfies 20A + 56H ≤ S fits the recipe input calculation. This continuous-rate equation helps set priorities; it does not guarantee stable in-game output at those rates."
      ]
    },
    {
      "heading": "How this differs from existing articles",
      "paragraphs": [
        "Existing belt-rating guides and draft 020 estimate transport capacity for a chosen item and production plan. This article focuses on deciding how much of one shared Quickwire supply to allocate to AI Limiters versus High-Speed Connectors. It does not cover motor or Space Elevator delivery planning, alternate-recipe comparisons, or belt selection."
      ]
    }
  ],
  "references": {
    "heading": "Recipe basis and version limits",
    "links": [
      {
        "label": "Planner data-version record",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "Base recipes: Quickwire, AI Limiter, and High-Speed Connector",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "heavy-modular-frame-screw-belt-capacity-guide",
    "priority-merger-use-cases-guide"
  ],
  "cta": {
    "kind": "sample",
    "label": "Check the item rates in a plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
