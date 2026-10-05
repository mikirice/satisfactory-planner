import { expect, it } from 'vitest'
import { buildingsById } from '../src/data/index.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

async function solve(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  expect(result.status).toBe('optimal')
  if (result.status !== 'optimal') throw new Error(result.message)
  return result
}

it('one available Somersloop cannot be rounded into two augmented buildings', async () => {
  const result = await solve({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 1 }], somersloops: 1 })
  expect(result.totalSomersloops).toBeLessThanOrEqual(1)
  expect(result.totalSomersloops).toBe(1)
  expect(result.targets[0]!.producedPerMin).toBeCloseTo(1, 6)
  expect(result.rawResources.find(r => r.item === 'Desc_OreIron_C')!.ratePerMin).toBeCloseTo(0.75, 6)
})

it('one augmented building can use its full overclocked capacity without counting extra rings', async () => {
  const result = await solve({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 75 }], maxClock: 2.5, somersloops: 1 })
  expect(result.totalSomersloops).toBe(1)
  expect(result.rawResources.find(r => r.item === 'Desc_OreIron_C')!.ratePerMin).toBeCloseTo(56.25, 6)
  for (const step of result.steps.filter(s => s.somersloops > 0)) {
    expect(step.builtCount).toBe(1)
    expect(step.machineCount).toBeGreaterThan(1)
    expect(step.clockSpeed).toBe(2.5)
  }
})

it('maximize also respects the integer ring budget', async () => {
  const result = await solve({ targets: [], maximize: 'Desc_IronPlate_C',
    resourceLimits: { Desc_OreIron_C: 10 }, somersloops: 1,
    enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'] })
  expect(result.totalSomersloops).toBeLessThanOrEqual(1)
  expect(result.maximizedOutput!.ratePerMin).toBeCloseTo(40 / 3, 5)
})

it('small averaged demand retains legal configured clock without changing resource demand', async () => {
  const result = await solve({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 0.1 }] })
  expect(result.targets[0]!.producedPerMin).toBeCloseTo(0.1, 8)
  expect(result.rawResources.find(r => r.item === 'Desc_OreIron_C')!.ratePerMin).toBeCloseTo(0.15, 8)
  for (const step of result.steps) expect(step.clockSpeed).toBe(1)
  expect(result.totalClockedPowerMW).toBe(8)
})

it('factory power coverage supplies configured capacity power, including added fuel buildings', async () => {
  const result = await solve({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], maxClock: 2.5,
    power: { generators: ['Build_GeneratorCoal_C'], coverFactoryPower: true } })
  expect(result.totalClockedPowerMW).toBeCloseTo(2 * 4 * Math.pow(2.5,
    buildingsById.get('Build_ConstructorMk1_C')!.powerExponent), 6)
  expect(result.powerGeneration!.factoryPowerMW).toBeCloseTo(result.totalClockedPowerMW, 6)
  expect(result.powerGeneration!.netMW).toBeGreaterThanOrEqual(-1e-6)
  expect(result.powerGeneration!.totalMW).toBeGreaterThanOrEqual(result.totalClockedPowerMW - 1e-6)
  expect(result.targets[0]!.producedPerMin).toBeCloseTo(21, 6)
})

it.each(['power', 'buildings'] as const)('optimization of %s uses installed capacity rather than fractional demand', async (objective) => {
  const result = await solve({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }],
    maxClock: 2.5, weights: { resources: 0, power: objective === 'power' ? 1 : 0,
      buildings: objective === 'buildings' ? 1 : 0 } })
  const expected = objective === 'power' ? result.totalClockedPowerMW : result.totalBuildingCount
  // Tiny epsilon only breaks ties on required throughput and raw input usage.
  expect(result.objectiveValue).toBeCloseTo(expected, 3)
  expect(result.targets[0]!.producedPerMin).toBeCloseTo(21, 6)
  expect(result.totalBuildingCount).toBe(2)
})
