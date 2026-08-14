/**
 * 静的アイテムページ（/items/{slug}/）の slug と URL。
 *
 * 生成側（scripts/build-pages.ts）と画面側（表のアイテム名リンク）で必ず同じ実装を使う。
 * 二重実装すると「リンクだけ404」という壊れ方をするので、slug の正典はこのファイルだけにする。
 */
import { items } from '../data/index.ts'

/** Item.id から永続的なASCII slugを作る。BP系は衝突回避のため接頭辞を残す。 */
export function itemSlug(itemId: string): string {
  const slug = itemId
    .replace(/^Desc_/, '')
    .replace(/_C$/, '')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`item slug could not be generated: ${itemId}`)
  }
  return slug
}

const itemSlugEntries = items.map((item) => [item.id, itemSlug(item.id)] as const)
if (new Set(itemSlugEntries.map(([, slug]) => slug)).size !== items.length) {
  throw new Error('item slug collision detected')
}

export const itemSlugById: ReadonlyMap<string, string> = new Map(itemSlugEntries)

/**
 * アイテムページのパス。ページを持たないID（建物や未収録ID）は null を返し、
 * 呼び出し側はリンクを作らずに名前だけを出す。
 *
 * 静的ページは今のところ日本語版だけなので、表示言語に関わらず同じパスを返す。
 * Stage 3 で /en/items/... のミラーを生成したら、ここでロケール分岐する。
 */
export function itemPagePath(itemId: string): string | null {
  const slug = itemSlugById.get(itemId)
  return slug === undefined ? null : `/items/${slug}/`
}
