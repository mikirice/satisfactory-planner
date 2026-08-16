/**
 * 静的ページ（アイテム別ページ・解説記事・sitemap）の生成。
 *
 * Stage 3 で日本語に加えて英語ミラー（/en/…）を出す（計画書 §5）。
 * ロケール依存のものは3か所から取る:
 *  - ゲーム内の名前: データの `name[locale]`（公式訳が唯一の語彙源）
 *  - UI と共通の語: `UI_DICTIONARIES[locale]`（作り方/使い道/個/分 など）
 *  - 静的ページ固有の文: `STATIC_PAGE_LABELS[locale]`（scripts/static-pages/labels.ts）
 * 数値はロケール別の Intl でフォーマットし、ソルバーの計算そのものは日英で共有する
 * （同じ計画を2回解かない＝日英で数値が食い違わない）。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { handwrittenArticlesEnBySlug } from '../content/articles/en/index.ts'
import { handwrittenArticles } from '../content/articles/index.ts'
import type { ArticleCta, HandwrittenArticle } from '../content/articles/types.ts'
import { LOOP_GUIDES_EN } from '../content/loop-guides/en.ts'
import iconIdsJson from '../src/data/icons.json'
import {
  buildingsById,
  items,
  itemsById,
  meta,
  ratePerMin,
  recipes,
} from '../src/data/index.ts'
import type { Item, ItemAmount, Recipe } from '../src/data/types.ts'
import type { UiDictionary } from '../src/i18n/types.ts'
import {
  aboutPagePath,
  articlePagePath,
  articlesIndexPath,
  itemPagePath,
  itemSlug,
  itemsIndexPath,
} from '../src/plan/item-pages.ts'
import { getRecipesForItem, recipeMetrics } from '../src/plan/recipe-index.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import type { SamplePlan } from '../src/plan/samples.ts'
import {
  buildShareUrl,
  defaultPlanInput,
  parsePlanSnapshot,
  toPlanSnapshot,
} from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { ObjectiveWeights, Solution, SolveResult } from '../src/solver/index.ts'
import { STATIC_LOCALES, STATIC_PAGE_LABELS, UI_DICTIONARIES } from './static-pages/labels.ts'
import type { StaticLocale, StaticPageLabels } from './static-pages/labels.ts'
import {
  escapeHtml,
  renderBreadcrumbs,
  renderDocument,
  siteName,
  SITE_URL,
  STATIC_PAGE_CSS,
} from './static-pages/templates.ts'
import type { PageAlternates } from './static-pages/templates.ts'

const PUBLISHED_DATE = '2026-08-14'
/** 問い合わせ先（個人の連絡先は出さず、公開リポジトリの Issues に一本化する）。 */
const CONTACT_URL = 'https://github.com/mikirice/satisfactory-planner/issues'
const iconIds = new Set<string>(iconIdsJson)
const baseRecipes = recipes.filter((recipe) => !recipe.isAlternate)
const baseRecipeIds = baseRecipes.map((recipe) => recipe.id)

const objectiveWeights: Readonly<Record<string, ObjectiveWeights>> = {
  resources: { resources: 1, power: 0, buildings: 0 },
  power: { resources: 0.01, power: 1, buildings: 0 },
  buildings: { resources: 0.01, power: 0, buildings: 1 },
}

type ItemGroup = {
  id: 'raw' | 'solid' | 'liquid' | 'gas'
  label: string
  items: readonly Item[]
}

type SolvedLoopArticle = {
  sample: SamplePlan
  current: Solution
  baseline?: SolveResult
}

export type StaticPagesManifest = {
  itemSlugs: readonly string[]
  articleSlugs: readonly string[]
  /** sitemap に載せる全URL（日本語 → 英語ミラーの順）。 */
  urls: readonly string[]
  locales: readonly StaticLocale[]
}

const loopSamples = SAMPLE_PLANS.filter(
  (sample): sample is SamplePlan & { guide: NonNullable<SamplePlan['guide']> } =>
    sample.category === 'special' && sample.guide !== undefined,
)

// slug の実装はアプリと共有する（src/plan/item-pages.ts が正典）。ここでは再輸出だけする。
export { itemSlug } from '../src/plan/item-pages.ts'

const itemSlugValues = items.map((item) => itemSlug(item.id))

export const articleSlugs: readonly string[] = [
  ...handwrittenArticles.map((article) => article.slug),
  ...loopSamples.map((sample) => sample.id),
]
if (new Set(articleSlugs).size !== articleSlugs.length) {
  throw new Error('article slug collision detected')
}

// ---------------------------------------------------------------------------
// ロケール文脈
// ---------------------------------------------------------------------------

/** 1ロケール分の表示資源（辞書・数値書式・並び順）。全 render 関数の第1引数。 */
type Ctx = {
  locale: StaticLocale
  /** もう一方の言語（英名／和名の併記と hreflang に使う）。 */
  other: StaticLocale
  L: StaticPageLabels
  ui: UiDictionary
  site: string
  fmtRate: (value: number) => string
  fmtPower: (value: number) => string
  fmtInteger: (value: number) => string
  fmtPercent: (value: number) => string
  sortedItems: readonly Item[]
  itemGroups: readonly ItemGroup[]
}

const NUMBER_LOCALES: Readonly<Record<StaticLocale, string>> = { ja: 'ja-JP', en: 'en-US' }

function cleanNumber(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) return 0
  return value
}

function createContext(locale: StaticLocale): Ctx {
  const numberLocale = NUMBER_LOCALES[locale]
  const rateFormat = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const integerFormat = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 })
  const percentFormat = new Intl.NumberFormat(numberLocale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const format = (formatter: Intl.NumberFormat) => (value: number) =>
    formatter.format(cleanNumber(value))

  const ui = UI_DICTIONARIES[locale]
  const sortedItems = [...items].sort((left, right) =>
    left.name[locale].localeCompare(right.name[locale], locale),
  )
  const itemGroups: readonly ItemGroup[] = [
    {
      id: 'raw',
      label: ui.recipeBrowser.groups.raw,
      items: sortedItems.filter((item) => item.isRawResource),
    },
    {
      id: 'solid',
      label: ui.recipeBrowser.groups.solid,
      items: sortedItems.filter((item) => !item.isRawResource && item.form === 'solid'),
    },
    {
      id: 'liquid',
      label: ui.recipeBrowser.groups.liquid,
      items: sortedItems.filter((item) => !item.isRawResource && item.form === 'liquid'),
    },
    {
      id: 'gas',
      label: ui.recipeBrowser.groups.gas,
      items: sortedItems.filter((item) => !item.isRawResource && item.form === 'gas'),
    },
  ]

  return {
    locale,
    other: locale === 'ja' ? 'en' : 'ja',
    L: STATIC_PAGE_LABELS[locale],
    ui,
    site: siteName(locale),
    fmtRate: format(rateFormat),
    fmtPower: format(rateFormat),
    fmtInteger: format(integerFormat),
    fmtPercent: format(percentFormat),
    sortedItems,
    itemGroups,
  }
}

// ---------------------------------------------------------------------------
// 名前・単位・リンク
// ---------------------------------------------------------------------------

function pageTitle(ctx: Ctx, headline: string): string {
  return `${headline} | ${ctx.site}`
}

function amountUnit(ctx: Ctx, itemId: string): string {
  return itemsById.get(itemId)?.form === 'solid' ? ctx.ui.units.item : ctx.ui.units.cubicMeter
}

function rateUnit(ctx: Ctx, itemId: string): string {
  return itemsById.get(itemId)?.form === 'solid'
    ? ctx.ui.units.solidPerMinute
    : ctx.ui.units.fluidPerMinute
}

function itemCategory(ctx: Ctx, item: Item): string {
  const groups = ctx.ui.recipeBrowser.groups
  if (item.isRawResource) return groups.raw
  if (item.form === 'solid') return groups.solid
  if (item.form === 'liquid') return groups.liquid
  return groups.gas
}

function itemUrl(itemId: string, locale: StaticLocale): string {
  const path = itemPagePath(itemId, locale)
  if (path === null) throw new Error(`unknown item id: ${itemId}`)
  return path
}

function itemLink(ctx: Ctx, itemId: string): string {
  const item = itemsById.get(itemId)
  if (item === undefined) throw new Error(`unknown item id: ${itemId}`)
  return `<a href="${itemUrl(itemId, ctx.locale)}">${escapeHtml(item.name[ctx.locale])}</a>`
}

function itemIcon(ctx: Ctx, item: Item, size = 72): string {
  const name = item.name[ctx.locale]
  if (!iconIds.has(item.id)) {
    return `<span class="item-icon-missing" role="img" aria-label="${escapeHtml(ctx.L.iconMissingFor(name))}">${escapeHtml(ctx.L.iconMissing)}</span>`
  }
  return `<img class="item-icon" src="/icons/${escapeHtml(item.id)}.png" alt="${escapeHtml(name)}" width="${size}" height="${size}" />`
}

function breadcrumbSchema(entries: readonly { name: string; path: string }[], id: string): object {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${id}`,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: `${SITE_URL}${entry.path}`,
    })),
  }
}

/** 同じページの日英パス（hreflang と言語切替リンク）。 */
function alternatesOf(pathFor: (locale: StaticLocale) => string): PageAlternates {
  return Object.fromEntries(STATIC_LOCALES.map((locale) => [locale, pathFor(locale)]))
}

function targetPlanHref(
  ctx: Ctx,
  item: Item,
  options: {
    ratePerMin?: number
    alternateRecipeIds?: readonly string[]
    somersloops?: number
  } = {},
): string {
  const firstRecipe = getRecipesForItem(item.id).producing[0]
  const defaultRate = firstRecipe
    ? recipeMetrics(firstRecipe, item.id).outputRatePerMin
    : item.form === 'solid'
      ? 1
      : 60
  const enabledAlternates: Record<string, true> = {}
  for (const recipeId of options.alternateRecipeIds ?? []) enabledAlternates[recipeId] = true
  // 通常レシピがなく代替だけで作れるアイテムも、CTAからそのまま求解できるようにする。
  if (firstRecipe?.isAlternate === true) enabledAlternates[firstRecipe.id] = true

  const snapshot = toPlanSnapshot({
    ...defaultPlanInput(),
    targets: [
      {
        key: 'seo-target',
        item: item.id,
        ratePerMin: options.ratePerMin ?? defaultRate,
      },
    ],
    enabledAlternates,
    somersloops: options.somersloops ?? 0,
    planName: ctx.L.itemPlanName(item.name[ctx.locale]),
  })
  return buildShareUrl('/', snapshot)
}

/**
 * CTAの既定条件で、マップ原料から対象までレシピの依存をたどれるかを判定する。
 * 発電副産物・手動採取品など、製造レシピ外の供給が必要な目標には注意書きを出すために使う。
 */
function defaultTargetIsAutomatable(item: Item): boolean {
  const firstRecipe = getRecipesForItem(item.id).producing[0]
  const enabledRecipes =
    firstRecipe?.isAlternate === true ? [...baseRecipes, firstRecipe] : baseRecipes
  const reachable = new Set(
    items.filter((candidate) => candidate.isRawResource).map((candidate) => candidate.id),
  )

  let changed = true
  while (changed) {
    changed = false
    for (const recipe of enabledRecipes) {
      if (!recipe.ingredients.every((ingredient) => reachable.has(ingredient.item))) continue
      for (const product of recipe.products) {
        if (reachable.has(product.item)) continue
        reachable.add(product.item)
        changed = true
      }
    }
  }
  return reachable.has(item.id)
}

function recipeRateList(ctx: Ctx, entries: readonly ItemAmount[], durationSec: number): string {
  if (entries.length === 0) return `<p class="version">${escapeHtml(ctx.L.none)}</p>`
  const rows = entries
    .map(
      (entry) => `<li>
        <span>${itemLink(ctx, entry.item)}</span>
        <span class="num">${ctx.fmtRate(ratePerMin(entry.amount, durationSec))} ${escapeHtml(rateUnit(ctx, entry.item))}</span>
      </li>`,
    )
    .join('')
  return `<ul class="rate-list">${rows}</ul>`
}

function recipePowerText(ctx: Ctx, recipe: Recipe): string {
  const building = buildingsById.get(recipe.producedIn)
  if (building === undefined) return ctx.L.unknown
  const range = recipe.variablePower ?? building.variablePower
  if (range === undefined) return ctx.L.powerFixed(ctx.fmtPower(building.powerConsumptionMW))
  const average = (range.minMW + range.maxMW) / 2
  return ctx.L.powerRange(
    ctx.fmtPower(range.minMW),
    ctx.fmtPower(range.maxMW),
    ctx.fmtPower(average),
  )
}

function renderProducingRecipe(ctx: Ctx, recipe: Recipe, outputItem: Item): string {
  const metrics = recipeMetrics(recipe, outputItem.id)
  const building = buildingsById.get(recipe.producedIn)
  const browser = ctx.ui.recipeBrowser
  const ingredientMetrics =
    metrics.ingredients.length === 0
      ? `<p class="version ingredient-metrics">${escapeHtml(ctx.L.noIngredients)}</p>`
      : `<div class="ingredient-metrics">
          <h4>${escapeHtml(ctx.L.ingredientComparisonHeading)}</h4>
          <ul class="metric-list">
            ${metrics.ingredients
              .map(
                (ingredient) => `<li>
                  <span>${browser.perIngredient(itemLink(ctx, ingredient.item), escapeHtml(amountUnit(ctx, ingredient.item)))}</span>
                  <span class="num">${ctx.fmtRate(ingredient.outputPerIngredient)} ${escapeHtml(amountUnit(ctx, outputItem.id))}</span>
                </li>`,
              )
              .join('')}
          </ul>
        </div>`

  return `<article class="card" data-recipe-id="${escapeHtml(recipe.id)}">
    <header>
      <h3>${escapeHtml(recipe.name[ctx.locale])}</h3>
      <span class="tag${recipe.isAlternate ? ' accent' : ''}">${escapeHtml(recipe.isAlternate ? browser.alternate : browser.standard)}</span>
    </header>
    <dl class="facts">
      <div><dt>${escapeHtml(browser.building)}</dt><dd>${escapeHtml(building?.name[ctx.locale] ?? recipe.producedIn)}</dd></div>
      <div><dt>${escapeHtml(browser.power)}</dt><dd>${escapeHtml(recipePowerText(ctx, recipe))}</dd></div>
      <div><dt>${escapeHtml(browser.cycle)}</dt><dd>${escapeHtml(browser.seconds(ctx.fmtRate(recipe.durationSec)))}</dd></div>
    </dl>
    <div class="flow-columns">
      <section><h4>${escapeHtml(browser.ingredients)}</h4>${recipeRateList(ctx, recipe.ingredients, recipe.durationSec)}</section>
      <section><h4>${escapeHtml(browser.products)}</h4>${recipeRateList(ctx, recipe.products, recipe.durationSec)}</section>
    </div>
    <div class="metrics">
      <dl>
        <dt>${escapeHtml(browser.outputPerMachine)}</dt>
        <dd>${ctx.fmtRate(metrics.outputRatePerMin)} ${escapeHtml(rateUnit(ctx, outputItem.id))}</dd>
      </dl>
      <dl>
        <dt>${escapeHtml(browser.outputPerPower)}${metrics.powerRangeMW ? escapeHtml(ctx.L.averagePowerNote) : ''}</dt>
        <dd>${ctx.fmtRate(metrics.outputPerMW)} ${escapeHtml(ctx.L.perPowerUnit(rateUnit(ctx, outputItem.id)))}</dd>
      </dl>
      ${ingredientMetrics}
    </div>
  </article>`
}

function renderConsumingRecipe(ctx: Ctx, recipe: Recipe, consumedItem: Item): string {
  const building = buildingsById.get(recipe.producedIn)
  const browser = ctx.ui.recipeBrowser
  const consumedRate = recipe.ingredients
    .filter((ingredient) => ingredient.item === consumedItem.id)
    .reduce((sum, ingredient) => sum + ratePerMin(ingredient.amount, recipe.durationSec), 0)
  return `<li data-recipe-id="${escapeHtml(recipe.id)}">
    <div class="use-summary">
      <strong>${escapeHtml(recipe.name[ctx.locale])}</strong>
      <span class="num">${escapeHtml(consumedItem.name[ctx.locale])} ${ctx.fmtRate(consumedRate)} ${escapeHtml(rateUnit(ctx, consumedItem.id))}</span>
    </div>
    <p class="version">${escapeHtml(ctx.L.consumingRecipeMeta(building?.name[ctx.locale] ?? recipe.producedIn, ctx.fmtRate(recipe.durationSec)))}</p>
    <div class="flow-columns">
      <section><h4>${escapeHtml(browser.ingredients)}</h4>${recipeRateList(ctx, recipe.ingredients, recipe.durationSec)}</section>
      <section><h4>${escapeHtml(browser.products)}</h4>${recipeRateList(ctx, recipe.products, recipe.durationSec)}</section>
    </div>
  </li>`
}

export function renderItemPage(ctx: Ctx, item: Item): string {
  const indexed = getRecipesForItem(item.id)
  const name = item.name[ctx.locale]
  const otherName = item.name[ctx.other]
  const headline = ctx.L.itemPageTitle(name)
  const title = pageTitle(ctx, headline)
  const path = itemUrl(item.id, ctx.locale)
  const breadcrumbId = `${path}#breadcrumb`
  const category = itemCategory(ctx, item)
  const sink =
    item.sinkPoints > 0
      ? ctx.L.sinkPoints(ctx.fmtInteger(item.sinkPoints), amountUnit(ctx, item.id))
      : ctx.L.sinkUnavailable
  const hasProducing = indexed.producing.length > 0
  const hasConsuming = indexed.consuming.length > 0
  const description =
    hasProducing && hasConsuming
      ? ctx.L.itemDescriptionBoth(
          name,
          otherName,
          indexed.producing.length,
          indexed.consuming.length,
          meta.gameVersion,
        )
      : hasProducing
        ? ctx.L.itemDescriptionProducingOnly(name, otherName, indexed.producing.length)
        : hasConsuming
          ? ctx.L.itemDescriptionConsumingOnly(name, otherName, indexed.consuming.length)
          : ctx.L.itemDescriptionNeither(name, otherName, meta.gameVersion)
  const intro = item.isRawResource
    ? ctx.L.itemIntroRaw(name)
    : !hasProducing && !hasConsuming
      ? ctx.L.itemIntroNeither(name)
      : !hasProducing
        ? ctx.L.itemIntroConsumingOnly(name)
        : ctx.L.itemIntroDefault(name)
  const producing =
    indexed.producing.length === 0
      ? `<p class="empty-state">${escapeHtml(ctx.L.producingEmpty)}</p>`
      : `<div class="grid">${indexed.producing.map((recipe) => renderProducingRecipe(ctx, recipe, item)).join('')}</div>`
  const consuming =
    indexed.consuming.length === 0
      ? `<p class="empty-state">${escapeHtml(ctx.L.consumingEmpty)}</p>`
      : `<ul class="use-list">${indexed.consuming.map((recipe) => renderConsumingRecipe(ctx, recipe, item)).join('')}</ul>`
  const ctaNotice = defaultTargetIsAutomatable(item)
    ? ''
    : `<p class="version">${escapeHtml(ctx.L.itemCtaNotice)}</p>`
  const scopeSection =
    hasProducing || hasConsuming
      ? `<section class="card">
          <h2>${escapeHtml(ctx.L.scopeHeading)}</h2>
          <p>${escapeHtml(ctx.L.scopeBody)}</p>
          <p class="version">${escapeHtml(ctx.L.generatedLine(meta.gameVersion, PUBLISHED_DATE))}</p>
        </section>`
      : `<section class="card">
          <h2>${escapeHtml(ctx.L.scopeEmptyHeading)}</h2>
          <p>${escapeHtml(ctx.L.scopeEmptyBody(name))}</p>
          <p>${escapeHtml(ctx.L.scopeEmptyFacts(otherName, category, sink))}</p>
          <p class="version">${escapeHtml(ctx.L.generatedLine(meta.gameVersion, PUBLISHED_DATE))}</p>
        </section>`

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: ctx.L.home, path: '/' },
          { name: ctx.ui.footer.items, path: itemsIndexPath(ctx.locale) },
          { name, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'ItemPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: ctx.locale,
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'Thing',
          '@id': `${SITE_URL}${path}#item`,
          name,
          alternateName: otherName,
          identifier: item.id,
          ...(iconIds.has(item.id) ? { image: `${SITE_URL}/icons/${item.id}.png` } : {}),
        },
      },
    ],
  }

  const body = `${renderBreadcrumbs(
    [
      { label: ctx.L.home, href: '/' },
      { label: ctx.ui.footer.items, href: itemsIndexPath(ctx.locale) },
      { label: name },
    ],
    ctx.locale,
  )}
  <header class="hero">
    <div class="hero-row">
      ${itemIcon(ctx, item)}
      <div>
        <p class="eyebrow">${escapeHtml(ctx.L.itemEyebrow)}</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="lead">${escapeHtml(intro)}</p>
        <div class="meta-row">
          <span class="tag accent">${escapeHtml(category)}</span>
          <span class="tag">${escapeHtml(ctx.L.sinkTag(sink))}</span>
          <span class="tag">${escapeHtml(ctx.L.otherNameTag(otherName))}</span>
          <span class="tag">${escapeHtml(ctx.L.idTag(item.id))}</span>
        </div>
        ${ctaNotice}
        <a class="cta" href="${escapeHtml(targetPlanHref(ctx, item))}">${escapeHtml(ctx.L.itemCta)}</a>
      </div>
    </div>
  </header>
  <section aria-labelledby="producing-heading">
    <h2 id="producing-heading" class="section-heading">${escapeHtml(ctx.ui.recipeBrowser.producing)} <span class="count">${escapeHtml(ctx.L.recipeCount(indexed.producing.length))}</span></h2>
    ${producing}
  </section>
  <section aria-labelledby="consuming-heading">
    <h2 id="consuming-heading" class="section-heading">${escapeHtml(ctx.ui.recipeBrowser.consuming)} <span class="count">${escapeHtml(ctx.L.recipeCount(indexed.consuming.length))}</span></h2>
    ${consuming}
  </section>
  ${scopeSection}`

  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => itemUrl(item.id, locale)),
      structuredData,
    },
    body,
  )
}

function renderItemIndex(ctx: Ctx): string {
  const title = pageTitle(ctx, ctx.L.itemsIndexTitle)
  const description = ctx.L.itemsIndexDescription(items.length)
  const path = itemsIndexPath(ctx.locale)
  const sections = ctx.itemGroups
    .map(
      (group) => `<section class="index-section" id="${group.id}">
        <h2>${escapeHtml(group.label)} <span class="count">${escapeHtml(ctx.L.itemCount(group.items.length))}</span></h2>
        <ul class="link-list">
          ${group.items
            .map((item) => {
              const otherName = ctx.L.itemsIndexShowsOtherName
                ? ` <small>${escapeHtml(item.name[ctx.other])}</small>`
                : ''
              return `<li><a href="${itemUrl(item.id, ctx.locale)}">${escapeHtml(item.name[ctx.locale])}</a>${otherName}</li>`
            })
            .join('')}
        </ul>
      </section>`,
    )
    .join('')
  const breadcrumbId = `${path}#breadcrumb`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: ctx.L.home, path: '/' },
          { name: ctx.ui.footer.items, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: ctx.locale,
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: ctx.sortedItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name[ctx.locale],
            url: `${SITE_URL}${itemUrl(item.id, ctx.locale)}`,
          })),
        },
      },
    ],
  }
  const body = `${renderBreadcrumbs(
    [{ label: ctx.L.home, href: '/' }, { label: ctx.ui.footer.items }],
    ctx.locale,
  )}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(ctx.L.itemsIndexEyebrow(items.length))}</p>
      <h1>${escapeHtml(ctx.L.itemsIndexTitle)}</h1>
      <p class="lead">${escapeHtml(ctx.L.itemsIndexLead)}</p>
    </header>
    ${sections}`
  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => itemsIndexPath(locale)),
      structuredData,
    },
    body,
  )
}

// ---------------------------------------------------------------------------
// このサイトについて
// ---------------------------------------------------------------------------

function aboutSection(heading: string, paragraphs: readonly string[]): string {
  return `<section>
    <h2>${escapeHtml(heading)}</h2>
    ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
  </section>`
}

/**
 * 運営者・問い合わせ先・免責・広告の扱いをまとめたページ。
 * 記事と同じテンプレートで出し、内容は STATIC_PAGE_LABELS の about* だけから取る。
 */
export function renderAboutPage(ctx: Ctx): string {
  const path = aboutPagePath(ctx.locale)
  const title = pageTitle(ctx, ctx.L.aboutTitle)
  const description = ctx.L.aboutDescription
  const breadcrumbId = `${path}#breadcrumb`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: ctx.L.home, path: '/' },
          { name: ctx.L.aboutTitle, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'AboutPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: ctx.locale,
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'WebApplication',
          '@id': `${SITE_URL}/#webapp`,
          name: ctx.site,
          url: SITE_URL,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web browser',
        },
      },
    ],
  }

  const body = `${renderBreadcrumbs(
    [{ label: ctx.L.home, href: '/' }, { label: ctx.L.aboutTitle }],
    ctx.locale,
  )}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(ctx.L.aboutEyebrow)}</p>
      <h1>${escapeHtml(ctx.L.aboutTitle)}</h1>
      <p class="lead">${escapeHtml(ctx.L.aboutLead)}</p>
    </header>
    <article class="article-body">
      ${aboutSection(ctx.L.aboutOverviewHeading, ctx.L.aboutOverviewParagraphs)}
      <section>
        <h2>${escapeHtml(ctx.L.aboutFeaturesHeading)}</h2>
        <ul>${ctx.L.aboutFeatures.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
      </section>
      ${aboutSection(ctx.L.aboutDataHeading, ctx.L.aboutDataParagraphs)}
      ${aboutSection(ctx.L.aboutOperatorHeading, ctx.L.aboutOperatorParagraphs)}
      <section>
        <h2>${escapeHtml(ctx.L.aboutContactHeading)}</h2>
        ${ctx.L.aboutContactParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        <p><a href="${escapeHtml(CONTACT_URL)}" rel="noopener">${escapeHtml(ctx.L.aboutContactLinkLabel)}</a></p>
      </section>
      ${aboutSection(ctx.L.aboutDisclaimerHeading, ctx.L.aboutDisclaimerParagraphs)}
      <section>
        <h2>${escapeHtml(ctx.L.aboutAdsHeading)}</h2>
        ${ctx.L.aboutAdsParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        <p><a href="/privacy.html">${escapeHtml(ctx.L.aboutPrivacyLinkLabel)}</a></p>
      </section>
      <section>
        <h2>${escapeHtml(ctx.L.aboutLinksHeading)}</h2>
        <ul class="link-list">
          <li><a href="/">${escapeHtml(ctx.L.aboutPlannerLinkLabel)}</a></li>
          <li><a href="${escapeHtml(itemsIndexPath(ctx.locale))}">${escapeHtml(ctx.ui.footer.items)}</a></li>
          <li><a href="${escapeHtml(articlesIndexPath(ctx.locale))}">${escapeHtml(ctx.ui.footer.articles)}</a></li>
        </ul>
      </section>
      <p class="version">${escapeHtml(ctx.L.generatedLine(meta.gameVersion, PUBLISHED_DATE))}</p>
    </article>`

  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => aboutPagePath(locale)),
      structuredData,
    },
    body,
  )
}

// ---------------------------------------------------------------------------
// 記事
// ---------------------------------------------------------------------------

function articleSchema(
  ctx: Ctx,
  path: string,
  headline: string,
  description: string,
  breadcrumbId: string,
): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: ctx.L.home, path: '/' },
          { name: ctx.ui.footer.articles, path: articlesIndexPath(ctx.locale) },
          { name: headline, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'Article',
        '@id': `${SITE_URL}${path}#article`,
        headline,
        description,
        image: `${SITE_URL}/ogp.png`,
        datePublished: PUBLISHED_DATE,
        dateModified: PUBLISHED_DATE,
        inLanguage: ctx.locale,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
        author: { '@type': 'Organization', name: ctx.site, url: SITE_URL },
        publisher: { '@type': 'Organization', name: ctx.site, url: SITE_URL },
      },
    ],
  }
}

function articleCtaHref(ctx: Ctx, cta: ArticleCta): string {
  if (cta.kind === 'sample') {
    const sample = SAMPLE_PLANS.find((entry) => entry.id === cta.sampleId)
    if (sample === undefined) throw new Error(`unknown sample for article CTA: ${cta.sampleId}`)
    return buildShareUrl('/', sample.snapshot)
  }
  const item = itemsById.get(cta.itemId)
  if (item === undefined) throw new Error(`unknown item for article CTA: ${cta.itemId}`)
  return targetPlanHref(ctx, item, cta)
}

function renderRelatedItems(ctx: Ctx, itemIds: readonly string[]): string {
  const unique = [...new Set(itemIds)].filter((itemId) => itemsById.has(itemId))
  if (unique.length === 0) return ''
  return `<section>
    <h2>${escapeHtml(ctx.L.relatedItems)}</h2>
    <ul class="link-list">${unique.map((itemId) => `<li>${itemLink(ctx, itemId)}</li>`).join('')}</ul>
  </section>`
}

/**
 * 表示ロケールの記事本文。英語は content/articles/en/ の**全文訳**を使う
 * （機械置換ではなく1本ずつ英語として成立させたもの。計画書 §5）。
 */
function localizedArticle(ctx: Ctx, article: HandwrittenArticle): HandwrittenArticle {
  if (ctx.locale === 'ja') return article
  const translated = handwrittenArticlesEnBySlug.get(article.slug)
  if (translated === undefined) {
    throw new Error(`missing English article: ${article.slug} (content/articles/en/)`)
  }
  return translated
}

function renderHandwrittenArticle(ctx: Ctx, source: HandwrittenArticle): string {
  const article = localizedArticle(ctx, source)
  const path = articlePagePath(article.slug, ctx.locale)
  const title = pageTitle(ctx, article.title)
  const breadcrumbId = `${path}#breadcrumb`
  const sections = article.sections
    .map(
      (section) => `<section>
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </section>`,
    )
    .join('')
  const body = `${renderBreadcrumbs(
    [
      { label: ctx.L.home, href: '/' },
      { label: ctx.ui.footer.articles, href: articlesIndexPath(ctx.locale) },
      { label: article.title },
    ],
    ctx.locale,
  )}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(ctx.L.articleEyebrow)}</p>
      <h1>${escapeHtml(article.title)}</h1>
      <p class="lead">${escapeHtml(article.description)}</p>
      <p class="version">${escapeHtml(ctx.L.publishedOn(PUBLISHED_DATE))}</p>
    </header>
    <article class="article-body">
      ${sections}
      ${renderRelatedItems(ctx, article.relatedItemIds)}
      <section>
        <h2>${escapeHtml(ctx.L.tryInPlannerHeading)}</h2>
        <p>${escapeHtml(ctx.L.tryInPlannerBody)}</p>
        <a class="cta" href="${escapeHtml(articleCtaHref(ctx, article.cta))}">${escapeHtml(article.cta.label)}</a>
      </section>
    </article>`
  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description: article.description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => articlePagePath(article.slug, locale)),
      ogType: 'article',
      publishedTime: PUBLISHED_DATE,
      structuredData: articleSchema(ctx, path, article.title, article.description, breadcrumbId),
    },
    body,
  )
}

async function solveSample(sample: SamplePlan, includeAlternates: boolean): Promise<SolveResult> {
  const parsed = parsePlanSnapshot(sample.snapshot)
  if (!parsed.ok) throw new Error(parsed.error)
  const { input } = parsed
  const maximize = input.targets.find((target) => target.mode === 'max')?.item
  const inputs = Object.fromEntries(input.inputs.map((entry) => [entry.item, entry.ratePerMin]))
  const fuels = Object.fromEntries(
    Object.entries(input.enabledFuels).map(([generator, selected]) => [
      generator,
      Object.keys(selected),
    ]),
  )
  return solveProduction({
    targets: input.targets
      .filter((target) => target.mode !== 'max')
      .map(({ item, ratePerMin: targetRate }) => ({ item, ratePerMin: targetRate })),
    ...(maximize === undefined ? {} : { maximize }),
    enabledRecipes: [
      ...baseRecipeIds,
      ...(includeAlternates ? Object.keys(input.enabledAlternates) : []),
    ],
    resourceLimits: input.limitOverrides,
    inputs,
    weights: objectiveWeights[input.objective],
    maxClock: input.maxClock,
    somersloops: input.somersloops,
    power: {
      generators: Object.keys(input.enabledGenerators),
      ...(Object.keys(fuels).length === 0 ? {} : { fuels }),
      targetMW: input.powerTargetMW,
      coverFactoryPower: input.coverFactoryPower,
    },
  })
}

/** ループ記事の求解は言語に依存しないので、日英で1回の結果を共有する。 */
async function solveLoopArticles(): Promise<readonly SolvedLoopArticle[]> {
  const solved: SolvedLoopArticle[] = []
  for (const sample of loopSamples) {
    const current = await solveSample(sample, true)
    if (current.status !== 'optimal') {
      throw new Error(`loop article is infeasible: ${sample.id}: ${current.message}`)
    }
    const baseline = sample.snapshot.a.length > 0 ? await solveSample(sample, false) : undefined
    solved.push({ sample, current, ...(baseline === undefined ? {} : { baseline }) })
  }
  return solved
}

function renderCurrentPlanMetrics(ctx: Ctx, solution: Solution): string {
  const targets = solution.targets
    .map(
      (target) => `<li>${itemLink(ctx, target.item)}: <span class="num">${ctx.fmtRate(target.producedPerMin)} ${escapeHtml(rateUnit(ctx, target.item))}</span></li>`,
    )
    .join('')
  const generation = solution.powerGeneration
    ? `<li>${escapeHtml(ctx.L.loopTotalGeneration)}: <span class="num">${ctx.fmtPower(solution.powerGeneration.totalMW)} MW</span></li>
       ${solution.powerGeneration.fuelUsage
         .map(
           (fuel) =>
             `<li>${ctx.L.loopFuelUsage(itemLink(ctx, fuel.item))}: <span class="num">${ctx.fmtRate(fuel.ratePerMin)} ${escapeHtml(rateUnit(ctx, fuel.item))}</span></li>`,
         )
         .join('')}`
    : ''
  return `<ul>
    ${targets}
    ${generation}
    <li>${escapeHtml(ctx.L.loopProductionPower)}: <span class="num">${ctx.fmtPower(solution.totalClockedPowerMW)} MW</span></li>
    <li>${escapeHtml(ctx.L.loopBuildings)}: <span class="num">${escapeHtml(ctx.L.loopBuildingCount(ctx.fmtInteger(solution.totalBuildingCount)))}</span></li>
  </ul>`
}

function renderRawResourceTable(ctx: Ctx, solution: Solution): string {
  const rows = solution.rawResources
    .map(
      (resource) => `<tr>
        <td>${itemLink(ctx, resource.item)}</td>
        <td class="num">${ctx.fmtRate(resource.ratePerMin)}</td>
        <td>${escapeHtml(rateUnit(ctx, resource.item))}</td>
      </tr>`,
    )
    .join('')
  return `<div class="table-wrap"><table class="comparison-table">
    <thead><tr><th scope="col">${escapeHtml(ctx.L.loopRawTableCaption)}</th><th scope="col">${escapeHtml(ctx.L.loopRawTableRate)}</th><th scope="col">${escapeHtml(ctx.L.loopRawTableUnit)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`
}

function renderBaselineComparison(ctx: Ctx, current: Solution, baseline: SolveResult): string {
  if (baseline.status !== 'optimal') {
    return `<p class="article-note">${escapeHtml(ctx.L.loopBaselineInfeasible)}</p>`
  }
  const baselineByItem = new Map(baseline.rawResources.map((raw) => [raw.item, raw.ratePerMin]))
  const currentByItem = new Map(current.rawResources.map((raw) => [raw.item, raw.ratePerMin]))
  const resourceIds = [
    ...new Set([
      ...baseline.rawResources.map((raw) => raw.item),
      ...current.rawResources.map((raw) => raw.item),
    ]),
  ]
  const resourceRows = resourceIds.flatMap((itemId) => {
    const baselineRate = baselineByItem.get(itemId) ?? 0
    const currentRate = currentByItem.get(itemId) ?? 0
    if (Math.abs(baselineRate - currentRate) <= 0.005) return []
    const change =
      baselineRate <= 0.005
        ? ctx.L.loopChangeNew
        : currentRate > baselineRate
          ? ctx.L.loopChangeIncrease(ctx.fmtPercent((currentRate - baselineRate) / baselineRate))
          : ctx.L.loopChangeDecrease(ctx.fmtPercent((baselineRate - currentRate) / baselineRate))
    return [
      `<tr>
        <td>${itemLink(ctx, itemId)}</td>
        <td class="num">${ctx.fmtRate(baselineRate)} → ${ctx.fmtRate(currentRate)} ${escapeHtml(rateUnit(ctx, itemId))}</td>
        <td class="num">${escapeHtml(change)}</td>
      </tr>`,
    ]
  })
  const powerRatio =
    baseline.totalClockedPowerMW <= 0
      ? 0
      : Math.abs(baseline.totalClockedPowerMW - current.totalClockedPowerMW) /
        baseline.totalClockedPowerMW
  const powerChange =
    current.totalClockedPowerMW < baseline.totalClockedPowerMW
      ? ctx.L.loopChangeDecrease(ctx.fmtPercent(powerRatio))
      : ctx.L.loopChangeIncrease(ctx.fmtPercent(powerRatio))
  const powerRow = `<tr>
    <td>${escapeHtml(ctx.L.loopProductionPower)}</td>
    <td class="num">${ctx.fmtPower(baseline.totalClockedPowerMW)} → ${ctx.fmtPower(current.totalClockedPowerMW)} MW</td>
    <td class="num">${escapeHtml(powerChange)}</td>
  </tr>`
  return `<p>${escapeHtml(ctx.L.loopComparisonIntro)}</p>
    <div class="table-wrap"><table class="comparison-table">
      <thead><tr><th scope="col">${escapeHtml(ctx.L.loopComparisonMetric)}</th><th scope="col">${escapeHtml(ctx.L.loopComparisonBaseline)}</th><th scope="col">${escapeHtml(ctx.L.loopComparisonChange)}</th></tr></thead>
      <tbody>${resourceRows.join('')}${powerRow}</tbody>
    </table></div>
    <p class="version">${escapeHtml(ctx.L.loopComparisonPowerNote)}</p>`
}

function loopRelatedItemIds(solution: Solution, sample: SamplePlan): readonly string[] {
  return [
    sample.icon,
    ...solution.targets.map((target) => target.item),
    ...solution.rawResources.map((raw) => raw.item),
    ...solution.steps.flatMap((step) => [
      ...step.inputs.map((input) => input.item),
      ...step.outputs.map((output) => output.item),
    ]),
  ]
}

/** ループ記事の表示テキスト。日本語はテンプレート定義、英語は content/loop-guides/en.ts。 */
type LoopContent = {
  title: string
  headline: string
  description: string
  highlight: string
  mechanism: readonly string[]
  tips: readonly string[]
  circulationMeaning?: string
}

function loopContent(ctx: Ctx, sample: SamplePlan): LoopContent {
  if (ctx.locale === 'ja') {
    const guide = sample.guide
    if (guide === undefined) throw new Error(`missing loop guide: ${sample.id}`)
    return {
      title: sample.title,
      headline: ctx.L.loopHeadline(sample.title),
      description: sample.description,
      highlight: sample.highlight ?? sample.description,
      mechanism: guide.sections.mechanism,
      tips: guide.sections.tips,
      ...(guide.circulationMeaning === undefined
        ? {}
        : { circulationMeaning: guide.circulationMeaning }),
    }
  }
  const guide = LOOP_GUIDES_EN[sample.id]
  if (guide === undefined) {
    throw new Error(`missing English loop guide: ${sample.id} (content/loop-guides/en.ts)`)
  }
  return {
    title: guide.title,
    headline: guide.headline,
    description: guide.description,
    highlight: guide.highlight,
    mechanism: guide.mechanism,
    tips: guide.tips,
    ...(guide.circulationMeaning === undefined
      ? {}
      : { circulationMeaning: guide.circulationMeaning }),
  }
}

function renderWaterCirculation(ctx: Ctx, content: LoopContent, solution: Solution): string {
  if (content.circulationMeaning === undefined) return ''
  const waterByRecipe = new Map<string, number>()
  for (const step of solution.steps) {
    const producedWater = step.outputs
      .filter((output) => output.item === 'Desc_Water_C')
      .reduce((sum, output) => sum + output.ratePerMin, 0)
    if (producedWater <= 0.005) continue
    const recipeName = step.recipeName[ctx.locale]
    waterByRecipe.set(recipeName, (waterByRecipe.get(recipeName) ?? 0) + producedWater)
  }
  const totalWater = [...waterByRecipe.values()].reduce((sum, rate) => sum + rate, 0)
  const breakdown = [...waterByRecipe]
    .map(
      ([recipeName, rate]) =>
        `<li>${escapeHtml(recipeName)}: <span class="num">${ctx.fmtRate(rate)} ${escapeHtml(ctx.ui.units.cubicMetersPerMinute)}</span></li>`,
    )
    .join('')
  return `<section>
    <h2>${escapeHtml(ctx.L.loopCirculationHeading)}</h2>
    <p>${escapeHtml(content.circulationMeaning)}</p>
    ${
      totalWater <= 0.005
        ? ''
        : `<p class="article-note">${escapeHtml(ctx.L.loopReusedWater)}: <span class="num">${ctx.fmtRate(totalWater)} ${escapeHtml(ctx.ui.units.cubicMetersPerMinute)}</span></p>
           <h3>${escapeHtml(ctx.L.loopCirculationBreakdown)}</h3><ul>${breakdown}</ul>`
    }
  </section>`
}

function renderLoopArticle(ctx: Ctx, entry: SolvedLoopArticle): string {
  const { sample, current, baseline } = entry
  const content = loopContent(ctx, sample)
  const path = articlePagePath(sample.id, ctx.locale)
  const title = pageTitle(ctx, content.headline)
  const description = ctx.L.loopDescription(content.description, meta.gameVersion)
  const breadcrumbId = `${path}#breadcrumb`
  const circulation = renderWaterCirculation(ctx, content, current)
  const comparison =
    baseline === undefined
      ? `<p>${escapeHtml(ctx.L.loopCurrentPlanNote)}</p>${renderCurrentPlanMetrics(ctx, current)}${renderRawResourceTable(ctx, current)}`
      : `${renderBaselineComparison(ctx, current, baseline)}<h3>${escapeHtml(ctx.L.loopTemplateResourcesHeading)}</h3>${renderRawResourceTable(ctx, current)}`
  const body = `${renderBreadcrumbs(
    [
      { label: ctx.L.home, href: '/' },
      { label: ctx.ui.footer.articles, href: articlesIndexPath(ctx.locale) },
      { label: content.headline },
    ],
    ctx.locale,
  )}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(ctx.L.loopEyebrow)}</p>
      <h1>${escapeHtml(content.headline)}</h1>
      <p class="lead">${escapeHtml(content.description)}</p>
      <p class="version">${escapeHtml(ctx.L.loopPublishedLine(meta.gameVersion, PUBLISHED_DATE))}</p>
    </header>
    <article class="article-body">
      <section>
        <h2>${escapeHtml(ctx.L.loopInsightHeading)}</h2>
        <p>${escapeHtml(content.highlight)}</p>
      </section>
      <section>
        <h2>${escapeHtml(ctx.L.loopMechanismHeading)}</h2>
        <ol>${content.mechanism.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol>
      </section>
      <section>
        <h2>${escapeHtml(baseline === undefined ? ctx.L.loopResultHeading : ctx.L.loopComparisonHeading)}</h2>
        <p class="version">${escapeHtml(ctx.L.loopSolverNote(meta.gameVersion))}</p>
        ${comparison}
      </section>
      ${circulation}
      <section>
        <h2>${escapeHtml(ctx.L.loopTipsHeading)}</h2>
        <ul>${content.tips.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      </section>
      ${renderRelatedItems(ctx, loopRelatedItemIds(current, sample))}
      <section>
        <h2>${escapeHtml(ctx.L.loopOpenHeading)}</h2>
        <p>${escapeHtml(ctx.L.loopOpenBody)}</p>
        <a class="cta" href="${escapeHtml(buildShareUrl('/', sample.snapshot))}">${escapeHtml(ctx.L.loopOpenCta(content.title))}</a>
      </section>
    </article>`
  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => articlePagePath(sample.id, locale)),
      ogType: 'article',
      publishedTime: PUBLISHED_DATE,
      structuredData: articleSchema(ctx, path, content.headline, description, breadcrumbId),
    },
    body,
  )
}

function renderArticlesIndex(ctx: Ctx): string {
  const title = pageTitle(ctx, ctx.L.articlesIndexTitle)
  const description = ctx.L.articlesIndexDescription
  const path = articlesIndexPath(ctx.locale)
  const handwritten = handwrittenArticles.map((article) => localizedArticle(ctx, article))
  const loops = loopSamples.map((sample) => ({
    slug: sample.id,
    content: loopContent(ctx, sample),
  }))
  const handwrittenList = handwritten
    .map(
      (article) => `<li><a href="${escapeHtml(articlePagePath(article.slug, ctx.locale))}"><strong>${escapeHtml(article.title)}</strong><span>${escapeHtml(article.description)}</span></a></li>`,
    )
    .join('')
  const loopList = loops
    .map(
      (loop) => `<li><a href="${escapeHtml(articlePagePath(loop.slug, ctx.locale))}"><strong>${escapeHtml(loop.content.headline)}</strong><span>${escapeHtml(loop.content.description)}</span></a></li>`,
    )
    .join('')
  const articleEntries = [
    ...handwritten.map((article) => ({ title: article.title, slug: article.slug })),
    ...loops.map((loop) => ({ title: loop.content.headline, slug: loop.slug })),
  ]
  const breadcrumbId = `${path}#breadcrumb`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: ctx.L.home, path: '/' },
          { name: ctx.ui.footer.articles, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: ctx.locale,
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: articleEntries.length,
          itemListElement: articleEntries.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: article.title,
            url: `${SITE_URL}${articlePagePath(article.slug, ctx.locale)}`,
          })),
        },
      },
    ],
  }
  const body = `${renderBreadcrumbs(
    [{ label: ctx.L.home, href: '/' }, { label: ctx.ui.footer.articles }],
    ctx.locale,
  )}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(ctx.L.articlesIndexEyebrow(articleSlugs.length))}</p>
      <h1>${escapeHtml(ctx.L.articlesIndexTitle)}</h1>
      <p class="lead">${escapeHtml(ctx.L.articlesIndexLead)}</p>
    </header>
    <section>
      <h2>${escapeHtml(ctx.L.articlesIndexToolSection)}</h2>
      <ul class="article-list">${handwrittenList}</ul>
    </section>
    <section>
      <h2>${escapeHtml(ctx.L.articlesIndexLoopSection)}</h2>
      <ul class="article-list">${loopList}</ul>
    </section>`
  return renderDocument(
    {
      locale: ctx.locale,
      title,
      description,
      canonicalPath: path,
      alternates: alternatesOf((locale) => articlesIndexPath(locale)),
      structuredData,
    },
    body,
  )
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

/**
 * sitemap のパス。日本語（トップとプライバシーを含む）→ 英語ミラーの順。
 * SPA のトップとプライバシーは1URLで言語が切り替わるので en 側には作らない。
 */
export function localeSitemapPaths(locale: StaticLocale): readonly string[] {
  return [
    ...(locale === 'ja' ? ['/', '/privacy.html'] : []),
    aboutPagePath(locale),
    itemsIndexPath(locale),
    ...items.map((item) => itemUrl(item.id, locale)),
    articlesIndexPath(locale),
    ...articleSlugs.map((slug) => articlePagePath(slug, locale)),
  ]
}

export function sitemapPaths(): readonly string[] {
  return STATIC_LOCALES.flatMap((locale) => localeSitemapPaths(locale))
}

export function renderSitemap(paths: readonly string[]): string {
  const urls = paths
    .map(
      (path) => `  <url>
    <loc>${escapeHtml(`${SITE_URL}${path}`)}</loc>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

async function writeHtml(filePath: string, html: string): Promise<void> {
  await mkdir(resolve(filePath, '..'), { recursive: true })
  await writeFile(filePath, html, 'utf8')
}

/** そのロケールの出力先ディレクトリ（ja は既存URLのままルート直下）。 */
function localeDirectory(output: string, locale: StaticLocale): string {
  return locale === 'ja' ? output : resolve(output, locale)
}

export async function generateStaticPages(outputDirectory: string): Promise<StaticPagesManifest> {
  const output = resolve(outputDirectory)
  await mkdir(output, { recursive: true })

  // 数値は言語に依存しないので、ソルバーは全ロケール分まとめて1回だけ回す。
  const solvedLoops = await solveLoopArticles()

  for (const locale of STATIC_LOCALES) {
    const ctx = createContext(locale)
    const directory = localeDirectory(output, locale)
    await Promise.all([
      writeHtml(resolve(directory, 'about/index.html'), renderAboutPage(ctx)),
      writeHtml(resolve(directory, 'items/index.html'), renderItemIndex(ctx)),
      ...items.map((item) =>
        writeHtml(
          resolve(directory, 'items', itemSlug(item.id), 'index.html'),
          renderItemPage(ctx, item),
        ),
      ),
      writeHtml(resolve(directory, 'articles/index.html'), renderArticlesIndex(ctx)),
      ...handwrittenArticles.map((article) =>
        writeHtml(
          resolve(directory, 'articles', article.slug, 'index.html'),
          renderHandwrittenArticle(ctx, article),
        ),
      ),
      ...solvedLoops.map((entry) =>
        writeHtml(
          resolve(directory, 'articles', entry.sample.id, 'index.html'),
          renderLoopArticle(ctx, entry),
        ),
      ),
    ])
  }

  const paths = sitemapPaths()
  await Promise.all([
    writeFile(resolve(output, 'static-pages.css'), STATIC_PAGE_CSS, 'utf8'),
    writeFile(resolve(output, 'sitemap.xml'), renderSitemap(paths), 'utf8'),
  ])

  return {
    itemSlugs: itemSlugValues,
    articleSlugs,
    urls: paths.map((path) => `${SITE_URL}${path}`),
    locales: STATIC_LOCALES,
  }
}

const entryFile = process.argv[1]
if (entryFile !== undefined && resolve(entryFile) === fileURLToPath(import.meta.url)) {
  const manifest = await generateStaticPages(resolve('dist'))
  console.log(
    `[build-pages] ${manifest.locales.join('/')}: ${manifest.itemSlugs.length} item pages and ` +
      `${manifest.articleSlugs.length} article pages per locale, ${manifest.urls.length} sitemap URLs`,
  )
}
