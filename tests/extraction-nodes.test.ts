import { expect, it } from 'vitest'
import { materializeExtractionNodes, singleMachineNodes } from '../src/plan/extraction-nodes.ts'
import { planExtraction } from '../src/solver/extraction.ts'
import { encodePlan, decodePlan, toPlanSnapshot } from '../src/plan/serialize.ts'
import { usePlanner } from '../src/store/planner.ts'

const iron = 'Desc_OreIron_C'
const mk3 = 'Build_MinerMk3_C'
const input = (ratePerMin: number) => ({ rawResources: [{ item: iron, ratePerMin, limitPerMin: null, usageRatio: null }] })
it('defaults create one group per machine; later demand and sidebar changes preserve installed nodes', () => {
  const overrides = materializeExtractionNodes(input(300), { minerId: mk3, purity: 'normal', clock: 1 })
  expect(overrides[iron].nodes).toEqual(Array.from({ length: 2 }, () => ({ extractorId: mk3, purity: 'normal', clock: 1, count: 1 })))
  const unchanged = materializeExtractionNodes(input(600), { clock: 2, purity: 'pure', overrides })
  expect(unchanged).toEqual(overrides)
  expect(planExtraction(input(600), { overrides: unchanged }).shortfalls[0].shortfallPerMin).toBe(120)
})
it('legacy multi-machine and automatic settings migrate without changing their capacity', () => {
  const legacy = { [iron]: { nodes: [{ extractorId: mk3, purity: 'pure' as const, clock: 1.5, count: 3 }] } }
  const migrated = materializeExtractionNodes(input(300), { overrides: legacy })
  expect(migrated[iron].nodes).toHaveLength(3)
  expect(migrated[iron].nodes!.every(n => n.count === 1)).toBe(true)
  expect(planExtraction(input(300), { overrides: migrated }).totalPowerMW).toBeCloseTo(planExtraction(input(300), { overrides: legacy }).totalPowerMW)
  const automatic = materializeExtractionNodes(input(300), { overrides: { [iron]: { purity: 'impure', clock: 1, minerId: mk3 } } })
  expect(automatic[iron].nodes).toHaveLength(3)
  const saved = decodePlan(encodePlan(toPlanSnapshot({ ...usePlanner.getState(), extractionOverrides: migrated })))
  if (!saved.ok) throw new Error('expected valid snapshot')
  expect(saved.input.extractionOverrides).toEqual(migrated)
})
it('preserves more than 100 single-machine nodes and explicit empty configurations', () => {
  const nodes = singleMachineNodes([{ extractorId: 'Build_WaterPump_C', purity: 'normal', clock: 1, count: 150 }])
  const water = { rawResources: [{ item: 'Desc_Water_C', ratePerMin: 18000, limitPerMin: null, usageRatio: null }] }
  expect(planExtraction(water, { overrides: { Desc_Water_C: { nodes } } }).totalBuildingCount).toBe(150)
  expect(materializeExtractionNodes(input(300), { overrides: { [iron]: { nodes: [] } } })[iron].nodes).toEqual([])
})
