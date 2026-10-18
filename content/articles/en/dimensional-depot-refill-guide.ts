import type { HandwrittenArticle } from '../types.ts'

export const dimensional_depot_refill_guide_enArticle = {
  "slug": "dimensional-depot-refill-guide",
  "title": "Diagnose a Dimensional Depot Refill That Has Stopped",
  "description": "A refill that appears to have stopped does not automatically point to the Uploader. Check the item’s Depot quota, stock immediately before the Uploader, conveyor connection and flow, and upstream production in that order. This is a troubleshooting method for separating possible causes. It does not claim that mixed belts always jam or report measurements from a current client build.",
  "sections": [
    {
      "heading": "1. Check whether the Depot has room",
      "paragraphs": [
        "If the target item is at its Depot limit, that is consistent with the item no longer being accepted. Check the item’s in-game display first. If it is full, make room by using some stock, or consider capacity options after checking the current in-game research and UI. This draft does not give an exact limit because the Wiki figures have not been verified in the current game.",
        "If the item is below its limit, inspect the Uploader and feed next. The Depot display alone cannot distinguish a production shortage from a stopped conveyor."
      ]
    },
    {
      "heading": "2. Look immediately before the Uploader",
      "paragraphs": [
        "Check whether the container or belt feeding the Uploader still has the target item."
      ],
      "lists": [
        {
          "ordered": false,
          "items": [
            "No stock there: Do not assume Uploader speed is the cause. Trace production, splits, and delivery to the container upstream.",
            "Stock is available: Recheck the conveyor connection and flow, then the target item’s Depot limit. If neither explains the problem, consider upload speed or the Uploader’s processing as possibilities to investigate.",
            "Other items share the belt or container: Observe whether one is full or is stopping the flow before the target item reaches the Uploader. The community Wiki contains information about Uploader input and buffering, and a player post describes a full item holding up a mixed line. However, the material available for this revision was a search-result snippet and the existence of that post; it was not a reproduced test in the current build. Do not treat a mixed feed as the confirmed cause. As a diagnostic test, temporarily feed only the target item and see whether the behavior changes."
          ]
        }
      ]
    },
    {
      "heading": "3. Check the conveyor path end to end",
      "paragraphs": [
        "If the item exists at its source but does not reach the Uploader, confirm that the belt connects to the Uploader input and that it is not stopped, diverted, or carrying a different item at the relevant point. For a mixed line, observe whether the target item actually reaches the Uploader. The mere presence of another item on the route does not prove that it caused the stoppage.",
        "While isolating the cause, briefly feed only the target item or divert it temporarily, without dismantling the existing line. If the Depot refills, that makes the mixed route a more likely factor, but one observation does not establish universal game behavior. Record the game version, conditions, and result."
      ]
    },
    {
      "heading": "4. Check upstream production and destinations",
      "paragraphs": [
        "If there is no stock immediately before the Uploader, check whether the machines produce the target item, whether the split sends enough to the feed, and whether another destination consumes the output. A container before the Uploader buys temporary room. If the Depot stays full while supply continues, a finite container can also fill and pass the backup farther upstream.",
        "If factory supply must continue, account for both the Depot branch and factory demand. A container alone does not guarantee uninterrupted factory supply. Verify the actual split, priority settings, and behavior when the Depot is full before relying on a surplus route."
      ]
    },
    {
      "heading": "Quick decision table",
      "paragraphs": [
        "This table is a field-check order. It is not a specification for exact rates, capacity, internal buffer size, or mixed-item queue behavior."
      ]
    }
  ],
  "references": {
    "heading": "Sources and evidence",
    "links": [
      {
        "label": "Coffee Stain Studios, Satisfactory 1.0 Launch",
        "href": "https://coffeestain.com/news/satisfactory-1-0-launch/"
      },
      {
        "label": "Official Satisfactory Wiki: Dimensional Depot Uploader",
        "href": "https://satisfactory.wiki.gg/wiki/Dimensional_Depot_Uploader"
      },
      {
        "label": "r/SatisfactoryGame: “Use of the Dimensional Depot”",
        "href": "https://www.reddit.com/r/SatisfactoryGame/comments/1flhwvp/use_of_the_dimensional_depot/"
      },
      {
        "label": "JEU.VIDEO, “Satisfactory Dimensional Depot: unlock cloud storage without stalling your factory”",
        "href": "https://jeu.video/en/guide/satisfactory-dimensional-depot-en"
      }
    ]
  },
  "relatedItemIds": [],
  "publishedDate": "2026-10-18",
  "relatedArticleSlugs": [
    "production-planning-tutorial",
    "build-checklist-guide"
  ],
  "versionNotice": "Planner's bundled data is 1.1.x. Dimensional Depot refill behavior and UI in the current 1.2.x client were not tested; check each step against your game."
} as const satisfies HandwrittenArticle
