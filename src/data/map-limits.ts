/**
 * マップ上の資源ノード数と最大採取レート。
 *
 * これらは Docs.json（レシピ・建物の定義）ではなくワールドデータ側の値なので
 * 自動生成できない。公式Wikiの実測値を手で写し、テストで内部整合性
 * （ノード数 × 純度倍率 × 最高効率の採掘機 × クロック250% = 最大レート）を検証している。
 *
 * 出典（2026-08-07 参照）:
 * - https://satisfactory.wiki.gg/wiki/Resource_node   … 固体ノード・原油ノードの純度別個数と最大レート
 * - https://satisfactory.wiki.gg/wiki/Resource_Well   … 資源井戸のサテライトノード数
 * - https://satisfactory.wiki.gg/wiki/Nitrogen_Gas    … 窒素ガスの純度別内訳
 *
 * NEEDS-REVIEW: ゲームのワールドが更新される（1.2 等）と値が変わる。
 * バージョンを上げるときは必ず出典を引き直すこと。
 */
import { CLOCK_MAX, PURITY_MULTIPLIER } from './constants.ts'

export type ResourcePurity = keyof typeof PURITY_MULTIPLIER

export type NodeCounts = Readonly<Record<ResourcePurity, number>>

export type MapResourceLimit = {
  /** Item.id */
  item: string
  /** 採掘機・石油採掘機を設置できる通常ノードの数 */
  nodes: NodeCounts
  /** 資源井戸のサテライトノードの数（無い資源は全て 0） */
  wells: NodeCounts
  /**
   * マップ全体の最大採取レート（個/分 または m³/min）。
   * 全ノードに最高効率の設備を置き、クロック250%で回した理論値。
   * null = 実質無制限（水は水面にいくらでも汲み上げ機を置けるため）。
   */
  maxRatePerMin: number | null
}

const NONE: NodeCounts = { impure: 0, normal: 0, pure: 0 }

/**
 * 純度別ノード数と最大採取レート。
 * ここに載っていない原料（存在しない）は「マップから採れない」扱いになる。
 */
export const MAP_RESOURCE_LIMITS: readonly MapResourceLimit[] = [
  // --- 固体（採掘機 Mk.3 / 240 個/分 が最高効率） -------------------------
  { item: 'Desc_OreIron_C', nodes: { impure: 39, normal: 42, pure: 46 }, wells: NONE, maxRatePerMin: 92_100 },
  { item: 'Desc_OreCopper_C', nodes: { impure: 13, normal: 29, pure: 13 }, wells: NONE, maxRatePerMin: 36_900 },
  { item: 'Desc_Stone_C', nodes: { impure: 15, normal: 50, pure: 29 }, wells: NONE, maxRatePerMin: 69_300 },
  { item: 'Desc_Coal_C', nodes: { impure: 15, normal: 31, pure: 16 }, wells: NONE, maxRatePerMin: 42_300 },
  { item: 'Desc_OreGold_C', nodes: { impure: 0, normal: 9, pure: 8 }, wells: NONE, maxRatePerMin: 15_000 },
  { item: 'Desc_RawQuartz_C', nodes: { impure: 3, normal: 7, pure: 7 }, wells: NONE, maxRatePerMin: 13_500 },
  { item: 'Desc_Sulfur_C', nodes: { impure: 6, normal: 5, pure: 5 }, wells: NONE, maxRatePerMin: 10_800 },
  { item: 'Desc_OreBauxite_C', nodes: { impure: 5, normal: 6, pure: 6 }, wells: NONE, maxRatePerMin: 12_300 },
  { item: 'Desc_OreUranium_C', nodes: { impure: 3, normal: 2, pure: 0 }, wells: NONE, maxRatePerMin: 2_100 },
  { item: 'Desc_SAM_C', nodes: { impure: 10, normal: 6, pure: 3 }, wells: NONE, maxRatePerMin: 10_200 },

  // --- 液体・気体 ---------------------------------------------------------
  // 原油: ノード 9,900 + 資源井戸 2,700 = 12,600
  {
    item: 'Desc_LiquidOil_C',
    nodes: { impure: 10, normal: 12, pure: 8 },
    wells: { impure: 8, normal: 6, pure: 4 },
    maxRatePerMin: 12_600,
  },
  // 窒素ガス: 資源井戸のみ（6基・サテライト45個）
  {
    item: 'Desc_NitrogenGas_C',
    nodes: NONE,
    wells: { impure: 2, normal: 7, pure: 36 },
    maxRatePerMin: 12_000,
  },
  // 水: 資源井戸からは 13,125 m³/min だが、水面には汲み上げ機を無制限に設置できるため
  // 生産計画上は上限なしとして扱う（NEEDS-REVIEW: 上限を課したい場合は UI で上書きする）
  {
    item: 'Desc_Water_C',
    nodes: NONE,
    wells: { impure: 7, normal: 12, pure: 36 },
    maxRatePerMin: null,
  },
] as const

export const mapResourceLimitsByItem: ReadonlyMap<string, MapResourceLimit> = new Map(
  MAP_RESOURCE_LIMITS.map((r) => [r.item, r]),
)

/**
 * LP のデフォルト原料上限（item → 毎分レート。null = 無制限）。
 * SolveInput.resourceLimits を省略したときに使われる。
 */
export const DEFAULT_RESOURCE_LIMITS: Readonly<Record<string, number | null>> =
  Object.fromEntries(MAP_RESOURCE_LIMITS.map((r) => [r.item, r.maxRatePerMin]))

/** 純度別ノード数の合計。 */
export function totalNodeCount(counts: NodeCounts): number {
  return counts.impure + counts.normal + counts.pure
}

/**
 * 「ノード数 × 純度倍率」の合計。設備1台の基準レートに掛けると総採取レートになる。
 * 例: 鉄鉱石 = 39*0.5 + 42*1 + 46*2 = 153.5 → 採掘機Mk.3(240/min) × 2.5クロック で 92,100/min
 */
export function purityWeightedNodes(counts: NodeCounts): number {
  return (
    counts.impure * PURITY_MULTIPLIER.impure +
    counts.normal * PURITY_MULTIPLIER.normal +
    counts.pure * PURITY_MULTIPLIER.pure
  )
}

/**
 * 純度別ノード数から最大採取レートを再計算する（テストでの検算用）。
 * @param nodeRatePerMin 通常ノードに置いた設備1台の基準レート（採掘機Mk.3=240, 石油採掘機=120）
 * @param wellRatePerMin 資源井戸サテライト1個の基準レート（資源井戸エクストラクター=60）
 * @param maxClock 最大クロック（デフォルト 2.5）
 */
export function computeMaxRatePerMin(
  limit: MapResourceLimit,
  nodeRatePerMin: number,
  wellRatePerMin: number,
  maxClock: number = CLOCK_MAX,
): number {
  return (
    (purityWeightedNodes(limit.nodes) * nodeRatePerMin +
      purityWeightedNodes(limit.wells) * wellRatePerMin) *
    maxClock
  )
}

/**
 * 必要レートを満たすのに要るノード数を純度別に見積もる（Excel「原料」シート用）。
 * 純度の高いノードから順に埋めていき、残りを台数（小数）で返す。
 */
export function nodesRequired(
  ratePerMin: number,
  limit: MapResourceLimit,
  extractorBaseRatePerMin: number,
  clock = 1,
): { purity: ResourcePurity; nodes: number }[] {
  const order: ResourcePurity[] = ['pure', 'normal', 'impure']
  const out: { purity: ResourcePurity; nodes: number }[] = []
  let remaining = ratePerMin
  for (const purity of order) {
    if (remaining <= 0) break
    const perNode = extractorBaseRatePerMin * PURITY_MULTIPLIER[purity] * clock
    if (perNode <= 0) continue
    const available = limit.nodes[purity]
    const needed = Math.min(available, remaining / perNode)
    if (needed > 0) {
      out.push({ purity, nodes: needed })
      remaining -= needed * perNode
    }
  }
  return out
}
