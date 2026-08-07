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

/** 文字列フィールドを数値化する。空文字・非数値は fallback。 */
export function num(value: string | undefined, fallback = 0): number {
  if (value === undefined || value === '') return fallback
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}
