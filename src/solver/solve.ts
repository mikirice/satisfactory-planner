/**
 * LP を解いて Solution（仕様書ドラフト-v0 §4.4）に組み立てる本体。
 */
import { buildingsById, itemsById, ratePerMin, recipesById } from '../data/index.ts'
import { CLOCK_MAX, SOMERSLOOP_FULL_OUTPUT_MULTIPLIER } from '../data/constants.ts'
import type { ItemAmount, Recipe } from '../data/types.ts'
import type { LpBackend, LpResult } from './lp.ts'
import { glpkBackend } from './glpk-backend.ts'
import type { GeneratorVariant, ProductionModel, SupplySource } from './model.ts'
import {
  DEFAULT_TOLERANCE,
  buildProductionModel,
  defaultEnabledRecipeIds,
  maximizeVarKey,
  overflowVarKey,
  recipeVarKey,
  somersloopPowerFactor,
  somersloopVarKey,
  variablePowerRange,
} from './model.ts'
import { clockedPowerMW, powerShardsForClock } from './overclock.ts'
import type {
  ExternalInputUsage,
  InfeasibleReason,
  InfeasibleResult,
  ItemBalance,
  ItemRate,
  PowerGenerationSummary,
  RawResourceUsage,
  Solution,
  SolutionStep,
  SolveInput,
  SolveResult,
  TargetResult,
} from './types.ts'

export type SolveOptions = {
  /** 差し替え可能な LP バックエンド。既定は glpk.js(GLPK 5.0 / WASM) */
  backend?: LpBackend
}

const jaName = (itemId: string): string => itemsById.get(itemId)?.name.ja ?? itemId
const round = (n: number): number => Math.round(n * 1000) / 1000

/**
 * 目標産出から生産チェーンを求める。
 * 解けなければ status: 'infeasible' と原因ヒントを返す（例外は投げない。
 * ただし存在しない ID を渡した等の入力エラーは例外）。
 *
 * `input.maximize` があるときは2フェーズで解く:
 *   1. そのアイテムの産出を最大化して最大レート y* を求める（他の目標は制約のまま）
 *   2. y* を目標レートに足した通常の最小化モデルを解き、構成を決める
 * こうすると「最大産出の中で最も資源効率のよい構成」が選ばれ、
 * 結果の組み立て（Solution）も既存の経路をそのまま使える。
 */
export async function solveProduction(
  input: SolveInput,
  options: SolveOptions = {},
): Promise<SolveResult> {
  const backend = options.backend ?? glpkBackend
  const tolerance = input.tolerance ?? DEFAULT_TOLERANCE
  if (input.maximize === undefined) return solveCost(input, backend, tolerance)
  return solveMaximize(input, input.maximize, backend, tolerance)
}

/** レート指定の目標だけを満たす通常の解（従来の経路）。 */
async function solveCost(
  input: SolveInput,
  backend: LpBackend,
  tolerance: number,
): Promise<SolveResult> {
  const model = buildProductionModel(input)
  const maxClock = resolveMaxClock(input.maxClock)

  const totalTarget = [...model.targets.values()].reduce((sum, v) => sum + v, 0)
  // 目標アイテムが無くても「発電だけ」の計画は成り立つ（目標電力300MW → 石炭発電機4台 など）
  if (totalTarget <= 0 && !model.powerPlan.active) return emptySolution(input)

  // 先に「そもそも作れないアイテム」を弾く。LP を回すより原因が明確に出せる。
  const unreachable = findUnreachableTargets(input, model.supplies, model.generatorVariants)
  if (unreachable.length > 0) return infeasible(unreachable)
  const fuelless = findUnusableGenerators(input, model)
  if (fuelless.length > 0) return infeasible(fuelless)

  const result = await backend.solve(model.lp)

  switch (result.status) {
    case 'optimal': {
      const solution = buildSolution(model, result, tolerance, maxClock)
      // 定式化から漏れたアイテムがあった場合の保険（本来ここには落ちない）
      const short = solution.targets.filter(
        (t) =>
          t.producedPerMin <
          t.requestedPerMin - Math.max(tolerance, Math.abs(t.requestedPerMin) * 1e-9),
      )
      if (short.length === 0) return solution
      return infeasible(
        short.map((t) => ({
          kind: 'unproducibleItem' as const,
          item: t.item,
          message:
            `${jaName(t.item)} を目標の ${round(t.requestedPerMin)} /min まで生産できません` +
            `（最大 ${round(t.producedPerMin)} /min）`,
        })),
      )
    }
    case 'unbounded':
      return infeasible([
        {
          kind: 'unbounded',
          message: '目的関数が下に有界ではありません。重みの設定を見直してください。',
        },
      ])
    case 'error':
      return infeasible([
        { kind: 'solverError', message: `ソルバーが解を返しませんでした (${result.rawStatus})` },
      ])
    case 'infeasible':
      return infeasible(await diagnose(input, backend, tolerance))
  }
}

/**
 * 産出最大化モード。
 *
 * フェーズ1で「取り出し量 y の最大化」だけを解いて上限 y* を求め、
 * フェーズ2で y* を目標レートに加えた通常のモデルを解く。
 * 原料上限が実質の制約になるので、上限のない資源だけで作れるアイテムは
 * フェーズ1が unbounded になる（＝最大化できない）。
 */
async function solveMaximize(
  input: SolveInput,
  item: string,
  backend: LpBackend,
  tolerance: number,
): Promise<SolveResult> {
  if (!itemsById.has(item)) throw new Error(`unknown item id in maximize: ${item}`)
  // 同じアイテムのレート指定は最大化に吸収させる（二重に数えない）
  const rateTargets = input.targets.filter((t) => t.item !== item)
  const base: SolveInput = { ...input, targets: rateTargets, maximize: undefined }

  const model = buildProductionModel(base, { maximize: item })

  // 「そもそも作れない」は最大化対象も含めて先に弾く（LP は 0 を返すだけなので）
  const unreachable = findUnreachableTargets(
    { ...base, targets: [{ item, ratePerMin: 1 }, ...rateTargets] },
    model.supplies,
    model.generatorVariants,
  )
  if (unreachable.length > 0) return infeasible(unreachable)
  const fuelless = findUnusableGenerators(base, model)
  if (fuelless.length > 0) return infeasible(fuelless)

  const result = await backend.solve(model.lp)
  switch (result.status) {
    case 'unbounded':
      return infeasible([
        {
          kind: 'unbounded',
          item,
          message:
            `${jaName(item)} は原料上限が効いていないため最大化できません` +
            '（上限のない資源だけでいくらでも作れる構成です）',
          advice:
            'サイドバーの「原料上限」で上限のない原料（水など）に上限を入れるか、レート指定に切り替えてください。',
        },
      ])
    case 'error':
      return infeasible([
        { kind: 'solverError', message: `ソルバーが解を返しませんでした (${result.rawStatus})` },
      ])
    case 'infeasible':
      // 最大化対象ではなく、他のレート指定の目標が満たせないケース
      return infeasible(await diagnose(base, backend, tolerance))
    case 'optimal':
      break
  }

  const best = result.values.get(maximizeVarKey(item)) ?? 0
  if (!(best > tolerance)) {
    return infeasible([
      {
        kind: 'unproducibleItem',
        item,
        message: `${jaName(item)} はこの条件では生産できません（最大 0 /min）`,
      },
    ])
  }

  // フェーズ2。丸め誤差で実行不能にならないよう、ごくわずかに緩めた値を目標にする
  const solved = await solveCost(
    { ...base, targets: [...rateTargets, { item, ratePerMin: best * (1 - 1e-9) }] },
    backend,
    tolerance,
  )
  if (solved.status !== 'optimal') return solved

  const produced = solved.targets.find((t) => t.item === item)?.producedPerMin ?? best
  return {
    ...solved,
    // 要求レートは「最大化した結果の達成レート」に揃える（緩めた値を見せない）
    targets: solved.targets.map((t) =>
      t.item === item ? { ...t, requestedPerMin: t.producedPerMin, maximized: true } : t,
    ),
    maximizedOutput: { item, ratePerMin: produced },
  }
}

// ---------------------------------------------------------------------------
// 解の組み立て
// ---------------------------------------------------------------------------

function emptySolution(input?: SolveInput): Solution {
  return {
    status: 'optimal',
    steps: [],
    rawResources: [],
    externalInputs: [],
    byproducts: [],
    targets: [],
    itemBalance: [],
    totalPowerMW: 0,
    totalPowerRangeMW: { minMW: 0, maxMW: 0 },
    totalClockedPowerMW: 0,
    totalClockedPowerRangeMW: { minMW: 0, maxMW: 0 },
    totalMachineCount: 0,
    totalBuildingCount: 0,
    totalBuildCost: [],
    maxClock: resolveMaxClock(input?.maxClock),
    totalPowerShards: 0,
    totalSomersloops: 0,
    somersloopLimit: input?.somersloops ?? 0,
    totalFootprintAreaM2: 0,
    sinkPointsPerMin: 0,
    objectiveValue: 0,
  }
}

/** 製造クロック上限を有効範囲（1〜250%）に丸める。未指定は 1（100%）。 */
export function resolveMaxClock(maxClock: number | undefined): number {
  if (maxClock === undefined || !Number.isFinite(maxClock)) return 1
  return Math.min(CLOCK_MAX, Math.max(0.01, maxClock))
}

function buildSolution(
  model: ProductionModel,
  result: LpResult,
  tolerance: number,
  maxClock: number,
): Solution {
  const clean = (v: number): number => (Math.abs(v) < tolerance ? 0 : v)
  const produced = new Map<string, number>()
  const consumed = new Map<string, number>()
  const accumulate = (map: Map<string, number>, item: string, value: number): void => {
    map.set(item, (map.get(item) ?? 0) + value)
  }

  const steps: SolutionStep[] = []
  const buildCost = new Map<string, number>()
  let totalPowerMW = 0
  let minPowerMW = 0
  let maxPowerMW = 0
  let totalClockedPowerMW = 0
  let minClockedPowerMW = 0
  let maxClockedPowerMW = 0
  let totalMachineCount = 0
  let totalBuildingCount = 0
  let totalPowerShards = 0
  let totalSomersloops = 0
  let totalFootprintAreaM2 = 0

  /**
   * 1レシピ1バリアントぶんのステップを作る。
   * `somersloop` が true のとき産出だけ2倍、消費はそのまま、電力は倍率^指数ぶん増える。
   */
  const addStep = (recipe: Recipe, machineCount: number, somersloop: boolean): void => {
    const building = buildingsById.get(recipe.producedIn)!
    const outputMultiplier = somersloop ? SOMERSLOOP_FULL_OUTPUT_MULTIPLIER : 1
    const powerFactor = somersloop ? somersloopPowerFactor(building) : 1

    const inputs: ItemRate[] = recipe.ingredients.map((i) => {
      const rate = ratePerMin(i.amount, recipe.durationSec) * machineCount
      accumulate(consumed, i.item, rate)
      return { item: i.item, ratePerMin: rate }
    })
    const outputs: ItemRate[] = recipe.products.map((p) => {
      const rate = ratePerMin(p.amount, recipe.durationSec) * machineCount * outputMultiplier
      accumulate(produced, p.item, rate)
      return { item: p.item, ratePerMin: rate }
    })

    // 建てる台数はクロック上限で決まる（上限が高いほど少ない台数で足りる）
    const builtCount = Math.max(1, Math.ceil(machineCount / maxClock - tolerance))
    const clockSpeed = Math.min(maxClock, machineCount / builtCount)
    const powerShards = builtCount * powerShardsForClock(clockSpeed)
    const somersloops = somersloop ? builtCount * building.maxSomersloops : 0

    // 100%換算（LP の目的関数と同じ基準）
    const range = variablePowerRange(recipe, building)
    const powerRangeMW = range
      ? {
          minMW: range.minMW * powerFactor * machineCount,
          maxMW: range.maxMW * powerFactor * machineCount,
        }
      : undefined
    const powerMW = powerRangeMW
      ? (powerRangeMW.minMW + powerRangeMW.maxMW) / 2
      : building.powerConsumptionMW * powerFactor * machineCount

    // クロック適用後（画面と Excel の主表示）。クロックに対して超線形（c^powerExponent）
    const clockedFactor = clockedPowerMW(builtCount, clockSpeed, building.powerExponent)
    const clockedPowerRangeMW = range
      ? {
          minMW: range.minMW * powerFactor * clockedFactor,
          maxMW: range.maxMW * powerFactor * clockedFactor,
        }
      : undefined
    const stepClockedPowerMW = clockedPowerRangeMW
      ? (clockedPowerRangeMW.minMW + clockedPowerRangeMW.maxMW) / 2
      : building.powerConsumptionMW * powerFactor * clockedFactor

    totalPowerMW += powerMW
    minPowerMW += powerRangeMW ? powerRangeMW.minMW : powerMW
    maxPowerMW += powerRangeMW ? powerRangeMW.maxMW : powerMW
    totalClockedPowerMW += stepClockedPowerMW
    minClockedPowerMW += clockedPowerRangeMW ? clockedPowerRangeMW.minMW : stepClockedPowerMW
    maxClockedPowerMW += clockedPowerRangeMW ? clockedPowerRangeMW.maxMW : stepClockedPowerMW
    totalMachineCount += machineCount
    totalBuildingCount += builtCount
    totalPowerShards += powerShards
    totalSomersloops += somersloops
    const footprintAreaM2 = builtCount * building.footprint.areaM2
    totalFootprintAreaM2 += footprintAreaM2

    for (const cost of building.buildCost) {
      buildCost.set(cost.item, (buildCost.get(cost.item) ?? 0) + cost.amount * builtCount)
    }

    steps.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      buildingId: building.id,
      buildingName: building.name,
      machineCount,
      builtCount,
      clockSpeed,
      powerShards,
      somersloops,
      powerMW,
      ...(powerRangeMW ? { powerRangeMW } : {}),
      clockedPowerMW: stepClockedPowerMW,
      ...(clockedPowerRangeMW ? { clockedPowerRangeMW } : {}),
      footprintAreaM2,
      inputs,
      outputs,
    })
  }

  /**
   * 発電機1台種ぶんのステップ。**クロックは100%固定**（発電側のオーバークロックは
   * 初期スコープ外）なので、端数の台数はそのまま部分負荷（clockSpeed < 1）になる。
   * 消費電力は 0、代わりに powerProductionMW に発電量を入れる。
   */
  let totalPowerProductionMW = 0
  let generatorMachineCount = 0
  let generatorBuildingCount = 0
  const fuelUsed = new Map<string, number>()
  const addGeneratorStep = (variant: GeneratorVariant, machineCount: number): void => {
    const { generator, fuel } = variant
    const building = buildingsById.get(generator.id)
    const fuelName = itemsById.get(fuel.item)?.name ?? { ja: fuel.item, en: fuel.item }

    const inputs: ItemRate[] = [{ item: fuel.item, ratePerMin: fuel.ratePerMin * machineCount }]
    if (fuel.supplementalItem && fuel.supplementalRatePerMin > 0) {
      inputs.push({
        item: fuel.supplementalItem,
        ratePerMin: fuel.supplementalRatePerMin * machineCount,
      })
    }
    for (const flow of inputs) accumulate(consumed, flow.item, flow.ratePerMin)
    accumulate(fuelUsed, fuel.item, fuel.ratePerMin * machineCount)

    const outputs: ItemRate[] = []
    if (fuel.byproduct && fuel.byproduct.ratePerMin > 0) {
      outputs.push({
        item: fuel.byproduct.item,
        ratePerMin: fuel.byproduct.ratePerMin * machineCount,
      })
    }
    for (const flow of outputs) accumulate(produced, flow.item, flow.ratePerMin)

    const builtCount = Math.max(1, Math.ceil(machineCount - tolerance))
    const powerProductionMW = generator.powerProductionMW * machineCount
    const footprintAreaM2 = builtCount * (building?.footprint.areaM2 ?? 0)

    totalPowerProductionMW += powerProductionMW
    generatorMachineCount += machineCount
    generatorBuildingCount += builtCount
    totalMachineCount += machineCount
    totalBuildingCount += builtCount
    totalFootprintAreaM2 += footprintAreaM2
    for (const cost of building?.buildCost ?? []) {
      buildCost.set(cost.item, (buildCost.get(cost.item) ?? 0) + cost.amount * builtCount)
    }

    steps.push({
      recipeId: generatorStepId(generator.id, fuel.item),
      recipeName: {
        ja: `${generator.name.ja}（${fuelName.ja}）`,
        en: `${generator.name.en} (${fuelName.en})`,
      },
      buildingId: generator.id,
      buildingName: generator.name,
      machineCount,
      builtCount,
      clockSpeed: machineCount / builtCount,
      powerShards: 0,
      somersloops: 0,
      powerMW: 0,
      clockedPowerMW: 0,
      footprintAreaM2,
      inputs,
      outputs,
      powerProductionMW,
      fuelItem: fuel.item,
    })
  }

  for (const recipe of model.recipes) {
    const machineCount = clean(result.values.get(recipeVarKey(recipe.id)) ?? 0)
    if (machineCount <= 0) continue
    addStep(recipe, machineCount, false)
  }
  // Somersloop バリアントは同じレシピの通常ステップと併存しうる（LP が分けて選ぶ）
  for (const recipe of model.somersloopRecipes) {
    const machineCount = clean(result.values.get(somersloopVarKey(recipe.id)) ?? 0)
    if (machineCount <= 0) continue
    addStep(recipe, machineCount, true)
  }
  for (const variant of model.generatorVariants) {
    const machineCount = clean(result.values.get(variant.key) ?? 0)
    if (machineCount <= 0) continue
    addGeneratorStep(variant, machineCount)
  }

  steps.sort(
    (a, b) =>
      b.machineCount - a.machineCount ||
      a.recipeId.localeCompare(b.recipeId) ||
      a.somersloops - b.somersloops,
  )

  // --- 外部供給（原料・持ち込み） -------------------------------------------
  const supplied = new Map<string, number>()
  const rawResources: RawResourceUsage[] = []
  const externalInputs: ExternalInputUsage[] = []
  for (const supply of model.supplies) {
    const rate = clean(result.values.get(supply.key) ?? 0)
    accumulate(supplied, supply.item, rate)
    if (supply.kind === 'input') {
      // 使われなかった持ち込み（0）も残す。「入れたのに使われていない」を見せるため
      externalInputs.push({
        item: supply.item,
        ratePerMin: rate,
        availablePerMin: supply.limit ?? 0,
      })
      continue
    }
    if (rate <= 0) continue
    rawResources.push({
      item: supply.item,
      ratePerMin: rate,
      limitPerMin: supply.limit,
      usageRatio: supply.limit === null || supply.limit === 0 ? null : rate / supply.limit,
    })
  }
  rawResources.sort((a, b) => b.ratePerMin - a.ratePerMin || a.item.localeCompare(b.item))
  externalInputs.sort((a, b) => b.ratePerMin - a.ratePerMin || a.item.localeCompare(b.item))

  // --- アイテム収支 ---------------------------------------------------------
  const itemIds = new Set<string>([
    ...produced.keys(),
    ...consumed.keys(),
    ...model.targets.keys(),
    ...rawResources.map((r) => r.item),
    ...externalInputs.map((r) => r.item),
  ])
  const itemBalance: ItemBalance[] = [...itemIds].sort().map((item) => {
    const producedPerMin = clean(produced.get(item) ?? 0)
    const consumedPerMin = clean(consumed.get(item) ?? 0)
    const suppliedPerMin = clean(supplied.get(item) ?? 0)
    return {
      item,
      producedPerMin,
      consumedPerMin,
      suppliedPerMin,
      netPerMin: clean(producedPerMin + suppliedPerMin - consumedPerMin),
    }
  })
  const netByItem = new Map(itemBalance.map((b) => [b.item, b.netPerMin]))

  const targets: TargetResult[] = [...model.targets]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([item, requestedPerMin]) => ({
      item,
      requestedPerMin,
      producedPerMin: netByItem.get(item) ?? 0,
    }))

  // 副産物 = 目標でも外部供給でもないのに余っているアイテム
  const byproducts: ItemRate[] = itemBalance
    .filter((b) => !model.targets.has(b.item) && b.suppliedPerMin === 0 && b.netPerMin > 0)
    .map((b) => ({ item: b.item, ratePerMin: b.netPerMin }))
    .sort((a, b) => b.ratePerMin - a.ratePerMin || a.item.localeCompare(b.item))

  const sinkPointsPerMin = byproducts.reduce(
    (sum, b) => sum + b.ratePerMin * (itemsById.get(b.item)?.sinkPoints ?? 0),
    0,
  )

  const totalBuildCost: ItemAmount[] = [...buildCost]
    .map(([item, amount]) => ({ item, amount }))
    .sort((a, b) => b.amount - a.amount || a.item.localeCompare(b.item))

  // 発電計画のサマリー（発電機を LP に入れたときだけ）
  const powerGeneration: PowerGenerationSummary | undefined = model.powerPlan.active
    ? {
        targetMW: model.powerPlan.targetMW,
        coverFactoryPower: model.powerPlan.coverFactoryPower,
        totalMW: totalPowerProductionMW,
        totalGeneratorCount: generatorBuildingCount,
        totalGeneratorMachineCount: generatorMachineCount,
        fuelUsage: [...fuelUsed]
          .map(([item, ratePerMin]) => ({ item, ratePerMin }))
          .sort((a, b) => b.ratePerMin - a.ratePerMin || a.item.localeCompare(b.item)),
        factoryPowerMW: totalPowerMW,
        netMW: totalPowerProductionMW - totalPowerMW,
      }
    : undefined

  return {
    status: 'optimal',
    steps,
    rawResources,
    externalInputs,
    byproducts,
    targets,
    itemBalance,
    totalPowerMW,
    totalPowerRangeMW: { minMW: minPowerMW, maxMW: maxPowerMW },
    totalClockedPowerMW,
    totalClockedPowerRangeMW: { minMW: minClockedPowerMW, maxMW: maxClockedPowerMW },
    totalMachineCount,
    totalBuildingCount,
    totalBuildCost,
    maxClock,
    totalPowerShards,
    totalSomersloops,
    somersloopLimit: model.somersloopLimit,
    totalFootprintAreaM2,
    sinkPointsPerMin,
    objectiveValue: result.objectiveValue,
    ...(powerGeneration ? { powerGeneration } : {}),
  }
}

/**
 * 発電機ステップの疑似レシピID。
 * `Solution.steps` は表・グラフ・Excel が recipeId をキーに扱うので、
 * 実在のレシピIDとぶつからない前置き（`power:`）を付けて一意にする。
 */
export const generatorStepId = (generatorId: string, fuelItem: string): string =>
  `power:${generatorId}:${fuelItem}`

// ---------------------------------------------------------------------------
// 実行不能の原因ヒント
// ---------------------------------------------------------------------------

function infeasible(reasons: InfeasibleReason[]): InfeasibleResult {
  const list: InfeasibleReason[] =
    reasons.length > 0
      ? reasons
      : [{ kind: 'solverError', message: '原因を特定できませんでした' }]
  return {
    status: 'infeasible',
    reasons: list,
    message: `この条件では生産できません。${list.map((r) => r.message).join(' / ')}`,
  }
}

/**
 * 有効レシピと供給可能な原料だけから到達できるアイテム集合を求め、
 * 目標がそこに含まれなければ「作れない」と判定する（前方到達可能性）。
 *
 * `generatorVariants` を渡すと、発電機の副産物（ウラン廃棄物・プルトニウム廃棄物）も
 * 供給源として数える。これらはレシピでは作れず**発電機を回したときだけ出る**ので、
 * 渡さないと再処理チェーン（プルトニウム / FICSONIUM 系）が丸ごと「作れない」と
 * 誤判定される。
 */
export function findUnreachableTargets(
  input: SolveInput,
  supplies: readonly SupplySource[],
  generatorVariants: readonly GeneratorVariant[] = [],
): InfeasibleReason[] {
  const available = reachableItems(input, supplies, generatorVariants)

  const reasons: InfeasibleReason[] = []
  for (const target of input.targets) {
    if (target.ratePerMin <= 0) continue
    if (available.has(target.item)) continue
    reasons.push({
      kind: 'unproducibleItem',
      item: target.item,
      message: `${jaName(target.item)} は有効なレシピと利用できる原料からは生産できません`,
    })
  }
  return reasons
}

/**
 * 有効レシピと供給可能な原料だけから到達できるアイテム集合（前方到達可能性）。
 *
 * レシピに加えて**発電機も「燃料(+水) → 副産物」の生産者として数える**。
 * ウラン廃棄物・プルトニウム廃棄物を作るレシピはゲームに存在せず、燃料棒を燃やした
 * 副産物としてしか得られないため、ここで数えないと再処理チェーンが全滅する。
 */
function reachableItems(
  input: SolveInput,
  supplies: readonly SupplySource[],
  generatorVariants: readonly GeneratorVariant[] = [],
): Set<string> {
  const enabledIds = input.enabledRecipes
    ? [...new Set(input.enabledRecipes)]
    : defaultEnabledRecipeIds()

  const available = new Set<string>()
  for (const supply of supplies) {
    if (supply.limit === null || supply.limit > 0) available.add(supply.item)
  }

  const remaining = new Set(enabledIds)
  const remainingVariants = new Set(
    generatorVariants.filter((v) => v.fuel.byproduct && v.fuel.byproduct.ratePerMin > 0),
  )
  let changed = true
  while (changed) {
    changed = false
    for (const recipeId of [...remaining]) {
      const recipe = recipesById.get(recipeId)
      if (!recipe) throw new Error(`unknown recipe id: ${recipeId}`)
      if (!recipe.ingredients.every((i) => available.has(i.item))) continue
      remaining.delete(recipeId)
      for (const p of recipe.products) {
        if (!available.has(p.item)) {
          available.add(p.item)
          changed = true
        }
      }
    }
    for (const variant of [...remainingVariants]) {
      const { fuel } = variant
      if (!available.has(fuel.item)) continue
      if (fuel.supplementalItem && !available.has(fuel.supplementalItem)) continue
      remainingVariants.delete(variant)
      const byproduct = fuel.byproduct!.item
      if (!available.has(byproduct)) {
        available.add(byproduct)
        changed = true
      }
    }
  }
  return available
}

/**
 * 発電計画を有効にしたのに、許可した発電機の燃料（と水）が1つも作れないケースを弾く。
 * LP に任せると「原料上限を無視しても解が無い」という漠然としたメッセージになるので、
 * どの発電機の何が足りないかを先に出す。
 */
export function findUnusableGenerators(
  input: SolveInput,
  model: ProductionModel,
): InfeasibleReason[] {
  if (!model.powerPlan.active) return []
  // 発電機の副産物も供給源に数える（FICSONIUM燃料棒はプルトニウム廃棄物が要る）
  const available = reachableItems(input, model.supplies, model.generatorVariants)
  const usable = model.generatorVariants.filter(
    (v) =>
      available.has(v.fuel.item) &&
      (!v.fuel.supplementalItem || available.has(v.fuel.supplementalItem)),
  )
  if (usable.length > 0) return []

  // 「同じ発電機の別の燃料を燃やして出る副産物」が足りないだけのケースを見分ける。
  // 例: FICSONIUM燃料棒はプルトニウム廃棄物（＝プルトニウム燃料棒の副産物）が要るので、
  // FICSONIUM燃料棒だけを選ぶと絶対に解けない。外した燃料を名指しして案内する。
  const withAllFuels = reachableItems(
    input,
    model.supplies,
    model.powerPlan.generators.flatMap((generator) =>
      generator.fuels.map((fuel) => ({ generator, fuel, key: `${generator.id}:${fuel.item}` })),
    ),
  )

  return model.powerPlan.generators.map((generator) => {
    // 燃料を絞っている場合は「絞ったせいで解けない」ことが分かるよう、許可した燃料だけを挙げる
    const allowed = model.powerPlan.allowedFuels.get(generator.id) ?? generator.fuels
    const restricted = allowed.length < generator.fuels.length
    const unlocked = allowed.filter((f) => withAllFuels.has(f.item))
    // 外している燃料のうち、副産物（廃棄物）を出すもの＝ふさがっている供給源
    const missing = generator.fuels.filter(
      (f) => f.byproduct !== undefined && !allowed.some((a) => a.item === f.item),
    )
    const hint =
      restricted && unlocked.length > 0 && missing.length > 0
        ? `（${unlocked.map((f) => jaName(f.item)).join(' / ')} の材料には ` +
          `${[...new Set(missing.map((f) => jaName(f.byproduct!.item)))].join(' / ')} が要ります。` +
          `これはレシピでは作れず ${missing.map((f) => jaName(f.item)).join(' / ')} を燃やしたときの` +
          '副産物なので、その燃料も一緒に許可してください）'
        : restricted
          ? '（選択中の燃料だけで判定しています。他の燃料も許可すると解けることがあります）'
          : ''
    return {
      kind: 'unproducibleItem' as const,
      item: allowed[0]?.item ?? generator.id,
      message:
        `${generator.name.ja} の燃料（${allowed
          .map((f) => jaName(f.item))
          .join(' / ')}）を、有効なレシピと利用できる原料からは用意できません` + hint,
    }
  })
}

/**
 * 原料上限を緩めた「弾性モデル」を解き、どの原料がどれだけ足りないかを求める。
 * 上限超過量の合計を最小化するので、報告される不足量は「最低限これだけ要る」量になる。
 */
async function diagnose(
  input: SolveInput,
  backend: LpBackend,
  tolerance: number,
): Promise<InfeasibleReason[]> {
  const elastic = buildProductionModel(input, { elastic: true })
  const result = await backend.solve(elastic.lp)
  if (result.status !== 'optimal') {
    return [
      {
        kind: 'solverError',
        message: '原料上限を無視しても解が見つかりませんでした（有効レシピの構成を確認してください）',
      },
    ]
  }

  const reasons: InfeasibleReason[] = []
  for (const supply of elastic.supplies) {
    const over = result.values.get(overflowVarKey(supply.key)) ?? 0
    if (over <= tolerance) continue
    const limit = supply.limit ?? 0
    const what = supply.kind === 'input' ? '持ち込み量' : '上限'
    reasons.push({
      kind: 'resourceLimit',
      item: supply.item,
      limitPerMin: limit,
      requiredPerMin: limit + over,
      shortfallPerMin: over,
      message:
        `${jaName(supply.item)} が足りません（${what} ${round(limit)} /min に対し ` +
        `${round(limit + over)} /min 必要。不足 ${round(over)} /min）`,
    })
  }
  reasons.sort((a, b) =>
    a.kind === 'resourceLimit' && b.kind === 'resourceLimit'
      ? b.shortfallPerMin - a.shortfallPerMin
      : 0,
  )
  return reasons
}
