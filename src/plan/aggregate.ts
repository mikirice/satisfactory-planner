/**
 * 結果の集計（結果テーブルと Excel 出力の共通ロジック）。
 *
 * 画面（src/ui/*）と Excel（src/export/excel.ts）で同じ数字を出すために、
 * 「稼働台数 → 建てる台数」「機械種別のグルーピング」「建設コストの合成」は
 * ここに一本化する。二重実装すると片方だけ直して数字がズレる。
 */
import { buildingsById } from '../data/index.ts'
import { AISLE_AREA_FACTOR, FOUNDATION_AREA_M2 } from '../data/constants.ts'
import type { ExtractionPlan, Solution, SolutionStep } from '../solver/index.ts'

/**
 * 稼働台数（小数）→ 実際に建てる台数。0 より大きければ最低1台。
 * `maxClock` を上げると1台あたりの処理量が増えるので台数は減る（既定 1 = 100%）。
 */
export function builtCount(machineCount: number, maxClock = 1): number {
  return machineCount <= 0 ? 0 : Math.max(1, Math.ceil(machineCount / maxClock - 1e-9))
}

/**
 * 表・グラフの行キー。Somersloop バリアントは同じレシピの通常ステップと併存しうるので、
 * レシピIDだけでは一意にならない。
 */
export function stepKey(step: SolutionStep): string {
  return step.somersloops > 0 ? `${step.recipeId}:sloop` : step.recipeId
}

export type BuildingGroup = {
  buildingId: string
  buildingNameJa: string
  steps: SolutionStep[]
  machineCount: number
  buildingCount: number
  /** クロック適用後の消費電力(MW) */
  powerMW: number
  powerShards: number
  somersloops: number
  footprintAreaM2: number
}

/** 生産ステップを機械種別でまとめる（消費電力の大きい順）。 */
export function groupByBuilding(steps: readonly SolutionStep[]): BuildingGroup[] {
  const groups = new Map<string, BuildingGroup>()
  for (const step of steps) {
    let group = groups.get(step.buildingId)
    if (!group) {
      group = {
        buildingId: step.buildingId,
        buildingNameJa: buildingsById.get(step.buildingId)?.name.ja ?? step.buildingName.ja,
        steps: [],
        machineCount: 0,
        buildingCount: 0,
        powerMW: 0,
        powerShards: 0,
        somersloops: 0,
        footprintAreaM2: 0,
      }
      groups.set(step.buildingId, group)
    }
    group.steps.push(step)
    group.machineCount += step.machineCount
    group.buildingCount += step.builtCount
    group.powerMW += step.clockedPowerMW
    group.powerShards += step.powerShards
    group.somersloops += step.somersloops
    group.footprintAreaM2 += step.footprintAreaM2
  }
  return [...groups.values()].sort(
    (a, b) => b.powerMW - a.powerMW || a.buildingId.localeCompare(b.buildingId),
  )
}

/**
 * 床面積の概算（仕様: 建物の設置面積合計 × 通路係数）。
 *
 * **概算**であることが要点。ここで出るのは「建物のクリアランス箱を平面に投影した
 * 面積の合計」に通路ぶんの係数を掛けた値で、実際のレイアウト（縦積み・詰め方・
 * ベルトの取り回し）でいくらでも変わる。
 */
export type FootprintEstimate = {
  /** 製造建物の設置面積合計(m²) */
  manufacturingAreaM2: number
  /** 採掘設備の設置面積合計(m²) */
  extractionAreaM2: number
  /** 設置面積の合計(m²)。通路係数は掛けていない */
  buildingAreaM2: number
  /** 通路係数を掛けた概算床面積(m²) */
  totalAreaM2: number
  /** 通路係数（AISLE_AREA_FACTOR） */
  aisleFactor: number
  /** ファウンデーション換算の枚数（8m × 8m） */
  foundations: number
}

export function estimateFootprint(
  solution: Solution,
  extraction: ExtractionPlan | null,
): FootprintEstimate {
  const manufacturingAreaM2 = solution.totalFootprintAreaM2
  const extractionAreaM2 = extraction?.totalFootprintAreaM2 ?? 0
  const buildingAreaM2 = manufacturingAreaM2 + extractionAreaM2
  const totalAreaM2 = buildingAreaM2 * AISLE_AREA_FACTOR
  return {
    manufacturingAreaM2,
    extractionAreaM2,
    buildingAreaM2,
    totalAreaM2,
    aisleFactor: AISLE_AREA_FACTOR,
    // 面積0のときに -0 を返さないよう max を噛ませる
    foundations: Math.max(0, Math.ceil(totalAreaM2 / FOUNDATION_AREA_M2 - 1e-9)),
  }
}

export type BuildCostRow = {
  item: string
  manufacturing: number
  extraction: number
  total: number
}

/** 製造建物と採掘設備の建設コストを1つの表にまとめる（合計の大きい順）。 */
export function mergeBuildCost(
  solution: Solution,
  extraction: ExtractionPlan | null,
): BuildCostRow[] {
  const rows = new Map<string, BuildCostRow>()
  const rowFor = (item: string): BuildCostRow => {
    let row = rows.get(item)
    if (!row) {
      row = { item, manufacturing: 0, extraction: 0, total: 0 }
      rows.set(item, row)
    }
    return row
  }
  for (const cost of solution.totalBuildCost) rowFor(cost.item).manufacturing += cost.amount
  for (const cost of extraction?.totalBuildCost ?? []) rowFor(cost.item).extraction += cost.amount
  for (const row of rows.values()) row.total = row.manufacturing + row.extraction
  return [...rows.values()].sort((a, b) => b.total - a.total || a.item.localeCompare(b.item))
}
