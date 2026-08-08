/**
 * 保存・共有と store をつなぐ層。
 *
 * - 起動時: URLハッシュ（共有リンク）> 自動保存 の優先順で復元する
 * - 作業中: 入力が変わったらデバウンスして自動保存する（解は保存しない）
 *
 * store の外に置いてあるのは、保存の都合で store の形を汚さないため。
 */
import { usePlanner } from '../store/planner.ts'
import type { PlannerState } from '../store/planner.ts'
import { decodePlan, parsePlanSnapshot, readPlanParam, toPlanSnapshot } from './serialize.ts'
import type { PlanSnapshot } from './serialize.ts'
import { planStorage } from './storage.ts'

/** 自動保存のデバウンス。連打しても書き込みは1回にする。 */
export const AUTOSAVE_DEBOUNCE_MS = 800

export type RestoreSource = 'url' | 'autosave' | 'none'

export type RestoreResult = {
  source: RestoreSource
  warnings: string[]
  /** 拒否したとき（壊れたデータ・未知バージョン）の理由 */
  error: string | null
}

/** 現在の store の入力から保存形式を作る。 */
export function currentSnapshot(state: PlannerState = usePlanner.getState()): PlanSnapshot {
  return toPlanSnapshot(state)
}

/**
 * 起動時の復元。
 * URLハッシュがあればそれを優先し、無ければ自動保存を読む。
 * どちらも壊れていれば何も適用しない（＝デフォルト状態のまま）。
 */
export async function restoreInitialPlan(hash?: string): Promise<RestoreResult> {
  const rawHash = hash ?? (typeof location === 'undefined' ? '' : location.hash)
  const encoded = readPlanParam(rawHash)
  if (encoded !== null) {
    const parsed = decodePlan(encoded)
    if (parsed.ok) {
      usePlanner.getState().applyPlan(parsed.input)
      return { source: 'url', warnings: parsed.warnings, error: null }
    }
    return { source: 'none', warnings: [], error: parsed.error }
  }

  let stored: PlanSnapshot | null = null
  try {
    stored = await planStorage().getAutosave()
  } catch {
    // IndexedDB が使えない環境（プライベートモード等）は黙って諦める
    return { source: 'none', warnings: [], error: null }
  }
  if (stored === null) return { source: 'none', warnings: [], error: null }

  // 保存済みオブジェクトも URL 経由と同じ規則で検証する（古い形式は拒否）
  const parsed = parsePlanSnapshot(stored)
  if (!parsed.ok) return { source: 'none', warnings: [], error: parsed.error }
  usePlanner.getState().applyPlan(parsed.input)
  return { source: 'autosave', warnings: parsed.warnings, error: null }
}

/** 現在の入力をすぐ自動保存に書く（共有URLを開いた直後など）。 */
export async function saveAutosaveNow(): Promise<void> {
  try {
    await planStorage().putAutosave(currentSnapshot())
  } catch {
    /* 保存できなくても作業は続けられる */
  }
}

/**
 * 入力の自動保存を開始する。戻り値で停止できる。
 * 入力に関係ない変化（status / result / 経過時間）では書き込まない。
 */
export function startAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastJson = JSON.stringify(currentSnapshot())

  const flush = (): void => {
    timer = undefined
    const snapshot = currentSnapshot()
    const json = JSON.stringify(snapshot)
    if (json === lastJson) return
    lastJson = json
    void planStorage()
      .putAutosave(snapshot)
      .catch(() => {
        /* 保存できなくても作業は続けられるので握りつぶす */
      })
  }

  const unsubscribe = usePlanner.subscribe(() => {
    const json = JSON.stringify(currentSnapshot())
    if (json === lastJson) return // 解の更新など入力以外の変化
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS)
  })

  return () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    unsubscribe()
  }
}

/** 共有リンクを開いた状態（ハッシュ）を読み直して適用する。hashchange 用。 */
export async function applyPlanFromHash(hash: string): Promise<RestoreResult> {
  const encoded = readPlanParam(hash)
  if (encoded === null) return { source: 'none', warnings: [], error: null }
  const parsed = decodePlan(encoded)
  if (!parsed.ok) return { source: 'none', warnings: [], error: parsed.error }
  usePlanner.getState().applyPlan(parsed.input)
  return { source: 'url', warnings: parsed.warnings, error: null }
}
