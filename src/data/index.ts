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
