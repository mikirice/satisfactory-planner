import { describe, expect, it } from 'vitest'
import { recipes } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import { selectedRecipeIds } from '../src/plan/recipe-selection.ts'
import { solveProduction } from '../src/solver/index.ts'

const item = 'Desc_IronPlate_C'
async function maximum(input: Parameters<typeof solveProduction>[0]) {
  const solution = await solveProduction(input)
  if (solution.status !== 'optimal') throw new Error('Expected feasible production plan')
  const output = buildPlanGraph(solution).nodes.find(node => node.kind === 'output' && node.item === item)
  if (output?.kind !== 'output') throw new Error('Missing target output')
  return { output, solution }
}
describe('Final-node single-machine baseline output', () => {
  it('keeps the 20/min baseline separate from the 60/min line output', async () => {
    const { output } = await maximum({ targets: [{ item, ratePerMin: 60 }] })
    expect(output.ratePerMin).toBeCloseTo(60)
    expect(output.maxSingleOutputPerMin).toBeCloseTo(20)
  })
  it('does not change the baseline with overclocking or Somersloops', async () => {
    const { output, solution } = await maximum({ targets: [{ item, ratePerMin: 60 }], maxClock: 2.5,
      somersloops: 20, weights: { resources: 0.01, power: 0, buildings: 1 } })
    expect(solution.totalSomersloops).toBeGreaterThan(0)
    expect(output.maxSingleOutputPerMin).toBeCloseTo(20)
  })
  it('uses the selected alternate recipe baseline', async () => {
    const enabledRecipes = selectedRecipeIds(recipes.filter(recipe => !recipe.isAlternate).map(recipe => recipe.id), { [item]: 'Recipe_Alternate_CoatedIronPlate_C' })
    const { output } = await maximum({ targets: [{ item, ratePerMin: 60 }], enabledRecipes })
    expect(output.maxSingleOutputPerMin).toBeCloseTo(75)
  })
})
