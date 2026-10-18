import type { HandwrittenArticle } from './types.ts'

export const variablePowerPeakLoadPlanningArticle = {
  "slug": "variable-power-peak-load-planning",
  "title": "可変電力レシピのピーク負荷を計画する",
  "description": "可変電力レシピの最大MWと他の最大負荷から、保守的な電力予算を見積もります。",
  "publishedDate": "2026-10-19",
  "versionNotice": "Plannerの同梱ゲームデータはSatisfactory 1.1.xです。正確なパッチ、アップデート1.2との一致、可変レシピの同時ピーク挙動は未確認です。",
  "sections": [
    {
      "heading": "平均値でなく最大値を設備計画に使う",
      "paragraphs": [
        "通常の消費電力を一つの固定値として足すと、可変電力レシピの負荷が上がったときに余裕を過小評価するおそれがあります。Plannerに同梱されたSatisfactory 1.1.x データでは、変換機のレシピは100〜400 MW、粒子加速器の「核パスタ」レシピは500〜1,500 MW、量子エンコーダーの「異星のパワーマトリックス」レシピは0〜2,000 MWの範囲として記録されています。",
        "1台ずつ同時に動かす計画なら、3台の負荷はデータ上の最小値合計で600 MW、最大値合計で3,900 MWです。ほかの工場の最大負荷が500 MWなら、すべての設備が同時に高負荷になるケースを見込んだ合計は4,400 MWになります。これはデータ上の上限を足した保守的な設計値で、ゲーム内の実測ピークではありません。"
      ]
    },
    {
      "heading": "台数と運転条件を式に入れる",
      "paragraphs": [
        "各レシピについて、予定台数にそのレシピの最大MWを掛け、同時に動く他の設備の最大負荷を加えます。",
        "ピーク用の計画値 = Σ（各レシピの台数 × レシピの最大MW）+ その他の最大負荷",
        "たとえば同じ構成を粒子加速器2台、変換機1台、量子エンコーダー1台にすると、可変レシピ部分だけで最大 2 × 1,500 + 400 + 2,000 = 5,400 MW です。量子エンコーダーが最大値に達しない運転でも、上限を使う計画ならその差を予備余裕として扱えます。すべての設備が同時に最大値となる頻度や時間は、このデータだけでは分かりません。",
        "例のレシピは標準クロックを前提にします。クロック、サマースループによる生産増幅、稼働中のレシピ、他の回路の負荷を変える場合は、ゲーム内の電力グラフで実際の最大消費を確認してから計画値を見直してください。ここでの最大値は設計用の上限確認であり、平均消費量や1個あたりの消費エネルギーを表しません。"
      ]
    },
    {
      "heading": "計画表の定常値とゲーム内のピークを分ける",
      "paragraphs": [
        "既存の発電計画記事は発電機の定格出力、燃料レート、発電設備側の消費を整理します。本稿は可変電力レシピを使う設備側で、最低値から最大値までの負荷幅を拾い、ピーク時にグリッドの余裕が足りるかを先に判断する補助計算です。"
      ]
    }
  ],
  "references": {
    "heading": "計算根拠と参照資料",
    "links": [
      {
        "label": "データ版情報",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md"
      },
      {
        "label": "可変電力レシピ",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json"
      },
      {
        "label": "設備電力データ",
        "href": "https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/src/data/buildings.json"
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
    "label": "生産計画を開く",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
