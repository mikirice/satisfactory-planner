/**
 * ソルバー非依存の線形計画モデル表現と、CPLEX LP フォーマットへの書き出し。
 *
 * バックエンドを差し替えられるように、モデルの組み立て（model.ts）と
 * 解く処理（glpk-backend.ts）をこの型で分離している。
 * writeLpFormat は本番の解法経路では使わないが、
 * 「同じ問題を外部のソルバーに食わせて突き合わせる」ためのデバッグ出力として残している
 * （docs/bench/solver-bench.ts が実際に使っている）。
 */

export type LpDirection = 'min' | 'max'

export type LpVariable = {
  /** モデル内で一意なキー。LPファイル上の名前は書き出し時に v0, v1 … へ機械的に置換する。 */
  key: string
  /** 目的関数の係数。0 のときは目的関数に現れない。 */
  objective: number
  /** 下限。既定 0 */
  lower?: number
  /** 上限。既定 +∞ */
  upper?: number
}

/**
 * 制約 lower <= Σ coef·x <= upper。
 * lower のみ → `>=`、upper のみ → `<=`、両方同値 → `=`。
 */
export type LpConstraint = {
  key: string
  coefficients: Map<string, number>
  lower?: number
  upper?: number
}

export type LpModel = {
  direction: LpDirection
  variables: LpVariable[]
  constraints: LpConstraint[]
}

export type LpStatus = 'optimal' | 'infeasible' | 'unbounded' | 'error'

export type LpResult = {
  status: LpStatus
  objectiveValue: number
  /** 変数キー → 値。infeasible のときは空。 */
  values: ReadonlyMap<string, number>
  /** バックエンドが返した生のステータス文字列（デバッグ用） */
  rawStatus: string
}

export type LpBackend = {
  name: string
  solve(model: LpModel): Promise<LpResult>
}

/** LP フォーマットに埋め込める数値表現。指数表記も HiGHS のリーダーが解釈できる。 */
function fmt(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`non-finite coefficient: ${n}`)
  // 往復可能な最短表現。1e-7 のような指数表記もそのまま使える。
  return String(n)
}

function term(coef: number, name: string, first: boolean): string {
  const abs = Math.abs(coef)
  const magnitude = abs === 1 ? '' : `${fmt(abs)} `
  if (coef < 0) return `- ${magnitude}${name}`
  return first ? `${magnitude}${name}` : `+ ${magnitude}${name}`
}

/**
 * LpModel を CPLEX LP フォーマット文字列に変換する。
 *
 * 変数名は元のキー（`x:Recipe_Alternate_Plastic_1_C` 等）をそのまま使わず
 * `v0, v1, …` に振り直す。LP フォーマットに使えない文字（`:` など）や、
 * 先頭が数字/`e` の名前による解釈ゆれを完全に避けるため。
 * 呼び出し側は返り値の nameByKey で元のキーに戻す。
 */
export function writeLpFormat(model: LpModel): { text: string; nameByKey: Map<string, string> } {
  if (model.variables.length === 0) throw new Error('cannot write an LP with no variables')
  const nameByKey = new Map<string, string>()
  model.variables.forEach((v, i) => {
    if (nameByKey.has(v.key)) throw new Error(`duplicate variable key: ${v.key}`)
    nameByKey.set(v.key, `v${i}`)
  })

  const lines: string[] = []
  lines.push(model.direction === 'min' ? 'Minimize' : 'Maximize')

  const objTerms: string[] = []
  for (const v of model.variables) {
    if (v.objective === 0) continue
    objTerms.push(term(v.objective, nameByKey.get(v.key)!, objTerms.length === 0))
  }
  // 目的関数が空だと LP リーダーが警告を出すので 0 係数のダミーを置く
  const firstName = nameByKey.get(model.variables[0].key)!
  lines.push(` obj: ${objTerms.length > 0 ? objTerms.join(' ') : `0 ${firstName}`}`)

  lines.push('Subject To')
  // 制約名も LP フォーマット安全な機械的な名前にする（元のキーは c.key で追える）
  model.constraints.forEach((c, i) => {
    const parts: string[] = []
    for (const [key, coef] of c.coefficients) {
      if (coef === 0) continue
      const name = nameByKey.get(key)
      if (!name) throw new Error(`constraint ${c.key} references unknown variable ${key}`)
      parts.push(term(coef, name, parts.length === 0))
    }
    if (parts.length === 0) return
    const body = parts.join(' ')
    const hasLower = c.lower !== undefined && Number.isFinite(c.lower)
    const hasUpper = c.upper !== undefined && Number.isFinite(c.upper)
    if (hasLower && hasUpper && c.lower === c.upper) {
      lines.push(` c${i}: ${body} = ${fmt(c.lower!)}`)
    } else {
      if (hasLower) lines.push(` c${i}l: ${body} >= ${fmt(c.lower!)}`)
      if (hasUpper) lines.push(` c${i}u: ${body} <= ${fmt(c.upper!)}`)
    }
  })

  const bounds: string[] = []
  for (const v of model.variables) {
    const name = nameByKey.get(v.key)!
    const lower = v.lower ?? 0
    const upper = v.upper ?? Number.POSITIVE_INFINITY
    if (lower === 0 && !Number.isFinite(upper)) continue // LP の既定
    if (!Number.isFinite(lower) && !Number.isFinite(upper)) {
      bounds.push(` ${name} free`)
    } else if (!Number.isFinite(upper)) {
      bounds.push(` ${name} >= ${fmt(lower)}`)
    } else if (lower === 0) {
      bounds.push(` ${name} <= ${fmt(upper)}`)
    } else {
      bounds.push(` ${fmt(lower)} <= ${name} <= ${fmt(upper)}`)
    }
  }
  if (bounds.length > 0) {
    lines.push('Bounds')
    lines.push(...bounds)
  }

  lines.push('End')
  return { text: lines.join('\n'), nameByKey }
}
