/**
 * プラン（入力状態）のシリアライズと URL 共有。
 *
 * 保存するのは「入力」だけで、解（Solution）は保存しない。ソルバーは数十msなので
 * 読み込み時に解き直したほうが、ゲームデータ更新後も常に正しい結果になる。
 *
 * JSON のキーは1文字にしてある。URL ハッシュに載せるので短いほうがよく、
 * 意味は PlanSnapshot 型のコメントで担保する。
 *
 * 壊れたデータ・未知バージョンは「拒否」（呼び出し側はデフォルト状態のまま）。
 * ゲームデータ更新で消えたアイテム/レシピIDは「無視して警告」にする。
 * 前者はデータ全体が信用できないが、後者は残りが十分使えるため。
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

import { belts, itemsById, pipes, recipesById } from '../data/index.ts'
import { DEFAULT_MINER_ID, MINER_IDS } from '../solver/index.ts'
import type { ObjectivePresetId, TargetEntry } from '../store/planner.ts'

/** スキーマ版。互換を壊す変更をしたら上げる（読み込み側は一致のみ受け入れる）。 */
export const PLAN_SCHEMA_VERSION = 1

/** URL ハッシュのパラメータ名（`#plan=...`） */
export const PLAN_HASH_PARAM = 'plan'

/** 保存形式。キーは短縮名。 */
export type PlanSnapshot = {
  /** schema version */
  v: number
  /** plan name */
  n: string
  /** targets: [itemId, ratePerMin][] */
  t: [string, number][]
  /** enabled alternate recipe ids */
  a: string[]
  /** resource limit overrides（null = 無制限） */
  l: Record<string, number | null>
  /** objective preset id */
  o: string
  /** miner id */
  m: string
  /** belt id */
  b: string
  /** pipe id */
  p: string
}

/** 復元して store に流し込む形（TargetEntry の key は store 側で採番する）。 */
export type PlanInput = {
  targets: { item: string; ratePerMin: number }[]
  enabledAlternates: Record<string, true>
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  minerId: string
  planName: string
  beltId: string
  pipeId: string
}

/** シリアライズ対象になる store の部分集合（store 全体に依存しないための型）。 */
export type PlanSource = {
  targets: TargetEntry[]
  enabledAlternates: Record<string, true>
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  minerId: string
  planName: string
  beltId: string
  pipeId: string
}

export type PlanParseResult =
  | { ok: true; input: PlanInput; warnings: string[] }
  | { ok: false; error: string }

const OBJECTIVE_IDS: readonly string[] = ['resources', 'power', 'buildings']
const DEFAULT_OBJECTIVE: ObjectivePresetId = 'resources'
const DEFAULT_BELT_ID = belts.at(-1)!.id
const DEFAULT_PIPE_ID = pipes.at(-1)!.id

const beltIds = new Set(belts.map((b) => b.id))
const pipeIds = new Set(pipes.map((p) => p.id))
const minerIds = new Set<string>(MINER_IDS)

/** 現在の入力から保存形式を作る。 */
export function toPlanSnapshot(state: PlanSource): PlanSnapshot {
  return {
    v: PLAN_SCHEMA_VERSION,
    n: state.planName,
    t: state.targets
      .filter((t) => t.item !== '' && Number.isFinite(t.ratePerMin))
      .map((t) => [t.item, t.ratePerMin]),
    a: Object.keys(state.enabledAlternates).sort(),
    l: { ...state.limitOverrides },
    o: state.objective,
    m: state.minerId,
    b: state.beltId,
    p: state.pipeId,
  }
}

/** 既定の入力（拒否したときに戻す状態）。 */
export function defaultPlanInput(): PlanInput {
  return {
    targets: [],
    enabledAlternates: {},
    limitOverrides: {},
    objective: DEFAULT_OBJECTIVE,
    minerId: DEFAULT_MINER_ID,
    planName: '',
    beltId: DEFAULT_BELT_ID,
    pipeId: DEFAULT_PIPE_ID,
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const itemLabel = (id: string): string => itemsById.get(id)?.name.ja ?? id

/**
 * 保存形式を検証して復元する。
 * 形が壊れている / 未知バージョンなら ok:false（呼び出し側はデフォルトのまま）。
 */
export function parsePlanSnapshot(raw: unknown): PlanParseResult {
  if (!isRecord(raw)) return { ok: false, error: 'プランのデータ形式が不正です' }
  if (typeof raw.v !== 'number' || !Number.isInteger(raw.v)) {
    return { ok: false, error: 'プランのバージョンがありません' }
  }
  if (raw.v !== PLAN_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `対応していないプランのバージョンです（v${raw.v} / 対応 v${PLAN_SCHEMA_VERSION}）`,
    }
  }
  if (!Array.isArray(raw.t)) return { ok: false, error: '目標産出のデータが不正です' }
  if (!Array.isArray(raw.a)) return { ok: false, error: '代替レシピのデータが不正です' }
  if (!isRecord(raw.l)) return { ok: false, error: '原料上限のデータが不正です' }

  const warnings: string[] = []
  const input = defaultPlanInput()

  input.planName = typeof raw.n === 'string' ? raw.n.slice(0, 120) : ''

  for (const entry of raw.t) {
    if (!Array.isArray(entry) || entry.length < 2) {
      warnings.push('読み取れない目標産出の行を1件無視しました')
      continue
    }
    const [item, rate] = entry as [unknown, unknown]
    if (typeof item !== 'string' || !itemsById.has(item)) {
      warnings.push(`存在しないアイテム「${String(item)}」の目標を無視しました`)
      continue
    }
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) {
      warnings.push(`${itemLabel(item)} のレートが不正なので無視しました`)
      continue
    }
    // 目標産出は1アイテム1行。古いデータや手書きの重複はレートを合算してまとめる
    const duplicate = input.targets.find((t) => t.item === item)
    if (duplicate !== undefined) {
      duplicate.ratePerMin += rate
      warnings.push(`${itemLabel(item)} の目標が重複していたので合算しました`)
      continue
    }
    input.targets.push({ item, ratePerMin: rate })
  }

  for (const id of raw.a) {
    if (typeof id !== 'string') continue
    const recipe = recipesById.get(id)
    if (recipe === undefined || !recipe.isAlternate) {
      warnings.push(`存在しない代替レシピ「${id}」を無視しました`)
      continue
    }
    input.enabledAlternates[id] = true
  }

  for (const [item, limit] of Object.entries(raw.l)) {
    if (!itemsById.has(item)) {
      warnings.push(`存在しない原料「${item}」の上限を無視しました`)
      continue
    }
    if (limit === null) {
      input.limitOverrides[item] = null
      continue
    }
    if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 0) {
      warnings.push(`${itemLabel(item)} の上限が不正なので無視しました`)
      continue
    }
    input.limitOverrides[item] = limit
  }

  if (typeof raw.o === 'string' && OBJECTIVE_IDS.includes(raw.o)) {
    input.objective = raw.o as ObjectivePresetId
  } else if (raw.o !== undefined) {
    warnings.push('目的関数が不明だったので既定に戻しました')
  }

  if (typeof raw.m === 'string' && minerIds.has(raw.m)) input.minerId = raw.m
  else if (raw.m !== undefined) warnings.push('採掘機が不明だったので既定に戻しました')

  if (typeof raw.b === 'string' && beltIds.has(raw.b)) input.beltId = raw.b
  else if (raw.b !== undefined) warnings.push('ベルトが不明だったので既定に戻しました')

  if (typeof raw.p === 'string' && pipeIds.has(raw.p)) input.pipeId = raw.p
  else if (raw.p !== undefined) warnings.push('パイプが不明だったので既定に戻しました')

  return { ok: true, input, warnings }
}

/** 保存形式 → URL ハッシュに載せる文字列（lz-string 圧縮）。 */
export function encodePlan(snapshot: PlanSnapshot): string {
  return compressToEncodedURIComponent(JSON.stringify(snapshot))
}

/** URL ハッシュの文字列 → 復元。伸長・JSON 解析の失敗も拒否として扱う。 */
export function decodePlan(encoded: string): PlanParseResult {
  if (encoded === '') return { ok: false, error: '共有データが空です' }
  let json: string | null
  try {
    json = decompressFromEncodedURIComponent(encoded)
  } catch {
    json = null
  }
  if (json === null || json === '') return { ok: false, error: '共有データを展開できませんでした' }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: '共有データが壊れています' }
  }
  return parsePlanSnapshot(raw)
}

/**
 * `#plan=xxx` からエンコード済み文字列を取り出す。
 * 他のハッシュ（`#foo=1&plan=xxx`）が混ざっても拾えるようにしてある。
 *
 * URLSearchParams は使えない。lz-string の URI-safe 文字集合には `+` が含まれ、
 * URLSearchParams はそれを空白に変換してしまうため（伸長に失敗する）。
 */
export function readPlanParam(hash: string): string | null {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  if (body === '') return null
  for (const part of body.split('&')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq) !== PLAN_HASH_PARAM) continue
    const value = part.slice(eq + 1)
    if (value === '') return null
    // 一部のクライアントが %XX に再エンコードする場合だけ戻す
    if (!value.includes('%')) return value
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  return null
}

/**
 * URL から plan パラメータだけを取り除く。
 * 共有URLで開いたあとアドレスバーを掃除するために使う。ハッシュを残したままだと
 * 「共有プランを開いて編集 → リロード」で自動保存より古い共有内容に戻ってしまう。
 */
export function stripPlanParam(href: string): string {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) return href
  const base = href.slice(0, hashIndex)
  const rest = href
    .slice(hashIndex + 1)
    .split('&')
    .filter((part) => part !== '' && part.split('=')[0] !== PLAN_HASH_PARAM)
  return rest.length === 0 ? base : `${base}#${rest.join('&')}`
}

/** 共有URLを組み立てる（既存のクエリ・パスは保つ）。 */
export function buildShareUrl(baseHref: string, snapshot: PlanSnapshot): string {
  const encoded = encodePlan(snapshot)
  const hashIndex = baseHref.indexOf('#')
  const base = hashIndex === -1 ? baseHref : baseHref.slice(0, hashIndex)
  return `${base}#${PLAN_HASH_PARAM}=${encoded}`
}
