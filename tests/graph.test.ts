/**
 * フローチャート用のグラフ変換（src/plan/graph.ts）の検証。
 *
 * 見た目（React Flow / elkjs）ではなく **ノードとエッジの数字** を見る。
 * 「グラフのエッジ合計＝解のレート」であることと、循環レシピがループとして
 * 表現されること、選択中のベルト Mk でボトルネックが検出されることが要点。
 */
import { describe, expect, it } from 'vitest'

import { enumeratePlanFlows } from '../src/plan/flows.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import type { PlanGraph, PlanGraphEdge, RecipeGraphNode } from '../src/plan/graph.ts'
import { linesRequired, solveProduction } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'

const MK1_BELT = 'Build_ConveyorBeltMk1_C'

async function solveOk(...args: Parameters<typeof solveProduction>): Promise<Solution> {
  const result = await solveProduction(...args)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

/** 鉄板 60/min（基本レシピのみ）: 鉄鉱石 → 製錬炉 → 製作機 → 鉄板 */
const ironPlate = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })

/**
 * 循環プラスチック / ゴム。リサイクル両方が回るように、プラとゴムを同時に要求する。
 * （tests/solver.test.ts の CYCLE_RECIPES と同じ5レシピ）
 */
const cycle = await solveOk({
  targets: [
    { item: 'Desc_Plastic_C', ratePerMin: 300 },
    { item: 'Desc_Rubber_C', ratePerMin: 300 },
  ],
  enabledRecipes: [
    'Recipe_Plastic_C',
    'Recipe_Rubber_C',
    'Recipe_ResidualFuel_C',
    'Recipe_Alternate_Plastic_1_C',
    'Recipe_Alternate_RecycledRubber_C',
  ],
})

const edgesOf = (graph: PlanGraph, item: string): PlanGraphEdge[] =>
  graph.edges.filter((e) => e.item === item)

const sum = (edges: readonly PlanGraphEdge[]): number =>
  edges.reduce((s, e) => s + e.ratePerMin, 0)

describe('鉄板ケース', () => {
  const graph = buildPlanGraph(ironPlate)

  it('原料ノード・レシピノード・目標出力ノードが1つずつ揃う', () => {
    const sources = graph.nodes.filter((n) => n.kind === 'source')
    const recipes = graph.nodes.filter((n) => n.kind === 'recipe')
    const outputs = graph.nodes.filter((n) => n.kind === 'output')

    expect(sources.map((n) => n.item)).toEqual(['Desc_OreIron_C'])
    expect(sources[0]?.kind === 'source' && sources[0].external).toBe(false)
    expect(recipes.length).toBe(ironPlate.steps.length)
    expect(recipes.map((n) => (n as RecipeGraphNode).recipeId).sort()).toEqual([
      'Recipe_IngotIron_C',
      'Recipe_IronPlate_C',
    ])
    expect(outputs.length).toBe(1)
    expect(outputs[0]?.kind === 'output' && outputs[0].isTarget).toBe(true)
    expect(outputs[0]?.kind === 'output' && outputs[0].requestedPerMin).toBe(60)
  })

  it('エッジは 原料→製錬炉→製作機→出力 の3本で、レートが解と一致する', () => {
    expect(graph.edges.length).toBe(3)
    const ore = edgesOf(graph, 'Desc_OreIron_C')[0]!
    expect(ore.source).toBe('source:Desc_OreIron_C')
    expect(ore.target).toBe('recipe:Recipe_IngotIron_C')
    expect(ore.ratePerMin).toBeCloseTo(ironPlate.rawResources[0]!.ratePerMin, 6)

    const ingot = edgesOf(graph, 'Desc_IronIngot_C')[0]!
    expect(ingot.source).toBe('recipe:Recipe_IngotIron_C')
    expect(ingot.target).toBe('recipe:Recipe_IronPlate_C')

    const plate = edgesOf(graph, 'Desc_IronPlate_C')[0]!
    expect(plate.source).toBe('recipe:Recipe_IronPlate_C')
    expect(plate.target).toBe('output:Desc_IronPlate_C')
    expect(plate.ratePerMin).toBeCloseTo(60, 6)
  })

  it('ノードの台数・クロックは結果テーブルと同じ値になる', () => {
    const node = graph.nodes.find(
      (n): n is RecipeGraphNode => n.kind === 'recipe' && n.recipeId === 'Recipe_IronPlate_C',
    )!
    const step = ironPlate.steps.find((s) => s.recipeId === 'Recipe_IronPlate_C')!
    expect(node.machineCount).toBeCloseTo(step.machineCount, 9)
    expect(node.buildingCount).toBe(Math.ceil(step.machineCount - 1e-9))
    expect(node.buildingCount * node.clock).toBeCloseTo(step.machineCount, 9)
    expect(node.powerMW).toBeCloseTo(step.powerMW, 9)
    expect(node.buildingName).toBe(step.buildingName.ja)
  })

  it('固体は実線（ベルト）扱いで、単位が個/分になる', () => {
    for (const edge of graph.edges) {
      expect(edge.form).toBe('solid')
      expect(edge.transport).toBe('belt')
    }
  })
})

describe('既保有アイテムの持ち込み', () => {
  it('原料供給とは別のノードになり、使われなかった分はノードを作らない', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      inputs: { Desc_IronIngot_C: 200, Desc_Cable_C: 10 },
    })
    const graph = buildPlanGraph(solution)
    const sources = graph.nodes.filter((n) => n.kind === 'source')

    // 鉄インゴットは持ち込みでまかなえるので、原料（鉄鉱石）の採掘ノードは出ない
    expect(sources.map((n) => n.id)).toEqual(['external:Desc_IronIngot_C'])
    expect(sources[0]?.kind === 'source' && sources[0].external).toBe(true)
    expect(sources[0]?.kind === 'source' && sources[0].ratePerMin).toBeCloseTo(90, 6)

    // 使われなかったケーブルは図に出さない
    expect(graph.nodes.some((n) => n.id === 'external:Desc_Cable_C')).toBe(false)

    const ingot = edgesOf(graph, 'Desc_IronIngot_C')[0]!
    expect(ingot.source).toBe('external:Desc_IronIngot_C')
    expect(ingot.target).toBe('recipe:Recipe_IronPlate_C')
  })
})

describe('循環プラスチックケース', () => {
  const graph = buildPlanGraph(cycle)

  it('リサイクル・プラスチックとリサイクル・ゴムの間に両方向のエッジができる', () => {
    const plastic = 'recipe:Recipe_Alternate_Plastic_1_C'
    const rubber = 'recipe:Recipe_Alternate_RecycledRubber_C'
    const forward = graph.edges.filter((e) => e.source === plastic && e.target === rubber)
    const backward = graph.edges.filter((e) => e.source === rubber && e.target === plastic)

    expect(forward.length).toBeGreaterThan(0)
    expect(backward.length).toBeGreaterThan(0)
    expect(forward[0]!.item).toBe('Desc_Plastic_C')
    expect(backward[0]!.item).toBe('Desc_Rubber_C')
    expect(forward[0]!.ratePerMin).toBeGreaterThan(0)
    expect(backward[0]!.ratePerMin).toBeGreaterThan(0)
  })

  it('液体（原油・燃料・廃重油）はパイプ扱いで m³/min', () => {
    const fluids = graph.edges.filter((e) => e.form !== 'solid')
    expect(fluids.length).toBeGreaterThan(0)
    for (const edge of fluids) {
      expect(edge.transport).toBe('pipe')
    }
  })

  it('目標2つがそれぞれ出力ノードになり、余りは副産物ノードになる', () => {
    const outputs = graph.nodes.filter((n) => n.kind === 'output')
    const targets = outputs.filter((n) => n.kind === 'output' && n.isTarget)
    expect(targets.map((n) => n.kind === 'output' && n.item).sort()).toEqual([
      'Desc_Plastic_C',
      'Desc_Rubber_C',
    ])
    for (const node of outputs) {
      if (node.kind !== 'output') continue
      expect(node.ratePerMin).toBeGreaterThan(0)
    }
  })

  it('アイテムごとに「産出の合計＝エッジの合計」で、二重計上も欠落もない', () => {
    for (const step of cycle.steps) {
      for (const flow of step.outputs) {
        const outgoing = graph.edges.filter(
          (e) => e.source === `recipe:${step.recipeId}` && e.item === flow.item,
        )
        expect(sum(outgoing)).toBeCloseTo(flow.ratePerMin, 6)
      }
      for (const flow of step.inputs) {
        const incoming = graph.edges.filter(
          (e) => e.target === `recipe:${step.recipeId}` && e.item === flow.item,
        )
        expect(sum(incoming)).toBeCloseTo(flow.ratePerMin, 6)
      }
    }
  })
})

describe('ボトルネック', () => {
  it('低い Mk のベルトを選ぶと1本で運べないエッジが検出される', () => {
    const graph = buildPlanGraph(ironPlate, { beltId: MK1_BELT })
    const ore = edgesOf(graph, 'Desc_OreIron_C')[0]!
    const expected = linesRequired(ore.ratePerMin, 'Desc_OreIron_C', MK1_BELT)

    expect(ore.transportName).toBe(expected.name.ja)
    expect(ore.capacityPerMin).toBe(expected.capacityPerMin)
    expect(ore.lines).toBe(expected.lines)
    expect(ore.lines).toBeGreaterThan(1)
    // 1本あたりの使用率は 1 を超える（linesRequired().utilization は本数で割るので必ず1以下）
    expect(ore.utilization).toBeGreaterThan(1)
    expect(ore.utilization).toBeCloseTo(ore.ratePerMin / expected.capacityPerMin, 9)
    expect(ore.bottleneck).toBe(true)
    expect(graph.bottleneckCount).toBeGreaterThan(0)
  })

  it('最速のベルト（既定）なら鉄板ケースにボトルネックは出ない', () => {
    const graph = buildPlanGraph(ironPlate)
    expect(graph.bottleneckCount).toBe(0)
    expect(graph.edges.every((e) => e.utilization <= 1)).toBe(true)
  })

  it('ベルトの選択は液体のパイプ換算に影響しない', () => {
    const fastest = buildPlanGraph(cycle)
    const slow = buildPlanGraph(cycle, { beltId: MK1_BELT })
    const pipeOf = (graph: PlanGraph): string[] =>
      graph.edges.filter((e) => e.transport === 'pipe').map((e) => `${e.id}:${e.lines}`)
    expect(pipeOf(slow)).toEqual(pipeOf(fastest))
  })
})

describe('フロー列挙（Excel と共有）', () => {
  it('原料供給が先に来て、その後に各ステップの投入・産出が並ぶ', () => {
    const flows = enumeratePlanFlows(ironPlate)
    const expected =
      ironPlate.rawResources.length +
      ironPlate.steps.reduce((n, s) => n + s.inputs.length + s.outputs.length, 0)

    expect(flows.length).toBe(expected)
    expect(flows[0]!.kind).toBe('source')
    expect(flows[0]!.step).toBeNull()
    expect(flows.filter((f) => f.kind === 'output').every((f) => f.step !== null)).toBe(true)
  })
})
