/**
 * glpk.js (GLPK 5.0 / WASM) バックエンド。
 * 選定の根拠は docs/solver-benchmark.md（highs-js との比較ベンチ）。
 *
 * glpk.js はエントリポイントが2つある:
 * - `glpk.js`      … ブラウザ用。wasm を埋め込んだ Web Worker で動く（solve は非同期）
 * - `glpk.js/node` … Node 用。同期 API（wasm を fs から読む）
 *
 * ここで両方を吸収し、上位（solve.ts）からは環境を意識せず await するだけにする。
 * ブラウザ用は Worker で動くので、重いプランを解いても UI スレッドが固まらない。
 */
import type { LpBackend, LpModel, LpResult, LpStatus } from './lp.ts'

/** glpk.js の LP 表現（dist/types.d.ts のうち使う部分だけ） */
type GlpkVarRef = { name: string; coef: number }
type GlpkBounds = { type: number; lb: number; ub: number }
type GlpkLp = {
  name: string
  objective: { direction: number; name: string; vars: GlpkVarRef[] }
  subjectTo: { name: string; vars: GlpkVarRef[]; bnds: GlpkBounds }[]
  bounds?: { name: string; type: number; lb: number; ub: number }[]
}
type GlpkResult = { result: { status: number; z: number; vars: Record<string, number> } }
type GlpkInstance = {
  GLP_MIN: number
  GLP_MAX: number
  GLP_FR: number
  GLP_LO: number
  GLP_UP: number
  GLP_DB: number
  GLP_FX: number
  GLP_MSG_OFF: number
  GLP_UNDEF: number
  GLP_FEAS: number
  GLP_INFEAS: number
  GLP_NOFEAS: number
  GLP_OPT: number
  GLP_UNBND: number
  version: string
  solve(lp: GlpkLp, options?: unknown): GlpkResult | Promise<GlpkResult>
  terminate?(cleanup?: boolean): void
}

const isNode =
  typeof globalThis.process !== 'undefined' &&
  globalThis.process.versions?.node !== undefined &&
  typeof (globalThis as { window?: unknown }).window === 'undefined'

let instance: Promise<GlpkInstance> | null = null

/** GLPK インスタンスを取得する（初回のみ wasm を初期化。以降は使い回す）。 */
export function loadGlpk(): Promise<GlpkInstance> {
  if (!instance) {
    instance = (async () => {
      if (isNode) {
        // 文字列を組み立てて Vite の静的解析を外す。
        // こうしないとブラウザ向けバンドルに Node 版（fs 依存）が混入する。
        const specifier = 'glpk.js/node'
        const mod = (await import(/* @vite-ignore */ specifier)) as {
          default: () => Promise<GlpkInstance>
        }
        return mod.default()
      }
      const mod = (await import('glpk.js')) as unknown as {
        default: () => Promise<GlpkInstance>
      }
      return mod.default()
    })()
    instance.catch(() => {
      instance = null
    })
  }
  return instance
}

/** ブラウザ版の Web Worker を止める（SPA のアンマウント時などに）。 */
export async function disposeGlpk(): Promise<void> {
  if (!instance) return
  const glpk = await instance.catch(() => null)
  glpk?.terminate?.()
  instance = null
}

function toStatus(glpk: GlpkInstance, status: number): LpStatus {
  if (status === glpk.GLP_OPT) return 'optimal'
  if (status === glpk.GLP_NOFEAS || status === glpk.GLP_INFEAS) return 'infeasible'
  if (status === glpk.GLP_UNBND) return 'unbounded'
  return 'error'
}

const isFinite_ = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v)

function boundsFor(glpk: GlpkInstance, lower: number | undefined, upper: number | undefined): GlpkBounds {
  const hasLower = isFinite_(lower)
  const hasUpper = isFinite_(upper)
  if (hasLower && hasUpper) {
    return lower === upper
      ? { type: glpk.GLP_FX, lb: lower, ub: upper }
      : { type: glpk.GLP_DB, lb: lower, ub: upper }
  }
  if (hasLower) return { type: glpk.GLP_LO, lb: lower, ub: 0 }
  if (hasUpper) return { type: glpk.GLP_UP, lb: 0, ub: upper }
  return { type: glpk.GLP_FR, lb: 0, ub: 0 }
}

function toGlpkLp(glpk: GlpkInstance, model: LpModel): GlpkLp {
  const objectiveVars: GlpkVarRef[] = []
  const bounds: GlpkLp['bounds'] = []
  const seen = new Set<string>()
  for (const v of model.variables) {
    if (seen.has(v.key)) throw new Error(`duplicate variable key: ${v.key}`)
    seen.add(v.key)
    if (v.objective !== 0) objectiveVars.push({ name: v.key, coef: v.objective })
    const lower = v.lower ?? 0
    const upper = v.upper ?? Number.POSITIVE_INFINITY
    // glpk.js の既定は lb=0 / ub=+∞ なので、それ以外だけ明示する
    if (lower !== 0 || Number.isFinite(upper)) {
      const b = boundsFor(glpk, lower, upper)
      bounds.push({ name: v.key, type: b.type, lb: b.lb, ub: b.ub })
    }
  }

  const subjectTo: GlpkLp['subjectTo'] = []
  for (const c of model.constraints) {
    const vars: GlpkVarRef[] = []
    for (const [name, coef] of c.coefficients) {
      if (coef === 0) continue
      if (!seen.has(name)) throw new Error(`constraint ${c.key} references unknown variable ${name}`)
      vars.push({ name, coef })
    }
    if (vars.length === 0) continue
    subjectTo.push({ name: c.key, vars, bnds: boundsFor(glpk, c.lower, c.upper) })
  }

  return {
    name: 'production',
    objective: {
      direction: model.direction === 'min' ? glpk.GLP_MIN : glpk.GLP_MAX,
      name: 'obj',
      vars: objectiveVars,
    },
    subjectTo,
    bounds,
  }
}

/**
 * LpModel を GLPK で解く。
 *
 * プリソルバ有りだと速いが、解けなかったときの状態が常に GLP_UNDEF になり
 * 「実行不能」と「非有界」を区別できない。最適解が出なかったときだけ
 * プリソルバ無しで解き直して正確なステータスを取る（遅い経路は失敗時のみ）。
 */
export async function solveWithGlpk(model: LpModel): Promise<LpResult> {
  const glpk = await loadGlpk()
  const lp = toGlpkLp(glpk, model)
  let solved = await glpk.solve(lp, { msglev: glpk.GLP_MSG_OFF, presol: true })
  if (solved.result.status !== glpk.GLP_OPT) {
    solved = await glpk.solve(lp, { msglev: glpk.GLP_MSG_OFF, presol: false })
  }
  const status = toStatus(glpk, solved.result.status)
  const values = new Map<string, number>()
  if (status === 'optimal') {
    for (const v of model.variables) values.set(v.key, solved.result.vars[v.key] ?? 0)
  }
  return { status, objectiveValue: solved.result.z, values, rawStatus: `GLP_${solved.result.status}` }
}

export const glpkBackend: LpBackend = {
  name: 'glpk.js',
  solve: solveWithGlpk,
}
