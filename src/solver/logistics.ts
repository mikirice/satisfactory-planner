/**
 * ベルト / パイプの本数換算（仕様書 v1 §7 の独自項目）。
 * 速度データは Docs.json 由来（src/data/logistics.json）。
 */
import { belts, itemsById, pipes } from '../data/index.ts'
import type { Belt, Pipe } from '../data/types.ts'

export type TransportRequirement = {
  /** 使う搬送手段 */
  id: string
  nameJa: string
  /** 1本あたりの上限（個/分 または m³/min） */
  capacityPerMin: number
  /** 必要本数（整数・切り上げ） */
  lines: number
  /** 上限に対する使用率（0〜1）。最後の1本を含めた平均ではなく満載換算 */
  utilization: number
}

/** そのアイテムを運ぶのはベルトかパイプか。 */
export function transportKind(itemId: string): 'belt' | 'pipe' {
  return itemsById.get(itemId)?.form === 'solid' ? 'belt' : 'pipe'
}

/** 指定レートを運ぶのに必要な本数。tier 未指定なら最速の Mk を使う。 */
export function linesRequired(
  ratePerMin: number,
  itemId: string,
  tierId?: string,
): TransportRequirement {
  const kind = transportKind(itemId)
  const candidates: (Belt | Pipe)[] = kind === 'belt' ? belts : pipes
  const chosen = tierId ? candidates.find((c) => c.id === tierId) : candidates.at(-1)
  if (!chosen) throw new Error(`unknown transport tier: ${tierId ?? '(fastest)'}`)
  const capacityPerMin = 'itemsPerMin' in chosen ? chosen.itemsPerMin : chosen.m3PerMin
  const lines = ratePerMin <= 0 ? 0 : Math.ceil(ratePerMin / capacityPerMin - 1e-9)
  return {
    id: chosen.id,
    nameJa: chosen.name.ja,
    capacityPerMin,
    lines,
    utilization: lines === 0 ? 0 : ratePerMin / (lines * capacityPerMin),
  }
}

/**
 * 各 Mk で必要になる本数を一覧で返す（遅い順）。
 * 「Mk.4 なら3本、Mk.5 なら2本」といった比較表示に使う。
 */
export function linesRequiredByTier(ratePerMin: number, itemId: string): TransportRequirement[] {
  const candidates = transportKind(itemId) === 'belt' ? belts : pipes
  return candidates.map((c) => linesRequired(ratePerMin, itemId, c.id))
}
