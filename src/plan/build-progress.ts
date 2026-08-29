/**
 * 建設チェックリストの進捗（計画書「建設チェックリスト（建設モード）」§4）。
 *
 * 保存先は localStorage。キーは**計画スナップショットの決定的ハッシュ**なので、
 * 同じ計画（保存プラン・共有URL経由を含む）を開き直せば続きから消し込める。
 * 計画を変えればキーが変わり、進捗はまっさらになる。
 *
 * ただしハッシュに入れるのは「解に効く入力」だけ（planProgressHash）。プラン名の変更や
 * ベルト等級の表示設定で消し込みが飛ぶのは事故なので、そこは除外する。
 *
 * 進捗は端末ローカル。共有URLには載せない（他人に自分の建設状況は渡らない）。
 *
 * localStorage は「無い / 使えない / 中身が壊れている」ことが普通にある
 * （プライベートモード、容量超過、手で書き換えられた値）。読み書きは必ず握り潰し、
 * 壊れていれば**空の進捗**として扱う。ここが原因で画面が落ちてはいけない。
 */

import type { PlanSnapshot } from './serialize.ts'

/** 保存キーの接頭辞（他機能の保存と衝突させないための名前空間）。 */
export const BUILD_PROGRESS_KEY_PREFIX = 'satisfactory-planner:build-progress:'

/** 項目ID → 建てた台数。 */
export type BuildProgress = Readonly<Record<string, number>>

export const EMPTY_BUILD_PROGRESS: BuildProgress = {}

/**
 * 文字列の決定的ハッシュ（djb2 の 32bit 版）。
 *
 * 用途は「同じ計画かどうか」の目印だけなので暗号強度は要らない。依存を増やさず、
 * どの環境でも同じ値が出ることだけを満たす。
 */
export function planHash(encoded: string): string {
  let hash = 5381
  for (let index = 0; index < encoded.length; index += 1) {
    hash = (hash * 33) ^ encoded.charCodeAt(index)
  }
  // 符号なし32bitへ寄せてから36進数（短く・URLにもログにも出せる文字だけ）
  return (hash >>> 0).toString(36)
}

/**
 * 進捗キーの計算から外す「表示だけの入力」。
 *
 * ここに挙げたキーは**解にも建設リストの中身にも影響しない**ので、変えても進捗は続く。
 *   n … プラン名（名前を付け直しただけで消し込みが消えるのは事故）
 *   b / p … ベルト・パイプの選択。搬送等級の見せ方（フローチャート・Excel・物流表）にしか
 *           使わず、建設リストの項目はレートから最小等級を自前で選ぶ（build-list.ts）。
 *           store も「解に影響しないので再計算しない」扱い（planner.ts の setBeltId / setPipeId）
 *
 * 逆に目標レート・代替レシピ・クロック・発電計画などを変えたらキーは変わり、進捗はまっさらになる。
 */
export const PROGRESS_IGNORED_SNAPSHOT_KEYS: readonly (keyof PlanSnapshot)[] = ['n', 'b', 'p']

/**
 * キー順に依存しない決定的な文字列化。
 *
 * スナップショットは省略可能なキーが多く、作られ方によって並びが変わりうる。
 * 並びでキーが変わると進捗が消えるので、オブジェクトはキーを並べ替えてから畳む。
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
  return `{${entries.join(',')}}`
}

/**
 * 進捗の保存キーになる計画ハッシュ。
 *
 * 「解に効く入力」だけを見る（PROGRESS_IGNORED_SNAPSHOT_KEYS を除いた全部）。
 * プラン名を変えただけ・ベルトの表示等級を変えただけなら、同じキーのまま続きから消し込める。
 *
 * 保存キーの形式（接頭辞 + ハッシュ）は変えていない。除外キーを増やした結果、
 * 以前のキーで書かれた進捗は参照されなくなる（孤児になるだけで実害はない）。
 */
export function planProgressHash(snapshot: PlanSnapshot): string {
  const relevant: Record<string, unknown> = { ...snapshot }
  for (const key of PROGRESS_IGNORED_SNAPSHOT_KEYS) delete relevant[key]
  return planHash(stableStringify(relevant))
}

/** 進捗の保存キー。 */
export const buildProgressKey = (hash: string): string => `${BUILD_PROGRESS_KEY_PREFIX}${hash}`

function storage(): Storage | null {
  try {
    const candidate = globalThis.localStorage as Storage | undefined
    // Node 25 は空オブジェクトの localStorage をグローバルに置くことがある（tests/locale.test.tsx 参照）
    if (candidate === undefined || typeof candidate.getItem !== 'function') return null
    return candidate
  } catch {
    return null
  }
}

/** 保存値の検証。数でない・負・非有限・整数でない値は落とす（壊れた値は無かったことにする）。 */
function sanitize(raw: unknown): BuildProgress {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return EMPTY_BUILD_PROGRESS
  const out: Record<string, number> = {}
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue
    out[id] = Math.floor(value)
  }
  return out
}

/** 進捗を読む。無い・壊れている・localStorage が使えないときは空。 */
export function loadBuildProgress(hash: string): BuildProgress {
  const store = storage()
  if (store === null) return EMPTY_BUILD_PROGRESS
  try {
    const raw = store.getItem(buildProgressKey(hash))
    if (raw === null) return EMPTY_BUILD_PROGRESS
    return sanitize(JSON.parse(raw))
  } catch {
    return EMPTY_BUILD_PROGRESS
  }
}

/** 進捗を書く。0台の項目は書かない（キーを増やさない）。書けなくても作業は続けられる。 */
export function saveBuildProgress(hash: string, progress: BuildProgress): void {
  const store = storage()
  if (store === null) return
  const trimmed = sanitize(progress)
  try {
    if (Object.keys(trimmed).length === 0) {
      store.removeItem(buildProgressKey(hash))
      return
    }
    store.setItem(buildProgressKey(hash), JSON.stringify(trimmed))
  } catch {
    /* 容量超過・プライベートモードなど。保存できないだけで画面は動く */
  }
}

/** その計画の進捗を消す（「進捗をリセット」）。 */
export function clearBuildProgress(hash: string): void {
  const store = storage()
  if (store === null) return
  try {
    store.removeItem(buildProgressKey(hash))
  } catch {
    /* 消せなくても画面上の進捗は空に戻す */
  }
}
