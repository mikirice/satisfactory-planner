import { describe, expect, it } from 'vitest'

import { buildingsById, itemsById, recipes, recipesById } from '../src/data/index.ts'
import {
  buildProductionModel,
  defaultEnabledRecipeIds,
  netRatePerMin,
  resolveResourceWeights,
  solveProduction,
  writeLpFormat,
} from '../src/solver/index.ts'
import type { Solution, SolveInput, SolveResult } from '../src/solver/index.ts'

/** 許容誤差。LP の数値解なので厳密一致は求めない。 */
const EPS = 1e-6

const ALL_RECIPES = recipes.map((r) => r.id)

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') {
    throw new Error(`expected optimal but got infeasible: ${result.message}`)
  }
  return result
}

/** レシピID → 稼働台数 */
function machines(solution: Solution): Map<string, number> {
  return new Map(solution.steps.map((s) => [s.recipeId, s.machineCount]))
}

function rateOf(entries: { item: string; ratePerMin: number }[], item: string): number {
  return entries.find((e) => e.item === item)?.ratePerMin ?? 0
}

function balanceOf(solution: Solution, item: string) {
  return solution.itemBalance.find((b) => b.item === item)
}

// ---------------------------------------------------------------------------
// 手計算で検証できる単純チェーン
// ---------------------------------------------------------------------------

describe('単純チェーン（手計算と一致すること）', () => {
  it('鉄板 60/min → 鉄鉱石 90/min・製錬炉3台・製作機3台・24MW', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })

    const m = machines(solution)
    expect(m.size).toBe(2)
    expect(m.get('Recipe_IngotIron_C')).toBeCloseTo(3, 6)
    expect(m.get('Recipe_IronPlate_C')).toBeCloseTo(3, 6)

    expect(rateOf(solution.rawResources, 'Desc_OreIron_C')).toBeCloseTo(90, 6)
    expect(solution.rawResources).toHaveLength(1)
    expect(solution.byproducts).toEqual([])

    // 製錬炉 4MW × 3 + 製作機 4MW × 3
    expect(solution.totalPowerMW).toBeCloseTo(24, 6)
    expect(solution.totalPowerRangeMW.minMW).toBeCloseTo(24, 6)
    expect(solution.totalPowerRangeMW.maxMW).toBeCloseTo(24, 6)
    expect(solution.totalMachineCount).toBeCloseTo(6, 6)
    expect(solution.totalBuildingCount).toBe(6)

    expect(solution.targets).toEqual([
      { item: 'Desc_IronPlate_C', requestedPerMin: 60, producedPerMin: expect.closeTo(60, 6) },
    ])
  })

  it('ケーブル 30/min → 銅鉱石 30/min・製作機3台・製錬炉1台・16MW', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_Cable_C', ratePerMin: 30 }] })

    const m = machines(solution)
    expect(m.get('Recipe_IngotCopper_C')).toBeCloseTo(1, 6)
    expect(m.get('Recipe_Wire_C')).toBeCloseTo(2, 6)
    expect(m.get('Recipe_Cable_C')).toBeCloseTo(1, 6)
    expect(m.size).toBe(3)

    expect(rateOf(solution.rawResources, 'Desc_OreCopper_C')).toBeCloseTo(30, 6)
    // ワイヤーは全量ケーブルに消費される（余りゼロ）
    expect(balanceOf(solution, 'Desc_Wire_C')!.netPerMin).toBeCloseTo(0, 6)
    expect(solution.totalPowerMW).toBeCloseTo(16, 6)
  })

  it('強化鉄板 5/min → 鉄鉱石 60/min・製錬炉2/製作機4/組立機1・39MW', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlateReinforced_C', ratePerMin: 5 }],
    })

    const m = machines(solution)
    expect(m.get('Recipe_IngotIron_C')).toBeCloseTo(2, 6)
    expect(m.get('Recipe_IronPlate_C')).toBeCloseTo(1.5, 6)
    expect(m.get('Recipe_Screw_C')).toBeCloseTo(1.5, 6)
    expect(m.get('Recipe_IronRod_C')).toBeCloseTo(1, 6)
    expect(m.get('Recipe_IronPlateReinforced_C')).toBeCloseTo(1, 6)

    expect(rateOf(solution.rawResources, 'Desc_OreIron_C')).toBeCloseTo(60, 6)
    // 製錬炉 4×2 + 製作機 4×(1.5+1.5+1) + 組立機 15×1
    expect(solution.totalPowerMW).toBeCloseTo(39, 6)
    // 中間品はすべて使い切られる
    for (const item of ['Desc_IronIngot_C', 'Desc_IronPlate_C', 'Desc_IronRod_C', 'Desc_IronScrew_C']) {
      expect(balanceOf(solution, item)!.netPerMin, item).toBeCloseTo(0, 6)
    }
  })

  it('目標を2つ同時に指定できる（鉄板60 + 鉄のロッド30）', async () => {
    const solution = await solveOk({
      targets: [
        { item: 'Desc_IronPlate_C', ratePerMin: 60 },
        { item: 'Desc_IronRod_C', ratePerMin: 30 },
      ],
    })
    // 鉄板: 鉄インゴット90/min、ロッド: 鉄インゴット30/min
    expect(rateOf(solution.rawResources, 'Desc_OreIron_C')).toBeCloseTo(120, 6)
    expect(machines(solution).get('Recipe_IronRod_C')).toBeCloseTo(2, 6)
    expect(solution.targets.map((t) => t.item).sort()).toEqual([
      'Desc_IronPlate_C',
      'Desc_IronRod_C',
    ])
    for (const t of solution.targets) {
      expect(t.producedPerMin, t.item).toBeCloseTo(t.requestedPerMin, 6)
    }
  })

  it('目標が空なら空の解を返す', async () => {
    const solution = await solveOk({ targets: [] })
    expect(solution.steps).toEqual([])
    expect(solution.totalPowerMW).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 循環レシピ（リサイクル・プラスチック / リサイクル・ゴム）
// ---------------------------------------------------------------------------

describe('循環レシピが有限解で解ける', () => {
  // 手計算の期待値:
  //   プラスチック(精製) 5台   : 原油150 → プラ100 + 廃重油50
  //   ゴム(精製)        5台   : 原油150 → ゴム100 + 廃重油100
  //   残留燃料          2.5台 : 廃重油150 → 燃料100
  //   リサイクル・プラ  10/3台 : ゴム100 + 燃料100 → プラ200
  //   合計 プラ300 / 原油300、ゴム・燃料・廃重油はすべて収支ゼロ
  // 手計算と突き合わせるため、この5レシピだけに絞る
  const CYCLE_RECIPES = [
    'Recipe_Plastic_C',
    'Recipe_Rubber_C',
    'Recipe_ResidualFuel_C',
    'Recipe_Alternate_Plastic_1_C',
    'Recipe_Alternate_RecycledRubber_C',
  ]
  const CYCLE_INPUT: SolveInput = {
    targets: [{ item: 'Desc_Plastic_C', ratePerMin: 300 }],
    enabledRecipes: CYCLE_RECIPES,
  }

  it('リサイクル・プラスチック/ゴムのループを含む構成が解ける（発散しない）', async () => {
    const solution = await solveOk(CYCLE_INPUT)

    const m = machines(solution)
    expect(m.get('Recipe_Plastic_C')).toBeCloseTo(5, 6)
    expect(m.get('Recipe_Rubber_C')).toBeCloseTo(5, 6)
    expect(m.get('Recipe_ResidualFuel_C')).toBeCloseTo(2.5, 6)
    expect(m.get('Recipe_Alternate_Plastic_1_C')).toBeCloseTo(10 / 3, 6)

    expect(rateOf(solution.rawResources, 'Desc_LiquidOil_C')).toBeCloseTo(300, 6)
    expect(solution.targets[0].producedPerMin).toBeCloseTo(300, 6)
  })

  it('原油と廃重油の収支が一致する（ループが余剰も不足も生まない）', async () => {
    const solution = await solveOk(CYCLE_INPUT)

    const oil = balanceOf(solution, 'Desc_LiquidOil_C')!
    expect(oil.suppliedPerMin).toBeCloseTo(300, 6)
    expect(oil.consumedPerMin).toBeCloseTo(300, 6)
    expect(oil.netPerMin).toBeCloseTo(0, 6)

    const residue = balanceOf(solution, 'Desc_HeavyOilResidue_C')!
    expect(residue.producedPerMin).toBeCloseTo(150, 6)
    expect(residue.consumedPerMin).toBeCloseTo(150, 6)
    expect(residue.netPerMin).toBeCloseTo(0, 6)

    // ループ内を回るゴム・燃料も出入りが一致する
    for (const item of ['Desc_Rubber_C', 'Desc_LiquidFuel_C']) {
      const b = balanceOf(solution, item)!
      expect(b.producedPerMin, item).toBeCloseTo(100, 6)
      expect(b.consumedPerMin, item).toBeCloseTo(100, 6)
      expect(b.netPerMin, item).toBeCloseTo(0, 6)
    }
  })

  it('リサイクル・プラスチック単体でもゴムの循環が閉じる（ゴム 120/min 目標）', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_Rubber_C', ratePerMin: 120 }],
      enabledRecipes: CYCLE_RECIPES,
    })
    expect(solution.targets[0].producedPerMin).toBeCloseTo(120, 6)
    // ループが回っていてもプラスチックの収支は閉じている（無限ループにならない）
    const plastic = balanceOf(solution, 'Desc_Plastic_C')
    if (plastic) expect(plastic.netPerMin).toBeGreaterThanOrEqual(-EPS)
    // 全ステップの台数が有限
    for (const step of solution.steps) {
      expect(Number.isFinite(step.machineCount), step.recipeId).toBe(true)
      expect(step.machineCount).toBeLessThan(1e6)
    }
  })

  it('循環レシピだけを有効にしても原料がなければ実行不能になる（無限ループにならない）', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 100 }],
      enabledRecipes: ['Recipe_Alternate_Plastic_1_C', 'Recipe_Alternate_RecycledRubber_C'],
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons[0].kind).toBe('unproducibleItem')
  })
})

// ---------------------------------------------------------------------------
// 副産物の扱い
// ---------------------------------------------------------------------------

describe('副産物', () => {
  it('副産物（廃重油）を再利用した分が二重計上されない', async () => {
    // 燃料 60/min を残留燃料経由で作る。廃重油はプラスチック生産の副産物。
    const solution = await solveOk({
      targets: [
        { item: 'Desc_Plastic_C', ratePerMin: 100 },
        { item: 'Desc_LiquidFuel_C', ratePerMin: 20 },
      ],
    })

    const residue = balanceOf(solution, 'Desc_HeavyOilResidue_C')!
    // 副産物として出た廃重油が燃料側の投入に回っている＝産出量が消費量に一致
    expect(residue.suppliedPerMin).toBe(0)
    expect(residue.producedPerMin).toBeGreaterThan(0)
    expect(residue.producedPerMin - residue.consumedPerMin).toBeCloseTo(residue.netPerMin, 6)

    // 原油の供給量は「プラスチック用 + 燃料用」の単純合計ではなく、副産物再利用後の量
    const oil = balanceOf(solution, 'Desc_LiquidOil_C')!
    expect(oil.suppliedPerMin).toBeCloseTo(oil.consumedPerMin, 6)
    // プラスチック100/min だけで原油150/min。廃重油の再利用で燃料が賄えるので原油は150のまま
    expect(oil.suppliedPerMin).toBeCloseTo(150, 6)
  })

  it('余った副産物は byproducts に一度だけ現れ、シンクポイントが計算される', async () => {
    // プラスチックだけを作ると廃重油が必ず余る
    const solution = await solveOk({
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 100 }],
      enabledRecipes: ['Recipe_Plastic_C'],
    })

    // 原油150 → プラ100 + 廃重油50
    expect(rateOf(solution.rawResources, 'Desc_LiquidOil_C')).toBeCloseTo(150, 6)
    const residueEntries = solution.byproducts.filter((b) => b.item === 'Desc_HeavyOilResidue_C')
    expect(residueEntries).toHaveLength(1)
    expect(residueEntries[0].ratePerMin).toBeCloseTo(50, 6)

    // 副産物は目標にも原料にも含まれない
    expect(solution.byproducts.map((b) => b.item)).not.toContain('Desc_Plastic_C')
    expect(solution.byproducts.map((b) => b.item)).not.toContain('Desc_LiquidOil_C')

    const sinkPoints = itemsById.get('Desc_HeavyOilResidue_C')!.sinkPoints
    expect(solution.sinkPointsPerMin).toBeCloseTo(50 * sinkPoints, 4)
  })

  it('同じアイテムを複数レシピが産出しても収支は1行に集約される', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 300 }],
      enabledRecipes: [...defaultEnabledRecipeIds(), 'Recipe_Alternate_Plastic_1_C'],
    })
    const plasticRows = solution.itemBalance.filter((b) => b.item === 'Desc_Plastic_C')
    expect(plasticRows).toHaveLength(1)
    expect(plasticRows[0].producedPerMin).toBeCloseTo(300, 6)
  })
})

// ---------------------------------------------------------------------------
// 原料上限と実行不能診断
// ---------------------------------------------------------------------------

describe('原料上限と実行不能診断', () => {
  it('原料上限を絞ると infeasible になり、不足している原料と量が返る', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
      resourceLimits: { Desc_OreIron_C: 50 },
    })

    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons).toHaveLength(1)
    const reason = result.reasons[0]
    expect(reason.kind).toBe('resourceLimit')
    if (reason.kind !== 'resourceLimit') return
    expect(reason.item).toBe('Desc_OreIron_C')
    expect(reason.limitPerMin).toBe(50)
    expect(reason.requiredPerMin).toBeCloseTo(90, 6)
    expect(reason.shortfallPerMin).toBeCloseTo(40, 6)
    expect(result.message).toContain('鉄鉱石')
  })

  it('マップ上限を超える目標は infeasible になる', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 200_000 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.some((r) => r.kind === 'resourceLimit' && r.item === 'Desc_OreIron_C')).toBe(true)
  })

  it('レシピが1つも有効でなければ「生産できない」と返る', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: [],
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons).toEqual([
      {
        kind: 'unproducibleItem',
        item: 'Desc_IronPlate_C',
        message: expect.stringContaining('鉄板'),
      },
    ])
  })

  it('上限ぎりぎりなら解けて、使用率が返る', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
      resourceLimits: { Desc_OreIron_C: 90 },
    })
    const iron = solution.rawResources.find((r) => r.item === 'Desc_OreIron_C')!
    expect(iron.ratePerMin).toBeCloseTo(90, 6)
    expect(iron.limitPerMin).toBe(90)
    expect(iron.usageRatio).toBeCloseTo(1, 6)
  })

  it('上限の部分指定は他の原料の既定値（マップ上限）を消さない', async () => {
    const model = buildProductionModel({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      resourceLimits: { Desc_OreIron_C: 50 },
    })
    expect(model.limits.get('Desc_OreIron_C')).toBe(50)
    expect(model.limits.get('Desc_Stone_C')).toBe(69_300)
    expect(model.limits.get('Desc_Water_C')).toBeNull()
  })

  it('無制限の原料は usageRatio が null になる', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_LiquidFuel_C', ratePerMin: 60 }],
      enabledRecipes: ALL_RECIPES,
      weights: { resources: 0, power: 1 },
    })
    for (const raw of solution.rawResources) {
      if (raw.item === 'Desc_Water_C') expect(raw.usageRatio).toBeNull()
    }
  })

  it('既保有アイテムの投入で必要な原料が減る', async () => {
    const withoutInput = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const withInput = await solveOk({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      inputs: { Desc_IronIngot_C: 45 },
    })
    expect(rateOf(withoutInput.rawResources, 'Desc_OreIron_C')).toBeCloseTo(90, 6)
    expect(rateOf(withInput.rawResources, 'Desc_OreIron_C')).toBeCloseTo(45, 6)
    expect(machines(withInput).get('Recipe_IngotIron_C')).toBeCloseTo(1.5, 6)
  })
})

// ---------------------------------------------------------------------------
// 目的関数の重み
// ---------------------------------------------------------------------------

describe('目的関数の重み', () => {
  const target: SolveInput = {
    targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    enabledRecipes: ALL_RECIPES,
  }

  it('資源最小と電力最小で別の解になる', async () => {
    const byResource = await solveOk({ ...target, weights: { resources: 1, power: 0, buildings: 0 } })
    const byPower = await solveOk({ ...target, weights: { resources: 0, power: 1, buildings: 0 } })

    const resourceRecipes = [...machines(byResource).keys()].sort()
    const powerRecipes = [...machines(byPower).keys()].sort()
    expect(resourceRecipes).not.toEqual(powerRecipes)

    // 電力最小の解は基本レシピ2本・24MW（これが全レシピ中で最小電力）
    expect(powerRecipes).toEqual(['Recipe_IngotIron_C', 'Recipe_IronPlate_C'])
    expect(byPower.totalPowerMW).toBeCloseTo(24, 6)

    // それぞれの指標で自分の方が優れている
    expect(byPower.totalPowerMW).toBeLessThan(byResource.totalPowerMW)
    expect(rateOf(byResource.rawResources, 'Desc_OreIron_C')).toBeLessThan(
      rateOf(byPower.rawResources, 'Desc_OreIron_C'),
    )
  })

  it('台数最小は稼働台数の合計が最も小さい', async () => {
    const byBuildings = await solveOk({ ...target, weights: { resources: 0, power: 0, buildings: 1 } })
    const byPower = await solveOk({ ...target, weights: { resources: 0, power: 1, buildings: 0 } })
    expect(byBuildings.totalMachineCount).toBeLessThan(byPower.totalMachineCount)
  })

  it("資源重み 'uniform' と 'scarcity' で解が変わる（コンクリート 45/min）", async () => {
    const input: SolveInput = { targets: [{ item: 'Desc_Cement_C', ratePerMin: 45 }] }
    const scarcity = await solveOk({ ...input, resourceWeights: 'scarcity' })
    const uniform = await solveOk({ ...input, resourceWeights: 'uniform' })

    // 希少度重み: 素直に石灰岩135/min
    expect(rateOf(scarcity.rawResources, 'Desc_Stone_C')).toBeCloseTo(135, 6)
    expect(scarcity.steps).toHaveLength(1)

    // 一律重み: 「総採取量」だけを見るので変換機で硫黄+SAMから石灰岩を作る解になる
    expect(rateOf(uniform.rawResources, 'Desc_Stone_C')).toBeCloseTo(0, 6)
    expect(uniform.totalPowerMW).toBeGreaterThan(scarcity.totalPowerMW)
  })

  it('resourceWeights にオブジェクトを渡すと個別に効く', async () => {
    const weights = resolveResourceWeights({ Desc_OreIron_C: 5 }, ['Desc_OreIron_C', 'Desc_Coal_C'], {})
    expect(weights.get('Desc_OreIron_C')).toBe(5)
    expect(weights.get('Desc_Coal_C')).toBe(1)
  })

  it("'scarcity' は上限が少ない資源ほど重く、無制限の資源は 0", () => {
    const limits = { Desc_OreIron_C: 92_100, Desc_OreUranium_C: 2_100, Desc_Water_C: null }
    const weights = resolveResourceWeights('scarcity', Object.keys(limits), limits)
    expect(weights.get('Desc_OreIron_C')).toBeCloseTo(1, 9)
    expect(weights.get('Desc_OreUranium_C')).toBeCloseTo(92_100 / 2_100, 9)
    expect(weights.get('Desc_Water_C')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 出力データ構造（v0 §4.4）
// ---------------------------------------------------------------------------

describe('Solution の構造', () => {
  it('各ステップの入出力レートが台数 × レシピレートと一致する', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_IronPlateReinforced_C', ratePerMin: 5 }],
    })
    for (const step of solution.steps) {
      const recipe = recipesById.get(step.recipeId)!
      for (const input of step.inputs) {
        const amount = recipe.ingredients.find((i) => i.item === input.item)!.amount
        expect(input.ratePerMin, `${step.recipeId}/${input.item}`).toBeCloseTo(
          (amount * 60 * step.machineCount) / recipe.durationSec,
          6,
        )
      }
      for (const output of step.outputs) {
        const amount = recipe.products.find((p) => p.item === output.item)!.amount
        expect(output.ratePerMin, `${step.recipeId}/${output.item}`).toBeCloseTo(
          (amount * 60 * step.machineCount) / recipe.durationSec,
          6,
        )
      }
    }
  })

  it('建設コストは切り上げ台数ぶんの建材合計になる', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const expected = new Map<string, number>()
    for (const step of solution.steps) {
      const building = buildingsById.get(step.buildingId)!
      for (const cost of building.buildCost) {
        expected.set(cost.item, (expected.get(cost.item) ?? 0) + cost.amount * Math.ceil(step.machineCount))
      }
    }
    expect(new Map(solution.totalBuildCost.map((c) => [c.item, c.amount]))).toEqual(expected)
    expect(solution.totalBuildCost.every((c) => Number.isInteger(c.amount))).toBe(true)
  })

  it('可変電力レシピは powerRangeMW を持ち、合計にも幅が出る', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_QuantumEnergy_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPES,
    })
    const variableSteps = solution.steps.filter((s) => s.powerRangeMW)
    expect(variableSteps.length).toBeGreaterThan(0)
    for (const step of variableSteps) {
      expect(step.powerRangeMW!.minMW).toBeLessThan(step.powerRangeMW!.maxMW)
      expect(step.powerMW).toBeCloseTo(
        (step.powerRangeMW!.minMW + step.powerRangeMW!.maxMW) / 2,
        6,
      )
    }
    expect(solution.totalPowerRangeMW.minMW).toBeLessThan(solution.totalPowerRangeMW.maxMW)
    expect(solution.totalPowerMW).toBeGreaterThan(solution.totalPowerRangeMW.minMW)
    expect(solution.totalPowerMW).toBeLessThan(solution.totalPowerRangeMW.maxMW)
  })

  it('固定電力のレシピは powerRangeMW を持たない', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    for (const step of solution.steps) expect(step.powerRangeMW, step.recipeId).toBeUndefined()
  })

  it('全アイテムの収支が「産出 + 供給 - 消費 = 差分」で閉じている', async () => {
    const solution = await solveOk({
      targets: [{ item: 'Desc_MotorLightweight_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPES,
    })
    for (const b of solution.itemBalance) {
      expect(b.netPerMin, b.item).toBeCloseTo(
        b.producedPerMin + b.suppliedPerMin - b.consumedPerMin,
        6,
      )
      // 目標・副産物・原料以外は余りが出ない（過剰生産していない）
      expect(b.netPerMin, b.item).toBeGreaterThanOrEqual(-1e-6)
    }
    // 目標は要求どおり
    expect(solution.targets[0].producedPerMin).toBeCloseTo(10, 6)
  })
})

// ---------------------------------------------------------------------------
// 定式化そのもの
// ---------------------------------------------------------------------------

describe('LP モデルの組み立て', () => {
  it('netRatePerMin が産出 - 消費になる', () => {
    // リサイクル・プラスチック: ゴム30 + 燃料30 → プラスチック60（毎分）
    const recipe = recipesById.get('Recipe_Alternate_Plastic_1_C')!
    expect(netRatePerMin(recipe, 'Desc_Plastic_C')).toBeCloseTo(60, 6)
    expect(netRatePerMin(recipe, 'Desc_Rubber_C')).toBeCloseTo(-30, 6)
    expect(netRatePerMin(recipe, 'Desc_IronPlate_C')).toBe(0)
  })

  it('既定の有効レシピは代替レシピを含まない', () => {
    const ids = defaultEnabledRecipeIds()
    expect(ids.length).toBeGreaterThan(100)
    expect(ids.some((id) => recipesById.get(id)!.isAlternate)).toBe(false)
  })

  it('レシピ変数と原料変数が作られ、アイテムごとに収支制約が立つ', () => {
    const model = buildProductionModel({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
    })
    expect(model.lp.direction).toBe('min')
    expect(model.lp.variables.map((v) => v.key)).toContain('x:Recipe_IronPlate_C')
    expect(model.lp.variables.map((v) => v.key)).toContain('s:Desc_OreIron_C')
    // 原料は13種すべて供給変数を持つ
    expect(model.supplies.filter((s) => s.kind === 'raw')).toHaveLength(13)

    const plateRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_IronPlate_C')!
    expect(plateRow.lower).toBe(60)
    expect(plateRow.coefficients.get('x:Recipe_IronPlate_C')).toBeCloseTo(20, 6)

    const ironOreRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_OreIron_C')!
    expect(ironOreRow.lower).toBe(0)
    expect(ironOreRow.coefficients.get('x:Recipe_IngotIron_C')).toBeCloseTo(-30, 6)
    expect(ironOreRow.coefficients.get('s:Desc_OreIron_C')).toBe(1)
  })

  it('全291レシピを有効にしてもモデルが破綻しない', async () => {
    const model = buildProductionModel({
      targets: [{ item: 'Desc_ModularFrameHeavy_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPES,
    })
    expect(model.recipes).toHaveLength(recipes.length)
    expect(model.lp.variables.length).toBe(recipes.length + 13)
    const solution = await solveOk({
      targets: [{ item: 'Desc_ModularFrameHeavy_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPES,
    })
    expect(solution.targets[0].producedPerMin).toBeCloseTo(10, 6)
  })

  it('存在しない ID は例外にする', () => {
    expect(() => buildProductionModel({ targets: [{ item: 'Desc_Nope_C', ratePerMin: 1 }] })).toThrow(
      /unknown item/,
    )
    expect(() =>
      buildProductionModel({ targets: [], enabledRecipes: ['Recipe_Nope_C'] }),
    ).toThrow(/unknown recipe/)
    expect(() => buildProductionModel({ targets: [], inputs: { Desc_Nope_C: 1 } })).toThrow(
      /unknown item/,
    )
  })

  it('負の重み・負の目標は例外にする（目的関数が発散するため）', () => {
    const targets = [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }]
    expect(() => buildProductionModel({ targets, weights: { resources: -1 } })).toThrow(
      /weight must be a finite number >= 0/,
    )
    expect(() => buildProductionModel({ targets, epsilon: -1 })).toThrow(/epsilon/)
    expect(() =>
      buildProductionModel({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: -1 }] }),
    ).toThrow(/target rate must be >= 0/)
  })

  it('変数のないモデルは LP に書き出せない', () => {
    expect(() => writeLpFormat({ direction: 'min', variables: [], constraints: [] })).toThrow(
      /no variables/,
    )
  })

  it('LP フォーマットに書き出せる（外部ソルバーとの突き合わせ用）', () => {
    const model = buildProductionModel({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
    })
    const { text, nameByKey } = writeLpFormat(model.lp)
    expect(text.startsWith('Minimize')).toBe(true)
    expect(text.trimEnd().endsWith('End')).toBe(true)
    expect(text).toContain('Subject To')
    expect(text).toContain('Bounds')
    // 変数名は v0, v1 … に振り直される（LP フォーマットに ':' は使えない）
    expect([...nameByKey.values()]).toContain('v0')
    expect(text).not.toContain(':Recipe_')
    // 鉄鉱石の上限が Bounds に出る
    expect(text).toMatch(new RegExp(`${nameByKey.get('s:Desc_OreIron_C')} <= 92100`))
  })
})

// ---------------------------------------------------------------------------
// 結果の安定性
// ---------------------------------------------------------------------------

describe('安定性', () => {
  it('同じ入力を2回解くと同じ解になる', async () => {
    const input: SolveInput = {
      targets: [{ item: 'Desc_MotorLightweight_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPES,
    }
    const a = await solveOk(input)
    const b = await solveOk(input)
    expect(a.steps.map((s) => [s.recipeId, s.machineCount])).toEqual(
      b.steps.map((s) => [s.recipeId, s.machineCount]),
    )
    expect(a.objectiveValue).toBeCloseTo(b.objectiveValue, 9)
  })

  it('目標レートを2倍にすると解も2倍になる（線形性）', async () => {
    const base = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const doubled = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 120 }] })
    const baseM = machines(base)
    for (const [id, count] of machines(doubled)) {
      expect(count, id).toBeCloseTo(baseM.get(id)! * 2, 6)
    }
    expect(doubled.totalPowerMW).toBeCloseTo(base.totalPowerMW * 2, 6)
  })

  it('SolveResult の判別が型どおりに効く', async () => {
    const result: SolveResult = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    })
    if (result.status === 'optimal') {
      expect(result.steps.length).toBeGreaterThan(0)
    } else {
      expect(result.reasons.length).toBeGreaterThan(0)
    }
    expect(EPS).toBeLessThan(1)
  })
})
