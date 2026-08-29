/**
 * 建設チェックリストの進捗（計画書「建設チェックリスト（建設モード）」§4）。
 *
 * 保存先は localStorage。キーは**計画スナップショットの決定的ハッシュ**なので、
 * 同じ計画（保存プラン・共有URL経由を含む）を開き直せば続きから消し込める。
 * 計画を変えればキーが変わり、進捗はまっさらになる。
 *
 * 進捗は端末ローカル。共有URLには載せない（他人に自分の建設状況は渡らない）。
 *
 * localStorage は「無い / 使えない / 中身が壊れている」ことが普通にある
 * （プライベートモード、容量超過、手で書き換えられた値）。読み書きは必ず握り潰し、
 * 壊れていれば**空の進捗**として扱う。ここが原因で画面が落ちてはいけない。
 */

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
