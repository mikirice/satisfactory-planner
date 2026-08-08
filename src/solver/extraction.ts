/**
 * 採掘側の計画（仕様書 v1 §7「電力の用途別内訳（製造/採掘）」・§8 原料シート）。
 *
 * LP は「原料が毎分いくら要るか」までしか出さない。実際にプレイするには
 * 「どの採掘機を何台、どの純度のノードに置くか」が要るので、ここで後処理する。
 *
 *   1台あたりの抽出レート = 基準レート × 純度倍率 × クロック
 *
 * ノードは純度の高い順に埋める（nodesRequired と同じ方針）。マップのノード数を
 * 使い切っても足りない場合は shortfallPerMin に残す（LP の上限は最大クロック250%
 * 前提なので、クロック100%だと物理的に足りないケースがありうる）。
 */
import { CLOCK_MAX, CLOCK_MIN, PURITY_MULTIPLIER } from '../data/constants.ts'
import { buildingsById, extractorsById, itemsById } from '../data/index.ts'
import type { ExtractorCategory, ItemAmount, LocalizedName } from '../data/types.ts'
import type { NodeCounts, ResourcePurity } from '../data/map-limits.ts'
import { mapResourceLimitsByItem } from '../data/map-limits.ts'
import { clockedPowerMW, powerShardsForClock } from './overclock.ts'
import type { RawResourceUsage, Solution } from './types.ts'

/** 固体ノード用の採掘機（遅い順）。UI の選択肢もこの順で出す。 */
export const MINER_IDS = ['Build_MinerMk1_C', 'Build_MinerMk2_C', 'Build_MinerMk3_C'] as const
export const DEFAULT_MINER_ID = 'Build_MinerMk3_C'

export const OIL_EXTRACTOR_ID = 'Build_OilPump_C'
export const WATER_EXTRACTOR_ID = 'Build_WaterPump_C'
export const WELL_EXTRACTOR_ID = 'Build_FrackingExtractor_C'
export const WELL_PRESSURIZER_ID = 'Build_FrackingSmasher_C'

/**
 * 資源井戸1基あたりのサテライトノード数（平均）。
 * 加圧機は「井戸1基につき1台」なので、サテライト数から台数を逆算するのに使う。
 *
 * 出典: https://satisfactory.wiki.gg/wiki/Resource_well （2026-08-07 参照）
 *   原油 18サテライト / 3基、窒素ガス 45 / 6基、水 55 / 8基
 * NEEDS-REVIEW: 実際は井戸ごとにサテライト数が違う（2〜10個）。ここでは平均で
 * 概算しているので、加圧機の台数と電力は ±1基程度ずれうる。
 */
const SATELLITES_PER_WELL: Readonly<Record<string, number>> = {
  Desc_LiquidOil_C: 18 / 3,
  Desc_NitrogenGas_C: 45 / 6,
  Desc_Water_C: 55 / 8,
}

const PURITY_ORDER: readonly ResourcePurity[] = ['pure', 'normal', 'impure']

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export type NodeAssignment = {
  purity: ResourcePurity
  /** 割り当てたノード数（小数。端数のノードはアンダークロックで賄う） */
  nodes: number
  /** マップに存在するノード数 */
  availableNodes: number
  /** ノード1個あたりの抽出レート（設備の基準レート × 純度倍率 × クロック） */
  ratePerNodePerMin: number
  /** この純度から得られるレート */
  ratePerMin: number
}

/** 同じ設備をまとめた単位（原油はノード用の抽出機＋資源井戸の2グループになる）。 */
export type ExtractorGroup = {
  /** Extractor.id（= Building.id） */
  extractorId: string
  extractorName: LocalizedName
  category: ExtractorCategory
  /** 純度別の割当。水の汲み上げ機は純度の概念がないので normal 1件にまとめる */
  assignments: NodeAssignment[]
  /** 稼働台数（小数） */
  machineCount: number
  /** 実際に建てる台数（切り上げ） */
  buildingCount: number
  /** このグループで得られるレート */
  ratePerMin: number
  /** クロック速度（100% = 1）。端数の1台だけはこれより低いクロックで回す */
  clockSpeed: number
  /** 消費電力(MW)。端数の1台はアンダークロック分を割り引いて計算する */
  powerMW: number
  /** 必要なパワーシャードの総数（クロック100%以下なら 0）。加圧機ぶんを含む */
  powerShards: number
  /** 建てる台数ぶんの設置面積(m²)。加圧機ぶんを含む */
  footprintAreaM2: number
  /** 資源井戸のみ: 必要な加圧機の台数（概算・SATELLITES_PER_WELL 参照） */
  pressurizerCount?: number
  /** 資源井戸のみ: 加圧機の消費電力(MW) */
  pressurizerPowerMW?: number
}

export type ResourceExtraction = {
  /** Item.id */
  item: string
  itemName: LocalizedName
  /** LP が要求した原料レート */
  requiredRatePerMin: number
  groups: ExtractorGroup[]
  /** 実際に賄えるレート */
  suppliedRatePerMin: number
  /** マップのノードが尽きて賄えなかったレート（0 なら充足） */
  shortfallPerMin: number
  /** この原料の採掘電力(MW)。加圧機を含む */
  powerMW: number
  /** 建てる設備の台数合計。加圧機を含む */
  buildingCount: number
  /** この原料に必要なパワーシャードの総数 */
  powerShards: number
  /** この原料の採掘設備の設置面積(m²) */
  footprintAreaM2: number
}

export type ExtractionPlan = {
  resources: ResourceExtraction[]
  /** 採掘設備の総消費電力(MW) */
  totalPowerMW: number
  /** 採掘設備の総台数（切り上げ・加圧機を含む） */
  totalBuildingCount: number
  /** 採掘設備に必要なパワーシャードの総数 */
  totalPowerShards: number
  /** 採掘設備の設置面積の合計(m²)。通路係数は掛けていない */
  totalFootprintAreaM2: number
  /** 適用した採掘クロック（1 = 100%） */
  clock: number
  /** 採掘設備の建設コスト合計 */
  totalBuildCost: ItemAmount[]
  /** ノード不足で賄えなかった原料（空なら全て充足） */
  shortfalls: { item: string; itemName: LocalizedName; shortfallPerMin: number }[]
}

export type ExtractionOptions = {
  /** 固体ノードに置く採掘機。既定 Build_MinerMk3_C */
  minerId?: string
  /** クロック速度（0.01〜2.5）。既定 1（100%） */
  clock?: number
}

/** planExtraction の入力。Solution をそのまま渡せる。 */
export type ExtractionInput = {
  rawResources: readonly RawResourceUsage[]
}

// ---------------------------------------------------------------------------
// 本体
// ---------------------------------------------------------------------------

/**
 * 原料の必要レートから採掘計画を組み立てる。
 * 純度の高いノードから順に埋め、余った端数は1台のアンダークロックで賄う想定。
 */
export function planExtraction(
  solution: ExtractionInput | Solution,
  options: ExtractionOptions = {},
): ExtractionPlan {
  const minerId = options.minerId ?? DEFAULT_MINER_ID
  const clock = clampClock(options.clock ?? 1)

  const resources: ResourceExtraction[] = []
  for (const raw of solution.rawResources) {
    if (raw.ratePerMin <= 0) continue
    resources.push(planResource(raw.item, raw.ratePerMin, minerId, clock))
  }
  resources.sort((a, b) => b.requiredRatePerMin - a.requiredRatePerMin || a.item.localeCompare(b.item))

  const buildCost = new Map<string, number>()
  let totalPowerMW = 0
  let totalBuildingCount = 0
  let totalPowerShards = 0
  let totalFootprintAreaM2 = 0
  for (const resource of resources) {
    totalPowerMW += resource.powerMW
    totalBuildingCount += resource.buildingCount
    totalPowerShards += resource.powerShards
    totalFootprintAreaM2 += resource.footprintAreaM2
    for (const group of resource.groups) {
      addBuildCost(buildCost, group.extractorId, group.buildingCount)
      if (group.pressurizerCount) {
        addBuildCost(buildCost, WELL_PRESSURIZER_ID, group.pressurizerCount)
      }
    }
  }

  return {
    resources,
    totalPowerMW,
    totalBuildingCount,
    totalPowerShards,
    totalFootprintAreaM2,
    clock,
    totalBuildCost: [...buildCost]
      .map(([item, amount]) => ({ item, amount }))
      .sort((a, b) => b.amount - a.amount || a.item.localeCompare(b.item)),
    shortfalls: resources
      .filter((r) => r.shortfallPerMin > 1e-9)
      .map((r) => ({ item: r.item, itemName: r.itemName, shortfallPerMin: r.shortfallPerMin })),
  }
}

function planResource(
  item: string,
  requiredRatePerMin: number,
  minerId: string,
  clock: number,
): ResourceExtraction {
  const itemName = itemsById.get(item)?.name ?? { ja: item, en: item }
  const limit = mapResourceLimitsByItem.get(item)
  const groups: ExtractorGroup[] = []
  let remaining = requiredRatePerMin

  if (item === 'Desc_Water_C') {
    // 水面にいくらでも置けるので純度もノード数も関係ない
    groups.push(buildUnlimitedGroup(WATER_EXTRACTOR_ID, remaining, clock))
    remaining = 0
  } else if (limit) {
    const nodeExtractorId = itemsById.get(item)?.form === 'solid' ? minerId : OIL_EXTRACTOR_ID
    // 1) 通常ノード（採掘機 / 原油抽出機）
    const nodeGroup = buildNodeGroup(nodeExtractorId, remaining, limit.nodes, clock)
    if (nodeGroup) {
      groups.push(nodeGroup)
      remaining -= nodeGroup.ratePerMin
    }
    // 2) 足りなければ資源井戸（原油・窒素ガス）
    if (remaining > 1e-9) {
      const wellGroup = buildNodeGroup(WELL_EXTRACTOR_ID, remaining, limit.wells, clock, item)
      if (wellGroup) {
        groups.push(wellGroup)
        remaining -= wellGroup.ratePerMin
      }
    }
  }

  const powerMW = groups.reduce((p, g) => p + g.powerMW + (g.pressurizerPowerMW ?? 0), 0)
  const buildingCount = groups.reduce((n, g) => n + g.buildingCount + (g.pressurizerCount ?? 0), 0)
  const suppliedRatePerMin = groups.reduce((r, g) => r + g.ratePerMin, 0)

  return {
    item,
    itemName,
    requiredRatePerMin,
    groups,
    suppliedRatePerMin,
    shortfallPerMin: Math.max(0, requiredRatePerMin - suppliedRatePerMin),
    powerMW,
    buildingCount,
    powerShards: groups.reduce((n, g) => n + g.powerShards, 0),
    footprintAreaM2: groups.reduce((a, g) => a + g.footprintAreaM2, 0),
  }
}

/** 設備1台の設置面積(m²)。建物データに無ければ 0（床面積の概算から外れるだけ）。 */
function footprintAreaOf(buildingId: string): number {
  return buildingsById.get(buildingId)?.footprint.areaM2 ?? 0
}

/** 純度別ノードに割り当てるグループ（採掘機・原油抽出機・資源井戸）。 */
function buildNodeGroup(
  extractorId: string,
  ratePerMin: number,
  counts: NodeCounts,
  clock: number,
  wellItem?: string,
): ExtractorGroup | null {
  const extractor = extractorsById.get(extractorId)
  if (!extractor) throw new Error(`unknown extractor id: ${extractorId}`)
  const assignments = assignPurityNodes(ratePerMin, counts, extractor.baseRatePerMin, clock)
  if (assignments.length === 0) return null

  const machineCount = assignments.reduce((n, a) => n + a.nodes, 0)
  const buildingCount = ceilCount(machineCount)
  const shardsEach = powerShardsForClock(clock)
  const group: ExtractorGroup = {
    extractorId,
    extractorName: extractor.name,
    category: extractor.category,
    assignments,
    machineCount,
    buildingCount,
    ratePerMin: assignments.reduce((r, a) => r + a.ratePerMin, 0),
    clockSpeed: clock,
    powerMW: groupPowerMW(assignments, extractor.powerConsumptionMW, extractor.powerExponent, clock),
    powerShards: buildingCount * shardsEach,
    footprintAreaM2: buildingCount * footprintAreaOf(extractorId),
  }

  if (extractor.category === 'wellExtractor' && wellItem) {
    // 加圧機は井戸1基につき1台。サテライト数の平均から逆算する（概算）
    const perWell = SATELLITES_PER_WELL[wellItem] ?? 1
    const pressurizer = extractorsById.get(WELL_PRESSURIZER_ID)!
    group.pressurizerCount = Math.max(1, ceilCount(group.buildingCount / perWell))
    group.pressurizerPowerMW =
      group.pressurizerCount *
      clockedPowerMW(pressurizer.powerConsumptionMW, clock, pressurizer.powerExponent)
    // 加圧機もサテライトと同じクロックで回す前提（シャードと面積を足す）
    group.powerShards += group.pressurizerCount * shardsEach
    group.footprintAreaM2 += group.pressurizerCount * footprintAreaOf(WELL_PRESSURIZER_ID)
  }
  return group
}

/** ノード数の制限がない設備（水の汲み上げ機）。 */
function buildUnlimitedGroup(
  extractorId: string,
  ratePerMin: number,
  clock: number,
): ExtractorGroup {
  const extractor = extractorsById.get(extractorId)
  if (!extractor) throw new Error(`unknown extractor id: ${extractorId}`)
  const ratePerNodePerMin = extractor.baseRatePerMin * clock
  const machineCount = ratePerNodePerMin > 0 ? ratePerMin / ratePerNodePerMin : 0
  const assignments: NodeAssignment[] = [
    {
      purity: 'normal',
      nodes: machineCount,
      availableNodes: Number.POSITIVE_INFINITY,
      ratePerNodePerMin,
      ratePerMin,
    },
  ]
  const buildingCount = ceilCount(machineCount)
  return {
    extractorId,
    extractorName: extractor.name,
    category: extractor.category,
    assignments,
    machineCount,
    buildingCount,
    ratePerMin,
    clockSpeed: clock,
    powerMW: groupPowerMW(assignments, extractor.powerConsumptionMW, extractor.powerExponent, clock),
    powerShards: buildingCount * powerShardsForClock(clock),
    footprintAreaM2: buildingCount * footprintAreaOf(extractorId),
  }
}

/**
 * 必要レートを純度の高いノードから順に割り当てる。
 * map-limits.ts の nodesRequired と同じ方針だが、資源井戸のサテライトにも使えるよう
 * NodeCounts を直接受け取る。
 */
export function assignPurityNodes(
  ratePerMin: number,
  counts: NodeCounts,
  baseRatePerMin: number,
  clock = 1,
): NodeAssignment[] {
  const out: NodeAssignment[] = []
  let remaining = ratePerMin
  for (const purity of PURITY_ORDER) {
    if (remaining <= 1e-9) break
    const ratePerNodePerMin = baseRatePerMin * PURITY_MULTIPLIER[purity] * clock
    if (ratePerNodePerMin <= 0) continue
    const availableNodes = counts[purity]
    const nodes = Math.min(availableNodes, remaining / ratePerNodePerMin)
    if (nodes <= 0) continue
    out.push({
      purity,
      nodes,
      availableNodes,
      ratePerNodePerMin,
      ratePerMin: nodes * ratePerNodePerMin,
    })
    remaining -= nodes * ratePerNodePerMin
  }
  return out
}

/**
 * グループの消費電力。整数台はクロック c、端数の1台は c×端数 で回す前提。
 * （純度ごとにレートが違うので、端数も純度ごとに出る）
 */
function groupPowerMW(
  assignments: readonly NodeAssignment[],
  basePowerMW: number,
  powerExponent: number,
  clock: number,
): number {
  if (basePowerMW <= 0) return 0
  let power = 0
  for (const a of assignments) {
    const full = Math.floor(a.nodes + 1e-9)
    const remainder = a.nodes - full
    power += full * clockedPowerMW(basePowerMW, clock, powerExponent)
    if (remainder > 1e-9) {
      power += clockedPowerMW(basePowerMW, clampClock(clock * remainder), powerExponent)
    }
  }
  return power
}

function addBuildCost(into: Map<string, number>, buildingId: string, count: number): void {
  const building = buildingsById.get(buildingId)
  if (!building || count <= 0) return
  for (const cost of building.buildCost) {
    into.set(cost.item, (into.get(cost.item) ?? 0) + cost.amount * count)
  }
}

function ceilCount(n: number): number {
  return n <= 0 ? 0 : Math.max(1, Math.ceil(n - 1e-9))
}

function clampClock(clock: number): number {
  if (!Number.isFinite(clock)) return 1
  return Math.min(CLOCK_MAX, Math.max(CLOCK_MIN, clock))
}
