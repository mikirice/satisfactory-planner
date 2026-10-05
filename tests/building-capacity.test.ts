import { expect, it } from 'vitest'
import { solveProduction, planExtraction } from '../src/solver/index.ts'
import { deriveBuildList, buildListItems } from '../src/plan/build-list.ts'
import { buildingBalance, buildingCapacityBalance } from '../src/plan/building-balance.ts'

it('rounds miners to whole buildings and balances full extraction against consumption', async () => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_OreIron_C', ratePerMin: 300 }] })
  if (solution.status !== 'optimal') throw new Error('expected solution')
  const extraction = planExtraction(solution, { minerId: 'Build_MinerMk3_C', clock: 1 })
  // Normal node: Mk.3 240 at 100%, demand 300 requires two buildings.
  const miner = buildListItems(deriveBuildList(solution, extraction))[0]!
  expect(miner.builtCount).toBe(2)
  expect(miner.outputs[0]!.ratePerMin).toBeCloseTo(300)
  expect(miner.outputs[0]!.maximumRatePerMin).toBeCloseTo(480)
  expect(buildingBalance(solution, extraction)[0]!.producedPerMin).toBeCloseTo(300)
  expect(buildingCapacityBalance(solution, extraction)[0]!.producedPerMin).toBeCloseTo(480)
})

it('uses configured manufacturing clock and keeps planned requirements separate', async () => {
  for (const maxClock of [1, 2]) {
    const solution = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], maxClock })
    if (solution.status !== 'optimal') throw new Error('expected solution')
    const constructors = buildListItems(deriveBuildList(solution)).filter(b => b.buildingId === 'Build_ConstructorMk1_C')
    expect(constructors[0]!.clockSpeed).toBe(maxClock)
    expect(constructors[0]!.outputs[0]!.ratePerMin).toBeCloseTo(21)
    expect(constructors[0]!.outputs[0]!.maximumRatePerMin).toBeCloseTo(40)
    expect(buildingBalance(solution, null).find(b => b.item === 'Desc_IronPlate_C')!.producedPerMin).toBeCloseTo(21)
    expect(buildingCapacityBalance(solution, null).find(b => b.item === 'Desc_IronPlate_C')!.producedPerMin).toBeCloseTo(40)
  }
})

it('preserves Somersloop output amplification without amplifying inputs', async () => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], somersloops: 100 })
  if (solution.status !== 'optimal') throw new Error('expected solution')
  const looped = buildListItems(deriveBuildList(solution)).find(b => b.somersloops > 0)!
  expect(looped).toBeDefined()
  const source = solution.steps.find(s => s.recipeId === looped.recipeId && s.somersloops > 0)!
  const ratio = looped.builtCount * solution.maxClock / source.machineCount
  expect(looped.outputs[0]!.maximumRatePerMin).toBeCloseTo(source.outputs[0]!.ratePerMin * ratio)
  expect(looped.inputs[0]!.maximumRatePerMin).toBeCloseTo(source.inputs[0]!.ratePerMin * ratio)
})

it('21 plates at 250% keeps ingot demand 31.5 and capacity 50; selected Mk1 uses demand lines', async () => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], maxClock: 2.5,
    inputs: { Desc_IronIngot_C: 31.5 } })
  if (solution.status !== 'optimal') throw new Error('expected solution')
  const constructor = buildListItems(deriveBuildList(solution, null, { beltId: 'Build_ConveyorBeltMk1_C' }))[0]!
  expect(constructor.builtCount).toBe(1)
  expect(constructor.outputs[0]!.maximumRatePerMin).toBeCloseTo(50)
  expect(constructor.inputs[0]!.ratePerMin).toBeCloseTo(31.5)
  expect(constructor.inputs[0]!.tierId).toBe('Build_ConveyorBeltMk1_C')
  expect(constructor.inputs[0]!.lines).toBe(1)
  expect(buildingBalance(solution, null).find(r => r.item === 'Desc_IronIngot_C')!.netPerMin).toBeCloseTo(0)
})
