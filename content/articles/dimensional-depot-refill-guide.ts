import type { HandwrittenArticle } from './types.ts'

export const dimensional_depot_refill_guideArticle = {
  "slug": "dimensional-depot-refill-guide",
  "title": "次元デポ の補充停止を切り分ける",
  "description": "次元デポへの補充が止まったように見えても、Uploaderが原因とは限りません。まずDepot側の保管上限、Uploaderへ入る直前の在庫、コンベアの接続と流れ、さらに上流の生産を順番に確認します。この手順は原因を切り分けるための診断ガイドです。混載ベルトが必ず詰まると断定したり、現行クライアントで数値を実測したりするものではありません。",
  "sections": [
    {
      "heading": "1. Depot側に空きがあるか確認する",
      "paragraphs": [
        "対象アイテムのDepot在庫が上限に達しているなら、追加できない状態と整合します。ゲーム内表示を確認し、満杯なら在庫を使って空きを作ります。容量を増やせるかは、現行の研究項目と表示を見て判断します。本稿では上限値を示しません。Wikiの記載値を現行ゲームで確認していないためです。",
        "在庫が上限未満なのに補充されないなら、次にUploader側と搬送を調べます。Depotの表示だけでは、上流の生産不足やベルト停止を区別できません。"
      ]
    },
    {
      "heading": "2. Uploader直前の在庫を見る",
      "paragraphs": [
        "Uploaderへ供給しているコンテナやベルトに、対象アイテムが残っているかを確認します。"
      ],
      "lists": [
        {
          "ordered": false,
          "items": [
            "対象アイテムが残っていない場合は、Uploaderの速度を原因と決めつけず、生産設備、分岐、コンテナまでの搬送を上流へたどります。",
            "在庫がある場合は、コンベアの接続と稼働状態、対象アイテムのDepot上限を再確認します。どちらにも問題が見当たらないときに、アップロード速度やUploaderの処理状況を候補として調べます。",
            "別のアイテムもベルトやコンテナに流れている場合は、そのアイテムが満杯か、投入位置より前で流れを止めているかを観察します。Wikiの検索結果にはUploaderの入力・バッファ情報が示され、プレイヤー投稿には、満杯のアイテムが混載ラインを止めたという報告があります。今回参照できたのは検索結果の断片と投稿の存在だけです。現行ビルドで混載時の挙動を再現した記録はありません。混載を原因と決めつけず、対象アイテムだけを一時的に流して挙動が変わるかを確認します。"
          ]
        }
      ]
    },
    {
      "heading": "3. 搬送経路を端から端まで確認する",
      "paragraphs": [
        "対象アイテムが供給元にあるのにUploaderへ届かない場合は、ベルトがUploaderの入力につながっているか、途中で停止・分岐・取り違えがないかを確認します。混載ラインでは、対象アイテムがUploader側へ実際に流れているかも確かめます。別のアイテムが同じ経路にあるだけでは、詰まりの原因とは言えません。",
        "原因を切り分ける間は、対象アイテムだけを短時間流すか、既存のラインを壊さない範囲で一時的に別経路へ分けます。Depotが補充されれば、混載経路が関係している可能性は高まります。ただし、1回の確認だけではゲーム全体の仕様は確認できません。観察したゲーム版、条件、結果を記録します。"
      ]
    },
    {
      "heading": "4. 上流の生産と行き先を確認する",
      "paragraphs": [
        "Uploader直前の在庫が空なら、対象アイテムを生産設備が作っているか、分岐先へ必要量が届いているか、別の消費先にすべて流れていないかを確認します。Uploaderの手前に置いたコンテナは、一時的な受け皿になります。Depotが満杯のまま供給が続けば、有限のコンテナも埋まり、詰まりが上流へ広がることがあります。",
        "工場への供給を保ちたい場合は、Depot用に分岐する量と工場側の需要を確認します。コンテナを置くだけで工場の供給が途切れないとは限りません。余剰の行き先や停止時の挙動は、実際の分岐・優先設定をゲーム内で確認してから設計してください。"
      ]
    },
    {
      "heading": "判断の早見表",
      "paragraphs": [
        "この表は現場での確認順を示します。正確な速度・容量、内部バッファ量、混載時の待ち行列挙動を保証する仕様表ではありません。"
      ]
    }
  ],
  "references": {
    "heading": "参照資料",
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
        "label": "JEU.VIDEO: “Satisfactory Dimensional Depot: unlock cloud storage without stalling your factory”",
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
  "versionNotice": "Plannerの収録データは1.1.xです。現行1.2.xの次元デポ補給挙動とUIは実機確認していません。記事の手順は自分のゲーム画面で照合してください。"
} as const satisfies HandwrittenArticle
