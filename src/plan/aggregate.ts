/**
 * 結果の集計（結果テーブルと Excel 出力の共通ロジック）。
 *
 * 画面（src/ui/*）と Excel（src/export/excel.ts）で同じ数字を出すために、
 * 「稼働台数 → 建てる台数」「機械種別のグルーピング」「建設コストの合成」は
 * ここに一本化する。二重実装すると片方だけ直して数字がズレる。
 */
import { buildingsById } from '../data/index.ts'
import type { ExtractionPlan, Solution, SolutionStep } from '../solver/index.ts'

/** 稼働台数（小数）→ 実際に建てる台数。0 より大きければ最低1台。 */
export function builtCount(machineCount: number): number {
  return machineCount <= 0 ? 0 : Math.max(1, Math.ceil(machineCount - 1e-9))
}

export type BuildingGroup = {
  buildingId: string
  buildingNameJa: string
  steps: SolutionStep[]
  machineCount: number
  buildingCount: number
  powerMW: number
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
      }
      groups.set(step.buildingId, group)
    }
    group.steps.push(step)
    group.machineCount += step.machineCount
    group.buildingCount += builtCount(step.machineCount)
    group.powerMW += step.powerMW
  }
  return [...groups.values()].sort(
    (a, b) => b.powerMW - a.powerMW || a.buildingId.localeCompare(b.buildingId),
  )
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
