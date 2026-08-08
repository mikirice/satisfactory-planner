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

import { itemsById, recipes, recipesById } from '../src/data/index.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { PLAN_SCHEMA_VERSION, parsePlanSnapshot } from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

describe('サンプルプランのスキーマ', () => {
  it('3種類あり、IDと名前が重複しない', () => {
    expect(SAMPLE_PLANS).toHaveLength(3)
    expect(new Set(SAMPLE_PLANS.map((s) => s.id)).size).toBe(3)
    expect(new Set(SAMPLE_PLANS.map((s) => s.title)).size).toBe(3)
  })

  it.each(SAMPLE_PLANS)('$id: 警告ゼロで復元できる', (sample) => {
    expect(sample.snapshot.v).toBe(PLAN_SCHEMA_VERSION)
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(`復元に失敗: ${parsed.error}`)
    // 警告が出る = 存在しないID等を含んでいる（データ更新で消えたことに気付くための砦）
    expect(parsed.warnings).toEqual([])
    expect(parsed.input.targets.length).toBeGreaterThan(0)
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
    expect(sample.description.length).toBeGreaterThan(0)
  })
})

describe('サンプルプランの求解', () => {
  it.each(SAMPLE_PLANS)('$id: 最適解が出て目標レートを満たす', async (sample) => {
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(parsed.error)
    const { input } = parsed

    const result = await solveProduction({
      targets: input.targets.map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
      enabledRecipes: [...baseRecipeIds, ...Object.keys(input.enabledAlternates)],
      resourceLimits: input.limitOverrides,
      weights: { resources: 1, power: 0, buildings: 0 },
      maxClock: input.maxClock,
      somersloops: input.somersloops,
    })

    if (result.status !== 'optimal') {
      throw new Error(`実行不能: ${result.message}`)
    }
    for (const target of result.targets) {
      expect(target.producedPerMin).toBeGreaterThanOrEqual(target.requestedPerMin - 1e-6)
    }
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.totalPowerMW).toBeGreaterThan(0)
  })

  it.each(SAMPLE_PLANS)('$id: 有効にした代替レシピは全部その解で使われる', async (sample) => {
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(parsed.error)
    const enabled = Object.keys(parsed.input.enabledAlternates)

    const result = await solveProduction({
      targets: parsed.input.targets.map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
      enabledRecipes: [...baseRecipeIds, ...enabled],
      resourceLimits: parsed.input.limitOverrides,
      weights: { resources: 1, power: 0, buildings: 0 },
    })
    if (result.status !== 'optimal') throw new Error(result.message)

    const used = new Set(result.steps.map((s) => s.recipeId))
    expect(enabled.filter((id) => !used.has(id))).toEqual([])
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
