/**
 * 表示用の数値フォーマット。
 * 丸めの粒度は仕様書 v1 §8 に合わせる（レート小数2位・台数小数4位）。
 */
import { itemsById, recipesById } from '../data/index.ts'

const fixed = (digits: number): Intl.NumberFormat =>
  new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

const rateFormat = fixed(2)
const countFormat = fixed(4)
const powerFormat = fixed(2)
const intFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('ja-JP', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** レート（個/分・m³/min）。小数2位 */
export const fmtRate = (n: number): string => rateFormat.format(clean(n))

/** 稼働台数。小数4位（端数がクロックになるので細かく見せる） */
export const fmtCount = (n: number): string => countFormat.format(clean(n))

/** 消費電力(MW)。小数2位 */
export const fmtPower = (n: number): string => powerFormat.format(clean(n))

/** 整数（建設コスト・建てる台数・シンクポイント） */
export const fmtInt = (n: number): string => intFormat.format(clean(n))

/** 面積(m²)。整数まるめ（概算なので小数は出さない） */
export const fmtArea = (n: number): string => intFormat.format(clean(n))

/** クロック（1 = 100%）を「87.5%」の形に。 */
export const fmtClock = (clock: number): string => `${(clean(clock) * 100).toFixed(1)}%`

/** 比率（0〜1）を % に。無制限などは '—' */
export const fmtPercent = (n: number | null | undefined): string =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : percentFormat.format(n)

/** 電力の幅表示。固定電力なら1つの値、可変電力なら「min 〜 max」 */
export function fmtPowerRange(minMW: number, maxMW: number): string {
  if (Math.abs(maxMW - minMW) < 0.005) return fmtPower(minMW)
  return `${fmtPower(minMW)} 〜 ${fmtPower(maxMW)}`
}

/** アイテムIDの日本語名。未知IDはIDのまま返す */
export const itemName = (id: string): string => itemsById.get(id)?.name.ja ?? id

/**
 * レシピの主産物（products の先頭）のアイテムID。未知のレシピは null。
 * フローチャートでレシピノードに「何を作るノードか」のアイコンを出すのに使う。
 */
export const recipeMainItem = (recipeId: string): string | null =>
  recipesById.get(recipeId)?.products[0]?.item ?? null

/**
 * 代替レシピか（名前が「代替: 」で始まるもの）。
 * ハードドライブのアイコンを名前の先頭に添えるかの判定に使う。
 */
export const isAlternateRecipe = (recipeId: string): boolean =>
  recipesById.get(recipeId)?.isAlternate ?? false

/**
 * レシピ名の先頭の「代替: 」（全角コロンの表記ゆれ・英語の "Alternate: " を含む）を落とす。
 * 全行が代替レシピと分かっている一覧（代替レシピ選択パネル）でだけ使う**表示専用**の加工で、
 * データ自体の名前は変えない。
 */
const ALTERNATE_PREFIX = /^(?:代替\s*[:：]\s*|Alternate\s*[:：]\s*)/i

export const stripAlternatePrefix = (name: string): string => name.replace(ALTERNATE_PREFIX, '')

/** アイテムの単位（固体=個/分、液体・気体=m³/min） */
export const itemUnit = (id: string): string =>
  itemsById.get(id)?.form === 'solid' ? '個/分' : 'm³/min'

/** -0 や 1e-12 のようなノイズを 0 に寄せる */
function clean(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.abs(n) < 1e-9 ? 0 : n
}
