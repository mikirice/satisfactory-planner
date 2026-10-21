import type { HandwrittenArticle } from './types.ts'

export const conveyor_throughput_monitor_guideArticle = {
  "slug": "conveyor-throughput-monitor-guide",
  "title": "コンベア・スループット・モニターの読み方と切り分け",
  "description": "設置後は1分待ち、ベルト区間の観測値として読みます。0表示のときは版と条件を記録し、原因を決めつけず順に確認します。",
  "sections": [
    {
      "heading": "設置直後の数値だけで判断しない",
      "paragraphs": [
        "コンベア・スループット・モニターは、ベルトを流れる部品数を画面に表示する、ベルトに取り付ける設備です。Coffee Stain のアップデート1.1ノートでは、最も正確な結果を表示するには1分間分のデータを集める必要があると説明されています。設置してすぐの表示だけで、ベルトの供給量が不足していると判断しないでください。",
        "使うときは、調べたい搬送経路のベルトにモニターを取り付け、対象の部品が流れ始めてから少なくとも1分待ち、その後の表示を読みます。これは公式説明にあるデータ収集条件に基づく目安です。現在の1.2.xで表示の更新間隔や一時的な数値の揺れ方が同じかは、この原稿では実機確認していません。"
      ],
      "illustrations": [
        {
          "src": "/article-images/throughput-display-presskit-1-1.jpg",
          "alt": "Satisfactory公式プレスキットのベルト流量表示例。画面には14、24、195、200/minが表示されている。",
          "caption": "公式プレスキット内の表示例です。数値は画像の場面に属し、本稿の実測値や現行1.2.xの画面ではありません。",
          "creditLinks": [
            {
              "label": "Official Satisfactory Press Kit source",
              "href": "https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view"
            }
          ]
        }
      ]
    },
    {
      "heading": "数値を「計画値」ではなく「通過した量の観測」として使う",
      "paragraphs": [
        "この表示が答えるのは、モニターを置いたベルトを部品がどれだけ通ったかです。工場全体の設計上の生産量や、下流の機械が必要とする量そのものを示すものではありません。生産計画の計算結果と照らすなら、まず比較するベルト区間と部品をそろえ、同じ時間帯の表示を確認してください。",
        "数値が想定より小さいときは、いきなり機械のクロック設定を変えるのではなく、表示までの経路を順に確認します。",
        "これは原因を絞るための確認順です。アップデート1.1の公式ノートが、あらゆる低い表示の原因を列挙しているわけではありません。"
      ],
      "lists": [
        {
          "ordered": true,
          "items": [
            "対象の部品が実際にモニター位置を通っているかを見る。",
            "モニターより上流のベルトや分岐・合流で、流れが止まったり別経路へ分かれたりしていないか確認する。",
            "モニターを設置してから1分以上のデータが集まったか確かめる。",
            "同じ条件で少し時間をおいて再確認し、単発の表示だけで恒常的な不足と決めつけない。"
          ]
        }
      ]
    },
    {
      "heading": "0表示や表示消失は、条件とゲーム版を記録する",
      "paragraphs": [
        "アップデート1.1実験版 v1.1.0.4 の修正記録には、特定の状況でモニターを遠くへ移動した後、または監視中のベルトに分岐器／合流器を使った後に「0個/分」と表示される問題が含まれています。また、特定の状況でセーブ後に読み込むとモニターが消える問題と、ベルトをアップグレード／ダウングレードした際にモニターが取り外され、返却される変更も記録されています。",
        "これは1.1実験版 v1.1.0.4に記載された修正・変更です。実験版の記録であり、安定版1.1に同じ修正がそのまま入ったことや、現在の全バージョンで同じ問題が起きることを示すものではありません。もし現在の環境で0表示や消失を見たら、ゲーム版、設置場所を動かしたか、監視区間に分岐・合流を追加したか、ベルトを変更したか、セーブ／ロードを挟んだかを控えてください。原因を決めつける前に、1分以上データを集め直し、必要ならモニターを再設置して表示を確認します。これらは切り分けの手順であり、1.2.xでの再現や解消を確認したものではありません。"
      ]
    },
    {
      "heading": "Plannerの生産計算と混同しない",
      "paragraphs": [
        "Satisfactory Plannerの計算値は、選んだ設備・レシピ・稼働率などに基づく計画です。ゲーム内ベルトに流れた量を測定した結果ではありません。計画値とモニター表示が違う場合は、計画の前提、対象部品、観測したベルト区間、データを待った時間をそれぞれ照合してください。モニターの数値だけで生産計画の設定が正しい／誤りと結論づけることはできません。"
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
        "label": "Coffee Stain Studios — Update 1.1実験版 v1.1.0.4",
        "href": "https://steamcommunity.com/games/526870/announcements/detail/520838945346422709"
      },
      {
        "label": "Coffee Stain Studios — Update 1.2.4.1 (Build 513885, 2026-10-12)",
        "href": "https://store.steampowered.com/news/app/526870/view/670630562731396159?l=english"
      },
      {
        "label": "Official Satisfactory Press Kit — Throughput display.png",
        "href": "https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view"
      },
      {
        "label": "Official Satisfactory Press Kit — Lift Splitters Mergers.png",
        "href": "https://drive.google.com/file/d/172p9je6hfBFH_cYsuM2vgN-UlH8CnZ2c/view"
      }
    ]
  },
  "relatedItemIds": [],
  "publishedDate": "2026-10-18",
  "relatedArticleSlugs": [
    "production-planning-tutorial",
    "production-planning-tutorial"
  ],
  "versionNotice": "Plannerの収録データは1.1.xです。機能の説明は安定版アップデート1.1の公式資料に基づきます。現行1.2.xでの表示更新や細部の挙動は実機確認していません。"
} as const satisfies HandwrittenArticle
