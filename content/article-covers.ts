/**
 * Editorial covers shared by the Japanese and English article pages. Each entry's caption
 * identifies whether it is original illustration art or official game media.
 */
export type ArticleCoverLocale = 'ja' | 'en'

type CoverDefinition = {
  readonly alt: Readonly<Record<ArticleCoverLocale, string>>
  readonly caption?: Readonly<Record<ArticleCoverLocale, string>>
  readonly badge?: Readonly<Record<ArticleCoverLocale, string>>
  readonly localizedSrc?: Readonly<Record<ArticleCoverLocale, string>>
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
      ja: 'Satisfactory公式Press Kitの石炭発電機のゲーム内スクリーンショット（2020年）',
      en: 'In-game screenshot of Coal-Powered Generators from the 2020 Satisfactory Press Kit',
    },
    caption: {
      ja: 'Satisfactory公式Press Kitのゲーム内スクリーンショット（2020年）。記事の8台構成そのものではありません。',
      en: 'In-game screenshot from the official Satisfactory Press Kit (2020); it does not show the article’s exact eight-generator layout.',
    },
    creditLinks: {
      ja: [{ href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view', label: 'Satisfactory公式Press Kit' }],
      en: [{ href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view', label: 'Official Satisfactory Press Kit' }],
    },
    badge: { ja: 'ゲーム画像', en: 'Game screenshot' },
    localizedSrc: {
      ja: '/article-covers/coal-power-startup-1280x720.webp',
      en: '/article-covers/coal-power-startup-1280x720.webp',
    },
    width: 1280,
    height: 720,
    type: 'image/webp',
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
      ja: 'Satisfactory公式Press Kitの工場全景。組立機、精錬炉、ベルト、配管が見えるゲーム内画像',
      en: 'In-game factory scene from the official Satisfactory Press Kit, with assemblers, smelters, belts, and pipes',
    },
    caption: {
      ja: 'Satisfactory公式Press Kitの実ゲーム画像を編集した参考イメージです。記事の建設配置や手順を再現した画面ではありません。',
      en: 'Edited in-game reference image from the official Satisfactory Press Kit. It does not reproduce the article’s exact layout or build steps.',
    },
    creditLinks: {
      ja: [{ href: 'https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view', label: 'Satisfactory公式Press Kit' }],
      en: [{ href: 'https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view', label: 'Official Satisfactory Press Kit' }],
    },
    badge: { ja: 'ゲーム画像', en: 'Game screenshot' },
    localizedSrc: {
      ja: '/article-covers/build-checklist-guide-official-ja.webp',
      en: '/article-covers/build-checklist-guide-official-en.webp',
    },
    width: 1280,
    height: 720,
    type: 'image/webp',
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
    localizedSrc: {
      ja: '/article-covers/motor-production-recipes-official-ja.webp',
      en: '/article-covers/motor-production-recipes-official-en.webp',
    },
    alt: {
      ja: 'Satisfactoryの一般的な工場風景と、モーター15個/分の3レシピを比較する見出しパネル',
      en: 'General Satisfactory factory scene with a separate panel introducing three Motor recipes at 15 per minute',
    },
    caption: {
      ja: '公式Satisfactoryメディアの一般的な工場風景です。Motor専用ラインや記事の計算結果ではありません。',
      en: 'General factory scene from official Satisfactory media. It is not a Motor-specific line or a result from this article.',
    },
    badge: { ja: 'ゲーム画像', en: 'Game screenshot' },
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
      ja: 'Satisfactory公式Press Kitの核廃棄物ドラムをベルトで運ぶゲーム内画像',
      en: 'In-game image from the official Satisfactory Press Kit showing nuclear-waste drums on conveyor belts',
    },
    caption: {
      ja: '核廃棄物ドラムの搬送を写した公式Press Kit画像です。記事の核種、レシピ、処理量、再処理ラインを示すものではありません。',
      en: 'Official Press Kit image of nuclear-waste drums in transit. It does not show the article’s specific waste type, recipe, throughput, or reprocessing line.',
    },
    creditLinks: {
      ja: [{ href: 'https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view', label: 'Satisfactory公式Press Kit' }],
      en: [{ href: 'https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view', label: 'Official Satisfactory Press Kit' }],
    },
    badge: { ja: 'ゲーム画像', en: 'Game screenshot' },
    localizedSrc: {
      ja: '/article-covers/nuclear-reprocessing-official-ja.webp',
      en: '/article-covers/nuclear-reprocessing-official-en.webp',
    },
    width: 1280,
    height: 720,
    type: 'image/webp',
  },
} as const satisfies Record<string, CoverDefinition>

export type ArticleCover = {
  readonly src: string
  readonly alt: string
  readonly caption?: string
  readonly creditLinks?: readonly { href: string; label: string }[]
  readonly badge?: string
  readonly width: number
  readonly height: number
  readonly type: string
}

export function articleCoverFor(slug: string, locale: ArticleCoverLocale): ArticleCover {
  const definition = ARTICLE_COVERS[slug as keyof typeof ARTICLE_COVERS]
  if (definition === undefined) throw new Error(`missing article cover: ${slug}`)
  return {
    src:
      'localizedSrc' in definition && definition.localizedSrc !== undefined
        ? definition.localizedSrc[locale]
        : `/article-covers/${slug}.webp`,
    alt: definition.alt[locale],
    caption:
      'caption' in definition && definition.caption !== undefined
        ? definition.caption[locale]
        : undefined,
    creditLinks:
      'creditLinks' in definition && definition.creditLinks !== undefined
        ? definition.creditLinks[locale]
        : undefined,
    badge:
      'badge' in definition && definition.badge !== undefined ? definition.badge[locale] : undefined,
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
