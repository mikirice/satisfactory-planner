/**
 * サンプルプラン（src/plan/samples.ts）の検証。
 *
 * サンプルは「初見の人が最初に押すボタン」なので、押した結果が実行不能だと最悪の第一印象になる。
 * ゲームデータ更新でアイテム/レシピIDが消えたらここで落ちるように、
 *  1. スキーマとして警告ゼロで復元できる（＝IDが全部実在する）
 *  2. 実際に解が出て、目標レートを満たす
 *  3. 有効にした代替レシピが**全部その解で使われている**（説明と中身が食い違わない）
 * まで固定する。
 */
import { describe, expect, it } from 'vitest'

import { generatorsById, itemsById, recipes, recipesById } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import { SAMPLE_PLANS, TEMPLATE_CATEGORIES } from '../src/plan/samples.ts'
import { PLAN_SCHEMA_VERSION, parsePlanSnapshot } from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

async function solveSample(sample: (typeof SAMPLE_PLANS)[number]): Promise<Solution> {
  const parsed = parsePlanSnapshot(sample.snapshot)
  if (!parsed.ok) throw new Error(parsed.error)
  const { input } = parsed
  const fuels = Object.fromEntries(
    Object.entries(input.enabledFuels).map(([generator, selected]) => [
      generator,
      Object.keys(selected),
    ]),
  )
  const solveInput: SolveInput = {
    targets: input.targets.map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
    enabledRecipes: [...baseRecipeIds, ...Object.keys(input.enabledAlternates)],
    resourceLimits: input.limitOverrides,
    inputs: Object.fromEntries(input.inputs.map((i) => [i.item, i.ratePerMin])),
    weights: { resources: 1, power: 0, buildings: 0 },
    maxClock: input.maxClock,
    somersloops: input.somersloops,
    power: {
      generators: Object.keys(input.enabledGenerators),
      fuels,
      targetMW: input.powerTargetMW,
      coverFactoryPower: input.coverFactoryPower,
    },
  }
  const result = await solveProduction(solveInput)
  if (result.status !== 'optimal') throw new Error(`実行不能: ${result.message}`)
  return result
}

function hasReciprocalEdgePair(solution: Solution): boolean {
  const graph = buildPlanGraph(solution)
  return graph.edges.some((edge) =>
    graph.edges.some((other) => other.source === edge.target && other.target === edge.source),
  )
}

describe('サンプルプランのスキーマ', () => {
  it('8種類あり、IDと名前が重複せず、すべて有効なカテゴリに属する', () => {
    expect(SAMPLE_PLANS).toHaveLength(8)
    expect(new Set(SAMPLE_PLANS.map((s) => s.id)).size).toBe(SAMPLE_PLANS.length)
    expect(new Set(SAMPLE_PLANS.map((s) => s.title)).size).toBe(SAMPLE_PLANS.length)
    const categories = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    expect(SAMPLE_PLANS.every((sample) => categories.has(sample.category))).toBe(true)
    expect(TEMPLATE_CATEGORIES.every((c) => SAMPLE_PLANS.some((s) => s.category === c.id))).toBe(
      true,
    )
  })

  it.each(SAMPLE_PLANS)('$id: 警告ゼロで復元できる', (sample) => {
    expect(sample.snapshot.v).toBe(PLAN_SCHEMA_VERSION)
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(`復元に失敗: ${parsed.error}`)
    // 警告が出る = 存在しないID等を含んでいる（データ更新で消えたことに気付くための砦）
    expect(parsed.warnings).toEqual([])
    expect(parsed.input.targets.length > 0 || parsed.input.powerTargetMW > 0).toBe(true)
    expect(parsed.input.planName).toBe(sample.title)
  })

  it.each(SAMPLE_PLANS)('$id: 目標・代替レシピ・アイコンのIDが実在する', (sample) => {
    expect(itemsById.has(sample.icon)).toBe(true)
    for (const [item, rate] of sample.snapshot.t) {
      expect(itemsById.has(item)).toBe(true)
      expect(rate).toBeGreaterThan(0)
    }
    for (const id of sample.snapshot.a) {
      expect(recipesById.get(id)?.isAlternate).toBe(true)
    }
    for (const generator of sample.snapshot.g ?? []) {
      expect(generatorsById.has(generator)).toBe(true)
      // v6 の既定未選択 semantics: 有効な方式には選択燃料を明記する。
      expect(sample.snapshot.u).toHaveProperty(generator)
      expect(sample.snapshot.u?.[generator]?.length).toBeGreaterThan(0)
    }
    expect(sample.description.length).toBeGreaterThan(0)
  })
})

describe('サンプルプランの求解', () => {
  it.each(SAMPLE_PLANS)('$id: 最適解が出て目標レートを満たす', async (sample) => {
    const result = await solveSample(sample)
    for (const target of result.targets) {
      expect(target.producedPerMin).toBeGreaterThanOrEqual(target.requestedPerMin - 1e-6)
    }
    expect(result.steps.length).toBeGreaterThan(0)
    if ((sample.snapshot.w ?? 0) > 0) {
      expect(result.powerGeneration?.totalMW).toBeGreaterThanOrEqual(sample.snapshot.w! - 1e-6)
    } else {
      expect(result.totalPowerMW).toBeGreaterThan(0)
    }
  })

  it.each(SAMPLE_PLANS)('$id: 有効にした代替レシピは全部その解で使われる', async (sample) => {
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(parsed.error)
    const enabled = Object.keys(parsed.input.enabledAlternates)

    const result = await solveSample(sample)

    const used = new Set(result.steps.map((s) => s.recipeId))
    expect(enabled.filter((id) => !used.has(id))).toEqual([])
  })

  it.each(SAMPLE_PLANS.filter((sample) => sample.hasCycle))(
    '$id: フローチャートに相互エッジの循環がある',
    async (sample) => {
      expect(hasReciprocalEdgePair(await solveSample(sample))).toBe(true)
    },
  )

  it('アルミ精錬は副産物の水を上流工程で再利用する', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'aluminum-water-loop')!
    const solution = await solveSample(sample)
    const water = solution.itemBalance.find((balance) => balance.item === 'Desc_Water_C')!
    expect(water.producedPerMin).toBeGreaterThan(0)
    expect(water.consumedPerMin).toBeGreaterThan(water.producedPerMin)
  })

  it('原子力テンプレートは再処理チェーンを表示する', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'nuclear-reprocessing')!
    const solution = await solveSample(sample)
    const used = new Set(solution.steps.map((step) => step.recipeId))
    expect(used).toContain('Recipe_Plutonium_C')
    expect(used).toContain('Recipe_PlutoniumFuelRod_C')
    expect(used).toContain('Recipe_Ficsonium_C')
    expect(used).toContain('Recipe_FicsoniumFuelRod_C')
  })

  it('リサイクルの例は代替レシピを切ると原油の消費が跳ね上がる（見せ場が成立している）', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'recycled-plastic')!
    const targets = sample.snapshot.t.map(([item, ratePerMin]) => ({ item, ratePerMin }))
    const weights = { resources: 1, power: 0, buildings: 0 }

    const withAlts = await solveProduction({
      targets,
      enabledRecipes: [...baseRecipeIds, ...sample.snapshot.a],
      weights,
    })
    const withoutAlts = await solveProduction({ targets, enabledRecipes: baseRecipeIds, weights })
    if (withAlts.status !== 'optimal' || withoutAlts.status !== 'optimal') {
      throw new Error('サンプルが実行不能')
    }

    const oil = (r: Solution): number =>
      r.rawResources.find((x) => x.item === 'Desc_LiquidOil_C')?.ratePerMin ?? 0
    expect(oil(withoutAlts)).toBeGreaterThan(oil(withAlts) * 2)
  })
})
