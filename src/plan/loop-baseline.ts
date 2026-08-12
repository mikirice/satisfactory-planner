import { recipes } from '../data/index.ts'
import { solveProduction } from '../solver/index.ts'
import type { ObjectiveWeights, SolveResult } from '../solver/index.ts'
import type { SamplePlan } from './samples.ts'
import { parsePlanSnapshot } from './serialize.ts'

const baseRecipeIds = recipes.filter((recipe) => !recipe.isAlternate).map((recipe) => recipe.id)
const cache = new Map<string, Promise<SolveResult>>()

const objectiveWeights: Record<string, ObjectiveWeights> = {
  resources: { resources: 1, power: 0, buildings: 0 },
  power: { resources: 0.01, power: 1, buildings: 0 },
  buildings: { resources: 0.01, power: 0, buildings: 1 },
}

/** 同じテンプレートを代替レシピなしで解き、比較用の基準値を返す。 */
export function getLoopBaseline(sample: SamplePlan): Promise<SolveResult> {
  const cached = cache.get(sample.id)
  if (cached !== undefined) return cached

  const request = solveWithoutAlternates(sample).catch((error: unknown) => {
    cache.delete(sample.id)
    throw error
  })
  cache.set(sample.id, request)
  return request
}

async function solveWithoutAlternates(sample: SamplePlan): Promise<SolveResult> {
  const parsed = parsePlanSnapshot(sample.snapshot)
  if (!parsed.ok) throw new Error(parsed.error)
  const { input } = parsed
  const maximize = input.targets.find((target) => target.mode === 'max')?.item

  const inputs: Record<string, number> = {}
  for (const entry of input.inputs) {
    inputs[entry.item] = (inputs[entry.item] ?? 0) + entry.ratePerMin
  }

  const fuels = Object.fromEntries(
    Object.entries(input.enabledFuels).map(([generator, selected]) => [
      generator,
      Object.keys(selected),
    ]),
  )

  return solveProduction({
    targets: input.targets
      .filter((target) => target.mode !== 'max')
      .map(({ item, ratePerMin }) => ({ item, ratePerMin })),
    ...(maximize === undefined ? {} : { maximize }),
    enabledRecipes: baseRecipeIds,
    resourceLimits: input.limitOverrides,
    inputs,
    weights: objectiveWeights[input.objective],
    maxClock: input.maxClock,
    somersloops: input.somersloops,
    power: {
      generators: Object.keys(input.enabledGenerators),
      ...(Object.keys(fuels).length === 0 ? {} : { fuels }),
      targetMW: input.powerTargetMW,
      coverFactoryPower: input.coverFactoryPower,
    },
  })
}
