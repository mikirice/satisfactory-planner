/**
 * アイテム / 建物のアイコン画像の解決。
 *
 * 画像は public/icons/<ClassName>.png に**完全に隔離**してある（入手元と撤去手順は
 * public/icons/SOURCES.md）。ゲームアセットなので権利者の要請があればフォルダごと消す
 * 前提で、**消えても画面が壊れないこと**をここで保証する:
 *
 *   - 一覧（src/data/icons.json）に無いIDは `null` → 呼び出し側はテキストだけ描く
 *   - 一覧にあるのにファイルが消えている場合は `<img>` の onError で個別に消える
 *     （ItemIcon.tsx）
 *
 * 参照しているのはこのファイルと ItemIcon.tsx だけ。
 */
import iconIds from '../data/icons.json'

/** アイコン画像を持つ ID（scripts/fetch-icons.ts が実ファイルから生成）。 */
const ICON_IDS: ReadonlySet<string> = new Set(iconIds as string[])

/**
 * アイテム / 建物ではないが画面で**記号として**使うアイコン
 * （scripts/fetch-icons.ts の EXTRA_ICONS と同じ ID を並べること）。
 *
 * icons.json は「アイテム/建物の一覧と一致していること」を担保しているので、
 * ここに混ぜずに別集合として持つ。画像が消えれば `<img>` の onError で個別に消える。
 */
const EXTRA_ICON_IDS: ReadonlySet<string> = new Set(['Desc_HardDrive_C'])

/** 代替レシピの目印に使うハードドライブのアイコンID。 */
export const HARD_DRIVE_ICON_ID = 'Desc_HardDrive_C'

/**
 * 公開ディレクトリの基準URL。GitHub Pages のようなサブパス配信でも壊れないように
 * Vite の BASE_URL を使う（テスト・SSR 環境で未定義でも '/' に落とす）。
 */
function baseUrl(): string {
  const base = import.meta.env?.BASE_URL
  if (typeof base !== 'string' || base === '') return '/'
  return base.endsWith('/') ? base : `${base}/`
}

/** アイコンを持つIDか（icons.json の一覧＝アイテム/建物のみ）。 */
export const hasIcon = (id: string): boolean => ICON_IDS.has(id)

/** アイテム/建物IDのアイコンURL。無ければ null（＝テキスト表示にフォールバック）。 */
export function iconPath(id: string): string | null {
  return ICON_IDS.has(id) || EXTRA_ICON_IDS.has(id) ? `${baseUrl()}icons/${id}.png` : null
}

/** 収録数（テスト・デバッグ用）。icons.json 由来の件数だけを数える。 */
export const iconCount = (): number => ICON_IDS.size
