import { expect, it } from 'vitest'
import { planExtraction } from '../src/solver/extraction.ts'
import { extractionDisplay } from '../src/plan/extraction-display.ts'
import { nodesFromExtraction } from '../src/plan/extraction-nodes.ts'
const item = 'Desc_OreIron_C'
const input = (ratePerMin: number) => ({ rawResources: [{ item, ratePerMin, limitPerMin: null, usageRatio: null }] })
const options = { minerId: 'Build_MinerMk3_C', purity: 'normal' as const, clock: 1 }
it('automatic groups grow with demand and ordinary integer slack is not idle', () => {
  const first = planExtraction(input(500), options).resources[0]
  const display = extractionDisplay(first)
  expect(display.rows.map(r => r.maximum)).toEqual([240, 240, 240])
  expect(display.rows[0].required).toBeCloseTo(240)
  expect(display.rows[1].required).toBeCloseTo(240)
  expect(display.rows[2].required).toBeCloseTo(20)
  expect(display.idle).toBe(0)
  expect(display.maximum).toBe(720)
  expect(extractionDisplay(planExtraction(input(800), options).resources[0]).rows).toHaveLength(4)
})
it('fixed machines show unused equipment or shortage without changing required demand', () => {
  const nodes = nodesFromExtraction(planExtraction(input(500), options).resources[0])
  const fixed = { ...options, overrides: { [item]: { nodes } } }
  expect(extractionDisplay(planExtraction(input(200), fixed).resources[0]).idle).toBe(2)
  const increased = planExtraction(input(800), fixed).resources[0]
  expect(increased.requiredRatePerMin).toBe(800)
  expect(extractionDisplay(increased).shortfall).toBe(80)
})
