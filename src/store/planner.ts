/**
 * 画面の状態（入力・解）を持つストア。
 *
 * 入力が変わるたびに 200ms のデバウンスで解き直す。ソルバーは1ms級なので
 * 「入力→即結果」で問題ない（docs/solver-benchmark.md）。解は非同期に返るので
 * 実行IDで古い結果を捨てる。
 */
import { create } from 'zustand'

import { recipes } from '../data/index.ts'
import { DEFAULT_RESOURCE_LIMITS } from '../data/map-limits.ts'
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

/** 目標産出の1行。key は行の同一性（同じアイテムを2行に出せるように） */
export type TargetEntry = {
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

/** 代替レシピの一覧（日本語名の五十音順）。 */
export const alternateRecipes = recipes
  .filter((r) => r.isAlternate)
  .sort((a, b) => a.name.ja.localeCompare(b.name.ja, 'ja'))

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

export type SolveStatus = 'idle' | 'solving' | 'done' | 'error'

export type PlannerState = {
  targets: TargetEntry[]
  /** 有効にした代替レシピID */
  enabledAlternates: Record<string, true>
  /** 原料上限の上書き（未指定の原料はマップ上限のまま）。null = 無制限 */
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  /** 固体ノードに置く採掘機 */
  minerId: string

  status: SolveStatus
  result: SolveResult | null
  extraction: ExtractionPlan | null
  /** 例外（不正な入力など）のメッセージ */
  error: string | null
  /** 直近の求解にかかった時間(ms) */
  elapsedMs: number

  addTarget: (item: string, ratePerMin?: number) => void
  updateTarget: (key: string, patch: Partial<Omit<TargetEntry, 'key'>>) => void
  removeTarget: (key: string) => void
  setAlternate: (recipeId: string, enabled: boolean) => void
  setAllAlternates: (enabled: boolean) => void
  setLimitOverride: (item: string, limit: number | null | undefined) => void
  resetLimits: () => void
  setObjective: (id: ObjectivePresetId) => void
  setMinerId: (id: string) => void
  /** 即時に解き直す（デバウンスなし。テストや初期化用） */
  recompute: () => Promise<void>
}

const DEBOUNCE_MS = 200
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let runId = 0
let keySeq = 0

const nextKey = (): string => `t${++keySeq}`

/** 現在の入力から SolveInput を組み立てる（テストから検証できるよう export）。 */
export function toSolveInput(state: PlannerState): SolveInput {
  const preset = objectivePresetById.get(state.objective) ?? OBJECTIVE_PRESETS[0]
  return {
    targets: state.targets
      .filter((t) => t.item && t.ratePerMin > 0)
      .map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
    enabledRecipes: [...baseRecipeIds, ...Object.keys(state.enabledAlternates)],
    resourceLimits: state.limitOverrides,
    weights: preset.weights,
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
    enabledAlternates: {},
    limitOverrides: {},
    objective: 'resources',
    minerId: DEFAULT_MINER_ID,

    status: 'idle',
    result: null,
    extraction: null,
    error: null,
    elapsedMs: 0,

    addTarget: (item, ratePerMin = 60) =>
      change({ targets: [...get().targets, { key: nextKey(), item, ratePerMin }] }),

    updateTarget: (key, patch) =>
      change({
        targets: get().targets.map((t) => (t.key === key ? { ...t, ...patch } : t)),
      }),

    removeTarget: (key) => change({ targets: get().targets.filter((t) => t.key !== key) }),

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

    recompute: async () => {
      const state = get()
      const input = toSolveInput(state)
      if (input.targets.length === 0) {
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
            ? planExtraction(result, { minerId: get().minerId })
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
