import type { HandwrittenArticle } from '../types.ts'

export const trainReplenishmentBufferPlanningGuideArticleEn = {
  "slug": "train-replenishment-buffer-planning-guide",
  "title": "Plan Train Replenishment and Receiver Buffers",
  "description": "Compare measured train deliveries with factory demand and estimate stock for the gap between arrivals.",
  "publishedDate": "2026-10-18",
  "versionNotice": "The Planner rates use Satisfactory 1.1.x data. No claim about current train behavior or Update 1.2 behavior is made.",
  "sections": [
    {
      "heading": "Measure at the receiving end first",
      "paragraphs": [
        "This plan does not assume a fixed nominal train capacity. For the item you care about, record the quantity Q actually received and the interval T between consecutive receipt times. If cargo is mixed, count only the target item. Use observed arrival intervals, not an ideal timetable interval. If arrivals vary, record long gaps separately from the average.",
        "Use the Planner production plan to find the item rate D the downstream factory needs, in items per minute. The Planner data is based on Satisfactory 1.1.x. This is a planned production rate; it is not a simulation of train arrivals or unloading."
      ]
    },
    {
      "heading": "Check whether average deliveries meet demand",
      "paragraphs": [
        "Convert the receipt interval to minutes and calculate the average delivered rate:",
        "average delivered rate = Q ÷ T",
        "The minimum condition for maintaining stock over time is:",
        "Q ÷ T ≥ D",
        "For example, if you measure 720 items received every 4 minutes and the Planner-estimated demand is 150 items per minute, average deliveries are 180 items per minute. That is 30 items per minute above demand on average. The 720 items and 4 minutes are hypothetical example measurements; they do not describe fixed train or freight-car specifications.",
        "If you instead receive 600 items every 4 minutes and use 150 items per minute, average supply only matches demand, leaving no margin. If demand is 180 per minute, stock falls by 120 items after each 4-minute delivery cycle. A larger buffer cannot fix a persistent average shortage. Increase planned deliveries or reduce the consumption rate first.",
        "Meeting the average condition alone does not guarantee continuous factory operation. If arrival gaps vary, you also need stock to cover the longer gaps."
      ]
    },
    {
      "heading": "Estimate stock to cover the gap between deliveries",
      "paragraphs": [
        "The quantity consumed between deliveries is:",
        "consumption during the gap = D × T",
        "At a demand of 150 items per minute and a 4-minute gap, the factory consumes 600 items. A receiving buffer of 600 items immediately after a delivery would cover a delay-free 4-minute interval in this calculation. Choose the actual buffer with extra reserve based on observed long gaps and downtime variation. Base the reserve on measurements from the route. This formula estimates inventory for an assumed gap; it does not predict in-game train behavior or delays."
      ]
    },
    {
      "heading": "Recheck actual stock after planning",
      "paragraphs": [
        "1. Record actual delivered quantities and arrival intervals at the receiving end. 2. Get demand rate D from the Planner production plan and compare it with average delivered supply. 3. Calculate D × T for a long observed gap and check whether receiving stock can cover consumption. 4. Observe stock over several delivery cycles. If it keeps falling, revisit the supply-demand gap rather than relying on a larger buffer alone.",
        "The Planner calculates item rates and production balances. It does not calculate measured train deliveries, route delays, station unloading, or when a receiving buffer will run empty. This draft makes no claim about current vehicle or station behavior."
      ]
    },
    {
      "heading": "How this differs from existing topics",
      "paragraphs": [
        "The prepared Train Signals article covers track signals, shared tracks, and deadlocks. Draft 009, “Freight Platform Loading Diagnosis,” investigates vehicle-to-platform alignment and unloading symptoms. This article covers neither setup nor fault diagnosis: it is limited to comparing measured receiving-side deliveries with factory demand and estimating a stock reserve."
      ]
    }
  ],
  "references": {
    "heading": "Calculation basis and Planner scope",
    "links": [
      {
        "label": "Planner data-version record",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "Planner rate input",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/solver/index.ts"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "train-signals-guide",
    "freight-platform-loading-diagnosis"
  ],
  "cta": {
    "kind": "sample",
    "label": "Check these rates in a production plan",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
