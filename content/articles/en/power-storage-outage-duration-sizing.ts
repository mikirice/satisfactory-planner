import type { HandwrittenArticle } from '../types.ts'

export const powerStorageOutageDurationSizingArticleEn = {
  "slug": "power-storage-outage-duration-sizing",
  "title": "Size Power Storage for an Outage",
  "description": "Estimate Power Storage count and charging conditions from a known constant deficit and outage duration.",
  "publishedDate": "2026-10-19",
  "versionNotice": "The cited references list Power Storage capacity and charge limits, but do not identify a game-data patch. Update 1.2 parity and current-build behavior are unverified.",
  "sections": [
    {
      "heading": "Separate the MW deficit from its duration in MWh",
      "paragraphs": [
        "Knowing the size of a generation shortfall in MW does not tell you how many minutes stored energy will last. The listed Power Storage capacity is 100 MWh per unit, with a maximum charge rate of 100 MW. That is enough energy to cover a 100 MW deficit for one hour. The reference lists the maximum discharge rate as “Unlimited.” The calculation therefore sizes units by MWh for the deficit duration, not by deficit MW. I did not check discharge behavior in the current build. The exact Japanese UI name is also unconfirmed, so this draft uses “Power Storage.”",
        "Calculate required energy by multiplying the deficit by its duration:",
        "required energy (MWh) = deficit (MW) × duration (minutes) ÷ 60",
        "If each Power Storage starts fully charged to 100 MWh, the minimum unit count is required energy ÷ 100, rounded up. This uses the full stored charge and includes no additional reserve for uncertainty or other uses."
      ]
    },
    {
      "heading": "Calculate the units for a target duration",
      "paragraphs": [
        "For example, a 300 MW deficit lasting 20 minutes requires 300 × 20 ÷ 60 = 100 MWh. One fully charged Power Storage matches that calculated energy. If the same 300 MW deficit lasts 30 minutes, the requirement is 150 MWh, so at least two fully charged Power Storages are needed. The additional 50 MWh comes from the second unit.",
        "If the shortfall changes over time, applying the peak value to the entire duration may overestimate demand, while using only the average can miss a brief large deficit. Divide the event into intervals, multiply each interval's deficit by its duration, and add the required MWh. Check actual behavior in game for changing generation, machine startup and shutdown, and the stored charge level."
      ]
    },
    {
      "heading": "Check charging surplus separately from installed capacity",
      "paragraphs": [
        "The maximum charge rate is 100 MW per unit. Installing enough units does not mean they will be fully charged quickly if the grid has little surplus. One empty Power Storage takes one hour to charge at a constant 100 MW surplus. At a constant 50 MW surplus, charging 100 MWh takes two hours. The charging pace is limited by the lower of the unit's charge-rate cap and the surplus actually available from the grid.",
        "Before relying on the reserve, check the stored-charge display and the current surplus. Building the calculated number of units does not guarantee that the required energy has been stored. If you can safely reproduce the anticipated deficit in stages after confirming a full charge, watch the power graph and charge display and refine the estimate. Do not claim a guaranteed runtime based on an untested startup sequence or setup."
      ]
    },
    {
      "heading": "How this differs from generation-capacity guides",
      "paragraphs": [
        "The existing power-generation guide covers generator MW ratings, fuel supply, and electricity used by the generation chain. This article calculates stored energy in MWh to decide how many units can bridge a known deficit duration. It is not a plan to solve a continuous generation shortfall with storage alone."
      ]
    }
  ],
  "references": {
    "heading": "Calculation and source limits",
    "links": [
      {
        "label": "Power Storage reference",
        "href": "https://v1.satisfactory.dev/codex/buildable/Build_PowerStorageMk1_C/"
      },
      {
        "label": "Japanese building data cross-check",
        "href": "https://wikiwiki.jp/sf-jp/%E5%BB%BA%E7%AF%89%E7%89%A9/%E9%9B%BB%E5%8A%9B"
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
