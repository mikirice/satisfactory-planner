import { expect, it } from 'vitest'
import { buildPlanGraph } from '../src/plan/graph.ts'
import { nodeRows } from '../src/ui/flow-layout.ts'
import { solveProduction, planExtraction } from '../src/solver/index.ts'
import { recipesById, ratePerMin } from '../src/data/index.ts'

it.each([1, 2.5])('shows configured single-machine limits on recipe outputs without changing demand at %s', async maxClock => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], maxClock })
  if (solution.status !== 'optimal') throw Error('expected solution')
  const graph = buildPlanGraph(solution)
  const producer = graph.nodes.find(n => n.kind === 'recipe' && n.recipeId === 'Recipe_IronPlate_C')!
  if (producer.kind !== 'recipe') throw Error('expected recipe')
  expect(producer.outputs[0].singleOutputLimit).toBeCloseTo(20 * maxClock)
  expect(producer.outputs[0].ratePerMin).toBeCloseTo(21)
  expect(producer.inputs[0].ratePerMin).toBeCloseTo(31.5)
  const final = graph.nodes.find(n => n.kind === 'output' && n.item === 'Desc_IronPlate_C')!
  expect(nodeRows(final).some(r => r.id === 'rate:single-max')).toBe(false)
})

it('each output includes configured Somersloop amplification but inputs remain planned rates', async () => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 21 }], maxClock: 2.5, somersloops: 100 })
  if (solution.status !== 'optimal') throw Error('expected solution')
  const graph = buildPlanGraph(solution)
  const looped = graph.nodes.filter(n => n.kind === 'recipe' && n.somersloops > 0)
  expect(looped.length).toBeGreaterThan(0)
  for (const node of looped) {
    if (node.kind !== 'recipe') continue
    const recipe = recipesById.get(node.recipeId)!
    for (const flow of node.outputs) {
      const amount = recipe.products.filter(p => p.item === flow.item).reduce((s, p) => s + p.amount, 0)
      expect(flow.singleOutputLimit).toBeCloseTo(ratePerMin(amount, recipe.durationSec) * node.clock * 2)
    }
  }
})

it('source ranges follow custom extraction settings; external supplies have no limit', async () => {
  const solution = await solveProduction({ targets: [{ item: 'Desc_OreIron_C', ratePerMin: 300 }, { item: 'Desc_CopperIngot_C', ratePerMin: 5 }], inputs: { Desc_CopperIngot_C: 5 } })
  if (solution.status !== 'optimal') throw Error('expected solution')
  const extraction = planExtraction(solution, { overrides: { Desc_OreIron_C: { nodes: [
    { extractorId: 'Build_MinerMk3_C', purity: 'impure', clock: 1, count: 1 },
    { extractorId: 'Build_MinerMk3_C', purity: 'pure', clock: 1.5, count: 1 },
  ] } } })
  const graph = buildPlanGraph(solution, { extraction })
  const source = graph.nodes.find(n => n.kind === 'source' && !n.external)!
  if (source.kind !== 'source') throw Error('expected source')
  expect(source.singleOutputLimit).toEqual({ min: 120, max: 720 })
  expect(nodeRows(source).some(r => r.id === 'rate:single-max')).toBe(false)
  const external = graph.nodes.find(n => n.kind === 'source' && n.external)!
  if (external.kind !== 'source') throw Error('expected external')
  expect(external.singleOutputLimit).toBeUndefined()
})
