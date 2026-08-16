/**
 * 静的ページ（/items/{slug}/, /articles/{slug}/ と /en/ ミラー）の slug と URL。
 *
 * 生成側（scripts/build-pages.ts）と画面側（表のアイテム名リンク・フッター）で必ず同じ実装を使う。
 * 二重実装すると「リンクだけ404」という壊れ方をするので、パスの正典はこのファイルだけにする。
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

/** 静的ページを持つ言語（計画書 §5「まず enミラー」）。 */
export const STATIC_PAGE_LOCALES = ['ja', 'en'] as const

export type StaticPageLocale = (typeof STATIC_PAGE_LOCALES)[number]

/**
 * 表示ロケール → 静的ページのロケール。
 *
 * 日本語だけが日本語ページを持ち、**それ以外はすべて en ミラーへ送る**。
 * Tier 2 の10言語（de/fr/es-ES/…）は UI と公式名は各言語で出るが、静的ページはまだ無いので、
 * 母語でない日本語ページより英語ページの方が読める、という判断（計画書 §5:
 * 「他言語の静的ページは Tier 2 の需要データを見て判断」）。
 * その言語の静的ページを生成したら、ここに分岐を足すだけで全リンクが切り替わる。
 */
export function staticPageLocale(locale: string = 'ja'): StaticPageLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

/** 静的ページのパス接頭辞。ja は接頭辞なし（公開済みURLを変えない）。 */
export function staticPagePrefix(locale: string = 'ja'): string {
  return staticPageLocale(locale) === 'ja' ? '' : `/${staticPageLocale(locale)}`
}

/**
 * アイテムページのパス。ページを持たないID（建物や未収録ID）は null を返し、
 * 呼び出し側はリンクを作らずに名前だけを出す。
 */
export function itemPagePath(itemId: string, locale: string = 'ja'): string | null {
  const slug = itemSlugById.get(itemId)
  return slug === undefined ? null : `${staticPagePrefix(locale)}/items/${slug}/`
}

/** アイテム一覧ページのパス。 */
export function itemsIndexPath(locale: string = 'ja'): string {
  return `${staticPagePrefix(locale)}/items/`
}

/** サイト説明ページ（運営者・問い合わせ・免責）のパス。 */
export function aboutPagePath(locale: string = 'ja'): string {
  return `${staticPagePrefix(locale)}/about/`
}

/** 解説記事の索引ページのパス。 */
export function articlesIndexPath(locale: string = 'ja'): string {
  return `${staticPagePrefix(locale)}/articles/`
}

/** 解説記事ページのパス（slug は日英で共通＝hreflang で相互に結べる）。 */
export function articlePagePath(slug: string, locale: string = 'ja'): string {
  return `${staticPagePrefix(locale)}/articles/${slug}/`
}
