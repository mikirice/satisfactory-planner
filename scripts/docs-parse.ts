/**
 * Docs.json の低レベルパース処理。
 * build-data.ts から使い、単体テスト（tests/docs-parse.test.ts）でも直接検証する。
 */

export type DocsClass = Record<string, string>
export type DocsGroup = { NativeClass: string; Classes: DocsClass[] }

/**
 * BOM / NUL バイトの並びからエンコーディングを判定して文字列化する。
 * Docs.json はバージョンによって UTF-16LE だったり UTF-8 だったりするため自動判定が必要。
 */
export function decodeDocs(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.subarray(2).toString('utf16le')
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    // UTF-16BE: バイトを入れ替えて LE として読む
    const swapped = Buffer.from(buf.subarray(2))
    swapped.swap16()
    return swapped.toString('utf16le')
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8')
  }
  // BOM なし: 先頭付近に NUL が混ざっていれば UTF-16LE とみなす
  const probe = buf.subarray(0, Math.min(buf.length, 64))
  if (probe.includes(0x00)) {
    return buf.toString('utf16le')
  }
  return buf.toString('utf8')
}

/** "/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'" → "FGRecipe" */
export function shortNativeClass(nativeClass: string): string {
  const m = /FactoryGame\.(FG\w+)/.exec(nativeClass)
  return m ? m[1] : nativeClass
}

/**
 * Unreal の ItemAmount 配列をパースする。
 * 例: ((ItemClass="...Desc_IronIngot.Desc_IronIngot_C'",Amount=3),(...))
 * Amount の直前に現れる ClassName トークンを拾う方式にして、
 * ItemClass のパス表記のバージョン差を吸収する。
 */
export function parseItemAmounts(raw: string | undefined): { classNameId: string; amount: number }[] {
  if (!raw) return []
  const out: { classNameId: string; amount: number }[] = []
  // (?<![A-Za-z0-9_]) でトークン先頭を固定する。これが無いと
  // "Build_ConstructorMk1" のような語からも "Build_C" を拾ってしまう。
  const re = /(?<![A-Za-z0-9_])([A-Za-z0-9_]+_C)['"\s]*,\s*Amount\s*=\s*(-?\d+(?:\.\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    out.push({ classNameId: m[1], amount: Number.parseFloat(m[2]) })
  }
  return out
}

/**
 * mProducedIn からビルド可能クラス名の候補を取り出す。
 * 例: ("/Game/.../Build_ConstructorMk1.Build_ConstructorMk1_C","/Script/FactoryGame.FGBuildableAutomatedWorkBench")
 */
export function parseProducedIn(raw: string | undefined): string[] {
  if (!raw) return []
  const out: string[] = []
  // 前後を非単語文字で挟んだ完全なトークンだけを拾う（"Build_ConstructorMk1" から
  // "Build_C" を誤検出しないため）。重複は除去する。
  const re = /(?<![A-Za-z0-9_])([A-Za-z0-9_]+_C)(?![A-Za-z0-9_])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) out.push(m[1])
  return [...new Set(out)]
}

// ---------------------------------------------------------------------------
// 建設クリアランス（mClearanceData）
// ---------------------------------------------------------------------------

/** 軸平行の直方体（Unreal 単位 = cm）。 */
export type ClearanceBox = {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

/**
 * mClearanceData をパースして、外形の軸平行バウンディングボックス（cm）を返す。
 *
 * 例:
 *   ((ClearanceBox=(Min=(X=-400,Y=-500,Z=0),Max=(X=400,Y=500,Z=600),IsValid=True)),
 *    (Type=CT_Soft,ClearanceBox=(...),RelativeTransform=(Translation=(...),Rotation=(...))))
 *
 * 除外するもの（意図的）:
 * - `Type=CT_Soft` … コンベア接続などの「柔らかい」クリアランス。建物の外形ではない
 * - `ExcludeForSnapping=True` … スナップ対象外の補助クリアランス（アームの可動域など）
 *
 * RelativeTransform の Translation と Rotation（クォータニオン）は箱の8頂点に適用してから
 * 和を取る。スケールは Docs 上 1 固定なので無視する。
 */
export function parseClearanceBounds(raw: string | undefined): ClearanceBox | null {
  if (!raw) return null
  let min = { x: Infinity, y: Infinity, z: Infinity }
  let max = { x: -Infinity, y: -Infinity, z: -Infinity }
  let found = false

  for (const entry of splitTopLevelGroups(raw)) {
    if (/Type=CT_Soft/.test(entry)) continue
    if (/ExcludeForSnapping=True/.test(entry)) continue
    const box = /ClearanceBox=\(Min=\(([^)]*)\),Max=\(([^)]*)\)/.exec(entry)
    if (!box) continue
    const lo = parseVector(box[1])
    const hi = parseVector(box[2])
    if (!lo || !hi) continue

    const translation = parseVector(/Translation=\(([^)]*)\)/.exec(entry)?.[1]) ?? {
      x: 0,
      y: 0,
      z: 0,
    }
    const rotation = parseQuaternion(entry)

    for (const x of [lo.x, hi.x]) {
      for (const y of [lo.y, hi.y]) {
        for (const z of [lo.z, hi.z]) {
          const r = rotateByQuaternion(rotation, { x, y, z })
          const p = { x: r.x + translation.x, y: r.y + translation.y, z: r.z + translation.z }
          min = { x: Math.min(min.x, p.x), y: Math.min(min.y, p.y), z: Math.min(min.z, p.z) }
          max = { x: Math.max(max.x, p.x), y: Math.max(max.y, p.y), z: Math.max(max.z, p.z) }
          found = true
        }
      }
    }
  }

  return found ? { min, max } : null
}

/** "(a),(b(c))" → ["(a)", "(b(c))"]（最外の括弧を1枚剥がしてから分割）。 */
function splitTopLevelGroups(raw: string): string[] {
  const inner = raw.trim().replace(/^\(/, '').replace(/\)$/, '')
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '(') {
      if (depth === 0) start = i
      depth += 1
    } else if (inner[i] === ')') {
      depth -= 1
      if (depth === 0) out.push(inner.slice(start, i + 1))
    }
  }
  return out
}

function parseVector(raw: string | undefined): { x: number; y: number; z: number } | null {
  if (!raw) return null
  const m = /X=(-?[\d.eE+-]+),Y=(-?[\d.eE+-]+),Z=(-?[\d.eE+-]+)/.exec(raw)
  return m
    ? { x: Number.parseFloat(m[1]), y: Number.parseFloat(m[2]), z: Number.parseFloat(m[3]) }
    : null
}

function parseQuaternion(entry: string): { x: number; y: number; z: number; w: number } {
  const m = /Rotation=\(X=(-?[\d.eE+-]+),Y=(-?[\d.eE+-]+),Z=(-?[\d.eE+-]+),W=(-?[\d.eE+-]+)\)/.exec(
    entry,
  )
  if (!m) return { x: 0, y: 0, z: 0, w: 1 }
  return {
    x: Number.parseFloat(m[1]),
    y: Number.parseFloat(m[2]),
    z: Number.parseFloat(m[3]),
    w: Number.parseFloat(m[4]),
  }
}

/** v' = v + 2·q.xyz × (q.xyz × v + q.w·v) （クォータニオンによる回転）。 */
function rotateByQuaternion(
  q: { x: number; y: number; z: number; w: number },
  v: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  const tx = 2 * (q.y * v.z - q.z * v.y)
  const ty = 2 * (q.z * v.x - q.x * v.z)
  const tz = 2 * (q.x * v.y - q.y * v.x)
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  }
}

/** 文字列フィールドを数値化する。空文字・非数値は fallback。 */
export function num(value: string | undefined, fallback = 0): number {
  if (value === undefined || value === '') return fallback
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}
