import type { HandwrittenArticle } from './types.ts'

export const minerRateByPurityArticle = {
  slug: 'miner-rate-by-purity',
  title: '採鉱機の採取量一覧 — ノード純度・機種・クロックから原料レートを決める',
  description:
    '採鉱機 Mk.1〜Mk.3 の採取量を資源ノードの純度別に一覧化。250%クロックの上限、電力の増え方、ベルトの詰まりまで、鉄板160個/分の例で確認します。',
  // Tables use the repository's verified Satisfactory 1.1.x game data; newer game data has not been checked.
  publishedDate: '2026-10-14',
  sections: [
    {
      heading: '採取量は「機種 × 純度 × クロック」で決まる',
      paragraphs: [
        'この表と計算例は、Satisfactory 1.1.x を対象にしたリポジトリ収録データに基づきます。固体資源ノードの採取量は、採鉱機の基準レートに純度倍率とクロック倍率を掛けて求めます。通常ノードを100%で採ると、採鉱機 Mk.1 は60個/分、Mk.2 は120個/分、Mk.3 は240個/分。純度はインプアが0.5倍、ノーマルが1倍、ピュアが2倍です。たとえば Mk.2 をピュアに置けば、120 × 2 = 240個/分になります。',
        'ノードは採取速度の基準を変えますが、埋蔵量を使い切る仕組みではありません。ここで扱うのは鉄鉱石や石炭などの固体ノードです。原油、揚水ポンプ、資源井戸は設備と計算が異なるため、この表には含めません。表の数値は採鉱機が連続稼働し、搬出先が受け入れられる場合の名目レートです。ベルトやコンテナが詰まった状態、電力が切れた状態での実稼働量を示すものではありません。',
      ],
      tables: [
        {
          caption: '100%クロック時の固体資源の基準採取量（個/分）',
          headers: ['ノード純度', '採鉱機 Mk.1', '採鉱機 Mk.2', '採鉱機 Mk.3'],
          rows: [
            ['インプア（0.5倍）', '30', '60', '120'],
            ['ノーマル（1倍）', '60', '120', '240'],
            ['ピュア（2倍）', '120', '240', '480'],
          ],
        },
      ],
    },
    {
      heading: '250%まで上げたときの最大値',
      paragraphs: [
        '採鉱機はパワーシャード1個ごとにクロック上限が50%上がり、3個で最大250%になります。採取量はクロックに比例するため、100%の表を2.5倍すれば250%の上限を出せます。例として、Mk.3 をピュアノードで250%にすると480 × 2.5 = 1,200個/分です。',
        'ただし搬出側にも上限があります。ベルト Mk.6 の定格は1,200個/分なので、この例はベルト1本の上限とちょうど一致します。ベルトの実効速度が不足すれば、採鉱機が計算上の量を出せても搬出できません。実際の設備では採掘機の出力と搬送能力を別々に確認してください。',
      ],
      tables: [
        {
          caption: '250%クロック時の固体資源の採取量（個/分）',
          headers: ['ノード純度', '採鉱機 Mk.1', '採鉱機 Mk.2', '採鉱機 Mk.3'],
          rows: [
            ['インプア（0.5倍）', '75', '150', '300'],
            ['ノーマル（1倍）', '150', '300', '600'],
            ['ピュア（2倍）', '300', '600', '1,200'],
          ],
        },
      ],
    },
    {
      heading: '鉄板160個/分なら、Mk.2とピュアノードで240個/分',
      paragraphs: [
        '標準レシピだけで鉄板160個/分を作ると、製作機8台が鉄インゴット240個/分を使い、そのインゴットを製錬炉8台が鉄鉱石240個/分から作ります。採鉱機 Mk.2 をピュアな鉄鉱石ノードに1台置き、100%で回せばちょうど240個/分です。採鉱機の基準電力は Mk.2 が15 MW、Mk.3 が45 MWなので、同じ240個/分でも、ノードの純度と機種によって電力と必要な設備が変わります。',
        'これは一つのピュアノードを使える場合の計算例です。計画ツールの自動採掘はマップ全体の純度別ノード数をもとに割り当てるため、近くにピュアノードがあるか、建物を置けるか、電力線やベルトをどう引くかまでは判定しません。共有プランは必要レートと採掘機の設定を復元しますが、特定の地点に工場を建てたシミュレーションではありません。',
      ],
    },
    {
      heading: 'クロックを上げると電力も増える',
      paragraphs: [
        'ゲームデータの採掘機は、消費電力が「基準電力 × クロックの1.321929乗」で増えます。採取量が2.5倍になる250%では、電力は2.5倍ではなく約3.36倍です。たとえば Mk.2 は100%の15 MWから、250%では約50.4 MWになります。パワーシャードを使うときは、増える採取量だけでなく電源側の余裕も見てください。',
        '必要量がノードの上限より小さい場合、余剰採取量を運ぶベルトを用意しても目標レートが増えるわけではありません。必要レートから設備を選び、建物の個別クロック、電力、ベルト容量を順に照合すると、過剰な採掘を避けやすくなります。',
      ],
    },
    {
      heading: '計画ツールで同じ条件を再現する',
      paragraphs: [
        '記事末尾の計画を開き、目標が鉄板160個/分、採掘機が Mk.2、採掘クロックが100%になっていることを確認します。原料表の鉄鉱石は240個/分です。別のノードを使う場合は、設定の採掘機と採掘クロックを変更して、採掘リストの台数・純度割り当て・電力を見比べてください。',
        '表示される採取レートは収支の計算です。実際のベルトの詰まり、電力停止、設備の配置や稼働開始順を再現する配管・搬送シミュレーションではありません。現地では搬出先の空き、ベルトの定格、電力の接続を別に確認してください。',
      ],
    },
  ],
  references: {
    heading: '参考資料',
    links: [
      { label: 'Official Satisfactory Wiki — Miner', href: 'https://satisfactory.wiki.gg/wiki/Miner' },
      { label: 'Official Satisfactory Wiki — Resource Node', href: 'https://satisfactory.wiki.gg/wiki/Resource_Node' },
      { label: 'Official Satisfactory Wiki — Conveyor Belt', href: 'https://satisfactory.wiki.gg/wiki/Conveyor_Belt' },
      { label: 'Satisfactory Planner — ゲームデータの取得元と対象バージョン', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Calculator — Miner Calculator（独立したレート比較）', href: 'https://satisfactorycalculator.net/miner-calculator' },
    ],
  },
  relatedItemIds: ['Desc_OreIron_C', 'Desc_IronIngot_C', 'Desc_IronPlate_C'],
  relatedArticleSlugs: ['clock-and-efficiency', 'build-checklist-guide', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: '鉄板160個/分の計画を開き、Mk.2採鉱機の採取量を確認する',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 160,
    minerId: 'Build_MinerMk2_C',
  },
} as const satisfies HandwrittenArticle
