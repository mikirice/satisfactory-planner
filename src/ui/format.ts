/**
 * Locale-aware display formatting. Solver values, persisted values, share URLs, and Excel
 * numeric cells never pass through these helpers.
 */
import { itemsById, recipesById, resolveDisplayName } from '../data/index.ts'
import { getActiveLocale } from '../i18n/index.ts'
import { T } from './text.ts'

type Digits = 0 | 1 | 2 | 4

const numberFormats = new Map<string, Intl.NumberFormat>()

function formatter(
  digits: Digits,
  options: Omit<Intl.NumberFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {},
): Intl.NumberFormat {
  const locale = getActiveLocale()
  const key = `${locale}:${digits}:${options.style ?? 'decimal'}`
  const cached = numberFormats.get(key)
  if (cached !== undefined) return cached
  const created = new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  numberFormats.set(key, created)
  return created
}

/** General display number with up to two fractional digits. */
export const fmtDecimal = (n: number): string =>
  new Intl.NumberFormat(getActiveLocale(), { maximumFractionDigits: 2 }).format(clean(n))

/** Rate (items/min or m³/min), two decimal places. */
export const fmtRate = (n: number): string => formatter(2).format(clean(n))

/** Running machine count, four decimal places. */
export const fmtCount = (n: number): string => formatter(4).format(clean(n))

/** Power in MW, two decimal places. */
export const fmtPower = (n: number): string => formatter(2).format(clean(n))

/** Integer counts (construction cost, built machines, sink points). */
export const fmtInt = (n: number): string => formatter(0).format(clean(n))

/** Approximate area in m², rounded to an integer. */
export const fmtArea = (n: number): string => formatter(0).format(clean(n))

/** Clock ratio (1 = 100%), one decimal place. */
export const fmtClock = (clock: number): string =>
  formatter(1, { style: 'percent' }).format(clean(clock))

/** Ratio as a percentage. Non-finite values use an em dash. */
export const fmtPercent = (n: number | null | undefined): string =>
  n === null || n === undefined || !Number.isFinite(n)
    ? '—'
    : formatter(1, { style: 'percent' }).format(n)

/** Fixed power value or localized min/max range. */
export function fmtPowerRange(minMW: number, maxMW: number): string {
  if (Math.abs(maxMW - minMW) < 0.005) return fmtPower(minMW)
  return `${fmtPower(minMW)}${T.units.rangeSeparator}${fmtPower(maxMW)}`
}

/** Official display name for any ClassName known to the bundled game data. */
export const itemName = (id: string): string => resolveDisplayName(id, getActiveLocale())

/** First product ClassName for a recipe, or null when the recipe is unknown. */
export const recipeMainItem = (recipeId: string): string | null =>
  recipesById.get(recipeId)?.products[0]?.item ?? null

/** Whether the ClassName identifies an alternate recipe. */
export const isAlternateRecipe = (recipeId: string): boolean =>
  recipesById.get(recipeId)?.isAlternate ?? false

/** Remove the official Japanese or English alternate-recipe prefix for compact lists. */
const ALTERNATE_PREFIX = /^(?:\u4ee3\u66ff\s*[:\uff1a]\s*|Alternate\s*[:\uff1a]\s*)/i

export const stripAlternatePrefix = (name: string): string => name.replace(ALTERNATE_PREFIX, '')

/** Per-minute unit for an item ClassName. */
export const itemUnit = (id: string): string =>
  itemsById.get(id)?.form === 'solid' ? T.units.solidPerMinute : T.units.fluidPerMinute

/** Collapse negative zero and tiny solver noise for display only. */
function clean(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.abs(n) < 1e-9 ? 0 : n
}
