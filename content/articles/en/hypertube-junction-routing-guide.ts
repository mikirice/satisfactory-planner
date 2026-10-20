import type { HandwrittenArticle } from '../types.ts'

export const hypertube_junction_routing_guide_enArticle = {
  "slug": "hypertube-junction-routing-guide",
  "title": "Diagnose Route Choice at Hypertube Junctions and Branches",
  "description": "Hypertube Junctions and Hypertube Branches both split tube travel, but their documented behavior is different. Coffee Stain’s Update 1.1 notes say that a Junction lets riders choose a route while approaching, and that a Branch’s resulting branch path is accessible by traveling through the longer segment because of its shape. That wording alone does not establish that the entire Branch is a one-way-only fitting. Test the routes you plan to use in each direction in the current game version.",
  "sections": [
    {
      "heading": "What the documented distinction says",
      "paragraphs": [
        "The basis is Coffee Stain’s official Satisfactory 1.1 release notes. This is a 1.1 description, not a hands-on check of a current 1.2.x client."
      ],
      "illustrations": [
        {
          "src": "/article-images/hypertube-junctions.jpg",
          "alt": "Overhead Satisfactory Update 1.1 screenshot of a Hypertube Junction connected to three tube paths.",
          "caption": "Official Update 1.1 Press Kit screenshot showing a Junction connected to several tube paths. It illustrates the fitting’s layout, not a current-client route prompt or selected route.",
          "creditLinks": [
            {
              "label": "Original screenshot",
              "href": "https://drive.google.com/file/d/18TR518-5BonLmKtsmhJ5mxhWsm3MRjS4/view?usp=drivesdk"
            }
          ]
        }
      ]
    },
    {
      "heading": "Check the control before rebuilding the fitting",
      "paragraphs": [],
      "lists": [
        {
          "ordered": true,
          "items": [
            "Watch for a Junction route-choice hint. As you approach a Junction, check whether the client shows a route-choice prompt. The official 1.1 notes give E as the keyboard example for choosing a route while approaching, but this draft does not treat that key as universal across devices or current versions. Confirm the actual display and timing in the current client. For a Branch, check its shape and the path traveled separately.",
            "Use the hint for the input device you are using. Do not assume a PC key applies to every device. A PS5 player report describes missing or overlooked guidance while riding in the tube. That is an individual report, not a guarantee about the current UI.",
            "Check input settings and test at the choice point. If the displayed input does not respond, check the current Controls settings and connected device. Test the route choice before passing the Junction, one approach at a time. This draft does not claim an exact input window beyond the official phrase “while approaching.”",
            "Then inspect the physical connections. Once the prompt and input have been checked, trace which opening each tube connects to and whether that tube reaches the intended destination.",
            "For a Branch, compare the path with the shape constraint. When trying to reach the resulting branch path, check whether your route travels through the longer segment described in the official notes. If you also need a return route, ride and verify that route separately. The official notes do not say that every Branch layout is one-way-only or establish whether every configuration supports a round trip."
          ]
        }
      ]
    },
    {
      "heading": "Troubleshoot by symptom",
      "paragraphs": [],
      "lists": [
        {
          "ordered": false,
          "items": [
            "A Junction takes you to an unexpected exit: Check the route hint and input first. After checking timing and device settings, inspect each opening and destination. Players and Q&A posts report route-selection problems, but those reports do not establish a persistent current-version bug.",
            "You cannot reach the Branch path: Compare the fitting’s shape and the route you traveled with the documented longer-segment condition. Record which connected path you used instead of calling the whole fitting “one-way.”",
            "You are unsure whether the return works: Do not generalize from a one-way trip. Ride the return route as a separate check. Update 1.1’s official description does not establish round-trip behavior for every Branch layout.",
            "The prompt is missing or input has no effect: Recheck the approach prompt, input device, Controls settings, exact game version, and approach path. Test another approach before concluding that the construction is wrong. Current 1.2.x reproducibility has not been checked for this draft."
          ]
        }
      ]
    }
  ],
  "references": {
    "heading": "Sources and evidence",
    "links": [
      {
        "label": "Coffee Stain Studios, Satisfactory 1.1 Out Now!",
        "href": "https://store.steampowered.com/news/posts/?appids=526870&enddate=1757345783&feed=steam_community_announcements"
      },
      {
        "label": "r/SatisfactoryGame: “How to control hypertube branch direction? PS5”",
        "href": "https://www.reddit.com/r/SatisfactoryGame/comments/1oxrwhv/how_to_control_hypertube_branch_direction_ps5/"
      },
      {
        "label": "Satisfactory Q&A: “Junctions stop letting you change direction”",
        "href": "https://questions.satisfactorygame.com/post/684852136b7c57319638347f"
      },
      {
        "label": "Official Satisfactory Wiki: Hypertube Junction",
        "href": "https://satisfactory.wiki.gg/wiki/Hypertube_Junction"
      }
    ]
  },
  "relatedItemIds": [],
  "publishedDate": "2026-10-18",
  "relatedArticleSlugs": [
    "power-system-capacity-and-recovery",
    "vehicle-paths"
  ],
  "versionNotice": "Planner's bundled data is 1.1.x. The behavior summary follows official stable Update 1.1 sources; route prompts and device-specific controls in the current 1.2.x client were not tested."
} as const satisfies HandwrittenArticle
