/**
 * 発電機の副産物（核廃棄物）を材料にする計画が、発電計画の有無に関係なく解けること。
 *
 * ウラン廃棄物・プルトニウム廃棄物はレシピでは作れず、原子力発電所を回したときの副産物
 * としてしか出ない。副産物を出す発電機 × 燃料は LP に常に入り（需要駆動）、副産物が
 * 消費される量までだけ稼働する（src/solver/model.ts の `byproduct:` 行）。
 * その発電量は発電計画が有効なら目標・自給の制約に数え（2段階解法）、無効なら報告だけする。
 *
 * 画面（サマリーの注記）は jsdom が要るので tests/generator-byproduct-ui.test.tsx に分けている。
 */
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { getDictionary, preloadLocale } from '../src/i18n/index.ts'
import { SUPPORTED_LOCALES } from '../src/i18n/types.ts'
import { deriveBuildList } from '../src/plan/build-list.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { decodePlan, parsePlanSnapshot } from '../src/plan/serialize.ts'
import { SHEET_NAMES, planWorkbookBuffer } from '../src/export/excel.ts'
import { recipes } from '../src/data/index.ts'
import {
  POWER_TARGET_ROW,
  buildProductionModel,
  byproductBoundRow,
  generatorVarKey,
  planExtraction,
  solveProduction,
} from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

const NUCLEAR = 'Build_GeneratorNuclear_C'
const COAL = 'Build_GeneratorCoal_C'
const URANIUM_ROD = 'Desc_NuclearFuelRod_C'
const PLUTONIUM_ROD = 'Desc_PlutoniumFuelRod_C'
const URANIUM_WASTE = 'Desc_NuclearWaste_C'
const PLUTONIUM_WASTE = 'Desc_PlutoniumWaste_C'
const PELLET = 'Desc_PlutoniumPellet_C'
const FICSONIUM_ROD = 'Desc_FicsoniumFuelRod_C'

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

const rateOf = (entries: readonly { item: string; ratePerMin: number }[], item: string): number =>
  entries.find((e) => e.item === item)?.ratePerMin ?? 0

const balanceOf = (solution: Solution, item: string) =>
  solution.itemBalance.find((b) => b.item === item)

const generatorSteps = (solution: Solution) =>
  solution.steps.filter((s) => (s.powerProductionMW ?? 0) > 0)

const PELLET_10: SolveInput = { targets: [{ item: PELLET, ratePerMin: 10 }] }

// ---------------------------------------------------------------------------
// LP モデル
// ---------------------------------------------------------------------------

describe('LP モデル（需要駆動の発電機）', () => {
  it('副産物を出す発電機 × 燃料だけが、発電計画なしでも需要駆動の変数として載る', () => {
    const model = buildProductionModel(PELLET_10)
    expect(model.powerPlan.active).toBe(false)
    const keys = model.generatorVariants.map((v) => v.key).sort()
    expect(keys).toEqual(
      [generatorVarKey(NUCLEAR, URANIUM_ROD), generatorVarKey(NUCLEAR, PLUTONIUM_ROD)].sort(),
    )
    expect(model.generatorVariants.every((v) => v.demandDriven)).toBe(true)
    // 電力の制約行は無い（発電量は報告だけ）
    expect(model.lp.constraints.some((c) => c.key === POWER_TARGET_ROW)).toBe(false)
  })

  it('副産物ごとに「需要駆動の産出 - レシピの消費 <= 目標」の行を張る', () => {
    const model = buildProductionModel(PELLET_10)
    const row = model.lp.constraints.find((c) => c.key === byproductBoundRow(URANIUM_WASTE))!
    expect(row.upper).toBe(0)
    expect(row.lower).toBeUndefined()
    expect(row.coefficients.get(generatorVarKey(NUCLEAR, URANIUM_ROD))).toBeCloseTo(10, 9)
    // 廃棄物を消費するレシピ（非核分裂性ウラン / プルトニウム・ペレット）は負の係数
    expect(row.coefficients.get('x:Recipe_NonFissileUranium_C')).toBeLessThan(0)
    expect(row.coefficients.get('x:Recipe_Plutonium_C')).toBeLessThan(0)
    // 廃棄物そのものを目標にすると右辺が目標レートになる
    const direct = buildProductionModel({ targets: [{ item: URANIUM_WASTE, ratePerMin: 10 }] })
    expect(
      direct.lp.constraints.find((c) => c.key === byproductBoundRow(URANIUM_WASTE))!.upper,
    ).toBe(10)
  })

  it('発電計画で許可した組み合わせは制限なしの1本にまとまり、二重には作らない', () => {
    const model = buildProductionModel({
      ...PELLET_10,
      power: { generators: [NUCLEAR], fuels: { [NUCLEAR]: [URANIUM_ROD] }, targetMW: 2500 },
    })
    const uranium = model.generatorVariants.filter(
      (v) => v.key === generatorVarKey(NUCLEAR, URANIUM_ROD),
    )
    expect(uranium).toHaveLength(1)
    expect(uranium[0].demandDriven).toBe(false)
    const plutonium = model.generatorVariants.find(
      (v) => v.key === generatorVarKey(NUCLEAR, PLUTONIUM_ROD),
    )!
    expect(plutonium.demandDriven).toBe(true)
    // 許可した側の廃棄物には上限行を張らない（発電所がたまたま廃棄物を出すのは許容する）
    expect(model.lp.constraints.some((c) => c.key === byproductBoundRow(URANIUM_WASTE))).toBe(false)
    expect(model.lp.constraints.some((c) => c.key === byproductBoundRow(PLUTONIUM_WASTE))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 発電計画なし
// ---------------------------------------------------------------------------

describe('発電計画なしで廃棄物を材料にする', () => {
  it('プルトニウム・ペレット 10/min → 原子力発電所（ウラン燃料棒）が廃棄物の需要ぶんだけ回る', async () => {
    const solution = await solveOk(PELLET_10)
    expect(solution.targets[0].producedPerMin).toBeCloseTo(10, 6)

    const nuclear = generatorSteps(solution)
    expect(nuclear).toHaveLength(1)
    expect(nuclear[0].buildingId).toBe(NUCLEAR)
    expect(nuclear[0].fuelItem).toBe(URANIUM_ROD)
    expect(rateOf(nuclear[0].inputs, URANIUM_ROD)).toBeCloseTo(nuclear[0].machineCount * 0.2, 6)
    expect(rateOf(nuclear[0].outputs, URANIUM_WASTE)).toBeCloseTo(nuclear[0].machineCount * 10, 6)

    // 廃棄物は作った分だけ消費される（余らない）
    const waste = balanceOf(solution, URANIUM_WASTE)!
    expect(waste.producedPerMin).toBeGreaterThan(0)
    expect(waste.producedPerMin).toBeCloseTo(waste.consumedPerMin, 6)
    expect(rateOf(solution.byproducts, URANIUM_WASTE)).toBe(0)
    // プルトニウム燃料棒を燃やす理由は無いので回らない
    expect(solution.steps.some((s) => s.fuelItem === PLUTONIUM_ROD)).toBe(false)

    // 発電量は報告する（制約はしない）
    const power = solution.powerGeneration!
    expect(power.targetMW).toBe(0)
    expect(power.coverFactoryPower).toBe(false)
    expect(power.totalMW).toBeCloseTo(nuclear[0].machineCount * 2500, 6)
    expect(power.totalMW).toBeGreaterThan(0)
    expect(power.netMW).toBeCloseTo(power.totalMW - solution.totalPowerMW, 6)
    expect(power.fuelUsage.map((f) => f.item)).toEqual([URANIUM_ROD])
    expect(power.totalGeneratorCount).toBe(nuclear[0].builtCount)
  })

  it('FICSONIUM燃料棒 1/min → ウラン・プルトニウム両方の廃棄物チェーンが立つ', async () => {
    const solution = await solveOk({ targets: [{ item: FICSONIUM_ROD, ratePerMin: 1 }] })
    expect(solution.targets[0].producedPerMin).toBeCloseTo(1, 6)
    const fuels = generatorSteps(solution)
      .map((s) => s.fuelItem)
      .sort()
    expect(fuels).toEqual([URANIUM_ROD, PLUTONIUM_ROD].sort())
    const recipeIds = new Set(solution.steps.map((s) => s.recipeId))
    for (const id of [
      'Recipe_Plutonium_C',
      'Recipe_PlutoniumFuelRod_C',
      'Recipe_Ficsonium_C',
      'Recipe_FicsoniumFuelRod_C',
    ]) {
      expect(recipeIds.has(id), id).toBe(true)
    }
    for (const waste of [URANIUM_WASTE, PLUTONIUM_WASTE]) {
      expect(rateOf(solution.byproducts, waste), waste).toBe(0)
      expect(balanceOf(solution, waste)!.producedPerMin, waste).toBeGreaterThan(0)
    }
    expect(solution.powerGeneration!.totalMW).toBeGreaterThan(0)
  })

  it('廃棄物そのものを目標にすると、その量だけ発電機が回る', async () => {
    const solution = await solveOk({ targets: [{ item: URANIUM_WASTE, ratePerMin: 10 }] })
    expect(solution.targets[0].producedPerMin).toBeCloseTo(10, 6)
    const nuclear = generatorSteps(solution)
    expect(nuclear).toHaveLength(1)
    expect(nuclear[0].machineCount).toBeCloseTo(1, 6)
  })

  it('廃棄物を使わない計画では発電機が1台も回らず、結果は従来どおり', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    expect(generatorSteps(solution)).toEqual([])
    expect(solution.powerGeneration).toBeUndefined()
    expect(rateOf(solution.rawResources, 'Desc_OreIron_C')).toBeCloseTo(90, 6)
    expect(solution.totalBuildingCount).toBe(6)
  })

  it('発電機とは無関係に作れないアイテムは、従来どおり「レシピ不足」', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: [],
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.map((reason) => reason.kind)).toEqual(['unproducibleItem'])
  })

  it('原料上限を 0 にして作れなくしたケースも「レシピ不足」のまま', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
      resourceLimits: { Desc_OreIron_C: 0 },
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.map((reason) => reason.kind)).toEqual(['unproducibleItem'])
  })

  it('産出最大化でも廃棄物チェーンを最大化できる', async () => {
    const solution = await solveOk({
      targets: [],
      maximize: PELLET,
      resourceLimits: { Desc_OreUranium_C: 100, Desc_SAM_C: 0 },
    })
    expect(solution.maximizedOutput!.ratePerMin).toBeGreaterThan(0)
    expect(rateOf(solution.byproducts, URANIUM_WASTE)).toBe(0)
    expect(generatorSteps(solution).length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 発電計画あり
// ---------------------------------------------------------------------------

describe('発電計画ありで廃棄物を材料にする', () => {
  it('石炭だけ許可 + ペレット目標 + 10000MW → 原子力は需要ぶんだけ、石炭はその発電量ぶん減る', async () => {
    const withoutPower = await solveOk(PELLET_10)
    const nuclearNeed = generatorSteps(withoutPower)[0].machineCount

    const solution = await solveOk({
      ...PELLET_10,
      power: { generators: [COAL], targetMW: 10000 },
    })
    const nuclear = generatorSteps(solution).find((s) => s.buildingId === NUCLEAR)!
    const coal = generatorSteps(solution).find((s) => s.buildingId === COAL)!
    // 原子力は発電計画なしのときと同じ台数（廃棄物の需要で決まる。発電のために増えない）
    expect(nuclear.machineCount).toBeCloseTo(nuclearNeed, 6)
    expect(rateOf(solution.byproducts, URANIUM_WASTE)).toBe(0)
    // 石炭発電機 = (目標 - 原子力の発電量) / 75MW
    const nuclearMW = nuclear.machineCount * 2500
    expect(nuclear.powerProductionMW).toBeCloseTo(nuclearMW, 6)
    expect(coal.machineCount).toBeCloseTo((10000 - nuclearMW) / 75, 6)
    expect(coal.machineCount).toBeCloseTo(10000 / 75 - nuclearNeed * (2500 / 75), 6)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(10000, 6)
    expect(solution.powerGeneration!.targetMW).toBe(10000)
  })

  it('石炭だけ許可で廃棄物の需要が無ければ、原子力を発電に流用しない（300MW → 石炭発電機4台）', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [COAL], targetMW: 300 } })
    expect(generatorSteps(solution).map((s) => s.buildingId)).toEqual([COAL])
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(4)
    expect(rateOf(solution.rawResources, 'Desc_Coal_C')).toBeCloseTo(60, 6)
    expect(solution.objectiveValue).toBeCloseTo(130.63854187234045, 6)
  })

  it('石炭だけ許可 + ペレット目標 + 自給 → 原子力の発電量で自給できるので石炭発電機は建たない', async () => {
    const solution = await solveOk({
      ...PELLET_10,
      power: { generators: [COAL], coverFactoryPower: true },
    })
    expect(generatorSteps(solution).map((s) => s.buildingId)).toEqual([NUCLEAR])
    expect(solution.powerGeneration!.netMW).toBeGreaterThanOrEqual(-1e-6)
  })

  it('原子力を許可した純粋な発電目標（2500MW）は変更前と同じ解（回帰ピン）', async () => {
    const solution = await solveOk({ targets: [], power: { generators: [NUCLEAR], targetMW: 2500 } })
    // 変更前の main で実行した値
    expect(solution.objectiveValue).toBeCloseTo(737.8938329215093, 6)
    expect(solution.totalMachineCount).toBeCloseTo(7.689537037036965, 6)
    expect(solution.totalBuildingCount).toBe(36)
    expect(solution.totalPowerMW).toBeCloseTo(319.39981481481334, 6)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(2500, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(2)
    expect(rateOf(solution.powerGeneration!.fuelUsage, URANIUM_ROD)).toBeCloseTo(0.13333333333333292, 6)
    expect(rateOf(solution.powerGeneration!.fuelUsage, PLUTONIUM_ROD)).toBeCloseTo(0.033333333333333215, 6)
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBeCloseTo(251.666667, 5)
    expect(rateOf(solution.rawResources, 'Desc_OreCopper_C')).toBeCloseTo(111.922222, 5)
    expect(solution.steps.find((s) => s.fuelItem === URANIUM_ROD)!.machineCount).toBeCloseTo(
      0.666667,
      5,
    )
    expect(solution.steps.find((s) => s.fuelItem === PLUTONIUM_ROD)!.machineCount).toBeCloseTo(
      0.333333,
      5,
    )
  })

  it('原子力の全燃料を許可した 5000MW も変更前と同じ解（回帰ピン）', async () => {
    const solution = await solveOk({
      targets: [],
      power: {
        generators: [NUCLEAR],
        fuels: { [NUCLEAR]: [FICSONIUM_ROD, PLUTONIUM_ROD, URANIUM_ROD] },
        targetMW: 5000,
      },
    })
    expect(solution.objectiveValue).toBeCloseTo(1475.7876658430187, 6)
    expect(solution.totalMachineCount).toBeCloseTo(15.37907407407393, 6)
    expect(solution.totalBuildingCount).toBe(40)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(5000, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// サンプルテンプレート（変更前の main の値をピン）
// ---------------------------------------------------------------------------

describe('原子力のサンプルテンプレート', () => {
  async function solveSample(id: string): Promise<Solution> {
    const sample = SAMPLE_PLANS.find((s) => s.id === id)!
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(parsed.error)
    const { input } = parsed
    const fuels = Object.fromEntries(
      Object.entries(input.enabledFuels).map(([generator, selected]) => [
        generator,
        Object.keys(selected),
      ]),
    )
    return solveOk({
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
    })
  }

  it('nuclear-reprocessing の主要な数値が変わらない', async () => {
    const solution = await solveSample('nuclear-reprocessing')
    expect(solution.objectiveValue).toBeCloseTo(1892.0669041622289, 5)
    expect(solution.totalMachineCount).toBeCloseTo(19.405157407407337, 6)
    expect(solution.totalBuildingCount).toBe(67)
    expect(solution.totalPowerMW).toBeCloseTo(833.5291296296256, 6)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(5000, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(3)
    expect(rateOf(solution.powerGeneration!.fuelUsage, URANIUM_ROD)).toBeCloseTo(0.2666666666666647, 6)
    expect(rateOf(solution.powerGeneration!.fuelUsage, PLUTONIUM_ROD)).toBeCloseTo(0.06666666666666618, 6)
    expect(rateOf(solution.rawResources, 'Desc_Water_C')).toBeCloseTo(511.126667, 5)
    expect(solution.steps).toHaveLength(62)
  })

  it('nuclear-simplified の主要な数値が変わらない', async () => {
    const solution = await solveSample('nuclear-simplified')
    expect(solution.objectiveValue).toBeCloseTo(987.8421219996228, 5)
    expect(solution.totalMachineCount).toBeCloseTo(7.133333333333334, 6)
    expect(solution.totalBuildingCount).toBe(16)
    expect(solution.totalPowerMW).toBeCloseTo(88.6733333333333, 6)
    expect(solution.powerGeneration!.totalMW).toBeCloseTo(2500, 6)
    expect(solution.powerGeneration!.totalGeneratorCount).toBe(1)
    expect(rateOf(solution.rawResources, 'Desc_OreUranium_C')).toBeCloseTo(12.5, 6)
    expect(solution.steps).toHaveLength(16)
  })
})

// ---------------------------------------------------------------------------
// 表示・書き出し
// ---------------------------------------------------------------------------

describe('発電計画なしの需要駆動の発電機の表示', () => {
  it('建設リストに発電セクションが出て、原子力発電所が並ぶ', async () => {
    const solution = await solveOk(PELLET_10)
    const list = deriveBuildList(solution, planExtraction(solution))
    const power = list.sections.find((s) => s.id === 'power')!
    expect(power).toBeDefined()
    expect(power.items).toHaveLength(1)
    expect(power.items[0].buildingId).toBe(NUCLEAR)
    expect(power.items[0].fuelItem).toBe(URANIUM_ROD)
    expect(power.items[0].powerProductionMW).toBeGreaterThan(0)
    expect(power.items[0].builtCount).toBe(generatorSteps(solution)[0].builtCount)
  })

  it('Excel に発電機の行と発電サマリーが入る', async () => {
    const solution = await solveOk(PELLET_10)
    const buffer = await planWorkbookBuffer({
      solution,
      extraction: planExtraction(solution),
      planName: 'プルトニウム・ペレット',
      generatedAt: new Date(2026, 8, 20, 12, 0),
    })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const buildings = workbook.getWorksheet(SHEET_NAMES.buildings)!
    const header = buildings.getRow(1)
    let typeCol = 0
    let generationCol = 0
    for (let col = 1; col <= header.cellCount; col += 1) {
      const value = header.getCell(col).value
      if (value === '機械種別') typeCol = col
      if (value === '発電量(MW)') generationCol = col
    }
    expect(typeCol).toBeGreaterThan(0)
    expect(generationCol).toBeGreaterThan(0)
    let generatorRow: ExcelJS.Row | undefined
    for (let r = 2; r <= buildings.rowCount; r += 1) {
      if (buildings.getRow(r).getCell(typeCol).value === '原子力発電所') {
        generatorRow = buildings.getRow(r)
        break
      }
    }
    expect(generatorRow).toBeDefined()
    expect(generatorRow!.getCell(generationCol).value).toBeCloseTo(
      solution.powerGeneration!.totalMW,
      6,
    )

    const summary = workbook.getWorksheet(SHEET_NAMES.summary)!
    const labels = new Map<string, ExcelJS.CellValue>()
    for (let r = 1; r <= summary.rowCount; r += 1) {
      const key = summary.getRow(r).getCell(1).value
      if (typeof key === 'string') labels.set(key, summary.getRow(r).getCell(2).value)
    }
    expect(labels.get('総発電量 (MW)')).toBeCloseTo(solution.powerGeneration!.totalMW, 6)
    expect(labels.get('目標発電量 (MW)')).toBe(0)
  })

  it.each(SUPPORTED_LOCALES)('%s: 廃止した実行不能理由の辞書項目が残っていない', async (locale) => {
    await preloadLocale(locale)
    const dictionary = getDictionary(locale) as unknown as {
      infeasible: { reason: object; reasonMessage: object; advice: object }
      summary: { powerGenerationDemandDriven: string }
    }
    // 実行不能の理由は InfeasibleReason.kind の4種だけ（発電機の副産物を理由にする項目は無い）
    for (const section of [
      dictionary.infeasible.reason,
      dictionary.infeasible.reasonMessage,
      dictionary.infeasible.advice,
    ]) {
      expect(Object.keys(section).sort()).toEqual(
        ['unproducibleItem', 'resourceLimit', 'unbounded', 'solverError'].sort(),
      )
    }
    expect(dictionary.summary.powerGenerationDemandDriven.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 保存形式・共有URL
// ---------------------------------------------------------------------------

describe('保存形式は変わらない', () => {
  it('変更前に作った共有URLのプランが同じ入力に復元される', () => {
    // 変更前のコードで encodePlan した「プルトニウム・ペレット 10/min（発電計画なし）」
    const encoded =
      'N4IgbiBcBsA0IBsrAL7wPZRAJwKYGd0BXbAYwJHgFssAhIgSwQBMB9AWQYDtdt2BrAMysAwpRAAjOoxaj0XMLgCe6bLVwIALgOijxAB2lM2ABQb6N3XOwDSAJj3wuWQOsMga4ZAEwyBphkBlDIAOGcU0oAG1gkAARAlJWEwQiTXkGIioTDQRcTUcARgAGAF08+ABDELyUIA'
    const parsed = decodePlan(encoded)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.warnings).toEqual([])
    expect(parsed.input.targets).toEqual([{ item: PELLET, ratePerMin: 10 }])
    expect(parsed.input.enabledGenerators).toEqual({})
    expect(parsed.input.powerTargetMW).toBe(0)
    expect(parsed.input.coverFactoryPower).toBe(false)
    expect(parsed.input.planName).toBe('プルトニウム')
  })
})
