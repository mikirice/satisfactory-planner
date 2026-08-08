/**
 * Somersloop（フル装着バリアント）の検証。
 *
 * LP に「産出2倍・消費据え置き・電力は倍率^指数」の変数を足し、
 * Σ(バリアント稼働台数 × スロット数) <= 使用可能数 を制約に張っている。
 * 部分装着（フル未満）は扱わない（README「Somersloop の扱い」）。
 */
import { describe, expect, it } from 'vitest'

import { buildingsById, recipesById } from '../src/data/index.ts'
import { SOMERSLOOP_FULL_OUTPUT_MULTIPLIER } from '../src/data/constants.ts'
import {
  buildProductionModel,
  netRatePerMin,
  solveProduction,
  somersloopPowerFactor,
  somersloopVarKey,
  supportsSomersloop,
} from '../src/solver/index.ts'
import type { Solution, SolutionStep, SolveInput } from '../src/solver/index.ts'

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

const IRON_PLATE_60: SolveInput = { targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] }

const rateOf = (entries: { item: string; ratePerMin: number }[], item: string): number =>
  entries.find((e) => e.item === item)?.ratePerMin ?? 0

/** LP が使った Somersloop 量（稼働台数ベース。制約に張り付いているかを見る） */
function lpSomersloopUsage(solution: Solution): number {
  return solution.steps
    .filter((s) => s.somersloops > 0)
    .reduce(
      (n, s) => n + s.machineCount * (buildingsById.get(s.buildingId)?.maxSomersloops ?? 0),
      0,
    )
}

const sloopSteps = (solution: Solution): SolutionStep[] =>
  solution.steps.filter((s) => s.somersloops > 0)

// ---------------------------------------------------------------------------
// 回帰: 使用可能数 0 なら従来と完全に同じ
// ---------------------------------------------------------------------------

describe('使用可能数 0（既定）', () => {
  it('LP にバリアント変数を1つも足さない', () => {
    const without = buildProductionModel(IRON_PLATE_60)
    const zero = buildProductionModel({ ...IRON_PLATE_60, somersloops: 0 })

    expect(without.somersloopRecipes).toEqual([])
    expect(zero.somersloopRecipes).toEqual([])
    expect(zero.lp.variables.map((v) => v.key)).toEqual(without.lp.variables.map((v) => v.key))
    expect(zero.lp.constraints.map((c) => c.key)).toEqual(
      without.lp.constraints.map((c) => c.key),
    )
    expect(zero.lp.constraints.some((c) => c.key === 'somersloop:capacity')).toBe(false)
  })

  it('解も従来どおり（鉄板 60/min → 鉄鉱石 90/min・6台）', async () => {
    const solution = await solveOk({ ...IRON_PLATE_60, somersloops: 0 })
    expect(rateOf(solution.rawResources, 'Desc_OreIron_C')).toBeCloseTo(90, 6)
    expect(solution.totalMachineCount).toBeCloseTo(6, 6)
    expect(solution.totalBuildingCount).toBe(6)
    expect(solution.totalSomersloops).toBe(0)
    expect(solution.somersloopLimit).toBe(0)
    expect(sloopSteps(solution)).toEqual([])
  })

  it('未指定と 0 指定で解が一致する', async () => {
    const implicit = await solveOk(IRON_PLATE_60)
    const explicit = await solveOk({ ...IRON_PLATE_60, somersloops: 0 })
    expect(explicit.steps.map((s) => [s.recipeId, s.machineCount])).toEqual(
      implicit.steps.map((s) => [s.recipeId, s.machineCount]),
    )
    expect(explicit.objectiveValue).toBeCloseTo(implicit.objectiveValue, 9)
  })
})

// ---------------------------------------------------------------------------
// モデル
// ---------------------------------------------------------------------------

describe('LP モデル', () => {
  it('対応する建物のレシピにだけバリアント変数が増える', () => {
    const model = buildProductionModel({ ...IRON_PLATE_60, somersloops: 10 })
    expect(model.somersloopLimit).toBe(10)
    expect(model.somersloopRecipes.length).toBeGreaterThan(0)
    for (const recipe of model.somersloopRecipes) {
      expect(supportsSomersloop(recipe), recipe.id).toBe(true)
      expect(buildingsById.get(recipe.producedIn)!.maxSomersloops).toBeGreaterThan(0)
    }
    // 非対応の建物（梱包機・採掘機）のレシピは含まない
    const packagerRecipes = model.somersloopRecipes.filter(
      (r) => r.producedIn === 'Build_Packager_C',
    )
    expect(packagerRecipes).toEqual([])
  })

  it('バリアントの係数は「産出2倍・消費そのまま」', () => {
    const model = buildProductionModel({ ...IRON_PLATE_60, somersloops: 10 })
    const recipe = recipesById.get('Recipe_IronPlate_C')!
    const key = somersloopVarKey(recipe.id)

    const plateRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_IronPlate_C')!
    const ingotRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_IronIngot_C')!
    expect(plateRow.coefficients.get(key)).toBeCloseTo(
      netRatePerMin(recipe, 'Desc_IronPlate_C') * SOMERSLOOP_FULL_OUTPUT_MULTIPLIER,
      9,
    )
    expect(ingotRow.coefficients.get(key)).toBeCloseTo(
      netRatePerMin(recipe, 'Desc_IronIngot_C'),
      9,
    )
  })

  it('容量制約はスロット数で重み付けした上限つきの1本', () => {
    const model = buildProductionModel({ ...IRON_PLATE_60, somersloops: 7 })
    const capacity = model.lp.constraints.find((c) => c.key === 'somersloop:capacity')!
    expect(capacity.upper).toBe(7)
    expect(capacity.lower).toBeUndefined()
    const manufacturerRecipe = model.somersloopRecipes.find(
      (r) => r.producedIn === 'Build_ManufacturerMk1_C',
    )
    if (manufacturerRecipe) {
      // 製造機はスロット4なので係数も4
      expect(capacity.coefficients.get(somersloopVarKey(manufacturerRecipe.id))).toBe(4)
    }
    const plateKey = somersloopVarKey('Recipe_IronPlate_C')
    expect(capacity.coefficients.get(plateKey)).toBe(1) // 製作機はスロット1
  })

  it('電力最小の目的では電力係数が 4倍（指数2）になる', () => {
    const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
    expect(somersloopPowerFactor(constructor_)).toBeCloseTo(4, 9)

    const model = buildProductionModel({
      ...IRON_PLATE_60,
      somersloops: 10,
      weights: { resources: 0, power: 1, buildings: 0 },
    })
    const normal = model.lp.variables.find((v) => v.key === 'x:Recipe_IronPlate_C')!
    const sloop = model.lp.variables.find((v) => v.key === 'xs:Recipe_IronPlate_C')!
    // ε ぶんの差はあるので比率でみる
    expect(sloop.objective).toBeGreaterThan(normal.objective * 3.9)
    expect(sloop.objective).toBeLessThan(normal.objective * 4.1)
  })
})

// ---------------------------------------------------------------------------
// 解
// ---------------------------------------------------------------------------

describe('解への反映', () => {
  it('建物最小の目的では Somersloop が選ばれて台数が半分になる', async () => {
    const weights = { resources: 0.01, power: 0, buildings: 1 }
    const base = await solveOk({ ...IRON_PLATE_60, weights })
    const withSloops = await solveOk({ ...IRON_PLATE_60, weights, somersloops: 20 })

    expect(sloopSteps(withSloops).length).toBeGreaterThan(0)
    expect(withSloops.totalMachineCount).toBeLessThan(base.totalMachineCount)
    // 各段が産出2倍になるので、段が重なるほど半分より小さくなる
    // （製作機 3→1.5台、その投入も減って製錬炉 3→0.75台 = 合計 2.25台）
    expect(withSloops.totalMachineCount).toBeLessThanOrEqual(base.totalMachineCount / 2 + 1e-6)
    expect(withSloops.totalMachineCount).toBeCloseTo(2.25, 6)
    expect(withSloops.totalBuildingCount).toBeLessThan(base.totalBuildingCount)
  })

  it('資源効率の目的でも原料が減る（産出が倍になるぶん採掘量が減る）', async () => {
    const base = await solveOk(IRON_PLATE_60)
    const withSloops = await solveOk({ ...IRON_PLATE_60, somersloops: 20 })
    expect(rateOf(withSloops.rawResources, 'Desc_OreIron_C')).toBeLessThan(
      rateOf(base.rawResources, 'Desc_OreIron_C'),
    )
    // 2段とも倍化するので 90 → 22.5
    expect(rateOf(withSloops.rawResources, 'Desc_OreIron_C')).toBeCloseTo(22.5, 6)
  })

  it('使用可能数が少ないと制約に張り付く', async () => {
    for (const limit of [1, 2]) {
      const solution = await solveOk({ ...IRON_PLATE_60, somersloops: limit })
      expect(sloopSteps(solution).length).toBeGreaterThan(0)
      // 使えるだけ使う（張り付き）
      expect(lpSomersloopUsage(solution), `limit=${limit}`).toBeCloseTo(limit, 6)
      expect(solution.somersloopLimit).toBe(limit)
    }
  })

  it('使用可能数を増やすほど原料が減る（単調）', async () => {
    const ore: number[] = []
    for (const limit of [0, 1, 2, 20]) {
      const solution = await solveOk({ ...IRON_PLATE_60, somersloops: limit })
      ore.push(rateOf(solution.rawResources, 'Desc_OreIron_C'))
    }
    for (let i = 1; i < ore.length; i += 1) {
      expect(ore[i], `limit index ${i}`).toBeLessThanOrEqual(ore[i - 1] + 1e-6)
    }
    expect(ore.at(-1)!).toBeLessThan(ore[0])
  })

  it('バリアントのステップは産出が倍・投入は据え置き・電力4倍', async () => {
    const solution = await solveOk({ ...IRON_PLATE_60, somersloops: 20 })
    const step = solution.steps.find((s) => s.recipeId === 'Recipe_IronPlate_C')!
    expect(step.somersloops).toBeGreaterThan(0)

    const recipe = recipesById.get('Recipe_IronPlate_C')!
    const building = buildingsById.get('Build_ConstructorMk1_C')!
    // 1台1分あたり 20個 → フル装着で 40個
    expect(rateOf(step.outputs, 'Desc_IronPlate_C')).toBeCloseTo(step.machineCount * 40, 6)
    expect(rateOf(step.inputs, 'Desc_IronIngot_C')).toBeCloseTo(step.machineCount * 30, 6)
    expect(recipe.durationSec).toBeGreaterThan(0)
    // 100%換算の電力は 基本電力 × 4 × 稼働台数
    expect(step.powerMW).toBeCloseTo(
      building.powerConsumptionMW * 4 * step.machineCount,
      6,
    )
    // 使用数は「建てる台数 × スロット数」
    expect(step.somersloops).toBe(step.builtCount * building.maxSomersloops)
  })

  it('サマリーの合計に使用数と上限が入る', async () => {
    const solution = await solveOk({ ...IRON_PLATE_60, somersloops: 20 })
    expect(solution.somersloopLimit).toBe(20)
    expect(solution.totalSomersloops).toBe(
      sloopSteps(solution).reduce((n, s) => n + s.somersloops, 0),
    )
    expect(solution.totalSomersloops).toBeGreaterThan(0)
  })

  it('同じレシピの通常ステップとバリアントが併存できる', async () => {
    // Somersloop が 1個しか無いので、足りないぶんは通常の製作機で作る
    const solution = await solveOk({ ...IRON_PLATE_60, somersloops: 1 })
    const byRecipe = new Map<string, SolutionStep[]>()
    for (const step of solution.steps) {
      byRecipe.set(step.recipeId, [...(byRecipe.get(step.recipeId) ?? []), step])
    }
    // 分かれても収支は必ず合う（目標を満たす）
    const plate = solution.targets.find((t) => t.item === 'Desc_IronPlate_C')!
    expect(plate.producedPerMin).toBeCloseTo(60, 6)
    for (const [recipeId, steps] of byRecipe) {
      const withSloop = steps.filter((s) => s.somersloops > 0)
      expect(withSloop.length, recipeId).toBeLessThanOrEqual(1)
    }
  })

  it('産出最大化モードでも Somersloop を使う', async () => {
    const input: SolveInput = {
      targets: [],
      maximize: 'Desc_IronPlate_C',
      resourceLimits: { Desc_OreIron_C: 60 },
    }
    const base = await solveOk(input)
    const withSloops = await solveOk({ ...input, somersloops: 20 })
    expect(withSloops.maximizedOutput!.ratePerMin).toBeGreaterThan(
      base.maximizedOutput!.ratePerMin,
    )
  })
})
