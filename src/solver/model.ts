/**
 * 生産計画の LP 定式化（仕様書ドラフト-v0 §4.2）。
 *
 *   決定変数
 *     x_r  … レシピ r の稼働台数（連続値・0以上）。部分稼働はアンダークロックと解釈する
 *     s_i  … 原料 i の外部供給量（0 <= s_i <= 上限）。採掘はレシピに無いのでここで表す
 *
 *   制約（アイテム i ごと）
 *     Σ_r (産出_{i,r} - 消費_{i,r})·x_r + s_i >= 目標産出_i
 *     目標でないアイテムは右辺 0（過剰生産＝副産物は許容する）
 *
 *   目的関数（最小化）
 *     w_res·Σ_i (資源重み_i · s_i) + w_pow·Σ_r (電力_r · x_r) + w_bld·Σ_r x_r + ε·Σ_r x_r
 *
 * 産出最大化モード（options.maximize）ではこの目的関数を差し替え、
 * 「対象アイテムを系の外へ取り出す量 y」の最大化だけを解く（詳細は BuildModelOptions）。
 *
 * 末尾の ε 項は「正味ゼロのまま無限に回り続ける循環」を潰すための保険。
 * リサイクル・プラスチック/ゴムのループは燃料を消費するので本来は有界だが、
 * 一般には目的関数に現れない退化した循環がありうるため常に入れている。
 */
import {
  buildingsById,
  generatorsById,
  itemsById,
  ratePerMin,
  recipes as allRecipes,
  recipesById,
} from '../data/index.ts'
import { SOMERSLOOP_FULL_OUTPUT_MULTIPLIER } from '../data/constants.ts'
import type { Building, Generator, GeneratorFuel, Recipe } from '../data/types.ts'
import { DEFAULT_RESOURCE_LIMITS, MAP_RESOURCE_LIMITS } from '../data/map-limits.ts'
import type { LpConstraint, LpModel, LpVariable } from './lp.ts'
import type {
  ObjectiveWeights,
  PowerPlanInput,
  ResourceWeightSpec,
  SolveInput,
} from './types.ts'

export const DEFAULT_WEIGHTS: ObjectiveWeights = { resources: 1, power: 0, buildings: 0 }
export const DEFAULT_EPSILON = 1e-6
export const DEFAULT_TOLERANCE = 1e-7

/**
 * 原料の相対コストの既定値。
 *
 * NEEDS-REVIEW: v0 §4.2 の文面は「原料消費量の最小化」だが、全原料を 1 として
 * 単純合計すると「250MW の変換機で硫黄から石灰岩を作る」ような解が出てしまう
 * （硫黄45 + SAM22.5 = 67.5 の方が石灰岩135より"少ない"ため）。
 * v0 が併記している「資源効率」の意図に沿うのは希少度で重み付けした合計なので
 * 既定を 'scarcity' にしている。'uniform' も引き続き選べる。
 */
export const DEFAULT_RESOURCE_WEIGHT_SPEC: ResourceWeightSpec = 'scarcity'

/** LP 変数のキー命名（結果の読み戻しでも使う） */
export const recipeVarKey = (recipeId: string): string => `x:${recipeId}`
/** Somersloop をフル装着したレシピ r の稼働台数（産出2倍・消費同じ・電力4倍） */
export const somersloopVarKey = (recipeId: string): string => `xs:${recipeId}`
/** 原料（マップから採取）の供給変数 */
export const supplyVarKey = (itemId: string): string => `s:${itemId}`
/** ユーザーが持ち込むアイテムの供給変数 */
export const inputVarKey = (itemId: string): string => `i:${itemId}`
/** 産出最大化モードで「取り出す量」を表す変数（これを最大化する） */
export const maximizeVarKey = (itemId: string): string => `y:${itemId}`
/** 実行不能診断で使う「上限を超えた分」の変数（供給変数キーから作る） */
export const overflowVarKey = (supplyKey: string): string => `o:${supplyKey}`
/** 発電機 g を燃料 f で回す稼働台数（クロック100%固定） */
export const generatorVarKey = (generatorId: string, fuelItem: string): string =>
  `g:${generatorId}:${fuelItem}`

/** 目標発電量の制約行（総発電量 >= 目標MW） */
export const POWER_TARGET_ROW = 'power:target'
/** 自給の制約行（総発電量 - 製造建物の総消費電力 >= 0） */
export const POWER_COVER_ROW = 'power:cover'

/** 資源の希少度重み（'scarcity'）の基準となる最大上限。鉄鉱石の 92,100/min。 */
export const SCARCITY_REFERENCE_RATE = Math.max(
  ...MAP_RESOURCE_LIMITS.map((r) => r.maxRatePerMin ?? 0),
)

/**
 * 原料1単位あたりの相対コストを解決する。
 * 'scarcity' は「マップ上限が少ない資源ほど高い」= 基準レート / 上限。
 * 上限なし（水）は 0（いくらでも汲めるのでコストに数えない）。
 */
export function resolveResourceWeights(
  spec: ResourceWeightSpec | undefined,
  resourceIds: readonly string[],
  limits: Readonly<Record<string, number | null>>,
): Map<string, number> {
  const out = new Map<string, number>()
  if (spec === 'scarcity') {
    for (const id of resourceIds) {
      const limit = limits[id] ?? null
      out.set(id, limit === null || limit <= 0 ? 0 : SCARCITY_REFERENCE_RATE / limit)
    }
    return out
  }
  if (spec && spec !== 'uniform') {
    for (const id of resourceIds) out.set(id, spec[id] ?? 1)
    return out
  }
  for (const id of resourceIds) out.set(id, 1)
  return out
}

/**
 * レシピ1台あたりの、アイテム i の正味レート（産出 - 消費、個/分）。
 * `outputMultiplier` は Somersloop の産出倍率（フル装着なら 2）。消費側には掛からない。
 */
export function netRatePerMin(recipe: Recipe, itemId: string, outputMultiplier = 1): number {
  let net = 0
  for (const p of recipe.products) {
    if (p.item === itemId) net += ratePerMin(p.amount, recipe.durationSec) * outputMultiplier
  }
  for (const i of recipe.ingredients) {
    if (i.item === itemId) net -= ratePerMin(i.amount, recipe.durationSec)
  }
  return net
}

/**
 * Somersloop をフル装着できるレシピか。
 * 建物にスロットがあることが条件（製作機・組立機・製造機・製錬炉・精製所ほか）。
 */
export function supportsSomersloop(recipe: Recipe): boolean {
  return (buildingsById.get(recipe.producedIn)?.maxSomersloops ?? 0) > 0
}

/** Somersloop をフル装着したときの消費電力倍率（既定の指数 2 なら 4倍）。 */
export function somersloopPowerFactor(building: Building): number {
  return Math.pow(SOMERSLOOP_FULL_OUTPUT_MULTIPLIER, building.somersloopPowerExponent)
}

/**
 * レシピ1台あたりの消費電力(MW)。可変電力は範囲の中央値を返す。
 * 可変電力はレシピ側（粒子加速器の各レシピ）が持つが、
 * 取れない場合は建物側の推定レンジにフォールバックする。
 */
export function recipePowerMW(recipe: Recipe, building: Building): number {
  const range = variablePowerRange(recipe, building)
  if (range) return (range.minMW + range.maxMW) / 2
  return building.powerConsumptionMW
}

export function variablePowerRange(
  recipe: Recipe,
  building: Building,
): { minMW: number; maxMW: number } | undefined {
  return recipe.variablePower ?? building.variablePower
}

/** 既定の有効レシピ集合＝代替レシピを除く全レシピ。 */
export function defaultEnabledRecipeIds(): string[] {
  return allRecipes.filter((r) => !r.isAlternate).map((r) => r.id)
}

/**
 * 外部からアイテムを供給する変数の素。
 * - `raw`   … マップから採取する原料。上限はマップ資源量、コストは資源重み
 * - `input` … ユーザーの手持ち / 別工場からの供給。上限は指定量、**コストは0**
 *             （すでに手元にあるものなので「消費して損」という扱いにしない）
 */
export type SupplySource = {
  item: string
  kind: 'raw' | 'input'
  /** LP 変数キー */
  key: string
  /** 供給上限（null = 無制限） */
  limit: number | null
  /** 1単位あたりの目的関数係数（weights.resources を掛ける前） */
  weight: number
}

/**
 * 発電機の変数1本ぶん（発電機 × 燃料の組み合わせ）。
 * 同じ発電機でも燃料ごとに別変数にして、LP に「どの燃料で回すか」を選ばせる。
 */
export type GeneratorVariant = {
  generator: Generator
  fuel: GeneratorFuel
  /** LP 変数キー */
  key: string
}

/** 解決済みの発電計画（LP に実際に反映される形）。 */
export type ResolvedPowerPlan = {
  /** 変数を作る発電機 */
  generators: Generator[]
  /** 目標発電量(MW)。0 = 指定なし */
  targetMW: number
  coverFactoryPower: boolean
  /** LP に発電機の変数と制約を足すか（false なら発電機能を使わない従来の LP） */
  active: boolean
}

/**
 * `SolveInput.power` を検証して解決する。
 *
 * 「発電機が1つ以上あり、かつ目標発電量か自給のどちらかが指定されている」ときだけ有効。
 * どちらも無いと発電機を建てる理由が無く、変数を足しても必ず 0 になるので、
 * LP を従来と1変数も変えないほうが安全（回帰の担保）。
 */
export function resolvePowerPlan(power: PowerPlanInput | undefined): ResolvedPowerPlan {
  const targetMW = power?.targetMW ?? 0
  if (!(Number.isFinite(targetMW) && targetMW >= 0)) {
    throw new Error(`power.targetMW must be a finite number >= 0: ${targetMW}`)
  }
  const coverFactoryPower = power?.coverFactoryPower === true
  const generators: Generator[] = []
  for (const id of new Set(power?.generators ?? [])) {
    const generator = generatorsById.get(id)
    if (!generator) throw new Error(`unknown generator id: ${id}`)
    generators.push(generator)
  }
  generators.sort((a, b) => a.id.localeCompare(b.id))
  return {
    generators,
    targetMW,
    coverFactoryPower,
    active: generators.length > 0 && (targetMW > 0 || coverFactoryPower),
  }
}

export type ProductionModel = {
  lp: LpModel
  /** 変数に含めたレシピ */
  recipes: Recipe[]
  /** Somersloop フル装着バリアントの変数を持つレシピ（somersloops <= 0 なら空） */
  somersloopRecipes: Recipe[]
  /** 使用可能な Somersloop 数（0 = バリアントなし） */
  somersloopLimit: number
  /** 発電機の変数（発電計画が無効なら空） */
  generatorVariants: GeneratorVariant[]
  /** 解決済みの発電計画 */
  powerPlan: ResolvedPowerPlan
  /** 外部供給変数（原料 + ユーザー投入） */
  supplies: SupplySource[]
  /** 原料の上限（ユーザー投入は含まない） */
  limits: Map<string, number | null>
  /** 実際に適用した資源重み */
  resourceWeights: Map<string, number>
  weights: ObjectiveWeights
  targets: Map<string, number>
}

export type BuildModelOptions = {
  /**
   * 診断モード。各供給アイテムに「上限超過」変数を足し、
   * 目的関数をその合計の最小化に置き換える（元の目的は ε 項だけ残す）。
   */
  elastic?: boolean
  /**
   * 産出最大化モード（Item.id）。目的関数を
   * 「そのアイテムの正味産出（取り出し変数 y）の最大化」だけに差し替える。
   *
   * - 他の重み・ε はすべて 0 にする。max 方向で ε を残すと「回すほど得」になり、
   *   退化した循環が無限に伸びてしまうため（ε は min 方向でのみ意味がある）。
   * - 目的関数が y だけなので、退化した循環があっても最適値 y* は正しく求まる。
   *   実際の構成（どのレシピを何台回すか）は、y* を目標レートにした
   *   通常の最小化モデルで解き直して決める（solve.ts の2フェーズ）。
   *
   * 入力側の `SolveInput.maximize` はここでは見ない（フェーズの切り替えは
   * 呼び出し側が明示する）。
   */
  maximize?: string
}

export function buildProductionModel(input: SolveInput, options: BuildModelOptions = {}): ProductionModel {
  const epsilon = input.epsilon ?? DEFAULT_EPSILON
  const weights: ObjectiveWeights = { ...DEFAULT_WEIGHTS, ...input.weights }
  // 負の重みを許すと目的関数が下に有界でなくなる（水は上限なしなので即座に発散する）
  for (const [name, value] of Object.entries(weights)) {
    if (!(Number.isFinite(value) && value >= 0)) {
      throw new Error(`objective weight must be a finite number >= 0: ${name}=${value}`)
    }
  }
  if (!(Number.isFinite(epsilon) && epsilon >= 0)) {
    throw new Error(`epsilon must be a finite number >= 0: ${epsilon}`)
  }

  // --- 変数に含めるレシピ ---------------------------------------------------
  const enabledIds = input.enabledRecipes
    ? [...new Set(input.enabledRecipes)]
    : defaultEnabledRecipeIds()
  const recipes: Recipe[] = []
  for (const id of enabledIds) {
    const recipe = recipesById.get(id)
    if (!recipe) throw new Error(`unknown recipe id: ${id}`)
    recipes.push(recipe)
  }

  // --- 外部供給（原料 + ユーザー投入） --------------------------------------
  // 指定されなかった原料はマップ上限のまま（部分指定で他が無制限にならないようにする）
  const providedLimits = { ...DEFAULT_RESOURCE_LIMITS, ...input.resourceLimits }
  const limits = new Map<string, number | null>()
  for (const item of itemsById.values()) {
    if (!item.isRawResource) continue
    limits.set(item.id, providedLimits[item.id] ?? null)
  }
  const rawItems = [...limits.keys()].sort()

  const resourceWeights = resolveResourceWeights(
    input.resourceWeights ?? DEFAULT_RESOURCE_WEIGHT_SPEC,
    rawItems,
    Object.fromEntries(limits),
  )

  const supplies: SupplySource[] = rawItems.map((item) => ({
    item,
    kind: 'raw' as const,
    key: supplyVarKey(item),
    limit: limits.get(item) ?? null,
    weight: resourceWeights.get(item) ?? 1,
  }))
  // ユーザー指定の投入は原料以外でも許可する（別工場からの供給・手持ち在庫）。
  // すでに手元にあるものなので目的関数上のコストは 0（使わないと損）。
  for (const [item, rate] of Object.entries(input.inputs ?? {})) {
    if (!itemsById.has(item)) throw new Error(`unknown item id in inputs: ${item}`)
    if (!(rate >= 0)) throw new Error(`input rate must be >= 0: ${item}`)
    supplies.push({ item, kind: 'input', key: inputVarKey(item), limit: rate, weight: 0 })
  }

  // --- 目標 -----------------------------------------------------------------
  const targets = new Map<string, number>()
  for (const t of input.targets) {
    if (!itemsById.has(t.item)) throw new Error(`unknown item id in targets: ${t.item}`)
    if (!(t.ratePerMin >= 0)) throw new Error(`target rate must be >= 0: ${t.item}`)
    targets.set(t.item, (targets.get(t.item) ?? 0) + t.ratePerMin)
  }

  // --- 最大化対象 -----------------------------------------------------------
  const maximize = options.maximize
  if (maximize !== undefined && !itemsById.has(maximize)) {
    throw new Error(`unknown item id in maximize: ${maximize}`)
  }

  // --- Somersloop ------------------------------------------------------------
  const somersloopLimit = input.somersloops ?? 0
  if (!(Number.isFinite(somersloopLimit) && somersloopLimit >= 0)) {
    throw new Error(`somersloops must be a finite number >= 0: ${somersloopLimit}`)
  }
  // 0 のときはバリアント変数を1つも作らない（＝ 従来と完全に同じ LP になる）
  const somersloopRecipes = somersloopLimit > 0 ? recipes.filter(supportsSomersloop) : []

  // --- 発電計画 --------------------------------------------------------------
  // 無効なら変数も制約も作らない（＝ 従来と完全に同じ LP になる）
  const powerPlan = resolvePowerPlan(input.power)
  const generatorVariants: GeneratorVariant[] = powerPlan.active
    ? powerPlan.generators.flatMap((generator) =>
        generator.fuels.map((fuel) => ({
          generator,
          fuel,
          key: generatorVarKey(generator.id, fuel.item),
        })),
      )
    : []

  // --- 変数 -----------------------------------------------------------------
  const variables: LpVariable[] = []
  const buildingOf = (recipe: Recipe): Building => {
    const building = buildingsById.get(recipe.producedIn)
    if (!building) throw new Error(`recipe ${recipe.id} has unknown building ${recipe.producedIn}`)
    return building
  }
  for (const recipe of recipes) {
    const building = buildingOf(recipe)
    const objective =
      maximize !== undefined
        ? 0
        : options.elastic
          ? epsilon
          : weights.power * recipePowerMW(recipe, building) + weights.buildings + epsilon
    variables.push({ key: recipeVarKey(recipe.id), objective })
  }
  for (const recipe of somersloopRecipes) {
    const building = buildingOf(recipe)
    // 建物1台であることは変わらないので buildings 項は通常変数と同じ。
    // 電力だけがフル装着ぶん（倍率^指数、既定 4倍）跳ね上がる。
    const objective =
      maximize !== undefined
        ? 0
        : options.elastic
          ? epsilon
          : weights.power * recipePowerMW(recipe, building) * somersloopPowerFactor(building) +
            weights.buildings +
            epsilon
    variables.push({ key: somersloopVarKey(recipe.id), objective })
  }
  for (const variant of generatorVariants) {
    // 発電機は電力を消費しないので power 項は 0。建物ではあるので buildings 項は 1台ぶん。
    // ε で「意味のない発電機を建てる」退化解を潰す（燃料コストがあるので本来は有界）。
    const objective =
      maximize !== undefined ? 0 : options.elastic ? epsilon : weights.buildings + epsilon
    variables.push({ key: variant.key, objective })
  }
  for (const supply of supplies) {
    // ε を足すのは「コスト0の供給（無制限の水・持ち込み分）を必要以上に引き込む
    // 退化解」を避けるため。重み1.0の鉄鉱石に対して 1e-6 なので解の選択には影響しない。
    variables.push({
      key: supply.key,
      objective:
        maximize !== undefined ? 0 : (options.elastic ? 0 : weights.resources * supply.weight) + epsilon,
      upper: supply.limit === null ? Number.POSITIVE_INFINITY : supply.limit,
    })
    if (options.elastic && supply.limit !== null) {
      // 上限を超えて供給できる「架空の」変数。これが正なら上限が原因で解けていない
      variables.push({ key: overflowVarKey(supply.key), objective: 1 })
    }
  }
  if (maximize !== undefined) {
    // 「系の外へ取り出す量」。収支の行から引くので y <= 正味産出 になる
    variables.push({ key: maximizeVarKey(maximize), objective: 1 })
  }

  // --- 制約（アイテムごとの収支） -------------------------------------------
  // 関係するアイテムだけ行を作る（198アイテム中、実際に登場するものだけ）
  const rows = new Map<string, Map<string, number>>()
  const rowFor = (itemId: string): Map<string, number> => {
    let row = rows.get(itemId)
    if (!row) {
      row = new Map<string, number>()
      rows.set(itemId, row)
    }
    return row
  }
  for (const recipe of recipes) {
    const touched = new Set<string>()
    for (const entry of [...recipe.products, ...recipe.ingredients]) touched.add(entry.item)
    for (const itemId of touched) {
      const net = netRatePerMin(recipe, itemId)
      if (net === 0) continue
      rowFor(itemId).set(recipeVarKey(recipe.id), net)
    }
  }
  for (const recipe of somersloopRecipes) {
    const touched = new Set<string>()
    for (const entry of [...recipe.products, ...recipe.ingredients]) touched.add(entry.item)
    for (const itemId of touched) {
      const net = netRatePerMin(recipe, itemId, SOMERSLOOP_FULL_OUTPUT_MULTIPLIER)
      if (net === 0) continue
      rowFor(itemId).set(somersloopVarKey(recipe.id), net)
    }
  }
  // 発電機は燃料（+補助資源の水）を消費し、副産物（核廃棄物）を産出する。
  // 同じ行に載るので、燃料の生産チェーンまで1つの LP で同時に解ける。
  for (const variant of generatorVariants) {
    const { fuel, key } = variant
    const add = (item: string, coefficient: number): void => {
      const row = rowFor(item)
      row.set(key, (row.get(key) ?? 0) + coefficient)
    }
    add(fuel.item, -fuel.ratePerMin)
    if (fuel.supplementalItem && fuel.supplementalRatePerMin > 0) {
      add(fuel.supplementalItem, -fuel.supplementalRatePerMin)
    }
    if (fuel.byproduct && fuel.byproduct.ratePerMin > 0) {
      add(fuel.byproduct.item, fuel.byproduct.ratePerMin)
    }
  }
  for (const supply of supplies) {
    rowFor(supply.item).set(supply.key, 1)
    if (options.elastic && supply.limit !== null) {
      rowFor(supply.item).set(overflowVarKey(supply.key), 1)
    }
  }
  for (const itemId of targets.keys()) rowFor(itemId)
  if (maximize !== undefined) rowFor(maximize).set(maximizeVarKey(maximize), -1)

  const constraints: LpConstraint[] = []
  for (const [itemId, coefficients] of [...rows].sort(([a], [b]) => a.localeCompare(b))) {
    constraints.push({
      key: `balance:${itemId}`,
      coefficients,
      lower: targets.get(itemId) ?? 0,
    })
  }

  // --- 電力の制約 -----------------------------------------------------------
  // 電力は疑似アイテムにせず専用の行にする（アイテムIDを偽装しないため）。
  //   目標: Σ(発電量_g × g) >= 目標MW
  //   自給: Σ(発電量_g × g) - Σ(消費電力_r × x_r) >= 0
  // 自給側は「発電のために増えた建物の消費」も左辺に入るので、循環は LP が同時に解く。
  if (generatorVariants.length > 0) {
    const production = new Map<string, number>()
    for (const variant of generatorVariants) {
      production.set(variant.key, variant.generator.powerProductionMW)
    }
    if (powerPlan.targetMW > 0) {
      constraints.push({
        key: POWER_TARGET_ROW,
        coefficients: new Map(production),
        lower: powerPlan.targetMW,
      })
    }
    if (powerPlan.coverFactoryPower) {
      const coefficients = new Map(production)
      for (const recipe of recipes) {
        coefficients.set(recipeVarKey(recipe.id), -recipePowerMW(recipe, buildingOf(recipe)))
      }
      for (const recipe of somersloopRecipes) {
        const building = buildingOf(recipe)
        coefficients.set(
          somersloopVarKey(recipe.id),
          -recipePowerMW(recipe, building) * somersloopPowerFactor(building),
        )
      }
      constraints.push({ key: POWER_COVER_ROW, coefficients, lower: 0 })
    }
  }

  // Somersloop の総数制限: Σ(バリアントの稼働台数 × その建物のスロット数) <= 使用可能数
  if (somersloopRecipes.length > 0) {
    const coefficients = new Map<string, number>()
    for (const recipe of somersloopRecipes) {
      coefficients.set(somersloopVarKey(recipe.id), buildingOf(recipe).maxSomersloops)
    }
    constraints.push({ key: 'somersloop:capacity', coefficients, upper: somersloopLimit })
  }

  return {
    lp: { direction: maximize === undefined ? 'min' : 'max', variables, constraints },
    recipes,
    somersloopRecipes,
    somersloopLimit,
    generatorVariants,
    powerPlan,
    supplies,
    limits,
    resourceWeights,
    weights,
    targets,
  }
}
