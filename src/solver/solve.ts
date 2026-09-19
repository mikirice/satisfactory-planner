/**
 * LP を解いて Solution（仕様書ドラフト-v0 §4.4）に組み立てる本体。
 */
import {
  buildingsById,
  itemsById,
  ratePerMin,
  recipes,
  recipesById,
} from '../data/index.ts'
import { CLOCK_MAX, SOMERSLOOP_FULL_OUTPUT_MULTIPLIER } from '../data/constants.ts'
import type { ItemAmount, Recipe } from '../data/types.ts'
import type { LpBackend, LpResult } from './lp.ts'
import { glpkBackend } from './glpk-backend.ts'
import type {
  BuildModelOptions,
  GeneratorVariant,
  ProductionModel,
  SupplySource,
} from './model.ts'
import {
  DEFAULT_TOLERANCE,
  buildProductionModel,
  defaultEnabledRecipeIds,
  fuelHasByproduct,
  maximizeVarKey,
  overflowVarKey,
  recipeVarKey,
  somersloopPowerFactor,
  somersloopVarKey,
  variablePowerRange,
  zeroSurplusChain,
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

/**
 * モデルを解く。発電計画が有効で、かつ需要駆動の発電機（発電計画で許可していないが
 * 副産物を出す発電機 × 燃料）があるときだけ2段階になる:
 *
 *   1段目: 需要駆動の発電量を電力の制約に**数えずに**解き、副産物の需要ぶんの台数を確定する。
 *          数えたまま解くと、LP が「廃棄物の消費先（再処理）を余分に建てて廃棄物の需要を
 *          作り出し、許可していない原子力を発電に流用する」抜け道を見つけてしまう
 *          （石炭だけを許可した 300MW の計画が原子力で解かれる）。
 *   2段目: 需要駆動の変数を1段目の台数に固定し、その発電量を電力の制約に数えて解き直す。
 *          廃棄物の需要で回る原子力の電力ぶんだけ、許可した発電機（石炭など）の台数が減る。
 *          このとき副産物から派生するアイテム（廃棄物 → ペレット → 燃料棒 …）の余りは
 *          1段目の値までに抑える。抑えないと、許可した発電機の燃料チェーン自体が廃棄物の
 *          消費先のとき（プルトニウム燃料棒だけを許可した原子力など）に、LP が許可した
 *          発電機をやめて燃料棒やペレットを捨てる解（需要駆動の発電量だけで目標を満たす）を選ぶ。
 *
 * 1段目の解は2段目でも実行可能（固定値と余りの上限は1段目の値そのもの・電力の行は
 * 左辺が増えるだけ）なので、2段目が最適解を返さないのは数値的な事故だけ。
 * その場合は1段目の解にフォールバックする。
 */
async function solveModel(
  input: SolveInput,
  options: BuildModelOptions,
  model: ProductionModel,
  backend: LpBackend,
  tolerance: number,
): Promise<{ model: ProductionModel; result: LpResult }> {
  const demandDriven = model.generatorVariants.filter((variant) => variant.demandDriven)
  if (!model.powerPlan.active || demandDriven.length === 0) {
    return { model, result: await backend.solve(model.lp) }
  }
  const first = buildProductionModel(input, { ...options, creditDemandDrivenPower: false })
  const firstResult = await backend.solve(first.lp)
  if (firstResult.status !== 'optimal') return { model: first, result: firstResult }

  const levels = new Map<string, number>()
  let running = false
  for (const variant of demandDriven) {
    const level = firstResult.values.get(variant.key) ?? 0
    if (level > tolerance) running = true
    levels.set(variant.key, level > tolerance ? level : 0)
  }
  // 需要駆動の発電機が1台も回らないなら、数え直す発電量が無いので1段目がそのまま答え
  if (!running) return { model: first, result: firstResult }

  // 副産物から派生するアイテムの余りを1段目の値で抑える（上のコメント参照）
  const surplusCaps = new Map<string, number>()
  for (const itemId of downstreamOfByproducts(first, demandDriven)) {
    const row = first.lp.constraints.find((c) => c.key === `balance:${itemId}`)
    if (!row) continue
    let net = 0
    for (const [key, coefficient] of row.coefficients) {
      net += coefficient * (firstResult.values.get(key) ?? 0)
    }
    const surplus = net - (first.targets.get(itemId) ?? 0)
    surplusCaps.set(itemId, Math.max(0, surplus))
  }

  const second = buildProductionModel(input, {
    ...options,
    demandDrivenLevels: levels,
    surplusCaps,
  })
  const secondResult = await backend.solve(second.lp)
  return secondResult.status === 'optimal'
    ? { model: second, result: secondResult }
    : { model: first, result: firstResult }
}

/**
 * 需要駆動の発電機が出す副産物から、有効レシピをたどって作られうるアイテムの集合
 * （副産物そのものを含む・前方到達）。
 */
function downstreamOfByproducts(
  model: ProductionModel,
  demandDriven: readonly GeneratorVariant[],
): Set<string> {
  const downstream = new Set<string>()
  for (const variant of demandDriven) {
    if (fuelHasByproduct(variant.fuel)) downstream.add(variant.fuel.byproduct!.item)
  }
  const candidates = [...model.recipes, ...model.somersloopRecipes]
  let changed = true
  while (changed) {
    changed = false
    for (const recipe of candidates) {
      if (!recipe.ingredients.some((ingredient) => downstream.has(ingredient.item))) continue
      for (const product of recipe.products) {
        if (downstream.has(product.item)) continue
        downstream.add(product.item)
        changed = true
      }
    }
  }
  return downstream
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

  const { model: solved, result } = await solveModel(input, {}, model, backend, tolerance)

  switch (result.status) {
    case 'optimal': {
      const solution = buildSolution(solved, result, tolerance, maxClock)
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

  const { result } = await solveModel(base, { maximize: item }, model, backend, tolerance)
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

  // 発電計画のサマリー。発電計画が有効なとき、または（無効でも）副産物の需要で
  // 発電機が1台でも回ったときに出す（発電量と差引を正直に見せるため）。
  const powerGeneration: PowerGenerationSummary | undefined =
    model.powerPlan.active || generatorMachineCount > 0
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
 * `generatorVariants` には `model.generatorVariants` を渡す。副産物（核廃棄物）を出す
 * 発電機 × 燃料は発電計画の有無に関係なく常にモデルに入っている（需要駆動）ので、
 * 再処理チェーン（プルトニウム / FICSONIUM 系）も発電計画なしで到達可能になる。
 */
export function findUnreachableTargets(
  input: SolveInput,
  supplies: readonly SupplySource[],
  generatorVariants: readonly GeneratorVariant[] = [],
): InfeasibleReason[] {
  const available = reachableItems(input, supplies, generatorVariants)
  return input.targets
    .filter((target) => target.ratePerMin > 0 && !available.has(target.item))
    .map((target) => ({
      kind: 'unproducibleItem' as const,
      item: target.item,
      message: `${jaName(target.item)} は有効なレシピと利用できる原料からは生産できません`,
    }))
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
  const remainingVariants = new Set(generatorVariants.filter((v) => fuelHasByproduct(v.fuel)))
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
 *
 * 判定対象は発電計画で**許可した**変数（`demandDriven: false`）だけ。需要駆動の変数は
 * 副産物の供給源としては数える（FICSONIUM燃料棒はプルトニウム廃棄物が要る）が、
 * 「発電に使える方式」ではないので usable には入れない。
 */
export function findUnusableGenerators(
  input: SolveInput,
  model: ProductionModel,
): InfeasibleReason[] {
  if (!model.powerPlan.active) return []
  const isFuelAvailable = (
    available: ReadonlySet<string>,
    fuel: GeneratorVariant['fuel'],
  ): boolean =>
    available.has(fuel.item) &&
    (!fuel.supplementalItem || available.has(fuel.supplementalItem))
  // 発電機の副産物（需要駆動の変数も含む）を供給源に数える
  const available = reachableItems(input, model.supplies, model.generatorVariants)
  const usable = model.generatorVariants.filter(
    (variant) => !variant.demandDriven && isFuelAvailable(available, variant.fuel),
  )
  if (usable.length > 0) return []

  const withAllRecipes = reachableItems(
    { ...input, enabledRecipes: recipes.map((recipe) => recipe.id) },
    model.supplies,
    model.generatorVariants,
  )

  return model.powerPlan.generators.map((generator) => {
    // 燃料を絞っている場合は「絞ったせいで解けない」ことが分かるよう、許可した燃料だけを挙げる
    const allowed = model.powerPlan.allowedFuels.get(generator.id) ?? generator.fuels
    const restricted = allowed.length < generator.fuels.length
    const manualOnlyFuels = allowed.filter((fuel) => !isFuelAvailable(withAllRecipes, fuel))
    const manualInputs = manualOnlyFuels.flatMap((fuel) => [
      ...nearestUnavailableIngredients(fuel.item, withAllRecipes),
      ...(fuel.supplementalItem && !withAllRecipes.has(fuel.supplementalItem)
        ? [fuel.supplementalItem]
        : []),
    ])
    const manualInputNames = [...new Set(manualInputs.map(jaName))].join(' / ')
    const hint =
      manualInputs.length > 0 && manualOnlyFuels.length === allowed.length
        ? `（材料の「${manualInputNames}」は、` +
          'マップ原料と自動化レシピだけでは用意できません。' +
          `「既にあるアイテム」に「${manualInputNames}」を追加してください）`
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

/** 全レシピを使っても作れない燃料について、持ち込みに最も近い材料を返す。 */
function nearestUnavailableIngredients(item: string, available: ReadonlySet<string>): string[] {
  const candidates = recipes
    .filter((recipe) => recipe.products.some((product) => product.item === item))
    .map((recipe) => recipe.ingredients.filter((ingredient) => !available.has(ingredient.item)))
    .filter((missing) => missing.length > 0)
    .sort((a, b) => a.length - b.length)
  return (candidates[0] ?? [{ item, amount: 0 }]).map((ingredient) => ingredient.item)
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
  // 2段階解法の1段目と同じ扱い（需要駆動の発電量は電力に数えない）。
  // ここに来るのは1段目が実行不能だったときだけなので、診断もその条件に揃える。
  const elastic = buildProductionModel(input, { elastic: true, creditDemandDrivenPower: false })
  const result = await backend.solve(elastic.lp)
  if (result.status !== 'optimal') {
    // 「余りを許さない副産物」が原因なら、原料上限より先にそれを言う
    const byproducts = await diagnoseZeroSurplus(input, elastic, backend)
    if (byproducts.length > 0) return byproducts
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

/**
 * 「余りを許さない副産物」（`power.zeroSurplusByproducts`）のせいで解けていないかを調べる。
 *
 * 弾性モデル（原料上限なし）でも実行不能だったときに呼ぶ。等式をすべて外した弾性モデルが
 * 解けるなら原因はこの制約にある。どの副産物かは:
 *   1. 静的に原因が分かるもの（消費する有効レシピが無い / 消費レシピの他の材料が用意できない）
 *      があればそれだけを挙げる（原因つき）
 *   2. 無ければ、1つだけ等式を外して解けるようになる副産物を挙げる（原因なし）
 *   3. それでも1つも無ければ、指定した副産物すべてを挙げる
 * 副産物が出ない計画（発電所を回さない）なら等式は元から満たせるので、ここには落ちない。
 */
async function diagnoseZeroSurplus(
  input: SolveInput,
  elastic: ProductionModel,
  backend: LpBackend,
): Promise<InfeasibleReason[]> {
  const constrained = [...elastic.powerPlan.zeroSurplusByproducts].sort()
  if (constrained.length === 0) return []
  const withZeroSurplus = (items: readonly string[]): SolveInput => ({
    ...input,
    power: { ...input.power, zeroSurplusByproducts: items },
  })
  const solvable = async (items: readonly string[]): Promise<boolean> => {
    const model = buildProductionModel(withZeroSurplus(items), {
      elastic: true,
      creditDemandDrivenPower: false,
    })
    return (await backend.solve(model.lp)).status === 'optimal'
  }
  if (!(await solvable([]))) return []

  const available = reachableItems(input, elastic.supplies, elastic.generatorVariants)
  const candidates = [...elastic.recipes, ...elastic.somersloopRecipes]
  const constrainedSet = new Set(constrained)
  /**
   * 静的に分かる原因。
   * - b を消費する有効レシピが1つも無い → noEnabledConsumer
   * - b とその再処理チェーン（zeroSurplusChain）のどれかに行き先が無い → consumerChainUnavailable。
   *   行き先 = 材料の揃う消費レシピ / 発電計画で許可した発電機 /
   *   需要駆動の発電機のうち副産物も「残さない」指定のもの（消費先ができれば回れる）
   */
  const causeOf = (item: string): 'noEnabledConsumer' | 'consumerChainUnavailable' | undefined => {
    const consumersOf = (id: string): Recipe[] =>
      candidates.filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.item === id))
    if (consumersOf(item).length === 0) return 'noEnabledConsumer'
    const chain = zeroSurplusChain(
      new Set([item]),
      candidates,
      elastic.generatorVariants,
      elastic.supplies,
    )
    for (const id of chain) {
      const recipeSink = consumersOf(id).some((recipe) =>
        recipe.ingredients.every((ingredient) => available.has(ingredient.item)),
      )
      const generatorSink = elastic.generatorVariants.some(
        (variant) =>
          variant.fuel.item === id &&
          (!variant.demandDriven ||
            (fuelHasByproduct(variant.fuel) &&
              constrainedSet.has(variant.fuel.byproduct!.item))),
      )
      if (!recipeSink && !generatorSink) return 'consumerChainUnavailable'
    }
    return undefined
  }
  const reasonFor = (
    item: string,
    cause: 'noEnabledConsumer' | 'consumerChainUnavailable' | undefined,
  ): InfeasibleReason => ({
    kind: 'byproductMustBeConsumed',
    item,
    ...(cause === undefined ? {} : { cause }),
    message:
      `${jaName(item)} を「残さない」設定にしていますが、この条件では消費しきれません` +
      (cause === 'noEnabledConsumer'
        ? '（消費する有効なレシピがありません）'
        : cause === 'consumerChainUnavailable'
          ? '（再処理でできるアイテムの行き先がありません。燃料棒を燃やす発電方式を許可するか、必要なレシピを有効にしてください）'
          : ''),
  })

  const explained = constrained
    .map((item) => ({ item, cause: causeOf(item) }))
    .filter((entry) => entry.cause !== undefined)
  if (explained.length > 0) return explained.map((e) => reasonFor(e.item, e.cause))

  const culprits: string[] = []
  for (const item of constrained) {
    if (await solvable(constrained.filter((other) => other !== item))) culprits.push(item)
  }
  return (culprits.length > 0 ? culprits : constrained).map((item) => reasonFor(item, undefined))
}
