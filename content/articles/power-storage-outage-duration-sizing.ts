import type { HandwrittenArticle } from './types.ts'

export const powerStorageOutageDurationSizingArticle = {
  "slug": "power-storage-outage-duration-sizing",
  "title": "停電時に必要な電力貯蔵量を見積もる",
  "description": "既知の一定負荷不足と停電時間から、必要なPower Storage台数と充電条件を見積もります。",
  "publishedDate": "2026-10-19",
  "versionNotice": "参照資料は電力貯蔵容量と充電上限を示しますが、対象ゲームデータの版は特定されていません。Update 1.2との一致と現行ビルドの挙動は未確認です。",
  "sections": [
    {
      "heading": "MWの不足量とMWhの継続時間を分ける",
      "paragraphs": [
        "発電不足が何MWかだけでは、蓄電設備が何分持つか分かりません。Power Storageのデータ記載容量は1台100 MWhで、最大充電レートは100 MWです。これは100 MWの不足を1時間補うエネルギー量に相当します。参照資料では最大放電レートが「無制限」とされています。容量計算の基準は目標時間分のMWhです。現行ビルドでの放電挙動は確認していません。日本語UIの正式名も未確認のため、本文ではPower Storageと表記します。",
        "不足電力に継続時間を掛けて必要エネルギーを求めます。",
        "必要エネルギー（MWh） = 不足電力（MW） × 継続時間（分） ÷ 60",
        "各Power Storageが100 MWh満充電の前提なら、必要台数の最小値は 必要エネルギー ÷ 100 を切り上げた数です。この値は満充電分を使い切る計算です。途中で充電量が足りなくなるリスクや、別途必要な予備は含みません。"
      ]
    },
    {
      "heading": "目標時間に必要な台数を計算する",
      "paragraphs": [
        "たとえばグリッドに300 MWの不足が20分続くケースでは、必要量は 300 × 20 ÷ 60 = 100 MWh です。満充電のPower Storageが1台あれば、この計算上のエネルギー量に一致します。同じ300 MWの不足が30分続くなら150 MWh必要なので、満充電のPower Storageは最低2台です。1台分を超える50 MWhは2台目の容量から使います。",
        "不足が時間によって変化する場合は、単一の最大値を時間全体に当てはめると過大評価になり、平均値だけを使うと短時間の大きな不足を見落とすことがあります。区間ごとに不足MWと時間を掛けて必要MWhを足してください。生成側の変動、設備の起動停止、蓄電残量を含めた実際の挙動は、ゲーム内で確認が必要です。"
      ]
    },
    {
      "heading": "設置数と充電できる余剰を別に確認する",
      "paragraphs": [
        "1台あたりの最大充電レートは100 MWです。必要台数を置いても、余剰発電が少なければ満充電までに時間がかかります。たとえば空のPower Storage1台を100 MWの余剰で充電する最短時間は1時間です。余剰が50 MWで一定なら、100 MWhの充電に2時間かかります。設備の充電レート上限と、グリッドから実際に回せる余剰のうち小さい方が充電ペースを決めます。",
        "充電開始前に、蓄電量の表示と現在の余剰電力を確認してください。必要台数を設置しただけでは、バックアップ用のエネルギーが蓄えられたとは限りません。満充電を確認した後、想定不足を少しずつ再現できるなら、電力グラフと残量表示を見て見積もりを調整します。実測していないルートや起動順を前提に保証時間を断定しないでください。"
      ]
    },
    {
      "heading": "発電能力の記事との違い",
      "paragraphs": [
        "既存の発電計画記事は発電機の定格MW、燃料供給、発電所側で消費する電力を扱います。こちらは不足が起きたときに使える蓄積エネルギーをMWhで計算し、既知の不足時間を何台分で橋渡しできるかを決めます。継続的な発電不足を蓄電だけで解消する計画ではありません。"
      ]
    }
  ],
  "references": {
    "heading": "計算根拠と参照資料",
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
    "label": "生産計画を開く",
    "sampleId": "iron-plate"
  }
} as const satisfies HandwrittenArticle
