/**
 * 計算エンジンの入出力型（仕様書ドラフト-v0 §4.2 / §4.4 準拠）。
 */
import type { ItemAmount, LocalizedName } from '../data/types.ts'

// ---------------------------------------------------------------------------
// 入力
// ---------------------------------------------------------------------------

export type TargetRate = {
  /** Item.id */
  item: string
  /** 目標産出レート（個/分 または m³/min） */
  ratePerMin: number
}

/**
 * 目的関数の重み（加重和）。
 *   minimize  resources·Σ(原料消費) + power·Σ(消費電力MW) + buildings·Σ(稼働台数)
 * 単位が違う項の加重和なので絶対値に意味はない。相対比だけを見る。
 */
export type ObjectiveWeights = {
  /** 原料消費量（resourceWeights で重み付けした合計）。既定 1 */
  resources: number
  /** 総消費電力(MW)。既定 0 */
  power: number
  /** 総稼働台数（連続値なので厳密には稼働率合計）。既定 0 */
  buildings: number
}

/**
 * 原料1単位あたりの相対コスト。
 * - `'scarcity'`（既定）: マップ上限が少ない資源ほど高コスト（鉄鉱石=1 基準）。無制限の水は 0
 * - `'uniform'`: すべての原料を 1 として扱う（単純な「総採取量の最小化」）
 * - オブジェクト: item.id → 重み。指定のない原料は 1
 */
export type ResourceWeightSpec = 'uniform' | 'scarcity' | Readonly<Record<string, number>>

/**
 * 発電計画の指定（`SolveInput.power`）。
 *
 * 発電機は「燃料(+水) を消費して電力(MW)を産出する変数」として LP に足す。
 * 燃料もアイテム収支の制約に入るので、石炭発電なら石炭の採掘、燃料式なら原油チェーン、
 * 原子力ならウラン燃料棒の製造までが同じ LP で同時に解ける。
 *
 * **無効時は LP を1変数も変えない**（`generators` が空、または目標も自給もオフのとき）。
 * これは既存プランの解が発電機能の追加で変わらないための約束（tests/power.test.ts）。
 */
export type PowerPlanInput = {
  /**
   * 使ってよい発電機の Building.id（例: `Build_GeneratorCoal_C`）。
   * 未指定・空なら発電計画そのものを行わない（既定）。
   */
  generators?: readonly string[]
  /**
   * 目標発電量(MW)。総発電量がこの値以上になるよう制約を張る。
   * 0 / 未指定なら「発電量そのもの」への要求はしない。
   */
  targetMW?: number
  /**
   * true なら「総発電量 >= 製造建物の総消費電力」を制約に足す。
   * 発電のために増えた建物（燃料精製・ウラン加工など）の消費も右辺に含まれるので、
   * 自己消費の循環は LP が同時に解く。
   *
   * 消費側はクロック100%換算の値（LP の目的関数と同じ基準）。
   * 採掘設備の電力は LP の外（後処理の planExtraction）なので**含まない**。
   */
  coverFactoryPower?: boolean
}

export type SolveInput = {
  /** 目標産出。複数指定可 */
  targets: readonly TargetRate[]
  /**
   * 産出を最大化するアイテム（Item.id）。**同時に1つだけ**。
   * targets の各レートは制約として満たしたうえで、このアイテムの産出を最大にする。
   * 同じアイテムが targets にもあれば、そのレート指定は無視する（最大化が上位）。
   *
   * 上限のない資源（水など）だけで作れる構成を最大化すると解が無限大になるため、
   * その場合は status:'infeasible' / kind:'unbounded' を返す。
   */
  maximize?: string
  /**
   * 使用を許可するレシピID。
   * 未指定なら「代替レシピを除く全レシピ」（isAlternate === false）。
   */
  enabledRecipes?: Iterable<string>
  /**
   * 原料の供給上限（item.id → 毎分レート。null = 無制限）。
   * DEFAULT_RESOURCE_LIMITS（マップ上限）に**上書きマージ**される。
   * つまり一部だけ指定しても、他の原料の上限はマップ上限のまま。
   */
  resourceLimits?: Readonly<Record<string, number | null>>
  /**
   * 既に手元にある / 別工場から供給されるアイテムの投入量（item.id → 毎分レート）。
   * 原料でないアイテムも指定できる。
   */
  inputs?: Readonly<Record<string, number>>
  /**
   * 製造建物のクロック上限（1 = 100%、最大 CLOCK_MAX = 2.5）。既定 1。
   *
   * **LP には影響しない**（稼働台数はクロック100%換算のまま）。
   * 「建てる台数 = ceil(稼働台数 / 上限クロック)」の後処理だけが変わり、
   * それに応じて実クロック・消費電力・パワーシャード・建設コストが決まる。
   */
  maxClock?: number
  /**
   * 使える Somersloop の総数。既定 0（＝ Somersloop を使わない従来どおりの解）。
   *
   * 1 以上にすると、Somersloop 対応の建物のレシピに「フル装着バリアント」の
   * 変数が増える（産出2倍・消費据え置き・電力は倍率^指数）。
   * Σ(バリアントの稼働台数 × その建物のスロット数) <= この値 を制約に張る。
   * 部分装着（フル未満）は扱わない（README「Somersloop の扱い」参照）。
   */
  somersloops?: number
  /**
   * 発電計画。未指定なら発電機を LP に入れない（従来と完全に同じ解）。
   * 発電機のクロックは100%固定（オーバークロックは初期スコープ外・README 参照）。
   */
  power?: PowerPlanInput
  /** 目的関数の重み。省略した項は既定値 */
  weights?: Partial<ObjectiveWeights>
  /** 原料の相対コスト。既定 'scarcity'（DEFAULT_RESOURCE_WEIGHT_SPEC） */
  resourceWeights?: ResourceWeightSpec
  /**
   * 退化した循環（正味ゼロでぐるぐる回るだけの解）を潰すための微小コスト。
   * 全レシピ変数に一律で掛かる。既定 1e-6
   */
  epsilon?: number
  /** これ未満の値は 0 とみなす。既定 1e-7 */
  tolerance?: number
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

export type ItemRate = {
  item: string
  ratePerMin: number
}

export type PowerRangeMW = {
  minMW: number
  maxMW: number
}

export type SolutionStep = {
  recipeId: string
  recipeName: LocalizedName
  /** Building.id */
  buildingId: string
  buildingName: LocalizedName
  /** 稼働台数（小数）。クロック100%換算 */
  machineCount: number
  /**
   * 実際に建てる台数 = ceil(machineCount / SolveInput.maxClock)。
   * 既定（maxClock=1）では ceil(machineCount) と同じ。
   */
  builtCount: number
  /**
   * builtCount 台で回すときのクロック（= machineCount / builtCount）。
   * 必ず maxClock 以下。0 台なら 0。
   */
  clockSpeed: number
  /** このステップに必要なパワーシャードの総数（クロック100%以下なら 0） */
  powerShards: number
  /**
   * 使用する Somersloop の総数（0 = 未使用）。
   * フル装着バリアントのステップだけが正の値を持ち、
   * `建てる台数 × その建物のスロット数` になる。
   */
  somersloops: number
  /** 消費電力(MW)。**クロック100%換算**（LP の目的関数と同じ基準）。可変電力は中央値 */
  powerMW: number
  /** 可変電力レシピのみ。固定電力のレシピでは undefined */
  powerRangeMW?: PowerRangeMW
  /** クロックと Somersloop を適用した実消費電力(MW)。画面と Excel はこちらを出す */
  clockedPowerMW: number
  /** 可変電力レシピのみ: クロック適用後の電力レンジ */
  clockedPowerRangeMW?: PowerRangeMW
  /** 建てる台数ぶんの設置面積(m²)。通路係数は掛けていない */
  footprintAreaM2: number
  inputs: ItemRate[]
  outputs: ItemRate[]
  /**
   * 発電機のステップだけ入る発電量(MW)（稼働台数ぶんの合計）。
   * 製造レシピのステップでは undefined。`powerMW` は**消費**電力なので発電機では 0。
   */
  powerProductionMW?: number
  /** 発電機のステップだけ入る燃料の Item.id（同じ発電機でも燃料ごとに行を分ける） */
  fuelItem?: string
}

export type RawResourceUsage = {
  item: string
  ratePerMin: number
  /** 適用された上限（null = 無制限） */
  limitPerMin: number | null
  /** 上限に対する使用率（0〜1）。無制限なら null */
  usageRatio: number | null
}

export type ItemBalance = {
  item: string
  /** レシピによる産出合計 */
  producedPerMin: number
  /** レシピによる消費合計 */
  consumedPerMin: number
  /** 外部からの投入（原料 + inputs） */
  suppliedPerMin: number
  /** 産出 + 投入 - 消費 */
  netPerMin: number
}

export type TargetResult = {
  item: string
  requestedPerMin: number
  producedPerMin: number
  /**
   * 産出最大化モードで最大化したアイテムか。
   * true のとき requestedPerMin は「達成できた最大レート」（＝ producedPerMin）を指す。
   */
  maximized?: boolean
}

/** SolveInput.inputs で持ち込んだアイテムの供給量と、そのうち実際に使われた量。 */
export type ExternalInputUsage = ItemRate & {
  /** 使えるものとして指定した量（SolveInput.inputs の値） */
  availablePerMin: number
}

/**
 * 発電計画の集計（`SolveInput.power` を有効にしたときだけ Solution に入る）。
 * 発電機の内訳そのものは `Solution.steps` の中に（`powerProductionMW` を持つ行として）並ぶ。
 */
export type PowerGenerationSummary = {
  /** 指定した目標発電量(MW)。0 = 指定なし */
  targetMW: number
  /** 「工場の消費電力ぶんを賄う」を有効にしたか */
  coverFactoryPower: boolean
  /** 総発電量(MW)。稼働台数ベース（＝ LP が決めた値。建てる台数の切り上げ分は含まない） */
  totalMW: number
  /** 建てる発電機の台数合計（各ステップを切り上げ） */
  totalGeneratorCount: number
  /** 発電機の稼働台数合計（小数） */
  totalGeneratorMachineCount: number
  /** 発電機が消費する燃料（アイテム別の合計・多い順）。補助資源の水は含まない */
  fuelUsage: ItemRate[]
  /**
   * 発電で賄う対象の消費電力(MW)。製造建物のみ・クロック100%換算
   * （＝ `Solution.totalPowerMW`。採掘設備の電力は LP の外なので含まない）。
   */
  factoryPowerMW: number
  /** `totalMW - factoryPowerMW`。0 以上なら製造ぶんは自給できている */
  netMW: number
}

export type Solution = {
  status: 'optimal'
  steps: SolutionStep[]
  rawResources: RawResourceUsage[]
  /**
   * SolveInput.inputs で持ち込んだアイテム。ratePerMin は実際に使われた分で、
   * availablePerMin が指定量。**使われなかった（0 の）行も残す**
   * （「入れたのに使われていない」ことが分かるようにするため）。
   */
  externalInputs: ExternalInputUsage[]
  /** 目標産出ではないが余っているアイテム（原料・持ち込み分の余りは含まない） */
  byproducts: ItemRate[]
  targets: TargetResult[]
  itemBalance: ItemBalance[]
  /** 総消費電力(MW)。**クロック100%換算**（LP の目的関数と同じ基準） */
  totalPowerMW: number
  totalPowerRangeMW: PowerRangeMW
  /** クロックと Somersloop を適用した総消費電力(MW)。画面の主表示はこちら */
  totalClockedPowerMW: number
  totalClockedPowerRangeMW: PowerRangeMW
  /** 稼働台数の合計（小数） */
  totalMachineCount: number
  /** 実際に建てる台数の合計（各ステップを切り上げ） */
  totalBuildingCount: number
  /** 建設コスト合計（台数は切り上げで計算） */
  totalBuildCost: ItemAmount[]
  /** 適用した製造クロック上限（SolveInput.maxClock。既定 1） */
  maxClock: number
  /** 必要なパワーシャードの総数 */
  totalPowerShards: number
  /** 使用する Somersloop の総数 */
  totalSomersloops: number
  /** 使用可能な Somersloop 数（SolveInput.somersloops。0 = 使わない設定） */
  somersloopLimit: number
  /** 製造建物の設置面積の合計(m²)。通路係数は掛けていない */
  totalFootprintAreaM2: number
  /** 副産物をすべてシンクに流した場合の獲得ポイント（毎分） */
  sinkPointsPerMin: number
  /** 目的関数値（重み次第で意味が変わるのでデバッグ用） */
  objectiveValue: number
  /**
   * 産出最大化モードのときだけ入る。最大化したアイテムと、その達成レート。
   * 通常のレート指定だけの解では undefined。
   */
  maximizedOutput?: ItemRate
  /**
   * 発電計画を有効にしたときだけ入る（`SolveInput.power`）。
   * 発電機を LP に入れていない従来どおりの解では undefined。
   */
  powerGeneration?: PowerGenerationSummary
}

export type InfeasibleReason =
  | {
      kind: 'unproducibleItem'
      item: string
      message: string
    }
  | {
      kind: 'resourceLimit'
      item: string
      limitPerMin: number
      requiredPerMin: number
      shortfallPerMin: number
      message: string
    }
  | {
      kind: 'unbounded'
      /** 最大化しようとしたアイテム（産出最大化モードのとき） */
      item?: string
      message: string
      /** この原因に固有の対処。未指定なら UI 側の既定文を使う */
      advice?: string
    }
  | {
      kind: 'solverError'
      message: string
    }

export type InfeasibleResult = {
  status: 'infeasible'
  reasons: InfeasibleReason[]
  /** 日本語の要約メッセージ（UI にそのまま出せる） */
  message: string
}

export type SolveResult = Solution | InfeasibleResult
