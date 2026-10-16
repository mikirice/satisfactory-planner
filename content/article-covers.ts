/**
 * Original, text-free editorial illustrations shared by the Japanese and English article pages.
 * They are decorative cover art, not screenshots, diagrams, or calculated production results.
 */
export type ArticleCoverLocale = 'ja' | 'en'

type CoverDefinition = {
  readonly alt: Readonly<Record<ArticleCoverLocale, string>>
  readonly width?: number
  readonly height?: number
  readonly type?: string
}

export const ARTICLE_COVERS = {
  'production-planning-tutorial': {
    alt: {
      ja: '工場設備と素材を並べた生産計画のイラスト',
      en: 'Editorial illustration of factory equipment and materials for production planning',
    },
  },
  'alternate-recipe-metrics': {
    alt: {
      ja: '異なる素材と製造機を並べた代替レシピ比較のイラスト',
      en: 'Editorial illustration of contrasting materials beside a production machine',
    },
  },
  'power-generation-planning': {
    alt: {
      ja: '複数の発電設備を描いた電力計画のイラスト',
      en: 'Editorial illustration of several power sources for factory planning',
    },
  },
  'somersloop-and-power-shards': {
    alt: {
      ja: '紫色の結晶と発光する破片を描いたイラスト',
      en: 'Editorial illustration of a violet crystal loop and glowing amber shards',
    },
  },
  'excel-export-guide': {
    alt: {
      ja: '工場の模型と空欄の表を描いたイラスト',
      en: 'Editorial illustration of a factory model beside a blank spreadsheet',
    },
  },
  'coal-power-startup': {
    alt: {
      ja: '石炭の山と水道管を備えた発電機のイラスト',
      en: 'Editorial illustration of a coal generator with coal and a water pipe',
    },
  },
  'oil-products-basics': {
    alt: {
      ja: '原油のしずくと精製設備を描いたイラスト',
      en: 'Editorial illustration of crude oil droplets and refinery tanks',
    },
  },
  'aluminum-production-guide': {
    alt: {
      ja: 'ボーキサイト鉱石とアルミニウムのインゴットを描いたイラスト',
      en: 'Editorial illustration of bauxite ore and an aluminum ingot',
    },
  },
  'awesome-sink-points': {
    alt: {
      ja: '素材を載せたベルトコンベアと受け入れ口のイラスト',
      en: 'Editorial illustration of a conveyor carrying assorted materials toward a hopper',
    },
  },
  'clock-and-efficiency': {
    alt: {
      ja: '目盛りのない時計と製造機を描いたイラスト',
      en: 'Editorial illustration of an unmarked clock face beside a factory machine',
    },
  },
  'build-checklist-guide': {
    alt: {
      ja: 'チェック欄のあるクリップボードと工場設備のイラスト',
      en: 'Editorial illustration of a checklist clipboard beside factory buildings',
    },
  },
  'strong-alternate-recipes': {
    alt: {
      ja: 'ハードドライブ風の発見物と素材見本を並べたイラスト',
      en: 'Editorial still life of a discovery drive and contrasting material samples',
    },
  },
  'miner-rate-by-purity': {
    width: 1280,
    height: 720,
    alt: {
      ja: '純度の違う資源ノードから採鉱機へ鉱石を運ぶ抽象的なイラスト',
      en: 'Abstract illustration of miners drawing ore from nodes of different purity',
    },
  },
  'motor-production-recipes': {
    width: 1280,
    height: 720,
    alt: {
      ja: 'ローター、ステーター、結晶部品を組み合わせた抽象的なモーター工場のイラスト',
      en: 'Abstract editorial illustration of a motor factory with rotors, stators and crystal components',
    },
  },
  'oil-loop-complete': {
    alt: {
      ja: '原油のしずくと複数の精製タンクを描いたイラスト',
      en: 'Editorial illustration of an oil droplet and refinery tanks',
    },
  },
  'diluted-fuel-power': {
    alt: {
      ja: '燃料タンクと発電機を描いたイラスト',
      en: 'Editorial illustration of a fuel tank beside an industrial generator',
    },
  },
  'turbofuel-power': {
    alt: {
      ja: 'タービンと精製設備を描いたイラスト',
      en: 'Editorial illustration of a turbine and refinery equipment',
    },
  },
  'packaged-diluted-fuel-loop': {
    alt: {
      ja: '燃料キャニスターと小型ポンプを描いたイラスト',
      en: 'Editorial illustration of a fuel canister and a small pump',
    },
  },
  'aluminum-water-loop': {
    alt: {
      ja: 'ボーキサイトとアルミのインゴット、水辺を描いたイラスト',
      en: 'Editorial illustration of bauxite, an aluminum ingot, and water',
    },
  },
  'battery-water-loop': {
    alt: {
      ja: 'バッテリーセルと水滴を描いたイラスト',
      en: 'Editorial illustration of a battery cell and water droplets',
    },
  },
  'nuclear-simplified': {
    alt: {
      ja: '緑色に光る燃料棒と小型原子炉のイラスト',
      en: 'Editorial illustration of a green-glowing fuel rod and compact reactor',
    },
  },
  'nuclear-uranium': {
    alt: {
      ja: '原子力発電所とウラン燃料棒を描いたイラスト',
      en: 'Editorial illustration of a nuclear plant and a uranium fuel rod',
    },
  },
  'nuclear-plutonium': {
    alt: {
      ja: '廃棄物容器と紫色の燃料ペレットを描いたイラスト',
      en: 'Editorial illustration of a waste canister and a violet fuel pellet',
    },
  },
  'nuclear-reprocessing': {
    alt: {
      ja: '原子炉のそばで環状の枠に囲まれた紫色の燃料を描いたイラスト',
      en: 'Editorial illustration of a violet fuel sphere framed by a reactor-like ring',
    },
  },
} as const satisfies Record<string, CoverDefinition>

export type ArticleCover = {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly type: string
}

export function articleCoverFor(slug: string, locale: ArticleCoverLocale): ArticleCover {
  const definition = ARTICLE_COVERS[slug as keyof typeof ARTICLE_COVERS]
  if (definition === undefined) throw new Error(`missing article cover: ${slug}`)
  return {
    src: `/article-covers/${slug}.webp`,
    alt: definition.alt[locale],
    width: 'width' in definition && typeof definition.width === 'number' ? definition.width : 1200,
    height:
      'height' in definition && typeof definition.height === 'number' ? definition.height : 630,
    type: 'type' in definition && typeof definition.type === 'string' ? definition.type : 'image/webp',
  }
}

export const ARTICLE_INDEX_COVER: ArticleCover = {
  src: '/article-covers/article-library.webp',
  width: 1200,
  height: 630,
  type: 'image/webp',
  alt: {
    ja: '白紙のガイドブックと工場の風景を描いたイラスト',
    en: 'Editorial illustration of a blank guidebook in an industrial landscape',
  }['ja'],
}

export function articleIndexCoverFor(locale: ArticleCoverLocale): ArticleCover {
  return {
    ...ARTICLE_INDEX_COVER,
    alt:
      locale === 'ja'
        ? ARTICLE_INDEX_COVER.alt
        : 'Editorial illustration of a blank guidebook in an industrial landscape',
  }
}
