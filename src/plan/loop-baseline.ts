import { recipes } from '../data/index.ts'
import { solveProduction } from '../solver/index.ts'
import type { ObjectiveWeights, SolveInput, SolveResult } from '../solver/index.ts'
import { SAMPLE_PLANS } from './samples.ts'
import type { SamplePlan } from './samples.ts'
import { parsePlanSnapshot } from './serialize.ts'
import type { PlanSnapshot } from './serialize.ts'

const baseRecipeIds = recipes.filter((recipe) => !recipe.isAlternate).map((recipe) => recipe.id)
const cache = new Map<string, Promise<SolveResult>>()

const objectiveWeights: Record<string, ObjectiveWeights> = {
  resources: { resources: 1, power: 0, buildings: 0 },
  power: { resources: 0.01, power: 1, buildings: 0 },
  buildings: { resources: 0.01, power: 0, buildings: 1 },
}

/**
 * テンプレートに比較の基準があるか。
 * - `baselineId` があれば、その id のテンプレートを解いた結果が基準（段階テンプレート）
 * - なければ、代替レシピを有効にしているテンプレートだけ「代替レシピなしの同じ目標」が基準
 */
export function hasLoopBaseline(sample: SamplePlan): boolean {
  return sample.baselineId !== undefined || sample.snapshot.a.length > 0
}

/** `baselineId` が指すテンプレート。無い id を指していたら例外（tests/samples.test.ts で固定）。 */
export function loopBaselineSample(sample: SamplePlan): SamplePlan | undefined {
  if (sample.baselineId === undefined) return undefined
  const baseline = SAMPLE_PLANS.find((entry) => entry.id === sample.baselineId)
  if (baseline === undefined) throw new Error(`unknown baseline template: ${sample.baselineId}`)
  return baseline
}

/**
 * 比較用の基準値を返す。
 * 基準テンプレートがあればそれをそのままの設定で解き、なければ同じテンプレートを
 * 代替レシピなしで解く。
 */
export function getLoopBaseline(sample: SamplePlan): Promise<SolveResult> {
  const cached = cache.get(sample.id)
  if (cached !== undefined) return cached

  const baseline = loopBaselineSample(sample)
  const request = (
    baseline === undefined
      ? solveSampleSnapshot(sample.snapshot, { alternates: false })
      : solveSampleSnapshot(baseline.snapshot, { alternates: true })
  ).catch((error: unknown) => {
    cache.delete(sample.id)
    throw error
  })
  cache.set(sample.id, request)
  return request
}

/**
 * テンプレートの snapshot をソルバー入力に直して解く。store の `toSolveInput` と同じ項目を渡す
 * （発電の副産物「残さない」も含む）。`alternates: false` は代替レシピを全部外した比較用。
 */
export function solveSampleSnapshot(
  snapshot: PlanSnapshot,
  options: { alternates: boolean },
): Promise<SolveResult> {
  return solveProduction(sampleSolveInput(snapshot, options))
}

export function sampleSolveInput(
  snapshot: PlanSnapshot,
  options: { alternates: boolean },
): SolveInput {
  const parsed = parsePlanSnapshot(snapshot)
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
  const zeroSurplusByproducts = Object.keys(input.zeroSurplusByproducts)

  return {
    targets: input.targets
      .filter((target) => target.mode !== 'max')
      .map(({ item, ratePerMin }) => ({ item, ratePerMin })),
    ...(maximize === undefined ? {} : { maximize }),
    enabledRecipes: [
      ...baseRecipeIds,
      ...(options.alternates ? Object.keys(input.enabledAlternates) : []),
    ],
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
      ...(zeroSurplusByproducts.length === 0 ? {} : { zeroSurplusByproducts }),
    },
  }
}
