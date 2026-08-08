/**
 * 画面の状態（入力・解）を持つストア。
 *
 * 入力が変わるたびに 200ms のデバウンスで解き直す。ソルバーは1ms級なので
 * 「入力→即結果」で問題ない（docs/solver-benchmark.md）。解は非同期に返るので
 * 実行IDで古い結果を捨てる。
 */
import { create } from 'zustand'

import { belts, generators, pipes, recipes } from '../data/index.ts'
import type { Generator } from '../data/types.ts'
import { DEFAULT_RESOURCE_LIMITS } from '../data/map-limits.ts'
import type { ExcelExportInput } from '../export/excel.ts'
// クロック / Somersloop の既定値と丸めは保存形式と共有する（store → serialize の一方向）
import {
  DEFAULT_COVER_FACTORY_POWER,
  DEFAULT_EXTRACTION_CLOCK,
  DEFAULT_MAX_CLOCK,
  DEFAULT_POWER_TARGET_MW,
  DEFAULT_SOMERSLOOPS,
  clampExtractionClock,
  clampMaxClock,
  clampPowerTargetMW,
  clampSomersloops,
} from '../plan/serialize.ts'
import type { PlanInput } from '../plan/serialize.ts'
import {
  DEFAULT_MINER_ID,
  planExtraction,
  solveProduction,
} from '../solver/index.ts'
import type {
  ExtractionPlan,
  ObjectiveWeights,
  SolveInput,
  SolveResult,
} from '../solver/index.ts'

/**
 * 目標産出の1行の指定方法。
 * - `'rate'`（既定）… ratePerMin ちょうどを目標にする
 * - `'max'`          … 産出を最大化する。**同時に1行だけ**（原料上限が実質の制約になる）
 */
export type TargetMode = 'rate' | 'max'

/**
 * 目標産出の1行。1アイテム1行（同じアイテムを2行に分けても解は変わらず、
 * 「追加したのに何も起きない」ように見えるだけなので重複は作らせない）。
 * key は行の同一性（アイテムを入れ替えても入力欄が作り直されないように）。
 */
export type TargetEntry = {
  key: string
  item: string
  ratePerMin: number
  /** 省略時は 'rate'。最大化中も ratePerMin は保持する（切り戻したとき元に戻る） */
  mode?: TargetMode
}

/**
 * 既に手元にある / 別工場から供給されるアイテムの1行。
 * 目標産出と同じく1アイテム1行。ソルバーにはコスト0の外部供給として渡る。
 */
export type InputEntry = {
  key: string
  item: string
  ratePerMin: number
}

export type ObjectivePresetId = 'resources' | 'power' | 'buildings'

export type ObjectivePreset = {
  id: ObjectivePresetId
  label: string
  hint: string
  weights: Partial<ObjectiveWeights>
}

/**
 * 目的関数のプリセット。
 * 単位が違う項の加重和なので、係数は「主目的を1、副目的をタイブレーク程度」に置く。
 * 資源項を完全に0にすると「無限に資源を使う解」が選ばれうるので常に残す。
 */
export const OBJECTIVE_PRESETS: readonly ObjectivePreset[] = [
  {
    id: 'resources',
    label: '資源効率',
    hint: '希少な資源ほど高コストとして扱い、原料の消費を最小化する',
    weights: { resources: 1, power: 0, buildings: 0 },
  },
  {
    id: 'power',
    label: '電力最小',
    hint: '総消費電力を主目的にする（資源はタイブレークとして少し効かせる）',
    weights: { resources: 0.01, power: 1, buildings: 0 },
  },
  {
    id: 'buildings',
    label: '建物最小（近似）',
    hint: '稼働台数の合計を主目的にする。連続変数なので厳密には稼働率の合計',
    weights: { resources: 0.01, power: 0, buildings: 1 },
  },
]

export const objectivePresetById = new Map(OBJECTIVE_PRESETS.map((p) => [p.id, p]))

/**
 * 発電計画で選べる発電機（発電量の小さい順）。
 * 石炭発電機 / 燃料式発電機 / 原子力発電所の3種（generators.json）。
 */
export const powerGenerators = [...generators].sort(
  (a, b) => a.powerProductionMW - b.powerProductionMW || a.id.localeCompare(b.id),
)

/**
 * その発電機で使ってよい燃料の Item.id。
 * `enabledFuels` にキーが無い発電機は**全燃料許可**（既定。従来と同じ挙動）。
 */
export function allowedFuelItems(
  generator: Generator,
  enabledFuels: Record<string, Record<string, true>>,
): string[] {
  const selection = enabledFuels[generator.id]
  if (selection === undefined) return generator.fuels.map((f) => f.item)
  return generator.fuels.filter((f) => selection[f.item] === true).map((f) => f.item)
}

/** 代替レシピの一覧（日本語名の五十音順）。 */
export const alternateRecipes = recipes
  .filter((r) => r.isAlternate)
  .sort((a, b) => a.name.ja.localeCompare(b.name.ja, 'ja'))

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

export type SolveStatus = 'idle' | 'solving' | 'done' | 'error'

export type PlannerState = {
  targets: TargetEntry[]
  /** 既に持っているアイテム（コスト0で投入できる） */
  inputs: InputEntry[]
  /** 有効にした代替レシピID */
  enabledAlternates: Record<string, true>
  /** 原料上限の上書き（未指定の原料はマップ上限のまま）。null = 無制限 */
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  /** 固体ノードに置く採掘機 */
  minerId: string
  /**
   * 製造建物のクロック上限（1 = 100%）。LP は変わらず、建てる台数と電力の後処理が変わる。
   */
  maxClock: number
  /** 採掘設備のクロック（1 = 100%）。EXTRACTION_CLOCK_CHOICES から選ぶ */
  extractionClock: number
  /** 使える Somersloop の総数。0 = 使わない */
  somersloops: number
  /**
   * 発電に使ってよい発電機（Building.id）。既定は空 = 発電計画なし（従来と同じ挙動）。
   */
  enabledGenerators: Record<string, true>
  /**
   * 発電方式ごとに使ってよい燃料（Building.id → 燃料 Item.id の集合）。
   * **キーが無い発電機は全燃料許可**（既定・従来と同じ挙動）。空オブジェクトは
   * 「燃料を1つも選んでいない」＝その方式を使わない、という意味。
   */
  enabledFuels: Record<string, Record<string, true>>
  /** 目標発電量(MW)。0 = 指定なし */
  powerTargetMW: number
  /** 工場（製造建物）の消費電力ぶんを発電で賄うか */
  coverFactoryPower: boolean
  /** Excel のファイル名に使うプラン名。空なら 'plan' */
  planName: string
  /** 物流の本数換算に使うベルト（Belt.id） */
  beltId: string
  /** 物流の本数換算に使うパイプ（Pipe.id） */
  pipeId: string

  status: SolveStatus
  result: SolveResult | null
  extraction: ExtractionPlan | null
  /** 例外（不正な入力など）のメッセージ */
  error: string | null
  /** 直近の求解にかかった時間(ms) */
  elapsedMs: number

  /**
   * 目標産出を1行追加する。追加済みのアイテムなら行は増やさず既存行の key を返す
   * （UI はその行のレート入力へフォーカスを移す）。
   */
  addTarget: (item: string, ratePerMin?: number) => string
  updateTarget: (key: string, patch: Partial<Omit<TargetEntry, 'key'>>) => void
  removeTarget: (key: string) => void
  /**
   * 目標行の指定方法を切り替える。
   * 'max' にできるのは1行だけなので、他の行は 'rate' に戻す。
   */
  setTargetMode: (key: string, mode: TargetMode) => void
  /** 既保有アイテムを1行追加する（追加済みなら既存行の key を返す）。 */
  addInput: (item: string, ratePerMin?: number) => string
  updateInput: (key: string, patch: Partial<Omit<InputEntry, 'key'>>) => void
  removeInput: (key: string) => void
  setAlternate: (recipeId: string, enabled: boolean) => void
  setAllAlternates: (enabled: boolean) => void
  setLimitOverride: (item: string, limit: number | null | undefined) => void
  resetLimits: () => void
  setObjective: (id: ObjectivePresetId) => void
  setMinerId: (id: string) => void
  /** 製造クロック上限（1 = 100%）。有効範囲に丸めて反映する */
  setMaxClock: (clock: number) => void
  /** 採掘クロック（1 = 100%） */
  setExtractionClock: (clock: number) => void
  /** 使える Somersloop 数（負数・非数は 0 に丸める） */
  setSomersloops: (count: number) => void
  /** 発電方式の許可を切り替える（Building.id） */
  setGenerator: (generatorId: string, enabled: boolean) => void
  /** その発電方式で使う燃料の1つを切り替える（全部オンなら記録を消して既定に戻す） */
  setGeneratorFuel: (generatorId: string, fuelItem: string, enabled: boolean) => void
  /** 目標発電量(MW)。負数・非数は 0 に丸める */
  setPowerTargetMW: (mw: number) => void
  /** 「工場の消費電力ぶんを賄う」の切り替え */
  setCoverFactoryPower: (cover: boolean) => void
  setPlanName: (name: string) => void
  setBeltId: (id: string) => void
  setPipeId: (id: string) => void
  /** 保存/共有から復元した入力をまとめて反映する（解は保存しないので解き直す） */
  applyPlan: (input: PlanInput) => void
  /** 即時に解き直す（デバウンスなし。テストや初期化用） */
  recompute: () => Promise<void>
}

const DEBOUNCE_MS = 200
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let runId = 0
let keySeq = 0

const nextKey = (): string => `t${++keySeq}`

/**
 * 復元した目標産出を1アイテム1行に正規化する。
 * UI からは重複を作れないが、共有URL・保存プランには古いデータや手書きの
 * データが入りうる。後勝ちで捨てるとレートを取りこぼすので合算してまとめる。
 * 最大化の指定も1行だけに絞る（先に出てきたものを採用）。
 */
function mergeTargetEntries(
  entries: readonly { item: string; ratePerMin: number; mode?: TargetMode }[],
): TargetEntry[] {
  const byItem = new Map<string, TargetEntry>()
  let maxTaken = false
  for (const t of entries) {
    const mode: TargetMode = t.mode === 'max' && !maxTaken ? 'max' : 'rate'
    if (mode === 'max') maxTaken = true
    const found = byItem.get(t.item)
    if (found === undefined) {
      byItem.set(t.item, { key: nextKey(), item: t.item, ratePerMin: t.ratePerMin, mode })
    } else {
      found.ratePerMin += t.ratePerMin
      if (mode === 'max') found.mode = 'max'
    }
  }
  return [...byItem.values()]
}

/** 既保有アイテムも1アイテム1行に正規化する（重複はレートを合算）。 */
function mergeInputEntries(entries: readonly { item: string; ratePerMin: number }[]): InputEntry[] {
  const byItem = new Map<string, InputEntry>()
  for (const i of entries) {
    const found = byItem.get(i.item)
    if (found === undefined) byItem.set(i.item, { key: nextKey(), item: i.item, ratePerMin: i.ratePerMin })
    else found.ratePerMin += i.ratePerMin
  }
  return [...byItem.values()]
}

/** 現在の入力から SolveInput を組み立てる（テストから検証できるよう export）。 */
/**
 * 発電計画が実際に LP を動かす状態か。
 * 「燃料を1つ以上使える発電機」が1つ以上許可され、かつ目標発電量か自給のどちらかが
 * 指定されているとき。（solver 側の `resolvePowerPlan().active` と同じ判定。
 * 画面の「解くかどうか」に使う）
 */
export function isPowerPlanActive(state: {
  enabledGenerators: Record<string, true>
  /** 省略時は全燃料許可（＝発電方式が選ばれていれば有効） */
  enabledFuels?: Record<string, Record<string, true>>
  powerTargetMW: number
  coverFactoryPower: boolean
}): boolean {
  const enabledFuels = state.enabledFuels ?? {}
  const usable = powerGenerators.some(
    (g) =>
      state.enabledGenerators[g.id] === true && allowedFuelItems(g, enabledFuels).length > 0,
  )
  return usable && (state.powerTargetMW > 0 || state.coverFactoryPower)
}

export function toSolveInput(state: PlannerState): SolveInput {
  const preset = objectivePresetById.get(state.objective) ?? OBJECTIVE_PRESETS[0]
  // 燃料を絞っている方式だけ渡す。1つも絞っていなければキーごと省略して、
  // ソルバー側を「従来と同じ入力」のまま通す（回帰の担保）。
  const fuels: Record<string, string[]> = {}
  for (const generator of powerGenerators) {
    if (state.enabledGenerators[generator.id] !== true) continue
    if (state.enabledFuels[generator.id] === undefined) continue
    fuels[generator.id] = allowedFuelItems(generator, state.enabledFuels)
  }
  const maximize = state.targets.find((t) => t.mode === 'max' && t.item)?.item
  const inputs: Record<string, number> = {}
  for (const i of state.inputs) {
    if (!i.item || !(i.ratePerMin > 0)) continue
    inputs[i.item] = (inputs[i.item] ?? 0) + i.ratePerMin
  }
  return {
    targets: state.targets
      .filter((t) => t.item && t.ratePerMin > 0 && t.mode !== 'max')
      .map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
    ...(maximize === undefined ? {} : { maximize }),
    enabledRecipes: [...baseRecipeIds, ...Object.keys(state.enabledAlternates)],
    resourceLimits: state.limitOverrides,
    inputs,
    weights: preset.weights,
    maxClock: state.maxClock,
    somersloops: state.somersloops,
    power: {
      generators: Object.keys(state.enabledGenerators),
      ...(Object.keys(fuels).length === 0 ? {} : { fuels }),
      targetMW: state.powerTargetMW,
      coverFactoryPower: state.coverFactoryPower,
    },
  }
}

/** 既定の搬送手段は最速の Mk（本数が最小になるので初見で驚かない）。 */
export const DEFAULT_BELT_ID = belts.at(-1)!.id
export const DEFAULT_PIPE_ID = pipes.at(-1)!.id

/**
 * 現在の状態から Excel 出力の入力を組み立てる。
 * 最適解が出ていないときは null（＝ダウンロードさせない）。
 */
export function toExcelInput(state: PlannerState): ExcelExportInput | null {
  if (state.result?.status !== 'optimal') return null
  return {
    solution: state.result,
    extraction: state.extraction,
    planName: state.planName,
    beltId: state.beltId,
    pipeId: state.pipeId,
    objectiveLabel: objectivePresetById.get(state.objective)?.label,
    enabledAlternateIds: Object.keys(state.enabledAlternates),
    minerId: state.minerId,
  }
}

export const usePlanner = create<PlannerState>((set, get) => {
  /** 入力を変えたときの共通処理: 反映してデバウンス再計算 */
  const change = (patch: Partial<PlannerState>): void => {
    set({ ...patch, status: 'solving' })
    if (debounceTimer !== undefined) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      void get().recompute()
    }, DEBOUNCE_MS)
  }

  return {
    targets: [],
    inputs: [],
    enabledAlternates: {},
    limitOverrides: {},
    objective: 'resources',
    minerId: DEFAULT_MINER_ID,
    maxClock: DEFAULT_MAX_CLOCK,
    extractionClock: DEFAULT_EXTRACTION_CLOCK,
    somersloops: DEFAULT_SOMERSLOOPS,
    enabledGenerators: {},
    enabledFuels: {},
    powerTargetMW: DEFAULT_POWER_TARGET_MW,
    coverFactoryPower: DEFAULT_COVER_FACTORY_POWER,
    planName: '',
    beltId: DEFAULT_BELT_ID,
    pipeId: DEFAULT_PIPE_ID,

    status: 'idle',
    result: null,
    extraction: null,
    error: null,
    elapsedMs: 0,

    addTarget: (item, ratePerMin = 60) => {
      // 二重追加は行を増やさない（既存行を返して、そこを直してもらう）
      const existing = get().targets.find((t) => t.item === item)
      if (existing !== undefined) return existing.key
      const key = nextKey()
      change({ targets: [...get().targets, { key, item, ratePerMin }] })
      return key
    },

    updateTarget: (key, patch) =>
      change({
        targets: get().targets.map((t) => (t.key === key ? { ...t, ...patch } : t)),
      }),

    removeTarget: (key) => change({ targets: get().targets.filter((t) => t.key !== key) }),

    setTargetMode: (key, mode) =>
      change({
        targets: get().targets.map((t) =>
          // 最大化は同時に1つだけ。他の行は自動でレート指定に戻す
          t.key === key ? { ...t, mode } : mode === 'max' ? { ...t, mode: 'rate' } : t,
        ),
      }),

    addInput: (item, ratePerMin = 60) => {
      const existing = get().inputs.find((i) => i.item === item)
      if (existing !== undefined) return existing.key
      const key = nextKey()
      change({ inputs: [...get().inputs, { key, item, ratePerMin }] })
      return key
    },

    updateInput: (key, patch) =>
      change({ inputs: get().inputs.map((i) => (i.key === key ? { ...i, ...patch } : i)) }),

    removeInput: (key) => change({ inputs: get().inputs.filter((i) => i.key !== key) }),

    setAlternate: (recipeId, enabled) => {
      const next = { ...get().enabledAlternates }
      if (enabled) next[recipeId] = true
      else delete next[recipeId]
      change({ enabledAlternates: next })
    },

    setAllAlternates: (enabled) =>
      change({
        enabledAlternates: enabled
          ? Object.fromEntries(alternateRecipes.map((r) => [r.id, true as const]))
          : {},
      }),

    setLimitOverride: (item, limit) => {
      const next = { ...get().limitOverrides }
      if (limit === undefined) delete next[item]
      else next[item] = limit
      change({ limitOverrides: next })
    },

    resetLimits: () => change({ limitOverrides: {} }),

    setObjective: (id) => change({ objective: id }),

    setMinerId: (id) => change({ minerId: id }),

    setMaxClock: (clock) => change({ maxClock: clampMaxClock(clock) }),

    setExtractionClock: (clock) => change({ extractionClock: clampExtractionClock(clock) }),

    setSomersloops: (count) => change({ somersloops: clampSomersloops(count) }),

    setGenerator: (generatorId, enabled) => {
      const next = { ...get().enabledGenerators }
      if (enabled) next[generatorId] = true
      else delete next[generatorId]
      change({ enabledGenerators: next })
    },

    setGeneratorFuel: (generatorId, fuelItem, enabled) => {
      const generator = powerGenerators.find((g) => g.id === generatorId)
      if (generator === undefined) return
      // 「キーが無い = 全燃料許可」なので、外すときはいったん全燃料を書き出してから落とす
      const current = new Set(allowedFuelItems(generator, get().enabledFuels))
      if (enabled) current.add(fuelItem)
      else current.delete(fuelItem)
      const next = { ...get().enabledFuels }
      if (current.size === generator.fuels.length) {
        // 全部オンなら記録を消して既定（全燃料許可）に戻す。共有URLを短く保つため
        delete next[generatorId]
      } else {
        next[generatorId] = Object.fromEntries([...current].map((item) => [item, true as const]))
      }
      change({ enabledFuels: next })
    },

    setPowerTargetMW: (mw) => change({ powerTargetMW: clampPowerTargetMW(mw) }),

    setCoverFactoryPower: (cover) => change({ coverFactoryPower: cover }),

    // プラン名・搬送手段は解に影響しないので再計算しない（set のまま）
    setPlanName: (name) => set({ planName: name }),
    setBeltId: (id) => set({ beltId: id }),
    setPipeId: (id) => set({ pipeId: id }),

    applyPlan: (input) =>
      change({
        targets: mergeTargetEntries(input.targets),
        inputs: mergeInputEntries(input.inputs ?? []),
        enabledAlternates: { ...input.enabledAlternates },
        limitOverrides: { ...input.limitOverrides },
        objective: input.objective,
        minerId: input.minerId,
        maxClock: clampMaxClock(input.maxClock),
        extractionClock: clampExtractionClock(input.extractionClock),
        somersloops: clampSomersloops(input.somersloops),
        enabledGenerators: { ...input.enabledGenerators },
        enabledFuels: Object.fromEntries(
          Object.entries(input.enabledFuels).map(([id, fuels]) => [id, { ...fuels }]),
        ),
        powerTargetMW: clampPowerTargetMW(input.powerTargetMW),
        coverFactoryPower: input.coverFactoryPower,
        planName: input.planName,
        beltId: input.beltId,
        pipeId: input.pipeId,
      }),

    recompute: async () => {
      const state = get()
      const input = toSolveInput(state)
      // 発電計画だけ（目標アイテムなし）でも解く価値がある: 目標電力から発電所を組む使い方
      if (
        input.targets.length === 0 &&
        input.maximize === undefined &&
        !isPowerPlanActive(state)
      ) {
        set({ status: 'idle', result: null, extraction: null, error: null, elapsedMs: 0 })
        return
      }
      const id = ++runId
      set({ status: 'solving', error: null })
      const startedAt = performance.now()
      try {
        const result = await solveProduction(input)
        if (id !== runId) return // 新しい入力が来ているので捨てる
        const extraction =
          result.status === 'optimal'
            ? planExtraction(result, {
                minerId: get().minerId,
                clock: get().extractionClock,
              })
            : null
        set({
          status: 'done',
          result,
          extraction,
          error: null,
          elapsedMs: performance.now() - startedAt,
        })
      } catch (e) {
        if (id !== runId) return
        set({
          status: 'error',
          result: null,
          extraction: null,
          error: e instanceof Error ? e.message : String(e),
          elapsedMs: 0,
        })
      }
    },
  }
})

/** 原料の既定上限（UI のプレースホルダ表示用）。 */
export const defaultResourceLimits = DEFAULT_RESOURCE_LIMITS
