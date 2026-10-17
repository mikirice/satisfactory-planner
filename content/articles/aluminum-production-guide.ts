import type { HandwrittenArticle } from './types.ts'

/** Per-minute figures are scaled directly from src/data/recipes.json and buildings.json. */
export const aluminumProductionGuideArticle = {
  slug: 'aluminum-production-guide',
  title: 'アルミ生産の基礎 — 3工程の収支と水・シリカの組み方',
  description:
    'ボーキサイトからインゴットまでの標準工程を毎分収支で解説。60個/分の実例、副産物の水、シリカの補い方、立ち上げと詰まりの確認手順をまとめます。',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'ボーキサイトから3工程でインゴットへ',
      paragraphs: [
        '標準ルートは、(1) 精製機でボーキサイトと水からアルミナ溶液を作る、(2) 精製機で溶液と石炭からアルミのスクラップを作る、(3) 鋳造炉でスクラップとシリカからアルミのインゴットを作る、の3工程です。表は各機械を100%クロックで動かした毎分レートです。',
        '1段目はシリカも出し、2段目は水を返します。この水は1段目へ戻せますが、循環が止まった初動用には外部の水が必要です。水の返却先が満杯になるとスクラップ工程が止まり、アルミナ溶液まで連鎖して停止します。',
      ],
      tables: [
        {
          caption: '標準アルミ工程の毎分収支（1.1.x収録データ）',
          headers: ['工程・設備', '入力', '出力'],
          rows: [
            ['アルミナ溶液・精製機', 'ボーキサイト120 + 水180m³', '溶液120m³ + シリカ50'],
            ['アルミのスクラップ・精製機', '溶液240m³ + 石炭120', 'スクラップ360 + 水120m³'],
            ['アルミのインゴット・鋳造炉', 'スクラップ90 + シリカ75', 'インゴット60'],
          ],
        },
      ],
    },
    {
      heading: 'インゴット60個/分を原料から逆算する',
      paragraphs: [
        'まず鋳造炉1台を100%で動かす例を見ます。インゴット60個/分にはスクラップ90個/分とシリカ75個/分が必要です。スクラップは精製機0.25台で作れ、アルミナ溶液60m³/minと石炭30個/分を使い、水30m³/minを返します。',
        '溶液60m³/minは1段目の精製機0.5台に相当し、ボーキサイト60個/分と水90m³/minを使ってシリカ25個/分も作ります。残るシリカ50個/分を標準レシピで補う場合、未加工石英30個/分と製作機1と1/3台が必要です。インゴット60個/分の原料はボーキサイト60個/分・石炭30個/分・未加工石英30個/分・水60m³/minです（戻り水を使う場合の正味量）。',
        '設備は精製機0.75台相当、鋳造炉1台、製作機1と1/3台です。100%クロック設備の電力で計算すると精製機22.5MW、鋳造炉16MW、製作機約5.33MW、合計約43.83MWです。端数設備を部分クロックにすれば、フルサイズ機を全部100%で動かす必要はありません。',
      ],
      tables: [
        {
          caption: '標準レシピでインゴット60個/分を作る例',
          headers: ['必要なもの', '毎分量'],
          rows: [
            ['ボーキサイト', '60個'],
            ['石炭', '30個'],
            ['未加工石英', '30個'],
            ['外部から補う水（戻り水を再利用）', '正味60m³'],
            ['電力（設備合計）', '約43.83MW'],
          ],
        },
      ],
    },
    {
      heading: '副産物の水は定常運転で戻す',
      paragraphs: [
        '60個/分の例では、アルミナ溶液工程が水90m³/minを使い、スクラップ工程から30m³/minが戻ります。定常時に戻り水を上流へ使えば外部から補う分は正味60m³/minです。戻り水を配管で返す循環の組み方、初期充填と逃がし先は[アルミ水循環ガイド](/articles/aluminum-water-loop/)で扱います。バッテリーも同じ水の返却を含むため、[バッテリー水循環ガイド](/articles/battery-water-loop/)は別工程まで広げるときに参照してください。',
        'この計算は定常時の物質収支です。建設後は外部水をまず流して溶液と配管を満たし、スクラップ工程が水を返し始めてから循環側の流れを確認してください。Plannerの収支が合っていても、戻り管が高すぎる、流路が細い、または水の受け先が止まっているとゲーム内では流れません。水を捨てる非常用の出口を設ける場合も、通常時に原料や製品が漏れない経路かを実機で確かめます。',
      ],
    },
    {
      heading: 'シリカは副産物・石英・代替レシピで補う',
      paragraphs: [
        '標準のシリカレシピは未加工石英22.5個/分からシリカ37.5個/分を作ります。代替の廉価シリカは同量の石英に石灰岩37.5個/分を加え、シリカ52.5個/分を作ります。60個/分のインゴット例で必要な追加シリカ50個/分を廉価シリカだけで作るなら、石英約21.43個/分と石灰岩約35.71個/分です。製作機ではなく組立機を使うため、石灰岩の搬入と建物の解放状況も比べてください。',
        'アルミナ溶液の標準工程から出るシリカも使えます。逆に、代替の汚濁アルミナ溶液はボーキサイト200個/分と水200m³/minから溶液240m³/minを作りますが、シリカは出ません。標準工程よりボーキサイト当たりの溶液量が多い一方、必要なシリカはすべて別に用意します。ボーキサイトと石英のどちらが拠点で足りないか、採掘・搬送距離も含めて選びます。',
      ],
    },
    {
      heading: 'Plannerの解を拠点条件に合わせ、停止箇所を切り分ける',
      paragraphs: [
        'Plannerでアルミのインゴット60個/分を目標に置き、レシピ・設備・原料上限を確認します。既定の「原料を最小化」では、マップ総量が少ないボーキサイトの代わりに、変換機で作ったボーキサイトを選ぶ場合があります。自分が採掘できるノードの上限を入力するか、電力・設備数を優先する目的関数でも解き、実際の拠点条件に近い案を選んでください。代替レシピの比較方法は[代替レシピの比較指標](/articles/alternate-recipe-metrics/)を参照してください。',
        '生産が止まったら、(1) アルミナ溶液がスクラップ精製機へ届いているか、(2) シリカが鋳造炉へ届き、過不足がないか、(3) スクラップから戻る水の管と受け先が空いているか、(4) ボーキサイト・石炭・石英の採掘とベルトが必要量を満たすか、の順に確認します。Plannerは選んだレシピと定常収支を解きますが、配管の高さ・揚程・初動の充填は自動配置しません。',
      ],
    },
  ],
  references: {
    heading: 'データの出典とレシピ参照',
    links: [
      {
        label: 'Planner収録レシピの出典と対象バージョン（1.1.x）',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      { label: 'Alumina Solution — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Alumina_Solution' },
      { label: 'Aluminum Scrap — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Aluminum_Scrap' },
      { label: 'Aluminum Ingot — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Aluminum_Ingot' },
      { label: 'Silica — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Silica' },
    ],
  },
  relatedItemIds: [
    'Desc_OreBauxite_C',
    'Desc_AluminaSolution_C',
    'Desc_AluminumScrap_C',
    'Desc_AluminumIngot_C',
    'Desc_Silica_C',
    'Desc_RawQuartz_C',
    'Desc_Water_C',
  ],
  relatedArticleSlugs: [
    'aluminum-water-loop',
    'battery-water-loop',
    'alternate-recipe-metrics',
    'awesome-sink-points',
  ],
  cta: {
    kind: 'item',
    label: 'アルミのインゴット60個/分の計画を開く',
    itemId: 'Desc_AluminumIngot_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
