/**
 * 正規化データのエントリポイント。
 * JSON は scripts/build-data.ts の生成物（`npm run build-data` で再生成）。
 */
import itemsJson from './items.json'
import recipesJson from './recipes.json'
import buildingsJson from './buildings.json'
import extractorsJson from './extractors.json'
import generatorsJson from './generators.json'
import logisticsJson from './logistics.json'
import metaJson from './meta.json'

import type {
  Belt,
  Building,
  DataMeta,
  Extractor,
  Generator,
  Item,
  LocalizedName,
  Logistics,
  Pipe,
  Recipe,
} from './types.ts'
import { SECONDS_PER_MINUTE } from './constants.ts'

export const items = itemsJson as unknown as Item[]
export const recipes = recipesJson as unknown as Recipe[]
export const buildings = buildingsJson as unknown as Building[]
export const extractors = extractorsJson as unknown as Extractor[]
/** 発電機（石炭 / 燃料式 / 原子力）。バイオマスバーナー・地熱は収録しない（types.ts 参照） */
export const generators = generatorsJson as unknown as Generator[]
export const logistics = logisticsJson as unknown as Logistics
export const meta = metaJson as unknown as DataMeta

/** 搬送量の小さい順（Mk.1 → Mk.6） */
export const belts: Belt[] = logistics.belts
/** 流量の小さい順（Mk.1 → Mk.2） */
export const pipes: Pipe[] = logistics.pipes

export const itemsById: ReadonlyMap<string, Item> = new Map(items.map((i) => [i.id, i]))
export const recipesById: ReadonlyMap<string, Recipe> = new Map(recipes.map((r) => [r.id, r]))
export const buildingsById: ReadonlyMap<string, Building> = new Map(buildings.map((b) => [b.id, b]))
export const extractorsById: ReadonlyMap<string, Extractor> = new Map(
  extractors.map((e) => [e.id, e]),
)
export const generatorsById: ReadonlyMap<string, Generator> = new Map(
  generators.map((g) => [g.id, g]),
)

/** ClassName → ja/en bundled name. String IDs passed to displayName resolve through this map. */
const localizedNamesById: ReadonlyMap<string, LocalizedName> = new Map(
  [...items, ...recipes, ...buildings, ...extractors, ...generators, ...belts, ...pipes].map(
    (entry) => [entry.id, entry.name],
  ),
)

/** Tier-2 name pack generated from the official game Docs (ClassName → display name). */
export type GameNamePack = Readonly<Record<string, string>>

/** Values whose official display name can be resolved. */
export type DisplayNameSource =
  | string
  | LocalizedName
  | { readonly id: string; readonly name: LocalizedName }

export type DisplayNameResolver = (source: DisplayNameSource) => string

/**
 * Resolve an official game name without reading mutable application state.
 *
 * ja/en stay bundled in normalized data. A future Tier-2 locale supplies its lazily loaded
 * ClassName-keyed pack; a missing entry falls back to the bundled English name as required by
 * the i18n plan. Unknown string IDs remain visible as IDs instead of becoming an empty label.
 */
export function resolveDisplayName(
  source: DisplayNameSource,
  locale: string = 'ja',
  pack?: GameNamePack,
): string {
  const id = typeof source === 'string' ? source : 'id' in source ? source.id : undefined
  const name =
    typeof source === 'string'
      ? localizedNamesById.get(source)
      : 'name' in source
        ? source.name
        : source

  if (!name) return id ?? ''
  if (locale === 'ja') return name.ja
  if (locale === 'en') return name.en
  return (id === undefined ? undefined : pack?.[id]) ?? name.en
}

/** Bind locale/pack once so React and export consumers can call `displayName(entity)`. */
export function createDisplayName(
  locale: string = 'ja',
  pack?: GameNamePack,
): DisplayNameResolver {
  return (source) => resolveDisplayName(source, locale, pack)
}

/** Convenience alias for direct, explicit locale-aware calls. */
export const displayName = resolveDisplayName

/** マップから直接採取するアイテム（FGResourceDescriptor 由来・1.1.x では13種） */
export const rawResourceItems: Item[] = items.filter((i) => i.isRawResource)

/** 1サイクルあたりの個数 → 毎分レート。液体・気体は m³/min。 */
export function ratePerMin(amount: number, durationSec: number): number {
  return (amount * SECONDS_PER_MINUTE) / durationSec
}

export type {
  Belt,
  Building,
  DataMeta,
  Extractor,
  Generator,
  GeneratorCategory,
  GeneratorFuel,
  Item,
  ItemAmount,
  Logistics,
  Pipe,
  Recipe,
} from './types.ts'
