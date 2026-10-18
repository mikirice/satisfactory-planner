import type { HandwrittenArticle } from './types.ts'

export const fusedModularFrameNitrogenPipelineCapacityArticle = {
  "slug": "fused-modular-frame-nitrogen-pipeline-capacity",
  "title": "窒素ガス供給量から溶融モジュラー・フレームの設備数を決める",
  "description": "溶融モジュラー・フレームのレシピから窒素需要と共投入量を計算し、パイプ公称容量と比べます。",
  "publishedDate": "2026-10-18",
  "versionNotice": "Plannerの同梱ゲームデータはSatisfactory 1.1.xです。参照記録は2026-08-07取得、正確な1.1パッチは特定されていません。アップデート1.2とのレシピ一致や実パイプ流量は主張しません。",
  "sections": [
    {
      "heading": "1台あたりの材料レートを出す",
      "paragraphs": [
        "Plannerに同梱されたSatisfactory 1.1.x データの溶融モジュラー・フレームレシピは、混合機で40秒ごとに1個を作ります。1台を100%稼働させた場合、毎分1.5個です。1サイクルあたりに必要なヘビー・モジュラー・フレームは1個、アルミ筐体は50個、窒素ガスは25 m³です。毎分の投入レートに直すと、混合機1台あたり次の量になります。",
        "設備台数を N としたときの必要量は、窒素ガスが 37.5 × N m³/分、アルミ筐体が 75 × N 個/分、ヘビー・モジュラー・フレームが 1.5 × N 個/分 です。各レートは同梱レシピから100%クロックの連続値に換算したもので、ゲーム内の実測値ではありません。"
      ],
      "lists": [
        {
          "ordered": false,
          "items": [
            "ヘビー・モジュラー・フレーム: 1.5個/分",
            "アルミ筐体: 75個/分",
            "窒素ガス: 37.5 m³/分",
            "溶融モジュラー・フレーム: 1.5個/分"
          ]
        }
      ]
    },
    {
      "heading": "パイプの公称容量と照らし合わせる",
      "paragraphs": [
        "同梱データのパイプライン Mk.1は300 m³/分、パイプライン Mk.2は600 m³/分です。レシピ需要をそれぞれの値で割ると、理想的な上限は次のようになります。",
        "計算は pipe capacity ÷ 37.5 です。Mk.2の600 m³/分を16台がすべて使うと、窒素ガスの計算需要も600 m³/分になります。公称容量に余裕はありません。15台なら562.5 m³/分を使い、単純計算で37.5 m³/分が残ります。Mk.1で8台を動かす場合も、窒素ガスは300 m³/分を使い切ります。",
        "したがって、上限ちょうどの設備数をそのまま推奨台数として扱わないでください。必要な余裕は、実際の供給量、ネットワーク内の他の消費先、設備の稼働率から決めます。別の消費先が同じ供給に接続される場合は、その窒素需要も合計してから比較してください。"
      ],
      "tables": [
        {
          "headers": [
            "窒素ガス供給の前提",
            "混合機の計算上限",
            "溶融モジュラー・フレーム",
            "アルミ筐体",
            "ヘビー・モジュラー・フレーム"
          ],
          "rows": [
            [
              "Mk.1: 300 m³/分",
              "8台",
              "12個/分",
              "600個/分",
              "12個/分"
            ],
            [
              "Mk.2: 600 m³/分",
              "16台",
              "24個/分",
              "1,200個/分",
              "24個/分"
            ]
          ]
        }
      ]
    },
    {
      "heading": "窒素以外の入力も確認する",
      "paragraphs": [
        "窒素ガスだけを確保しても、設備は予定レートで生産できるとは限りません。たとえばMk.2の計算上限である16台を計画するなら、毎分1,200 アルミ筐体と24 ヘビー・モジュラー・フレームも供給する必要があります。プランを作るときは、それぞれの供給元に必要な毎分レートを入力し、共有原料が足りるか確認します。",
        "Plannerは同梱されたレシピから投入レート、設備相当数、アイテム収支を計算します。有限の窒素貯蔵量や現場のパイプ内流量、揚程、分岐・合流を再現するシミュレーターではありません。パイプの公称容量を満たす計画でも、実際のネットワークで同じ流量が安定して届くとは、この計算だけでは判断できません。"
      ]
    },
    {
      "heading": "既存記事との違い",
      "paragraphs": [
        "公開済みのアルミニウム記事とアルミ水ループ記事は、アルミナ溶液の製造や水の副産物流用を扱います。本稿ではその工程を再説明せず、完成したアルミ筐体を溶融モジュラー・フレームへ供給する数量として扱います。010「パイプライン流量とヘッドリフトのトラブルシューティング」は一般的な流量低下の切り分けです。本稿は個別の故障診断ではなく、1.1.xレシピから窒素ガスを基準に設備数と他材料の需要を逆算する計画です。"
      ]
    }
  ],
  "references": {
    "heading": "レシピ・搬送量・版情報",
    "links": [
      {
        "label": "Plannerのデータ版情報",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "溶融モジュラー・フレームレシピ",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "パイプライン定格",
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
    "label": "このレートを生産計画で確認する",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
