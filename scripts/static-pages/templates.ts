import { articlesIndexPath, itemsIndexPath } from '../../src/plan/item-pages.ts'
import {
  ENDONYM,
  HTML_LANG,
  OG_LOCALE,
  STATIC_LOCALES,
  STATIC_PAGE_LABELS,
  UI_DICTIONARIES,
} from './labels.ts'
import type { StaticLocale } from './labels.ts'

export const SITE_URL = 'https://satisfactory-planner.net'

/** 日本語のサイト名。ロケール別に出すところは siteName(locale) を使う。 */
export const SITE_NAME = STATIC_PAGE_LABELS.ja.siteName

export function siteName(locale: StaticLocale): string {
  return STATIC_PAGE_LABELS[locale].siteName
}

export type Breadcrumb = {
  label: string
  href?: string
}

/** 同じページの日英パス。hreflang と言語切替リンクの両方に使う。 */
export type PageAlternates = Readonly<Partial<Record<StaticLocale, string>>>

export type StaticPageMeta = {
  locale: StaticLocale
  title: string
  description: string
  canonicalPath: string
  /** 対応する各言語のパス。片方しか無いページ（プライバシー等）は片方だけ入れる。 */
  alternates: PageAlternates
  ogType?: 'website' | 'article'
  publishedTime?: string
  structuredData?: unknown
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function jsonLdScript(value: unknown): string {
  const json = JSON.stringify(value).replaceAll('<', '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

export function renderBreadcrumbs(
  entries: readonly Breadcrumb[],
  locale: StaticLocale,
): string {
  const items = entries
    .map((entry, index) => {
      const current = index === entries.length - 1
      const content = entry.href
        ? `<a href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`
        : `<span${current ? ' aria-current="page"' : ''}>${escapeHtml(entry.label)}</span>`
      return `<li>${content}</li>`
    })
    .join('')
  const navLabel = STATIC_PAGE_LABELS[locale].breadcrumbNavLabel
  return `<nav class="breadcrumbs" aria-label="${escapeHtml(navLabel)}"><ol>${items}</ol></nav>`
}

/**
 * hreflang。日英が揃っているページは相互に指し、x-default は日本語版（既定言語）へ送る。
 * 片方しか無いページは自分だけを指す（相互リンクの整合は tests/build-pages.test.ts が検査）。
 */
function renderAlternateLinks(meta: StaticPageMeta): string {
  const links = STATIC_LOCALES.flatMap((locale) => {
    const path = meta.alternates[locale]
    return path === undefined
      ? []
      : [
          `<link rel="alternate" hreflang="${locale}" href="${escapeHtml(`${SITE_URL}${path}`)}" />`,
        ]
  })
  const defaultPath = meta.alternates.ja ?? meta.canonicalPath
  links.push(
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${SITE_URL}${defaultPath}`)}" />`,
  )
  return links.join('\n    ')
}

/** ヘッダー右上の言語切替。相手言語のページがある時だけ出す。 */
function renderLanguageSwitch(meta: StaticPageMeta): string {
  const other: StaticLocale = meta.locale === 'ja' ? 'en' : 'ja'
  const path = meta.alternates[other]
  if (path === undefined) return ''
  const labels = STATIC_PAGE_LABELS[meta.locale]
  return `<a class="lang-switch" href="${escapeHtml(path)}" hreflang="${other}" lang="${HTML_LANG[other]}" aria-label="${escapeHtml(labels.switchLanguageTo(ENDONYM[other]))}">${escapeHtml(ENDONYM[other])}</a>`
}

export function renderDocument(meta: StaticPageMeta, body: string): string {
  const canonicalUrl = `${SITE_URL}${meta.canonicalPath}`
  const { locale } = meta
  const labels = STATIC_PAGE_LABELS[locale]
  const ui = UI_DICTIONARIES[locale]
  const name = siteName(locale)
  const itemsHref = itemsIndexPath(locale)
  const articlesHref = articlesIndexPath(locale)
  const articleMeta = meta.publishedTime
    ? `<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`
    : ''
  const structuredData =
    meta.structuredData === undefined ? '' : jsonLdScript(meta.structuredData)

  return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/static-pages.css" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    ${renderAlternateLinks(meta)}
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="theme-color" content="#101318" />
    <meta property="og:type" content="${meta.ogType ?? 'website'}" />
    <meta property="og:site_name" content="${escapeHtml(name)}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${SITE_URL}/ogp.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(name)}" />
    <meta property="og:locale" content="${OG_LOCALE[locale]}" />
    ${articleMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${SITE_URL}/ogp.png" />
    ${structuredData}
  </head>
  <body>
    <a class="skip-link" href="#main-content">${escapeHtml(labels.skipToContent)}</a>
    <header class="site-header">
      <a class="brand" href="/">${escapeHtml(name)}</a>
      <nav aria-label="${escapeHtml(labels.siteNavLabel)}">
        <a href="${escapeHtml(itemsHref)}">${escapeHtml(ui.footer.items)}</a>
        <a href="${escapeHtml(articlesHref)}">${escapeHtml(ui.footer.articles)}</a>
        <a href="/">${escapeHtml(labels.planner)}</a>
      </nav>
      ${renderLanguageSwitch(meta)}
    </header>
    <main id="main-content">
      ${body}
    </main>
    <footer class="site-footer">
      <p>${escapeHtml(ui.footer.disclaimer)}</p>
      <nav aria-label="${escapeHtml(labels.footerNavLabel)}">
        <a href="${escapeHtml(itemsHref)}">${escapeHtml(ui.footer.items)}</a>
        <a href="${escapeHtml(articlesHref)}">${escapeHtml(ui.footer.articles)}</a>
        <a href="/privacy.html">${escapeHtml(ui.footer.privacy)}</a>
      </nav>
    </footer>
  </body>
</html>
`
}

export const STATIC_PAGE_CSS = `:root {
  color-scheme: dark;
  font: 15px/1.75 system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic UI', sans-serif;
  color: #dde3ec;
  background: #101318;
  --bg: #101318;
  --panel: #171b22;
  --raised: #1d232c;
  --border: #2b323d;
  --text: #dde3ec;
  --strong: #ffffff;
  --muted: #93a1b3;
  --accent: #f0a13c;
  --accent-soft: rgba(240, 161, 60, 0.1);
  --good: #78c69a;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

a { color: var(--accent); text-underline-offset: 0.18em; }
a:hover { color: #ffc36f; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

.skip-link {
  position: fixed;
  z-index: 10;
  top: 8px;
  left: 8px;
  padding: 8px 12px;
  transform: translateY(-160%);
  border-radius: 4px;
  background: var(--accent);
  color: #151515;
}
.skip-link:focus { transform: none; }

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 58px;
  padding: 10px max(20px, calc((100% - 1080px) / 2));
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}

.brand {
  color: var(--strong);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}

.site-header nav,
.site-footer nav { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.site-header nav a { color: var(--muted); font-size: 13px; }

/* 言語切替（日本語 ⇄ English）。タグと同じピル形で、ヘッダーの右端に置く。 */
.lang-switch {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  margin-left: auto;
  padding: 2px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--raised);
  color: var(--muted);
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
}
.lang-switch:hover { border-color: #805728; color: #ffc36f; }

main {
  width: min(1080px, calc(100% - 32px));
  margin: 34px auto 56px;
}

.breadcrumbs { margin-bottom: 18px; color: var(--muted); font-size: 13px; }
.breadcrumbs ol { display: flex; flex-wrap: wrap; gap: 5px 9px; margin: 0; padding: 0; list-style: none; }
.breadcrumbs li:not(:last-child)::after { margin-left: 9px; color: #596474; content: '/'; }
.breadcrumbs a { color: var(--muted); }

.hero,
.card,
.article-body,
.index-section {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--panel);
}

.hero { padding: 28px 32px; }
.hero-row { display: flex; align-items: flex-start; gap: 20px; }
.item-icon,
.item-icon-missing {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--raised);
  object-fit: contain;
}
.item-icon-missing {
  display: grid;
  place-items: center;
  padding: 6px;
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}

.eyebrow { margin: 0 0 4px; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; }
h1, h2, h3 { color: var(--strong); line-height: 1.4; }
h1 { margin: 0; font-size: clamp(25px, 5vw, 36px); }
h2 { margin: 34px 0 14px; font-size: 22px; }
h3 { margin: 0 0 12px; font-size: 17px; }
h4 { margin: 20px 0 8px; color: var(--strong); font-size: 14px; }
p { margin: 0 0 14px; }

.lead { max-width: 760px; margin: 12px 0 0; color: #c3ccd8; font-size: 16px; }
.meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; }
.tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 2px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--raised);
  color: #c8d0dc;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.tag.accent { border-color: #805728; background: var(--accent-soft); color: #ffc36f; }

.cta {
  display: inline-block;
  margin-top: 20px;
  padding: 11px 17px;
  border: 1px solid #d8892e;
  border-radius: 5px;
  background: var(--accent);
  color: #18130d;
  font-weight: 700;
  text-decoration: none;
}
.cta:hover { background: #ffc36f; color: #18130d; }

.section-heading { display: flex; align-items: baseline; gap: 10px; }
.count { color: var(--muted); font-size: 13px; font-weight: 400; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.card { padding: 20px; }
.card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }

.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0; }
.facts div,
.metrics > dl,
.metrics > .ingredient-metrics { margin: 0; padding: 10px 12px; border-radius: 4px; background: var(--raised); }
.facts dt,
.metrics dt { color: var(--muted); font-size: 11px; }
.facts dd,
.metrics dd { margin: 2px 0 0; color: var(--strong); font-variant-numeric: tabular-nums; }

.flow-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.rate-list,
.metric-list,
.use-list,
.link-list,
.article-list { margin: 0; padding: 0; list-style: none; }
.rate-list li,
.metric-list li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.rate-list li:last-child,
.metric-list li:last-child { border-bottom: 0; }
.num { white-space: nowrap; font-variant-numeric: tabular-nums; }

.metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 16px 0 0; }
.ingredient-metrics { grid-column: 1 / -1; }

.use-list { display: grid; gap: 10px; }
.use-list > li { padding: 16px 18px; border: 1px solid var(--border); border-radius: 5px; background: var(--panel); }
.use-summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 18px; }
.use-summary strong { color: var(--strong); }

.empty-state { padding: 18px; border-left: 2px solid var(--accent); background: var(--accent-soft); color: #c3ccd8; }

.index-section { margin-top: 18px; padding: 22px 24px; }
.index-section h2 { margin-top: 0; }
.link-list { columns: 3 220px; column-gap: 30px; }
.link-list li { break-inside: avoid; margin-bottom: 8px; }
.link-list small { color: var(--muted); }

.article-list { display: grid; gap: 12px; margin-top: 20px; }
.article-list a { display: block; padding: 18px 20px; border: 1px solid var(--border); border-radius: 5px; background: var(--panel); text-decoration: none; }
.article-list strong { display: block; color: var(--strong); font-size: 17px; }
.article-list span { display: block; margin-top: 5px; color: #b7c0cd; }

.article-body { max-width: 820px; margin: 20px auto 0; padding: 28px 34px; }
.article-body h2:first-child { margin-top: 0; }
.article-body p { line-height: 1.9; }
.article-body li { margin-bottom: 8px; }
.article-note { padding: 12px 14px; border-left: 2px solid var(--accent); background: var(--accent-soft); color: #c3ccd8; }
.comparison-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.table-wrap { overflow-x: auto; }
.comparison-table th,
.comparison-table td { padding: 9px 11px; border: 1px solid var(--border); text-align: left; }
.comparison-table th { background: var(--raised); color: var(--strong); }
.comparison-table td.num { text-align: right; }
.version { color: var(--muted); font-size: 12px; }

.site-footer {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 20px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: var(--panel);
  color: var(--muted);
  font-size: 11px;
}
.site-footer p { margin: 0; }
.site-footer a { color: var(--muted); }

@media (max-width: 760px) {
  .site-header { align-items: flex-start; flex-direction: column; gap: 5px; padding: 10px 16px; }
  .lang-switch { margin-left: 0; }
  main { margin-top: 20px; }
  .hero, .article-body { padding: 22px 20px; }
  .grid, .facts, .flow-columns, .metrics { grid-template-columns: 1fr; }
  .ingredient-metrics { grid-column: auto; }
  .hero-row { flex-direction: column; gap: 14px; }
  .hero-row > div { min-width: 0; width: 100%; }
  .item-icon, .item-icon-missing { width: 56px; height: 56px; }
  .link-list { columns: 1; }
}
`
