import type { HandwrittenArticle } from './types.ts'

export const heavyModularFrameScrewBeltCapacityGuideArticle = {
  "slug": "heavy-modular-frame-screw-belt-capacity-guide",
  "title": "ヘビー・モジュラー・フレームのネジ搬送容量を見積もる",
  "description": "製造機の台数からネジ需要を出し、ベルト定格と基本レシピの製作機相当数を確かめます。",
  "publishedDate": "2026-10-18",
  "versionNotice": "Plannerの同梱ゲームデータはSatisfactory 1.1.xです。参照記録は2026-08-07取得、正確な1.1パッチは特定されていません。Update 1.2とのレシピ一致や実ベルト流量は主張しません。",
  "sections": [
    {
      "heading": "製造機1台あたりのネジ需要",
      "paragraphs": [
        "Plannerに同梱されたSatisfactory 1.1.x の基本ヘビー・モジュラー・フレームレシピは、製造機で30秒ごとに1個を作ります。100%稼働なら毎分2個です。1サイクルあたりにモジュラー・フレーム5個、鋼管20個、コンクリート被覆型鋼梁5個、ネジ120個を使います。したがって、製造機1台を100%で動かす計画では、ネジだけで毎分240個必要です。",
        "製造機を N 台並べると、必要なネジレートは 240 × N 個/分 です。たとえば2台なら、ヘビー・モジュラー・フレームは毎分4個、ネジは毎分480個必要になります。ほかの入力も、同じレシピからモジュラー・フレーム毎分20個、鋼管80個、コンクリート被覆型鋼梁20個です。"
      ]
    },
    {
      "heading": "コンベア定格と照らし合わせる",
      "paragraphs": [
        "同梱1.1.xデータに記録されたベルト搬送量と、2台分のネジ需要を比べます。",
        "2台分を1本の入力ベルトで供給する想定なら、Mk.3の定格では足りません。Mk.4は計算上の需要と定格が同じなので、他の消費先や供給変動を含む余裕はありません。Mk.5なら定格上は300個/分の余白があります。これはベルトの公称搬送量とレシピ需要の比較であり、実際の流れや詰まりの発生をテストした結果ではありません。",
        "台数を決めたら、式 240 × N でネジ需要を出し、ほかのネジ搬送先が同じベルトにある場合はその量も足します。複数品目を同じベルトに流す構成では、ネジだけで定格を使い切らないよう全品目の合計レートを比べます。"
      ],
      "tables": [
        {
          "headers": [
            "ベルト",
            "データ上の搬送量",
            "2台分の480ネジ/分を運べるか"
          ],
          "rows": [
            [
              "Conveyor Belt Mk.3",
              "270個/分",
              "不足。210個/分足りない"
            ],
            [
              "Conveyor Belt Mk.4",
              "480個/分",
              "数値上は一致。余裕なし"
            ],
            [
              "Conveyor Belt Mk.5",
              "780個/分",
              "数値上は余裕あり"
            ]
          ]
        }
      ]
    },
    {
      "heading": "供給元の製作機相当数も確認する",
      "paragraphs": [
        "基本のネジレシピは、製作機で6秒ごとに鉄のロッド1個からネジ4個を作ります。100%連続稼働のレートに換算すると、製作機1台あたり毎分40個、鉄のロッドは毎分10個必要です。2台のヘビー・モジュラー・フレーム製造機に必要な480個/分は、基本ネジレシピを100%で動かす製作機12台分にあたります。その12台はレシピ上、鉄のロッドを毎分120個消費します。クロックや供給元の数を変える場合は、ロッド供給も合わせて計画してください。",
        "Plannerは毎分レートを使ってレシピ、建物相当数、収支、搬送量を計算します。有限の在庫、現場のベルト詰まり、設備の停止、ゲーム内の実際の到着や消費タイミングは再現しません。ベルト定格に収まっていても、実際の工場で安定供給できるかはゲーム内で確認してください。"
      ]
    },
    {
      "heading": "既存記事との違い",
      "paragraphs": [
        "公開済みのモーター製作記事はローターやステーターなどモーター用レシピを扱います。Space Elevatorの006は、納品目標と期限から複数部品の毎分目標を組み立てる記事です。本稿は基本ヘビー・モジュラー・フレームの製造機台数からネジ需要を算出し、コンベアの定格を選ぶ問いに限定します。代替レシピの比較やヘビー・モジュラー・フレームを必要とする納品数・完了期限の計画は扱いません。"
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
        "label": "ヘビー・モジュラー・フレームとネジのレシピ",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "コンベア定格",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/logistics.json"
      }
    ]
  },
  "relatedItemIds": [],
  "relatedArticleSlugs": [
    "motor-production-recipes",
    "fused-modular-frame-nitrogen-pipeline-capacity"
  ],
  "cta": {
    "kind": "sample",
    "label": "このレートを生産計画で確認する",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
