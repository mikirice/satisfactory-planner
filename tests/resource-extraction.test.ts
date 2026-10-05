import { expect, it } from 'vitest'
import { planExtraction, normalizeExtractionOverrides, solveProduction } from '../src/solver/index.ts'
import { deriveBuildList, buildListItems } from '../src/plan/build-list.ts'
import { buildingCapacityBalance } from '../src/plan/building-balance.ts'
import { toPlanSnapshot, encodePlan, decodePlan } from '../src/plan/serialize.ts'
import { usePlanner, cancelPendingSolve } from '../src/store/planner.ts'

const iron = 'Desc_OreIron_C'
const copper = 'Desc_OreCopper_C'
const mk3 = 'Build_MinerMk3_C'
const raw = (entries: [string, number][]) => ({ rawResources: entries.map(([item, ratePerMin]) => ({ item, ratePerMin, limitPerMin: null, usageRatio: null })) })

it('individual purity and clock override only their resource; requirements stay demand-based', () => {
  const plan = planExtraction(raw([[iron, 300], [copper, 300]]), {
    purity: 'normal', clock: 1, overrides: { [iron]: { purity: 'pure', clock: 1.5, minerId: mk3 } },
  })
  const i = plan.resources.find(r => r.item === iron)!
  const c = plan.resources.find(r => r.item === copper)!
  expect(i.buildingCount).toBe(1)
  expect(i.groups[0].assignments[0].ratePerNodePerMin).toBe(720)
  expect(i.suppliedRatePerMin).toBe(300)
  expect(c.buildingCount).toBe(2)
  expect(c.groups[0].assignments[0].ratePerNodePerMin).toBe(240)
})

it('mixed nodes sum capacity but do not expand upstream demand; shortages remain visible', () => {
  const overrides = { [iron]: { nodes: [
    { extractorId: mk3, purity: 'impure' as const, clock: 1, count: 1 },
    { extractorId: mk3, purity: 'pure' as const, clock: 1, count: 1 },
  ] } }
  const plan = planExtraction(raw([[iron, 300]]), { overrides })
  expect(plan.totalBuildingCount).toBe(2)
  expect(plan.totalPowerMW).toBe(90)
  expect(plan.totalBuildCost.length).toBeGreaterThan(0)
  expect(plan.resources[0].groups.map(g => g.ratePerMin)).toEqual([120, 180])
  expect(plan.resources[0].groups.map(g => g.maximumRatePerMin)).toEqual([120, 480])
  const shortage = planExtraction(raw([[iron, 700]]), { overrides })
  expect(shortage.resources[0].suppliedRatePerMin).toBe(600)
  expect(shortage.shortfalls[0].shortfallPerMin).toBe(100)
  const belt = planExtraction(raw([[iron, 300]]), { overrides, beltId: 'Build_ConveyorBeltMk1_C' })
  expect(belt.resources[0].suppliedRatePerMin).toBe(120)
  expect(belt.shortfalls[0].shortfallPerMin).toBe(180)
})

it('idle configured buildings retain costs, power and upper limits in build and balance views', async () => {
  const solution = await solveProduction({ targets: [{ item: iron, ratePerMin: 100 }] })
  if (solution.status !== 'optimal') throw new Error('expected optimal')
  const extraction = planExtraction(solution, { overrides: { [iron]: { nodes: [
    { extractorId: mk3, purity: 'normal', clock: 1, count: 1 },
    { extractorId: mk3, purity: 'pure', clock: 2, count: 1 },
  ] } } })
  const buildings = buildListItems(deriveBuildList(solution, extraction))
  expect(buildings).toHaveLength(2)
  expect(buildings.reduce((s, b) => s + b.outputs[0].ratePerMin, 0)).toBeCloseTo(100)
  expect(buildings.reduce((s, b) => s + b.outputs[0].maximumRatePerMin!, 0)).toBe(1200)
  expect(new Set(buildings.map(b => b.id)).size).toBe(2)
  expect(buildingCapacityBalance(solution, extraction).find(r => r.item === iron)!.producedPerMin).toBe(1200)
  expect(extraction.totalPowerShards).toBeGreaterThan(0)
  expect(extraction.totalPowerMW).toBeGreaterThan(90)
})

it('custom settings survive sharing and restoration; old plans clear overrides', () => {
  const extractionOverrides = { [iron]: { nodes: [{ extractorId: mk3, purity: 'pure' as const, clock: 1.5, count: 2 }] } }
  const snapshot = toPlanSnapshot({ ...usePlanner.getState(), extractionOverrides })
  const parsed = decodePlan(encodePlan(snapshot))
  expect(parsed.ok).toBe(true)
  if (!parsed.ok) return
  expect(parsed.input.extractionOverrides).toEqual(extractionOverrides)
  usePlanner.getState().applyPlan(parsed.input)
  expect(usePlanner.getState().extractionOverrides).toEqual(extractionOverrides)
  delete snapshot.h
  const old = decodePlan(encodePlan(snapshot))
  if (!old.ok) throw new Error('expected old plan')
  usePlanner.getState().applyPlan(old.input)
  expect(usePlanner.getState().extractionOverrides).toEqual({})
  cancelPendingSolve()
})

it('rejects invalid imported machines, clocks and counts without affecting other resources', () => {
  expect(normalizeExtractionOverrides({ [iron]: { nodes: [
    { extractorId: 'Build_WaterPump_C', purity: 'pure', clock: 1, count: 1 },
    { extractorId: mk3, purity: 'pure', clock: NaN, count: 1 },
    { extractorId: mk3, purity: 'pure', clock: 1, count: -2 },
  ] }, bogus: { purity: 'pure', clock: 1 } })).toEqual({ [iron]: { nodes: [] } })
  const empty = planExtraction(raw([[iron, 300]]), { overrides: { [iron]: { nodes: [] } } })
  expect(empty.totalBuildingCount).toBe(0)
  expect(empty.shortfalls[0].shortfallPerMin).toBe(300)
})
