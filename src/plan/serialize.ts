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

import { belts, generatorsById, itemsById, pipes, recipesById } from '../data/index.ts'
import {
  CLOCK_MAX,
  EXTRACTION_CLOCK_CHOICES,
  MANUFACTURING_CLOCK_MIN,
} from '../data/constants.ts'
import { DEFAULT_MINER_ID, MINER_IDS } from '../solver/index.ts'
import type { InputEntry, ObjectivePresetId, TargetEntry, TargetMode } from '../store/planner.ts'

// ---------------------------------------------------------------------------
// クロック / Somersloop の既定値と丸め
// （store と共有する。ここに置くのは store → serialize の一方向依存にするため）
// ---------------------------------------------------------------------------

/** 製造クロック上限の既定（100%）。 */
export const DEFAULT_MAX_CLOCK = 1
/** 採掘クロックの既定（100%）。 */
export const DEFAULT_EXTRACTION_CLOCK = 1
/** 使える Somersloop 数の既定（0 = 使わない）。 */
export const DEFAULT_SOMERSLOOPS = 0
/** 目標発電量の既定（0 = 指定なし）。 */
export const DEFAULT_POWER_TARGET_MW = 0
/** 「工場の消費電力ぶんを賄う」の既定（オフ）。 */
export const DEFAULT_COVER_FACTORY_POWER = false

/** 製造クロック上限を UI で選べる範囲（10%〜250%）に丸める。 */
export function clampMaxClock(clock: number | undefined): number {
  if (clock === undefined || !Number.isFinite(clock)) return DEFAULT_MAX_CLOCK
  return Math.min(CLOCK_MAX, Math.max(MANUFACTURING_CLOCK_MIN, clock))
}

/** 採掘クロックを選択肢（100/150/200/250%）に丸める。外れた値は既定に戻す。 */
export function clampExtractionClock(clock: number | undefined): number {
  if (clock === undefined || !Number.isFinite(clock)) return DEFAULT_EXTRACTION_CLOCK
  return EXTRACTION_CLOCK_CHOICES.includes(clock) ? clock : DEFAULT_EXTRACTION_CLOCK
}

/** Somersloop 数を 0 以上の整数に丸める。 */
export function clampSomersloops(count: number | undefined): number {
  if (count === undefined || !Number.isFinite(count)) return DEFAULT_SOMERSLOOPS
  return Math.max(0, Math.floor(count))
}

/** 目標発電量(MW)を 0 以上の有限値に丸める。 */
export function clampPowerTargetMW(mw: number | undefined): number {
  if (mw === undefined || !Number.isFinite(mw)) return DEFAULT_POWER_TARGET_MW
  return Math.max(0, mw)
}

/**
 * スキーマ版。書き出しは常に最新版。
 * v1 … 初版
 * v2 … 産出最大化（x）と既保有アイテムの投入（i）を追加。どちらも省略可なので v1 も読める
 * v3 … 製造クロック上限（c）・採掘クロック（e）・Somersloop 数（s）を追加。
 *       いずれも既定値なら省略するので v1 / v2 もそのまま読める
 * v4 … 発電計画（g: 許可する発電機・w: 目標発電量MW・f: 工場消費を賄う）を追加。
 *       いずれも既定値（発電計画なし）なら省略するので v1〜v3 もそのまま読める
 */
export const PLAN_SCHEMA_VERSION = 4

/**
 * 読み込めるスキーマ版。**古い版は読めること**（保存済みプラン・共有URLが死なないように）。
 * 未知の新しい版は拒否する（知らないキーを黙って落とすと事故になるため）。
 */
export const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = [1, 2, 3, 4]

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
  /** maximize: 産出を最大化する itemId（v2〜。指定なしなら省略） */
  x?: string
  /** inputs: 既保有アイテム [itemId, ratePerMin][]（v2〜。空なら省略） */
  i?: [string, number][]
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
  /** 製造クロック上限（1 = 100%）。v3〜。既定 1 なら省略 */
  c?: number
  /** 採掘クロック（1 = 100%）。v3〜。既定 1 なら省略 */
  e?: number
  /** 使える Somersloop 数。v3〜。既定 0 なら省略 */
  s?: number
  /** 発電に許可した発電機の Building.id。v4〜。空なら省略 */
  g?: string[]
  /** 目標発電量(MW)。v4〜。既定 0 なら省略 */
  w?: number
  /** 工場の消費電力ぶんを賄うか。v4〜。既定 false なら省略 */
  f?: boolean
}

/** 復元して store に流し込む形（TargetEntry の key は store 側で採番する）。 */
export type PlanInput = {
  targets: { item: string; ratePerMin: number; mode?: TargetMode }[]
  inputs: { item: string; ratePerMin: number }[]
  enabledAlternates: Record<string, true>
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  minerId: string
  /** 製造クロック上限（1 = 100%） */
  maxClock: number
  /** 採掘クロック（1 = 100%） */
  extractionClock: number
  /** 使える Somersloop 数 */
  somersloops: number
  /** 発電に許可した発電機（Building.id） */
  enabledGenerators: Record<string, true>
  /** 目標発電量(MW) */
  powerTargetMW: number
  /** 工場の消費電力ぶんを賄うか */
  coverFactoryPower: boolean
  planName: string
  beltId: string
  pipeId: string
}

/** シリアライズ対象になる store の部分集合（store 全体に依存しないための型）。 */
export type PlanSource = {
  targets: TargetEntry[]
  /** 既保有アイテム（v1 のデータには無いので省略可。key は保存に使わない） */
  inputs?: readonly Omit<InputEntry, 'key'>[]
  enabledAlternates: Record<string, true>
  limitOverrides: Record<string, number | null>
  objective: ObjectivePresetId
  minerId: string
  /** 製造クロック上限（v2 以前のデータには無いので省略可。既定 1） */
  maxClock?: number
  /** 採掘クロック（省略時 1） */
  extractionClock?: number
  /** 使える Somersloop 数（省略時 0） */
  somersloops?: number
  /** 発電に許可した発電機（v3 以前のデータには無いので省略可） */
  enabledGenerators?: Record<string, true>
  /** 目標発電量(MW)（省略時 0） */
  powerTargetMW?: number
  /** 工場の消費電力ぶんを賄うか（省略時 false） */
  coverFactoryPower?: boolean
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
  const maximize = state.targets.find((t) => t.mode === 'max' && t.item !== '')?.item
  const inputs = (state.inputs ?? []).filter(
    (i) => i.item !== '' && Number.isFinite(i.ratePerMin),
  )
  const maxClock = clampMaxClock(state.maxClock ?? DEFAULT_MAX_CLOCK)
  const extractionClock = clampExtractionClock(state.extractionClock ?? DEFAULT_EXTRACTION_CLOCK)
  const somersloops = clampSomersloops(state.somersloops ?? DEFAULT_SOMERSLOOPS)
  const enabledGenerators = Object.keys(state.enabledGenerators ?? {}).sort()
  const powerTargetMW = clampPowerTargetMW(state.powerTargetMW ?? DEFAULT_POWER_TARGET_MW)
  const coverFactoryPower = state.coverFactoryPower ?? DEFAULT_COVER_FACTORY_POWER
  return {
    v: PLAN_SCHEMA_VERSION,
    n: state.planName,
    t: state.targets
      .filter((t) => t.item !== '' && Number.isFinite(t.ratePerMin))
      .map((t) => [t.item, t.ratePerMin]),
    // 既定（最大化なし・持ち込みなし）ならキーごと省略して共有URLを短く保つ
    ...(maximize === undefined ? {} : { x: maximize }),
    ...(inputs.length === 0
      ? {}
      : { i: inputs.map((i): [string, number] => [i.item, i.ratePerMin]) }),
    a: Object.keys(state.enabledAlternates).sort(),
    l: { ...state.limitOverrides },
    o: state.objective,
    m: state.minerId,
    b: state.beltId,
    p: state.pipeId,
    // 既定値のキーは省略して共有URLを短く保つ（v1/v2 と同じ長さで済む）
    ...(maxClock === DEFAULT_MAX_CLOCK ? {} : { c: maxClock }),
    ...(extractionClock === DEFAULT_EXTRACTION_CLOCK ? {} : { e: extractionClock }),
    ...(somersloops === DEFAULT_SOMERSLOOPS ? {} : { s: somersloops }),
    ...(enabledGenerators.length === 0 ? {} : { g: enabledGenerators }),
    ...(powerTargetMW === DEFAULT_POWER_TARGET_MW ? {} : { w: powerTargetMW }),
    ...(coverFactoryPower === DEFAULT_COVER_FACTORY_POWER ? {} : { f: coverFactoryPower }),
  }
}

/** 既定の入力（拒否したときに戻す状態）。 */
export function defaultPlanInput(): PlanInput {
  return {
    targets: [],
    inputs: [],
    enabledAlternates: {},
    limitOverrides: {},
    objective: DEFAULT_OBJECTIVE,
    minerId: DEFAULT_MINER_ID,
    maxClock: DEFAULT_MAX_CLOCK,
    extractionClock: DEFAULT_EXTRACTION_CLOCK,
    somersloops: DEFAULT_SOMERSLOOPS,
    enabledGenerators: {},
    powerTargetMW: DEFAULT_POWER_TARGET_MW,
    coverFactoryPower: DEFAULT_COVER_FACTORY_POWER,
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
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(raw.v)) {
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

  // 産出最大化（v2〜）。対象は目標一覧にある行でなければならない
  if (typeof raw.x === 'string' && raw.x !== '') {
    const row = input.targets.find((t) => t.item === raw.x)
    if (row === undefined) {
      warnings.push(`最大化の対象「${itemLabel(raw.x)}」が目標に無いので無視しました`)
    } else {
      row.mode = 'max'
    }
  } else if (raw.x !== undefined) {
    warnings.push('最大化の対象が不正なので無視しました')
  }

  // 既保有アイテム（v2〜）
  if (Array.isArray(raw.i)) {
    for (const entry of raw.i) {
      if (!Array.isArray(entry) || entry.length < 2) {
        warnings.push('読み取れない既保有アイテムの行を1件無視しました')
        continue
      }
      const [item, rate] = entry as [unknown, unknown]
      if (typeof item !== 'string' || !itemsById.has(item)) {
        warnings.push(`存在しないアイテム「${String(item)}」の既保有を無視しました`)
        continue
      }
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) {
        warnings.push(`${itemLabel(item)} の既保有レートが不正なので無視しました`)
        continue
      }
      const duplicate = input.inputs.find((i) => i.item === item)
      if (duplicate !== undefined) {
        duplicate.ratePerMin += rate
        warnings.push(`${itemLabel(item)} の既保有が重複していたので合算しました`)
        continue
      }
      input.inputs.push({ item, ratePerMin: rate })
    }
  } else if (raw.i !== undefined) {
    warnings.push('既保有アイテムのデータが不正なので無視しました')
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

  // --- クロック / Somersloop（v3〜。無ければ既定のまま） ---------------------
  if (raw.c !== undefined) {
    if (typeof raw.c === 'number' && Number.isFinite(raw.c) && raw.c > 0) {
      input.maxClock = clampMaxClock(raw.c)
    } else {
      warnings.push('製造クロック上限が不正なので既定（100%）に戻しました')
    }
  }
  if (raw.e !== undefined) {
    if (typeof raw.e === 'number' && EXTRACTION_CLOCK_CHOICES.includes(raw.e)) {
      input.extractionClock = raw.e
    } else {
      warnings.push('採掘クロックが不正なので既定（100%）に戻しました')
    }
  }
  if (raw.s !== undefined) {
    if (typeof raw.s === 'number' && Number.isFinite(raw.s) && raw.s >= 0) {
      input.somersloops = clampSomersloops(raw.s)
    } else {
      warnings.push('Somersloop の数が不正なので 0 に戻しました')
    }
  }

  // --- 発電計画（v4〜。無ければ既定＝発電計画なしのまま） ---------------------
  if (Array.isArray(raw.g)) {
    for (const id of raw.g) {
      if (typeof id !== 'string') continue
      if (!generatorsById.has(id)) {
        warnings.push(`存在しない発電機「${id}」を無視しました`)
        continue
      }
      input.enabledGenerators[id] = true
    }
  } else if (raw.g !== undefined) {
    warnings.push('発電機のデータが不正なので無視しました')
  }
  if (raw.w !== undefined) {
    if (typeof raw.w === 'number' && Number.isFinite(raw.w) && raw.w >= 0) {
      input.powerTargetMW = clampPowerTargetMW(raw.w)
    } else {
      warnings.push('目標発電量が不正なので 0 に戻しました')
    }
  }
  if (raw.f !== undefined) {
    if (typeof raw.f === 'boolean') input.coverFactoryPower = raw.f
    else warnings.push('発電計画の設定が不正なので既定に戻しました')
  }

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
