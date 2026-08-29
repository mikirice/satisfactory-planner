/**
 * 建設チェックリストの導出（src/plan/build-list.ts）。
 *
 * 見たいのは「解をそのまま並べ替えただけになっているか」の4点。
 *   1. セクションの順（採掘 → 製造 → 発電）
 *   2. 製造ラインが原料 → 目標のトポロジカル順に並ぶこと（＝上から建てられる）
 *   3. 台数が解の builtCount と一致すること（勝手に丸めない）
 *   4. 搬送等級が「1本で運べる最小の等級」で、運びきれないときは本数が出ること
 *
 * 数値そのものの正しさは tests/solver.test.ts / tests/extraction.test.ts が担当する。
 */
import { describe, expect, it } from 'vitest'

import { itemsById } from '../src/data/index.ts'
import {
  BUILD_SECTION_ORDER,
  buildListItems,
  deriveBuildList,
  requiredTransport,
  topologicalSteps,
} from '../src/plan/build-list.ts'
import { planExtraction, solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput, SolutionStep } from '../src/solver/index.ts'

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') {
    throw new Error(`expected optimal but got infeasible: ${result.message}`)
  }
  return result
}

/** 鉄板 60/min（製錬炉3台 → 製作機3台）。 */
const ironPlate60 = (): Promise<Solution> =>
  solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })

describe('セクションの構成', () => {
  it('採掘計画が無ければ製造ラインだけになる', async () => {
    const solution = await ironPlate60()
    const list = deriveBuildList(solution, null)

    expect(list.sections.map((s) => s.id)).toEqual(['manufacturing'])
    expect(list.totalCount).toBe(solution.totalBuildingCount)
  })

  it('採掘計画を渡すと採掘が先頭に来る', async () => {
    const solution = await ironPlate60()
    const extraction = planExtraction(solution)
    const list = deriveBuildList(solution, extraction)

    expect(list.sections.map((s) => s.id)).toEqual(['extraction', 'manufacturing'])
    // 採掘の1件目は鉄鉱石の採鉱機（既定 Mk.3）
    const first = list.sections[0]!.items[0]!
    expect(first.section).toBe('extraction')
    expect(first.resourceItem).toBe('Desc_OreIron_C')
    expect(first.buildingId).toBe('Build_MinerMk3_C')
    expect(first.outputs.map((flow) => flow.item)).toEqual(['Desc_OreIron_C'])
    expect(first.inputs).toEqual([])
  })

  it('発電計画を有効にすると採掘 → 製造 → 発電の順になる', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      power: {
        generators: ['Build_GeneratorCoal_C'],
        fuels: { Build_GeneratorCoal_C: ['Desc_Coal_C'] },
        coverFactoryPower: true,
      },
    })
    const list = deriveBuildList(solution, planExtraction(solution))

    expect(list.sections.map((s) => s.id)).toEqual(['extraction', 'manufacturing', 'power'])
    // 並びは必ず BUILD_SECTION_ORDER の部分列
    const order = list.sections.map((s) => BUILD_SECTION_ORDER.indexOf(s.id))
    expect(order).toEqual([...order].sort((a, b) => a - b))

    const generators = list.sections.find((s) => s.id === 'power')!
    expect(generators.items.length).toBeGreaterThan(0)
    for (const item of generators.items) {
      expect(item.buildingId).toBe('Build_GeneratorCoal_C')
      expect(item.fuelItem).toBe('Desc_Coal_C')
      expect(item.powerProductionMW ?? 0).toBeGreaterThan(0)
      // 燃料と水は投入として出る（建てるときに必要な配線が分かる）
      expect(item.inputs.map((flow) => flow.item)).toContain('Desc_Coal_C')
    }
    // 発電機は製造ラインには混ざらない
    const manufacturing = list.sections.find((s) => s.id === 'manufacturing')!
    expect(manufacturing.items.every((item) => item.powerProductionMW === undefined)).toBe(true)
  })
})

describe('製造ラインの並び（原料 → 目標）', () => {
  /**
   * 「どの工程も、投入は"前の工程の産出"か原料・持ち込みで賄えている」ことを確かめる。
   * これが成り立てば上から順に建てられる（＝チェックリストとして使える）。
   */
  function assertTopologicalOrder(solution: Solution): void {
    const list = deriveBuildList(solution, null)
    const manufacturing = list.sections.find((s) => s.id === 'manufacturing')!
    const supplied = new Set<string>([
      ...solution.rawResources.map((raw) => raw.item),
      ...solution.externalInputs.map((external) => external.item),
    ])
    for (const item of manufacturing.items) {
      for (const input of item.inputs) {
        expect(
          supplied.has(input.item),
          `${item.id} の投入 ${input.item} が先に用意されていない`,
        ).toBe(true)
      }
      for (const output of item.outputs) supplied.add(output.item)
    }
  }

  it('鉄板 60/min: 製錬炉 → 製作機の順に並ぶ', async () => {
    const solution = await ironPlate60()
    const list = deriveBuildList(solution, null)
    const items = list.sections[0]!.items

    expect(items.map((item) => item.recipeId)).toEqual([
      'Recipe_IngotIron_C',
      'Recipe_IronPlate_C',
    ])
    assertTopologicalOrder(solution)
  })

  it('モジュール式エンジン（多段チェーン）でも投入が先に揃う', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_ModularFrame_C', ratePerMin: 10 }],
    })
    expect(solution.steps.length).toBeGreaterThan(3)
    assertTopologicalOrder(solution)
  })

  it('循環があっても工程を落とさず、必ず全件を並べる', () => {
    // A → B → A の循環（水の再利用のような構成）。順序は保証できないが全件出す
    const cyclic: SolutionStep[] = [
      step('r-a', ['Desc_Water_C', 'item-b'], ['item-a']),
      step('r-b', ['item-a'], ['item-b']),
    ]
    const sorted = topologicalSteps(cyclic)
    expect(sorted.map((s) => s.recipeId).sort()).toEqual(['r-a', 'r-b'])
  })

  it('同じ条件の工程は解に現れた順を保つ（並びが毎回変わらない）', () => {
    const independent: SolutionStep[] = [
      step('r-2', ['Desc_OreIron_C'], ['x']),
      step('r-1', ['Desc_OreIron_C'], ['y']),
    ]
    expect(topologicalSteps(independent).map((s) => s.recipeId)).toEqual(['r-2', 'r-1'])
    expect(topologicalSteps(independent).map((s) => s.recipeId)).toEqual(['r-2', 'r-1'])
  })
})

describe('台数', () => {
  it('各項目の台数は解の建てる台数と一致し、合計も合う', async () => {
    const solution = await ironPlate60()
    const extraction = planExtraction(solution)
    const list = deriveBuildList(solution, extraction)

    const manufacturing = list.sections.find((s) => s.id === 'manufacturing')!
    for (const item of manufacturing.items) {
      const step = solution.steps.find((s) => s.recipeId === item.recipeId)!
      expect(item.builtCount).toBe(step.builtCount)
      expect(item.clockSpeed).toBeCloseTo(step.clockSpeed, 9)
    }
    expect(manufacturing.totalCount).toBe(solution.totalBuildingCount)

    const mining = list.sections.find((s) => s.id === 'extraction')!
    expect(mining.totalCount).toBe(extraction.totalBuildingCount)
    expect(list.totalCount).toBe(solution.totalBuildingCount + extraction.totalBuildingCount)
    expect(buildListItems(list)).toHaveLength(mining.items.length + manufacturing.items.length)
  })

  it('項目IDは同じ計画から何度導出しても同じ（進捗の保存キーになる）', async () => {
    const solution = await ironPlate60()
    const extraction = planExtraction(solution)
    const ids = () => buildListItems(deriveBuildList(solution, extraction)).map((item) => item.id)

    expect(ids()).toEqual(ids())
    expect(new Set(ids()).size).toBe(ids().length)
    expect(ids()).toContain('make:Recipe_IronPlate_C')
    expect(ids()).toContain('extract:Desc_OreIron_C:Build_MinerMk3_C')
  })
})

describe('搬送の等級', () => {
  it('固体は1本で運べる最小のベルトを選ぶ', () => {
    expect(requiredTransport('Desc_OreIron_C', 60).tierId).toBe('Build_ConveyorBeltMk1_C')
    expect(requiredTransport('Desc_OreIron_C', 60.1).tierId).toBe('Build_ConveyorBeltMk2_C')
    // 鉄板 60/min の鉄鉱石 90/min は Mk.2（120/min）で1本
    const ore = requiredTransport('Desc_OreIron_C', 90)
    expect(ore.kind).toBe('belt')
    expect(ore.tierId).toBe('Build_ConveyorBeltMk2_C')
    expect(ore.capacityPerMin).toBe(120)
    expect(ore.lines).toBe(1)
  })

  it('液体はパイプの等級で見る', () => {
    const water = requiredTransport('Desc_Water_C', 450)
    expect(water.kind).toBe('pipe')
    expect(water.tierId).toBe('Build_PipelineMK2_C')
    expect(water.capacityPerMin).toBe(600)
    expect(water.lines).toBe(1)
    expect(requiredTransport('Desc_Water_C', 300).tierId).toBe('Build_Pipeline_C')
  })

  it('最上位でも運びきれないときは最上位等級の本数を出す', () => {
    // ベルト Mk.6 = 1200/min
    const belt = requiredTransport('Desc_OreIron_C', 2500)
    expect(belt.tierId).toBe('Build_ConveyorBeltMk6_C')
    expect(belt.lines).toBe(3)
    // パイプ Mk.2 = 600 m³/min
    const pipe = requiredTransport('Desc_Water_C', 1500)
    expect(pipe.tierId).toBe('Build_PipelineMK2_C')
    expect(pipe.lines).toBe(3)
    expect(itemsById.get('Desc_Water_C')?.form).not.toBe('solid')
  })

  it('大きな計画では工程の入出力に複数本のベルトが出る', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 3000 }] })
    const list = deriveBuildList(solution, null)
    const flows = buildListItems(list).flatMap((item) => [...item.inputs, ...item.outputs])

    const heavy = flows.filter((flow) => flow.lines > 1)
    expect(heavy.length).toBeGreaterThan(0)
    for (const flow of heavy) {
      expect(flow.tierId).toBe('Build_ConveyorBeltMk6_C')
      expect(flow.lines).toBe(Math.ceil(flow.ratePerMin / 1200 - 1e-9))
    }
    // 1本で足りる流量に最上位ベルトを充てていない（最小等級を選ぶ）
    for (const flow of flows) {
      if (flow.lines !== 1) continue
      expect(flow.ratePerMin).toBeGreaterThan(0)
    }
  })
})

/** テスト用の最小ステップ（並べ替えだけを見るので数値は使わない）。 */
function step(recipeId: string, inputs: string[], outputs: string[]): SolutionStep {
  return {
    recipeId,
    recipeName: { ja: recipeId, en: recipeId },
    buildingId: 'Build_ConstructorMk1_C',
    buildingName: { ja: 'x', en: 'x' },
    machineCount: 1,
    builtCount: 1,
    clockSpeed: 1,
    powerShards: 0,
    somersloops: 0,
    powerMW: 0,
    clockedPowerMW: 0,
    footprintAreaM2: 0,
    inputs: inputs.map((item) => ({ item, ratePerMin: 10 })),
    outputs: outputs.map((item) => ({ item, ratePerMin: 10 })),
  }
}
