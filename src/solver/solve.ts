/**
 * LP を解いて Solution（仕様書ドラフト-v0 §4.4）に組み立てる本体。
 */
import { buildingsById, itemsById, ratePerMin, recipesById } from '../data/index.ts'
import type { ItemAmount } from '../data/types.ts'
import type { LpBackend, LpResult } from './lp.ts'
import { glpkBackend } from './glpk-backend.ts'
import type { ProductionModel, SupplySource } from './model.ts'
import {
  DEFAULT_TOLERANCE,
  buildProductionModel,
  defaultEnabledRecipeIds,
  maximizeVarKey,
  overflowVarKey,
  recipeVarKey,
  variablePowerRange,
} from './model.ts'
import type {
  ExternalInputUsage,
  InfeasibleReason,
  InfeasibleResult,
  ItemBalance,
  ItemRate,
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

  const totalTarget = [...model.targets.values()].reduce((sum, v) => sum + v, 0)
  if (totalTarget <= 0) return emptySolution()

  // 先に「そもそも作れないアイテム」を弾く。LP を回すより原因が明確に出せる。
  const unreachable = findUnreachableTargets(input, model.supplies)
  if (unreachable.length > 0) return infeasible(unreachable)

  const result = await backend.solve(model.lp)

  switch (result.status) {
    case 'optimal': {
      const solution = buildSolution(model, result, tolerance)
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
  )
  if (unreachable.length > 0) return infeasible(unreachable)

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

function emptySolution(): Solution {
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
    totalMachineCount: 0,
    totalBuildingCount: 0,
    totalBuildCost: [],
    sinkPointsPerMin: 0,
    objectiveValue: 0,
  }
}

function buildSolution(model: ProductionModel, result: LpResult, tolerance: number): Solution {
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
  let totalMachineCount = 0
  let totalBuildingCount = 0

  for (const recipe of model.recipes) {
    const machineCount = clean(result.values.get(recipeVarKey(recipe.id)) ?? 0)
    if (machineCount <= 0) continue
    const building = buildingsById.get(recipe.producedIn)!

    const inputs: ItemRate[] = recipe.ingredients.map((i) => {
      const rate = ratePerMin(i.amount, recipe.durationSec) * machineCount
      accumulate(consumed, i.item, rate)
      return { item: i.item, ratePerMin: rate }
    })
    const outputs: ItemRate[] = recipe.products.map((p) => {
      const rate = ratePerMin(p.amount, recipe.durationSec) * machineCount
      accumulate(produced, p.item, rate)
      return { item: p.item, ratePerMin: rate }
    })

    const range = variablePowerRange(recipe, building)
    const powerRangeMW = range
      ? { minMW: range.minMW * machineCount, maxMW: range.maxMW * machineCount }
      : undefined
    const powerMW = powerRangeMW
      ? (powerRangeMW.minMW + powerRangeMW.maxMW) / 2
      : building.powerConsumptionMW * machineCount

    totalPowerMW += powerMW
    minPowerMW += powerRangeMW ? powerRangeMW.minMW : powerMW
    maxPowerMW += powerRangeMW ? powerRangeMW.maxMW : powerMW
    totalMachineCount += machineCount

    // 建設コストは実際に建てる台数（切り上げ）で計算する
    const builtCount = Math.max(1, Math.ceil(machineCount - tolerance))
    totalBuildingCount += builtCount
    for (const cost of building.buildCost) {
      buildCost.set(cost.item, (buildCost.get(cost.item) ?? 0) + cost.amount * builtCount)
    }

    steps.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      buildingId: building.id,
      buildingName: building.name,
      machineCount,
      clockSpeed: 1,
      powerMW,
      ...(powerRangeMW ? { powerRangeMW } : {}),
      inputs,
      outputs,
    })
  }

  steps.sort((a, b) => b.machineCount - a.machineCount || a.recipeId.localeCompare(b.recipeId))

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
    totalMachineCount,
    totalBuildingCount,
    totalBuildCost,
    sinkPointsPerMin,
    objectiveValue: result.objectiveValue,
  }
}

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
 */
export function findUnreachableTargets(
  input: SolveInput,
  supplies: readonly SupplySource[],
): InfeasibleReason[] {
  const enabledIds = input.enabledRecipes
    ? [...new Set(input.enabledRecipes)]
    : defaultEnabledRecipeIds()

  const available = new Set<string>()
  for (const supply of supplies) {
    if (supply.limit === null || supply.limit > 0) available.add(supply.item)
  }

  const remaining = new Set(enabledIds)
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
  }

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
