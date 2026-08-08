/**
 * 発電計画（発電機を LP に載せる）の検証。
 *
 * 発電機は「燃料(+水) を消費して電力(MW) を産出する変数」として LP に足し、
 *   目標: Σ(発電量_g × g) >= 目標MW
 *   自給: Σ(発電量_g × g) - Σ(消費電力_r × x_r) >= 0
 * の行を張る（src/solver/model.ts）。燃料はアイテム収支に入るので、
 * 石炭の採掘・燃料の精製・ウラン燃料棒の製造まで同じ LP が同時に解く。
 *
 * いちばん大事なのは**発電OFF時の回帰**（LP を1変数も変えないこと）。
 */
import { describe, expect, it } from 'vitest'

import { buildingsById, generators, generatorsById, itemsById } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import { groupByBuilding } from '../src/plan/aggregate.ts'
import {
  POWER_COVER_ROW,
  POWER_TARGET_ROW,
  buildProductionModel,
  generatorStepId,
  generatorVarKey,
  resolvePowerPlan,
  solveProduction,
} from '../src/solver/index.ts'
import type { Solution, SolutionStep, SolveInput } from '../src/solver/index.ts'

const COAL = 'Build_GeneratorCoal_C'
const FUEL = 'Build_GeneratorFuel_C'
const NUCLEAR = 'Build_GeneratorNuclear_C'

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

const rateOf = (entries: readonly { item: string; ratePerMin: number }[], item: string): number =>
  entries.find((e) => e.item === item)?.ratePerMin ?? 0

const generatorSteps = (solution: Solution): SolutionStep[] =>
  solution.steps.filter((s) => (s.powerProductionMW ?? 0) > 0)

const IRON_PLATE_60: SolveInput = { targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] }

// ---------------------------------------------------------------------------
// データ（generators.json）
// ---------------------------------------------------------------------------

describe('発電機データ', () => {
  it('石炭 / 燃料式 / 原子力の3種だけを収録する（バイオマス・地熱は除外）', () => {
    expect(generators.map((g) => g.id).sort()).toEqual([COAL, FUEL, NUCLEAR])
    expect(generators.map((g) => g.category).sort()).toEqual(['coal', 'fuel', 'nuclear'])
    expect(generatorsById.has('Build_GeneratorBiomass_Automated_C')).toBe(false)
    expect(generatorsById.has('Build_GeneratorGeoThermal_C')).toBe(false)
  })

  it('id が buildings.json（category: generator）に解決でき、建設コストと外形を持つ', () => {
    for (const generator of generators) {
      const building = buildingsById.get(generator.id)
      expect(building, generator.id).toBeDefined()
      expect(building!.category, generator.id).toBe('generator')
      expect(building!.buildCost.length, generator.id).toBeGreaterThan(0)
      expect(building!.footprint.areaM2, generator.id).toBeGreaterThan(0)
      // 発電機は電力を消費しない（産出するだけ）
      expect(building!.powerConsumptionMW, generator.id).toBe(0)
    }
  })

  it('燃料・補助資源・副産物がすべて items に解決でき、レートが正の有限値', () => {
    for (const generator of generators) {
      expect(generator.powerProductionMW, generator.id).toBeGreaterThan(0)
      expect(generator.fuels.length, generator.id).toBeGreaterThan(0)
      for (const fuel of generator.fuels) {
        expect(itemsById.has(fuel.item), `${generator.id} / ${fuel.item}`).toBe(true)
        expect(fuel.ratePerMin, `${generator.id} / ${fuel.item}`).toBeGreaterThan(0)
        expect(Number.isFinite(fuel.ratePerMin)).toBe(true)
        if (fuel.supplementalItem) {
          expect(itemsById.has(fuel.supplementalItem)).toBe(true)
          expect(fuel.supplementalRatePerMin).toBeGreaterThan(0)
        } else {
          expect(fuel.supplementalRatePerMin).toBe(0)
        }
        if (fuel.byproduct) {
          expect(itemsById.has(fuel.byproduct.item)).toBe(true)
          expect(fuel.byproduct.ratePerMin).toBeCloseTo(fuel.ratePerMin * fuel.byproduct.amount, 9)
        }
      }
    }
  })

  it('既知の値と一致する（石炭発電機 75MW / 石炭15・水45）', () => {
    const coal = generatorsById.get(COAL)!
    expect(coal.powerProductionMW).toBe(75)
    const byCoal = coal.fuels.find((f) => f.item === 'Desc_Coal_C')!
    expect(byCoal.ratePerMin).toBeCloseTo(15, 9)
    expect(byCoal.supplementalItem).toBe('Desc_Water_C')
    expect(byCoal.supplementalRatePerMin).toBeCloseTo(45, 9)
    expect(byCoal.byproduct).toBeUndefined()
    // 固形燃料3種すべてが使える
    expect(coal.fuels.map((f) => f.item).sort()).toEqual([
      'Desc_Coal_C',
      'Desc_CompactedCoal_C',
      'Desc_PetroleumCoke_C',
    ])
    expect(coal.fuels.find((f) => f.item === 'Desc_CompactedCoal_C')!.ratePerMin).toBeCloseTo(
      75 / 10.5,
      9,
    )
    expect(coal.fuels.find((f) => f.item === 'Desc_PetroleumCoke_C')!.ratePerMin).toBeCloseTo(25, 9)
  })

  it('既知の値と一致する（燃料式 250MW / 燃料20・ターボ燃料7.5・水なし）', () => {
    const fuel = generatorsById.get(FUEL)!
    expect(fuel.powerProductionMW).toBe(250)
    expect(fuel.fuels.map((f) => f.item).sort()).toEqual([
      'Desc_IonizedFuel_C',
      'Desc_LiquidBiofuel_C',
      'Desc_LiquidFuel_C',
      'Desc_LiquidTurboFuel_C',
      'Desc_RocketFuel_C',
    ])
    const liquid = fuel.fuels.find((f) => f.item === 'Desc_LiquidFuel_C')!
    expect(liquid.ratePerMin).toBeCloseTo(20, 9)
    expect(liquid.supplementalItem).toBeUndefined()
    expect(liquid.supplementalRatePerMin).toBe(0)
    expect(fuel.fuels.find((f) => f.item === 'Desc_LiquidTurboFuel_C')!.ratePerMin).toBeCloseTo(
      7.5,
      9,
    )
    expect(fuel.fuels.find((f) => f.item === 'Desc_IonizedFuel_C')!.ratePerMin).toBeCloseTo(3, 9)
  })

  it('既知の値と一致する（原子力 2500MW / ウラン燃料棒0.2・水240・核廃棄物10）', () => {
    const nuclear = generatorsById.get(NUCLEAR)!
    expect(nuclear.powerProductionMW).toBe(2500)
    const uranium = nuclear.fuels.find((f) => f.item === 'Desc_NuclearFuelRod_C')!
    expect(uranium.ratePerMin).toBeCloseTo(0.2, 9)
    expect(uranium.supplementalItem).toBe('Desc_Water_C')
    expect(uranium.supplementalRatePerMin).toBeCloseTo(240, 9)
    expect(uranium.byproduct).toEqual({
      item: 'Desc_NuclearWaste_C',
      amount: 50,
      ratePerMin: 10,
    })
    const plutonium = nuclear.fuels.find((f) => f.item === 'Desc_PlutoniumFuelRod_C')!
    expect(plutonium.ratePerMin).toBeCloseTo(0.1, 9)
    expect(plutonium.byproduct?.item).toBe('Desc_PlutoniumWaste_C')
    expect(plutonium.byproduct?.ratePerMin).toBeCloseTo(1, 9)
    // フィクソニウム燃料棒は廃棄物が出ない
    expect(nuclear.fuels.find((f) => f.item === 'Desc_FicsoniumFuelRod_C')!.byproduct).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 回帰: 発電OFF なら LP は1変数も変わらない
// ---------------------------------------------------------------------------

describe('発電OFF（既定）', () => {
  const allGenerators = generators.map((g) => g.id)

  it('resolvePowerPlan は「発電機なし」「目標も自給も無し」で無効になる', () => {
    expect(resolvePowerPlan(undefined).active).toBe(false)
    expect(resolvePowerPlan({}).active).toBe(false)
    expect(resolvePowerPlan({ generators: [] , targetMW: 500 }).active).toBe(false)
    expect(resolvePowerPlan({ generators: allGenerators }).active).toBe(false)
    expect(resolvePowerPlan({ generators: allGenerators, targetMW: 0 }).active).toBe(false)
    expect(resolvePowerPlan({ generators: allGenerators, targetMW: 300 }).active).toBe(true)
    expect(resolvePowerPlan({ generators: allGenerators, coverFactoryPower: true }).active).toBe(
      true,
    )
  })

  it('LP の変数・制約・目的係数が発電機能の追加前と完全に一致する', () => {
    const base = buildProductionModel(IRON_PLATE_60)
    for (const power of [
      undefined,
      {},
      { generators: [] },
      { generators: allGenerators },
      { generators: allGenerators, targetMW: 0, coverFactoryPower: false },
    ]) {
      const model = buildProductionModel({ ...IRON_PLATE_60, power })
      expect(model.generatorVariants, JSON.stringify(power)).toEqual([])
      expect(model.lp.variables).toEqual(base.lp.variables)
      expect(model.lp.constraints.map((c) => c.key)).toEqual(base.lp.constraints.map((c) => c.key))
      for (const row of [POWER_TARGET_ROW, POWER_COVER_ROW]) {
        expect(model.lp.constraints.some((c) => c.key === row)).toBe(false)
      }
    }
  })

  it('解が従来どおり（鉄板 60/min → 鉄鉱石 90/min・6台）で powerGeneration が付かない', async () => {
    const implicit = await solveOk(IRON_PLATE_60)
    const explicit = await solveOk({
      ...IRON_PLATE_60,
      power: { generators: allGenerators, targetMW: 0 },
    })
    expect(rateOf(explicit.rawResources, 'Desc_OreIron_C')).toBeCloseTo(90, 6)
    expect(explicit.totalMachineCount).toBeCloseTo(6, 6)
    expect(explicit.totalBuildingCount).toBe(6)
    expect(explicit.powerGeneration).toBeUndefined()
    expect(implicit.powerGeneration).toBeUndefined()
    expect(generatorSteps(explicit)).toEqual([])
    expect(explicit.steps.map((s) => [s.recipeId, s.machineCount])).toEqual(
      implicit.steps.map((s) => [s.recipeId, s.machineCount]),
    )
    expect(explicit.objectiveValue).toBeCloseTo(implicit.objectiveValue, 9)
  })

  it('不明な発電機IDは例外', () => {
    expect(() => resolvePowerPlan({ generators: ['Build_Nope_C'], targetMW: 1 })).toThrow(
      /unknown generator id/,
    )
    expect(() => resolvePowerPlan({ generators: [COAL], targetMW: -1 })).toThrow(/targetMW/)
  })
})

// ---------------------------------------------------------------------------
// LP モデル
// ---------------------------------------------------------------------------

describe('LP モデル', () => {
  const input: SolveInput = {
    ...IRON_PLATE_60,
    power: { generators: [COAL], targetMW: 300, coverFactoryPower: true },
  }

  it('発電機 × 燃料ごとに1変数を作る', () => {
    const model = buildProductionModel(input)
    expect(model.generatorVariants.map((v) => v.key)).toEqual([
      generatorVarKey(COAL, 'Desc_Coal_C'),
      generatorVarKey(COAL, 'Desc_CompactedCoal_C'),
      generatorVarKey(COAL, 'Desc_PetroleumCoke_C'),
    ])
  })

  it('燃料と水はアイテム収支の行に負の係数で入る（＝生産チェーンにつながる）', () => {
    const model = buildProductionModel(input)
    const key = generatorVarKey(COAL, 'Desc_Coal_C')
    const coalRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_Coal_C')!
    const waterRow = model.lp.constraints.find((c) => c.key === 'balance:Desc_Water_C')!
    expect(coalRow.coefficients.get(key)).toBeCloseTo(-15, 9)
    expect(waterRow.coefficients.get(key)).toBeCloseTo(-45, 9)
  })

  it('核廃棄物は正の係数（副産物）として同じ行に入る', () => {
    const model = buildProductionModel({
      ...IRON_PLATE_60,
      power: { generators: [NUCLEAR], targetMW: 2500 },
    })
    const key = generatorVarKey(NUCLEAR, 'Desc_NuclearFuelRod_C')
    const waste = model.lp.constraints.find((c) => c.key === 'balance:Desc_NuclearWaste_C')!
    expect(waste.coefficients.get(key)).toBeCloseTo(10, 9)
  })

  it('目標発電量と自給はそれぞれ専用の制約行になる', () => {
    const model = buildProductionModel(input)
    const target = model.lp.constraints.find((c) => c.key === POWER_TARGET_ROW)!
    expect(target.lower).toBe(300)
    expect(target.coefficients.get(generatorVarKey(COAL, 'Desc_Coal_C'))).toBe(75)
    // 目標行には製造建物の消費は入らない
    expect(target.coefficients.has('x:Recipe_IronPlate_C')).toBe(false)

    const cover = model.lp.constraints.find((c) => c.key === POWER_COVER_ROW)!
    expect(cover.lower).toBe(0)
    expect(cover.coefficients.get(generatorVarKey(COAL, 'Desc_Coal_C'))).toBe(75)
    // 製作機は 4MW/台 → 自給行では負の係数
    expect(cover.coefficients.get('x:Recipe_IronPlate_C')).toBeCloseTo(-4, 9)
  })

  it('目標だけ / 自給だけのときは、要らないほうの行を作らない', () => {
    const onlyTarget = buildProductionModel({
      ...IRON_PLATE_60,
      power: { generators: [COAL], targetMW: 300 },
    })
    expect(onlyTarget.lp.constraints.some((c) => c.key === POWER_TARGET_ROW)).toBe(true)
    expect(onlyTarget.lp.constraints.some((c) => c.key === POWER_COVER_ROW)).toBe(false)

    const onlyCover = buildProductionModel({
      ...IRON_PLATE_60,
      power: { generators: [COAL], coverFactoryPower: true },
    })
    expect(onlyCover.lp.constraints.some((c) => c.key === POWER_TARGET_ROW)).toBe(false)
    expect(onlyCover.lp.constraints.some((c) => c.key === POWER_COVER_ROW)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 解（手計算と突き合わせる既知値）
// ---------------------------------------------------------------------------

describe('石炭発電（手計算）', () => {
  /** レシピを一切使わない = 石炭と水を採るだけの、完全に手計算できる条件 */
  const bare: SolveInput = {
    targets: [],
    enabledRecipes: [],
    power: { generators: [COAL], targetMW: 300 },
  }

  it('目標300MW → 石炭発電機4台・石炭 60/min・水 180 m³/min', async () => {
    const solution = await solveOk(bare)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(300, 6)
    expect(solution.powerGeneration!.targetMW).toBe(300)
    expect(solution.powerGeneration!.totalGeneratorMachineCount).toBeCloseTo(4, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(4)
    expect(rateOf(solution.powerGeneration!.fuelUsage, 'Desc_Coal_C')).toBeCloseTo(60, 6)
    expect(rateOf(solution.rawResources, 'Desc_Coal_C')).toBeCloseTo(60, 6)
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBeCloseTo(180, 6)
    expect(solution.byproducts).toEqual([])
  })

  it('発電機のステップは消費電力0・発電量つき・クロック100%固定', async () => {
    const solution = await solveOk(bare)
    const steps = generatorSteps(solution)
    expect(steps.length).toBe(1)
    const step = steps[0]!
    expect(step.recipeId).toBe(generatorStepId(COAL, 'Desc_Coal_C'))
    expect(step.buildingId).toBe(COAL)
    expect(step.recipeName.ja).toContain('石炭')
    expect(step.fuelItem).toBe('Desc_Coal_C')
    expect(step.machineCount).toBeCloseTo(4, 6)
    expect(step.builtCount).toBe(4)
    expect(step.clockSpeed).toBeCloseTo(1, 6)
    expect(step.powerShards).toBe(0)
    expect(step.somersloops).toBe(0)
    expect(step.powerMW).toBe(0)
    expect(step.clockedPowerMW).toBe(0)
    expect(step.powerProductionMW).toBeCloseTo(300, 6)
    expect(rateOf(step.inputs, 'Desc_Coal_C')).toBeCloseTo(60, 6)
    expect(rateOf(step.inputs, 'Desc_Water_C')).toBeCloseTo(180, 6)
    expect(step.outputs).toEqual([])
    // 建物の合計にも入る（建設コスト・床面積が出るように）
    expect(step.footprintAreaM2).toBeCloseTo(4 * buildingsById.get(COAL)!.footprint.areaM2, 6)
    expect(solution.totalBuildingCount).toBe(4)
    expect(solution.totalBuildCost.length).toBeGreaterThan(0)
  })

  it('端数の台数は切り上げて建て、クロックは100%未満（部分負荷）になる', async () => {
    const solution = await solveOk({ ...bare, power: { generators: [COAL], targetMW: 100 } })
    const step = generatorSteps(solution)[0]!
    expect(step.machineCount).toBeCloseTo(100 / 75, 6)
    expect(step.builtCount).toBe(2)
    expect(step.clockSpeed).toBeCloseTo(100 / 75 / 2, 6)
    expect(step.clockSpeed).toBeLessThanOrEqual(1)
  })

  it('製造クロック上限を上げても発電機は100%のまま（発電側OCは未対応）', async () => {
    const solution = await solveOk({ ...bare, maxClock: 2.5 })
    const step = generatorSteps(solution)[0]!
    expect(step.builtCount).toBe(4)
    expect(step.clockSpeed).toBeCloseTo(1, 6)
  })

  it('レシピ有効でも既定（資源効率）では石炭をそのまま燃やす', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [COAL], targetMW: 300 } })
    expect(rateOf(solution.powerGeneration!.fuelUsage, 'Desc_Coal_C')).toBeCloseTo(60, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(4)
  })

  it('石炭の上限を超える目標は実行不能（原料不足として報告する）', async () => {
    const result = await solveProduction({ ...bare, power: { generators: [COAL], targetMW: 300_000 } })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.some((r) => r.kind === 'resourceLimit' && r.item === 'Desc_Coal_C')).toBe(
      true,
    )
  })
})

describe('燃料式発電（燃料チェーンまで解く）', () => {
  it('目標250MW → 1台・燃料 20 m³/min・原油 30 m³/min まで遡る', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [FUEL], targetMW: 250 } })
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(250, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(1)
    expect(rateOf(solution.powerGeneration!.fuelUsage, 'Desc_LiquidFuel_C')).toBeCloseTo(20, 6)
    // 燃料は精製所で作られる（原油 60 → 燃料 40 なので 0.5 台 = 原油 30）
    const refinery = solution.steps.find((s) => s.recipeId === 'Recipe_LiquidFuel_C')!
    expect(refinery).toBeDefined()
    expect(refinery.machineCount).toBeCloseTo(0.5, 6)
    expect(rateOf(solution.rawResources, 'Desc_LiquidOil_C')).toBeCloseTo(30, 6)
    // 発電機自体は水を使わない
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBe(0)
  })
})

describe('原子力発電（核廃棄物の計上）', () => {
  /** 燃料棒を持ち込み、レシピを使わない条件（再処理が走らないので廃棄物がそのまま残る） */
  const bare: SolveInput = {
    targets: [],
    enabledRecipes: [],
    inputs: { Desc_NuclearFuelRod_C: 1 },
    power: { generators: [NUCLEAR], targetMW: 2500 },
  }

  it('1台 → ウラン燃料棒 0.2/min・水 240 m³/min・核廃棄物 10/min を副産物に計上', async () => {
    const solution = await solveOk(bare)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(1)
    expect(rateOf(solution.powerGeneration!.fuelUsage, 'Desc_NuclearFuelRod_C')).toBeCloseTo(0.2, 6)
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBeCloseTo(240, 6)
    expect(rateOf(solution.byproducts, 'Desc_NuclearWaste_C')).toBeCloseTo(10, 6)

    const step = generatorSteps(solution)[0]!
    expect(rateOf(step.outputs, 'Desc_NuclearWaste_C')).toBeCloseTo(10, 6)
    const waste = solution.itemBalance.find((b) => b.item === 'Desc_NuclearWaste_C')!
    expect(waste.producedPerMin).toBeCloseTo(10, 6)
    expect(waste.netPerMin).toBeCloseTo(10, 6)
  })

  it('再処理レシピが使えると核廃棄物は消化される（ウラン廃棄物が残らない）', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [NUCLEAR], targetMW: 2500 } })
    // ウラン燃料棒の製造まで LP が一気に解いている
    expect(solution.steps.some((s) => s.recipeId === 'Recipe_NuclearFuelRod_C')).toBe(true)
    // 核廃棄物はプルトニウムへの再処理で消化され、副産物としては残らない
    expect(solution.steps.some((s) => s.recipeId === 'Recipe_Plutonium_C')).toBe(true)
    expect(rateOf(solution.byproducts, 'Desc_NuclearWaste_C')).toBeCloseTo(0, 6)
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBeGreaterThan(240)
  })
})

// ---------------------------------------------------------------------------
// 自給（工場の消費電力ぶんを賄う）
// ---------------------------------------------------------------------------

describe('工場の消費電力ぶんを賄う', () => {
  it('鉄板 60/min（24MW）を石炭発電で自給する', async () => {
    const solution = await solveOk({
      ...IRON_PLATE_60,
      power: { generators: [COAL], coverFactoryPower: true },
    })
    // 製錬炉3台(12MW) + 製作機3台(12MW) = 24MW
    expect(solution.totalPowerMW).toBeCloseTo(24, 6)
    expect(solution.powerGeneration!.coverFactoryPower).toBe(true)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(24, 6)
    expect(solution.powerGeneration!.factoryPowerMW).toBeCloseTo(24, 6)
    expect(solution.powerGeneration!.netMW).toBeCloseTo(0, 6)
    // 24MW / 75MW = 0.32 台（1台を32%負荷で回す想定）
    const step = generatorSteps(solution)[0]!
    expect(step.machineCount).toBeCloseTo(0.32, 6)
    expect(step.builtCount).toBe(1)
    expect(rateOf(solution.rawResources, 'Desc_Coal_C')).toBeCloseTo(0.32 * 15, 6)
  })

  it('自給は「発電のために増えた建物」の消費も込みで解く（燃料式・自己消費の循環）', async () => {
    const solution = await solveOk({
      ...IRON_PLATE_60,
      power: { generators: [FUEL], coverFactoryPower: true },
    })
    const generation = solution.powerGeneration!
    // 精製所（燃料を作る）の消費も左辺に入るので、発電量 >= 製造の消費 が必ず成り立つ
    expect(generation.totalMW).toBeGreaterThanOrEqual(generation.factoryPowerMW - 1e-6)
    expect(generation.netMW).toBeGreaterThanOrEqual(-1e-6)
    // 精製所ぶん（30MW）が乗るので、鉄板だけの 24MW より大きい
    expect(generation.factoryPowerMW).toBeGreaterThan(24)
    expect(solution.steps.some((s) => s.recipeId === 'Recipe_LiquidFuel_C')).toBe(true)
  })

  it('目標発電量と自給は同時に指定できる（厳しいほうが効く）', async () => {
    const solution = await solveOk({
      ...IRON_PLATE_60,
      power: { generators: [COAL], targetMW: 300, coverFactoryPower: true },
    })
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(300, 6)
    expect(solution.powerGeneration!.netMW).toBeCloseTo(300 - 24, 6)
  })

  it('発電方式を増やすほど資源コストは下がる（単調・悪化しない）', async () => {
    const single = await solveOk({ targets: [], power: { generators: [COAL], targetMW: 3000 } })
    const both = await solveOk({ targets: [], power: { generators: [COAL, FUEL], targetMW: 3000 } })
    expect(both.objectiveValue).toBeLessThanOrEqual(single.objectiveValue + 1e-6)
  })
})

// ---------------------------------------------------------------------------
// 実行不能の報告
// ---------------------------------------------------------------------------

describe('実行不能の報告', () => {
  it('燃料を用意できない発電方式だけを許可すると、その旨を返す', async () => {
    const result = await solveProduction({
      targets: [],
      enabledRecipes: [],
      power: { generators: [NUCLEAR], targetMW: 2500 },
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.message).toContain('原子力発電所')
    expect(result.message).toContain('燃料')
  })

  it('発電方式を選ばずに目標だけ入れても従来どおり（発電計画は動かない）', async () => {
    const solution = await solveOk({ ...IRON_PLATE_60, power: { generators: [], targetMW: 500 } })
    expect(solution.powerGeneration).toBeUndefined()
    expect(generatorSteps(solution)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 表・グラフへの反映
// ---------------------------------------------------------------------------

describe('表・グラフへの反映', () => {
  it('生産ステップ表は発電機を機械種別（石炭発電機）でまとめる', async () => {
    const solution = await solveOk({
      targets: [],
      enabledRecipes: [],
      power: { generators: [COAL], targetMW: 300 },
    })
    const group = groupByBuilding(solution.steps).find((g) => g.buildingId === COAL)!
    expect(group).toBeDefined()
    expect(group.buildingNameJa).toBe('石炭発電機')
    expect(group.buildingCount).toBe(4)
    expect(group.powerMW).toBe(0)
    expect(group.powerProductionMW).toBeCloseTo(300, 6)
  })

  it('フローチャートは燃料のエッジだけを張り、発電量はノードに持たせる', async () => {
    const solution = await solveOk({
      targets: [],
      enabledRecipes: [],
      power: { generators: [COAL], targetMW: 300 },
    })
    const graph = buildPlanGraph(solution)
    const node = graph.nodes.find((n) => n.kind === 'recipe')!
    expect(node.kind === 'recipe' && node.powerProductionMW).toBeCloseTo(300, 6)
    // 石炭と水が発電機ノードへ流れ込む
    expect(graph.edges.map((e) => e.item).sort()).toEqual(['Desc_Coal_C', 'Desc_Water_C'])
    for (const edge of graph.edges) expect(edge.target).toBe(node.id)
    // 「電力」のエッジは張らない（疑似アイテムを作っていないので当然だが明示しておく）
    expect(graph.edges.some((e) => e.item.includes('Power'))).toBe(false)
  })
})
