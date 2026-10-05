import type { ExtractionPlan, ItemBalance, Solution } from '../solver/index.ts'
import { buildListItems, deriveBuildList } from './build-list.ts'

/** Capacity balance at the configured clock, without throttling fractional machines. */
export function buildingCapacityBalance(solution: Solution, extraction: ExtractionPlan | null): ItemBalance[] {
  const rows = new Map<string, ItemBalance>()
  const row = (item: string) => {
    if (!rows.has(item)) rows.set(item, { item, producedPerMin: 0, consumedPerMin: 0, suppliedPerMin: 0, netPerMin: 0 })
    return rows.get(item)!
  }
  for (const building of buildListItems(deriveBuildList(solution, extraction))) {
    for (const flow of building.inputs) row(flow.item).consumedPerMin += flow.maximumRatePerMin ?? flow.ratePerMin
    for (const flow of building.outputs) row(flow.item).producedPerMin += flow.maximumRatePerMin ?? flow.ratePerMin
  }
  // External inputs are fixed supplies; extraction belongs to building production.
  for (const input of solution.externalInputs) row(input.item).suppliedPerMin += input.availablePerMin
  if (extraction === null) {
    for (const resource of solution.rawResources) row(resource.item).suppliedPerMin += resource.ratePerMin
  }
  for (const balance of rows.values()) balance.netPerMin = balance.producedPerMin + balance.suppliedPerMin - balance.consumedPerMin
  return [...rows.values()]
}

/** Planned demand balance; capacity is separate and never inflates upstream demand. */
export function buildingBalance(solution: Solution, extraction: ExtractionPlan | null): ItemBalance[] {
  const rows = solution.itemBalance.map((r) => ({ ...r }))
  for (const raw of solution.rawResources) {
    const row = rows.find((r) => r.item === raw.item)
    if (!row || !extraction) continue
    const supplied = extraction.resources.find((r) => r.item === raw.item)?.suppliedRatePerMin ?? 0
    row.suppliedPerMin -= raw.ratePerMin
    row.producedPerMin += supplied
    row.netPerMin = row.producedPerMin + row.suppliedPerMin - row.consumedPerMin
  }
  return rows
}
