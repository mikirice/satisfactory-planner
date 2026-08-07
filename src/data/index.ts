/**
 * 正規化データのエントリポイント。
 * JSON は scripts/build-data.ts の生成物（`npm run build-data` で再生成）。
 */
import itemsJson from './items.json'
import recipesJson from './recipes.json'
import buildingsJson from './buildings.json'
import metaJson from './meta.json'

import type { Building, DataMeta, Item, Recipe } from './types.ts'
import { SECONDS_PER_MINUTE } from './constants.ts'

export const items = itemsJson as unknown as Item[]
export const recipes = recipesJson as unknown as Recipe[]
export const buildings = buildingsJson as unknown as Building[]
export const meta = metaJson as unknown as DataMeta

export const itemsById: ReadonlyMap<string, Item> = new Map(items.map((i) => [i.id, i]))
export const recipesById: ReadonlyMap<string, Recipe> = new Map(recipes.map((r) => [r.id, r]))
export const buildingsById: ReadonlyMap<string, Building> = new Map(buildings.map((b) => [b.id, b]))

/** 1サイクルあたりの個数 → 毎分レート。液体・気体は m³/min。 */
export function ratePerMin(amount: number, durationSec: number): number {
  return (amount * SECONDS_PER_MINUTE) / durationSec
}

export type { Building, DataMeta, Item, ItemAmount, Recipe } from './types.ts'
