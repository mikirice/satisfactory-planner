import type { HandwrittenArticle } from './types.ts'

export const priority_merger_use_cases_guideArticle = {
  "slug": "priority-merger-use-cases-guide",
  "title": "優先マージャーの優先順位が役立つ場面",
  "description": "優先マージャーは稼働中の入力の出力順を指定します。優先度は固定比率や一方の入力が枯渇するまでの完全遮断を保証しません。",
  "sections": [
    {
      "heading": "優先マージャーが決めるのは、入力の出力順",
      "paragraphs": [
        "優先マージャーは、複数のベルト入力をまとめ、入力ごとに優先度を設定できるMergerです。Coffee Stainの安定版アップデート1.1資料によると、優先度は3段階で、稼働中の入力のうち優先度が高い入力から出力します。同じ優先度の入力が2つある場合は、出力が交互になります。",
        "ここでいう優先順位は、入力の出力順を指定するものです。高い優先度の入力が枯渇するまで他の入力を完全に遮断することや、2つの入力を特定の割合で混ぜることまでは、公式資料から確認できません。入力に優先度を付けるときは、まず「出力が競合する場面で、どちらの入力を先に出したいか」を考えます。"
      ],
      "illustrations": [
        {
          "src": "/article-images/priority-merger-settings-presskit-1-1.jpg",
          "alt": "Satisfactory 1.1 プレスキットの優先マージャー設定画面。左入力は「低」、中央・右入力は「高」の設定です。",
          "caption": "左入力が優先度「低」、中央・右入力が「高」の優先マージャー設定を示すSatisfactory公式アップデート1.1のプレスキット画像です。画面表示の参考であり、鉄鉱石の例の流れや現行1.2.xの画面を示すものではありません。",
          "creditLinks": [
            {
              "label": "元画像",
              "href": "https://drive.google.com/file/d/1mle940oY6jkYeVbz-vynIvma6mLEd0Wy/view"
            }
          ]
        }
      ]
    },
    {
      "heading": "例：補給ベルトがある鉄鉱石の供給ライン",
      "paragraphs": [
        "たとえば、鉄鉱石を必要とする製錬ラインに、工場内の供給と別の場所から届く補給を送る場面を考えます。2つの入力が同時に稼働し、その合計流量が共通の出力ベルトの容量を超えるなら、出力側で入力が競合します。この条件で、どちらの稼働中入力を先に出力したいかが設計上の判断になります。優先したい供給源を高い段階に設定し、もう一方を補助入力として設定する方法を検討できます。",
        "この例では両方の入力が鉄鉱石です。これは供給元の優先順位を説明するための例の条件であり、優先マージャーが同一アイテムだけを受け付けるという一般仕様を意味しません。異なるアイテムを扱う場合は、下流の設備が必要なアイテムを受け取れるようにラインを設計してください。",
        "優先度が決めるのは出力の優先順です。供給源Aを必ず先に使い切ってから供給源Bへ切り替える、あるいは一定量ずつ混ぜる、といった結果をこの例から保証することはできません。実際の流れは、各入力の供給、下流の受け入れ、出力ベルトの容量、詰まりなどに左右されます。この例はゲーム内で測定したレイアウトではありません。"
      ]
    },
    {
      "heading": "設定前後に確認すること",
      "paragraphs": [
        "入力順に意味がないなら、通常のMergerで足りる場合があります。優先マージャーを使う理由は、複数入力の出力順を制御したいことです。必要量の割合を整える道具としてではなく、優先順位を付けたい場面で検討してください。"
      ],
      "lists": [
        {
          "ordered": true,
          "items": [
            "優先順位を付けたい入力を特定し、出力側でどの入力を先に通したいか決める。",
            "公式資料で確認できるのは3段階の優先度と、同順位入力の交互出力です。正確な現在の日本語UI名は未確認なので、ゲーム内表示を確認する。",
            "出力ベルトが必要な流量を運べるか、下流設備が必要なアイテムを受け取れるかを別々に確認する。優先度はベルト容量を増やさない。",
            "条件を記録して入力と出力を観察する。確認していない挙動を、優先度だけで保証される仕様として扱わない。"
          ]
        }
      ]
    },
    {
      "heading": "Plannerの計算との違い",
      "paragraphs": [
        "生産計画で各供給元の予定量や下流の必要量を照合することはできます。しかし、計画上に優先マージャーを置いただけでは、ゲーム内の入力競合や出力順を測定したことにはなりません。計画では必要量とベルト容量を確認し、ゲーム内の結果は実際の入力・出力を観察して確かめてください。"
      ]
    }
  ],
  "references": {
    "heading": "参照資料",
    "links": [
      {
        "label": "Coffee Stain Studios — Satisfactory 1.1 Out now! (stable release notes)",
        "href": "https://store.steampowered.com/news/posts/?appids=526870&enddate=1757345783&feed=steam_community_announcements"
      },
      {
        "label": "Official Satisfactory Press Kit — Priority Merger.jpg",
        "href": "https://drive.google.com/file/d/1mle940oY6jkYeVbz-vynIvma6mLEd0Wy/view"
      },
      {
        "label": "Official Satisfactory Press & Content Creators page",
        "href": "https://www.satisfactorygame.com/press/"
      }
    ]
  },
  "relatedItemIds": [],
  "publishedDate": "2026-10-18",
  "relatedArticleSlugs": [
    "production-planning-tutorial",
    "build-checklist-guide"
  ],
  "versionNotice": "Plannerの収録データは1.1.xです。機能の説明は安定版アップデート1.1の公式資料に基づきます。現行1.2.xでの挙動と日本語UI名は実機確認していません。"
} as const satisfies HandwrittenArticle
