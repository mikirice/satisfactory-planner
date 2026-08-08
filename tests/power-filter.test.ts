/**
 * 「発電を隠す」の絞り込み（src/plan/power-filter.ts）の検証。
 *
 * 隠すのは**発電機と、発電のためだけに存在するステップ**だけ。工場側でも使う中間品や
 * 共有している原料は隠さない、というのがこの機能の肝なので、実際に解いた解で確かめる。
 * ここは表示の絞り込みなので、解そのもの（レート・台数）は一切変えない。
 */
import { describe, expect, it } from 'vitest'

import { stepKey } from '../src/plan/aggregate.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import {
  filterPowerFromGraph,
  findPowerOnlySteps,
  visibleSteps,
} from '../src/plan/power-filter.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

const COAL = 'Build_GeneratorCoal_C'
const FUEL = 'Build_GeneratorFuel_C'
const NUCLEAR = 'Build_GeneratorNuclear_C'

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

const generatorSteps = (solution: Solution) =>
  solution.steps.filter((s) => (s.powerProductionMW ?? 0) > 0)

const visibleRecipeIds = (solution: Solution): string[] =>
  visibleSteps(solution.steps, findPowerOnlySteps(solution)).map((s) => s.recipeId)

// ---------------------------------------------------------------------------
// ステップと原料の判定
// ---------------------------------------------------------------------------

describe('発電専用チェーンの判定', () => {
  it('石炭発電だけの解では、発電機も石炭・水の供給も丸ごと隠れる', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [COAL], targetMW: 300 } })
    const filter = findPowerOnlySteps(solution)

    for (const step of generatorSteps(solution)) {
      expect(filter.hiddenStepKeys.has(stepKey(step)), step.recipeId).toBe(true)
    }
    expect(filter.hiddenSourceItems.has('Desc_Coal_C')).toBe(true)
    expect(filter.hiddenSourceItems.has('Desc_Water_C')).toBe(true)
    // 工場側は何も無いので、表示するステップは残らない
    expect(visibleSteps(solution.steps, filter)).toEqual([])
    expect(filter.hiddenStepCount).toBe(solution.steps.length)
  })

  it('鉄板工場 + 石炭発電では、石炭は隠れるが鉄鉱石と製錬・製作は残る', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      power: { generators: [COAL], targetMW: 300 },
    })
    const filter = findPowerOnlySteps(solution)

    expect(filter.hiddenSourceItems.has('Desc_Coal_C')).toBe(true)
    expect(filter.hiddenSourceItems.has('Desc_OreIron_C')).toBe(false)

    const visible = visibleRecipeIds(solution)
    expect(visible).toContain('Recipe_IngotIron_C')
    expect(visible).toContain('Recipe_IronPlate_C')
    for (const step of generatorSteps(solution)) {
      expect(filter.hiddenStepKeys.has(stepKey(step)), step.recipeId).toBe(true)
      expect(visible).not.toContain(step.recipeId)
    }
    // 目標産出の鉄板は 60/min のまま（絞り込みは解に触らない）
    expect(solution.targets[0]!.producedPerMin).toBeCloseTo(60, 6)
  })

  it('燃料式発電 + プラスチック工場で原油を共有するときは、原油の供給を隠さない', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 60 }],
      power: { generators: [FUEL], targetMW: 250 },
    })
    const filter = findPowerOnlySteps(solution)

    // 原油は工場（プラスチック）でも使うので隠さない
    expect(filter.hiddenSourceItems.has('Desc_LiquidOil_C')).toBe(false)
    // プラスチックを作るステップは残り、発電機は隠れる
    const visible = visibleRecipeIds(solution)
    expect(
      visible.some((id) =>
        solution.steps
          .find((s) => s.recipeId === id)!
          .outputs.some((o) => o.item === 'Desc_Plastic_C'),
      ),
    ).toBe(true)
    for (const step of generatorSteps(solution)) {
      expect(filter.hiddenStepKeys.has(stepKey(step)), step.recipeId).toBe(true)
    }
    // 発電機の燃料そのもの（燃料 or 残留物由来）は工場へ出ていないので隠れる側にいる
    expect(filter.hiddenStepCount).toBeGreaterThan(0)
  })

  it('発電機のいない解では何も隠さない（従来どおりの表示）', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const filter = findPowerOnlySteps(solution)

    expect(filter.hiddenStepCount).toBe(0)
    expect(filter.hiddenStepKeys.size).toBe(0)
    expect(filter.hiddenSourceItems.size).toBe(0)
    expect(visibleSteps(solution.steps, filter)).toEqual(solution.steps)
  })

  it('発電のために増えた燃料精製は隠すが、同じ中間品を工場も使うなら隠さない', async () => {
    // 燃料式発電だけ → 原油 → 燃料 の精製は発電専用なので隠れる
    const powerOnly = await solveOk({ targets: [], power: { generators: [FUEL], targetMW: 250 } })
    const powerOnlyFilter = findPowerOnlySteps(powerOnly)
    expect(powerOnlyFilter.hiddenStepKeys.has('Recipe_LiquidFuel_C')).toBe(true)
    expect(powerOnlyFilter.hiddenSourceItems.has('Desc_LiquidOil_C')).toBe(true)
    expect(visibleSteps(powerOnly.steps, powerOnlyFilter)).toEqual([])

    // 燃料そのものを工場の目標にすると、同じ精製ステップが表示側に残る
    const shared = await solveOk({
      targets: [{ item: 'Desc_LiquidFuel_C', ratePerMin: 20 }],
      power: { generators: [FUEL], targetMW: 250 },
    })
    const sharedFilter = findPowerOnlySteps(shared)
    expect(sharedFilter.hiddenStepKeys.has('Recipe_LiquidFuel_C')).toBe(false)
    expect(sharedFilter.hiddenSourceItems.has('Desc_LiquidOil_C')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// グラフの絞り込み
// ---------------------------------------------------------------------------

describe('フローチャートの絞り込み', () => {
  it('発電機ノードと石炭・水の供給ノード、それに繋がる線だけを落とす', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      power: { generators: [COAL], targetMW: 300 },
    })
    const full = buildPlanGraph(solution)
    const filtered = filterPowerFromGraph(full, findPowerOnlySteps(solution))

    const ids = new Set(filtered.nodes.map((n) => n.id))
    expect(ids.has('source:Desc_Coal_C')).toBe(false)
    expect(ids.has('source:Desc_Water_C')).toBe(false)
    expect(ids.has('source:Desc_OreIron_C')).toBe(true)
    expect(ids.has('output:Desc_IronPlate_C')).toBe(true)
    for (const step of generatorSteps(solution)) {
      expect(ids.has(`recipe:${stepKey(step)}`), step.recipeId).toBe(false)
    }
    // 宙に浮いた線が残っていない
    for (const edge of filtered.edges) {
      expect(ids.has(edge.source), edge.id).toBe(true)
      expect(ids.has(edge.target), edge.id).toBe(true)
    }
    expect(filtered.nodes.length).toBeLessThan(full.nodes.length)
    expect(filtered.bottleneckCount).toBe(filtered.edges.filter((e) => e.bottleneck).length)
    // 元のグラフは壊さない
    expect(full.nodes.some((n) => n.id === 'source:Desc_Coal_C')).toBe(true)
  })

  it('隠した発電機の副産物（核廃棄物）の出力ノードも一緒に落とす', async () => {
    const solution = await solveOk({
      targets: [],
      enabledRecipes: [],
      inputs: { Desc_NuclearFuelRod_C: 1 },
      power: { generators: [NUCLEAR], targetMW: 2500 },
    })
    const full = buildPlanGraph(solution)
    expect(full.nodes.some((n) => n.id === 'output:Desc_NuclearWaste_C')).toBe(true)

    const filtered = filterPowerFromGraph(full, findPowerOnlySteps(solution))
    expect(filtered.nodes.some((n) => n.id === 'output:Desc_NuclearWaste_C')).toBe(false)
    expect(filtered.nodes.some((n) => n.id === 'external:Desc_NuclearFuelRod_C')).toBe(false)
    expect(filtered.edges).toEqual([])
  })

  it('発電専用の精製所が捨てている副産物（ポリマー樹脂）の出力ノードも落とす', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [FUEL], targetMW: 250 } })
    const full = buildPlanGraph(solution)
    expect(full.nodes.some((n) => n.id === 'output:Desc_PolymerResin_C')).toBe(true)

    const filtered = filterPowerFromGraph(full, findPowerOnlySteps(solution))
    // 工場が何も無いので、発電チェーンごと全部消える
    expect(filtered.nodes).toEqual([])
    expect(filtered.edges).toEqual([])
  })

  it('絞り込みの対象が無ければグラフをそのまま返す', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const full = buildPlanGraph(solution)
    expect(filterPowerFromGraph(full, findPowerOnlySteps(solution))).toBe(full)
  })
})
