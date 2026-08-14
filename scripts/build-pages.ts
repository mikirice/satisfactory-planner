import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { handwrittenArticles } from '../content/articles/index.ts'
import type { ArticleCta, HandwrittenArticle } from '../content/articles/types.ts'
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
import { itemPagePath, itemSlug } from '../src/plan/item-pages.ts'
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
import {
  escapeHtml,
  renderBreadcrumbs,
  renderDocument,
  SITE_NAME,
  SITE_URL,
  STATIC_PAGE_CSS,
} from './static-pages/templates.ts'

const PUBLISHED_DATE = '2026-08-14'
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
  urls: readonly string[]
}

const sortedItems = [...items].sort((left, right) =>
  left.name.ja.localeCompare(right.name.ja, 'ja'),
)

const itemGroups: readonly ItemGroup[] = [
  {
    id: 'raw',
    label: '原料',
    items: sortedItems.filter((item) => item.isRawResource),
  },
  {
    id: 'solid',
    label: '固体アイテム',
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'solid'),
  },
  {
    id: 'liquid',
    label: '液体',
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'liquid'),
  },
  {
    id: 'gas',
    label: '気体',
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'gas'),
  },
]

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

const rateFormat = new Intl.NumberFormat('ja-JP', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const integerFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('ja-JP', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const fmtRate = (value: number): string => rateFormat.format(cleanNumber(value))
const fmtPower = (value: number): string => rateFormat.format(cleanNumber(value))
const fmtInteger = (value: number): string => integerFormat.format(cleanNumber(value))
const fmtPercent = (value: number): string => percentFormat.format(cleanNumber(value))

function cleanNumber(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) return 0
  return value
}

function amountUnit(itemId: string): string {
  return itemsById.get(itemId)?.form === 'solid' ? '個' : 'm³'
}

function rateUnit(itemId: string): string {
  return itemsById.get(itemId)?.form === 'solid' ? '個/分' : 'm³/min'
}

function itemCategory(item: Item): string {
  if (item.isRawResource) return '原料'
  if (item.form === 'solid') return '固体アイテム'
  if (item.form === 'liquid') return '液体'
  return '気体'
}

function itemUrl(itemId: string): string {
  const path = itemPagePath(itemId)
  if (path === null) throw new Error(`unknown item id: ${itemId}`)
  return path
}

function itemLink(itemId: string): string {
  const item = itemsById.get(itemId)
  if (item === undefined) throw new Error(`unknown item id: ${itemId}`)
  return `<a href="${itemUrl(itemId)}">${escapeHtml(item.name.ja)}</a>`
}

function itemIcon(item: Item, size = 72): string {
  if (!iconIds.has(item.id)) {
    return `<span class="item-icon-missing" role="img" aria-label="${escapeHtml(item.name.ja)}の画像は未収録">画像未収録</span>`
  }
  return `<img class="item-icon" src="/icons/${escapeHtml(item.id)}.png" alt="${escapeHtml(item.name.ja)}" width="${size}" height="${size}" />`
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

function targetPlanHref(
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
    planName: `${item.name.ja} 生産計画`,
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

function recipeRateList(entries: readonly ItemAmount[], durationSec: number): string {
  if (entries.length === 0) return '<p class="version">なし</p>'
  const rows = entries
    .map(
      (entry) => `<li>
        <span>${itemLink(entry.item)}</span>
        <span class="num">${fmtRate(ratePerMin(entry.amount, durationSec))} ${rateUnit(entry.item)}</span>
      </li>`,
    )
    .join('')
  return `<ul class="rate-list">${rows}</ul>`
}

function recipePowerText(recipe: Recipe): string {
  const building = buildingsById.get(recipe.producedIn)
  if (building === undefined) return '不明'
  const range = recipe.variablePower ?? building.variablePower
  if (range === undefined) return `${fmtPower(building.powerConsumptionMW)} MW`
  const average = (range.minMW + range.maxMW) / 2
  return `${fmtPower(range.minMW)}〜${fmtPower(range.maxMW)} MW（平均 ${fmtPower(average)} MW）`
}

function renderProducingRecipe(recipe: Recipe, outputItem: Item): string {
  const metrics = recipeMetrics(recipe, outputItem.id)
  const building = buildingsById.get(recipe.producedIn)
  const ingredientMetrics =
    metrics.ingredients.length === 0
      ? '<p class="version ingredient-metrics">材料を使わないレシピです。</p>'
      : `<div class="ingredient-metrics">
          <h4>材料1単位あたりの比較</h4>
          <ul class="metric-list">
            ${metrics.ingredients
              .map(
                (ingredient) => `<li>
                  <span>${itemLink(ingredient.item)} 1${amountUnit(ingredient.item)}あたり</span>
                  <span class="num">${fmtRate(ingredient.outputPerIngredient)} ${amountUnit(outputItem.id)}</span>
                </li>`,
              )
              .join('')}
          </ul>
        </div>`

  return `<article class="card" data-recipe-id="${escapeHtml(recipe.id)}">
    <header>
      <h3>${escapeHtml(recipe.name.ja)}</h3>
      <span class="tag${recipe.isAlternate ? ' accent' : ''}">${recipe.isAlternate ? '代替' : '通常'}</span>
    </header>
    <dl class="facts">
      <div><dt>製造設備</dt><dd>${escapeHtml(building?.name.ja ?? recipe.producedIn)}</dd></div>
      <div><dt>消費電力</dt><dd>${recipePowerText(recipe)}</dd></div>
      <div><dt>サイクル</dt><dd>${fmtRate(recipe.durationSec)} 秒</dd></div>
    </dl>
    <div class="flow-columns">
      <section><h4>材料</h4>${recipeRateList(recipe.ingredients, recipe.durationSec)}</section>
      <section><h4>製品</h4>${recipeRateList(recipe.products, recipe.durationSec)}</section>
    </div>
    <div class="metrics">
      <dl>
        <dt>産出 / 機械1台</dt>
        <dd>${fmtRate(metrics.outputRatePerMin)} ${rateUnit(outputItem.id)}</dd>
      </dl>
      <dl>
        <dt>電力あたり産出${metrics.powerRangeMW ? '（平均電力で計算）' : ''}</dt>
        <dd>${fmtRate(metrics.outputPerMW)} ${rateUnit(outputItem.id)} / MW</dd>
      </dl>
      ${ingredientMetrics}
    </div>
  </article>`
}

function renderConsumingRecipe(recipe: Recipe, consumedItem: Item): string {
  const building = buildingsById.get(recipe.producedIn)
  const consumedRate = recipe.ingredients
    .filter((ingredient) => ingredient.item === consumedItem.id)
    .reduce((sum, ingredient) => sum + ratePerMin(ingredient.amount, recipe.durationSec), 0)
  return `<li data-recipe-id="${escapeHtml(recipe.id)}">
    <div class="use-summary">
      <strong>${escapeHtml(recipe.name.ja)}</strong>
      <span class="num">${escapeHtml(consumedItem.name.ja)} ${fmtRate(consumedRate)} ${rateUnit(consumedItem.id)}</span>
    </div>
    <p class="version">${escapeHtml(building?.name.ja ?? recipe.producedIn)}、${fmtRate(recipe.durationSec)}秒サイクル</p>
    <div class="flow-columns">
      <section><h4>材料</h4>${recipeRateList(recipe.ingredients, recipe.durationSec)}</section>
      <section><h4>製品</h4>${recipeRateList(recipe.products, recipe.durationSec)}</section>
    </div>
  </li>`
}

export function renderItemPage(item: Item): string {
  const indexed = getRecipesForItem(item.id)
  const title = `${item.name.ja} のレシピと使い道 | ${SITE_NAME}`
  const path = itemUrl(item.id)
  const breadcrumbId = `${path}#breadcrumb`
  const category = itemCategory(item)
  const sink = item.sinkPoints > 0 ? `${fmtInteger(item.sinkPoints)} pt/${amountUnit(item.id)}` : '投入不可'
  const hasProducing = indexed.producing.length > 0
  const hasConsuming = indexed.consuming.length > 0
  const description =
    hasProducing && hasConsuming
      ? `${item.name.ja}（${item.name.en}）の作り方${indexed.producing.length}件と使い道${indexed.consuming.length}件を掲載。必要材料、毎分レート、設備、電力、材料効率をゲームデータ${meta.gameVersion}で比較できます。`
      : hasProducing
        ? `${item.name.ja}（${item.name.en}）の作り方${indexed.producing.length}件を掲載。毎分レート、設備、電力、材料効率と、材料として使う自動化レシピが0件であることを確認できます。`
        : hasConsuming
          ? `${item.name.ja}（${item.name.en}）を使うレシピ${indexed.consuming.length}件を掲載。消費レート、製品、分類、シンクポイントと、自動化する作り方が未収録であることを確認できます。`
          : `${item.name.ja}（${item.name.en}）の分類、シンクポイント、アイテムIDを掲載。本サイトの計算対象では作り方・使い道とも0件であることをゲームデータ${meta.gameVersion}に基づいて示します。`
  const intro = item.isRawResource
    ? `${item.name.ja}はマップから外部供給する原料です。変換や副産物として得るレシピがある場合は作り方に、材料として使う工程は使い道に表示します。`
    : !hasProducing && !hasConsuming
      ? `${item.name.ja}は、本サイトが計算対象とする自動化レシピで産出・消費されないアイテムです。分類、英名、ID、シンク可否を参照できます。`
      : !hasProducing
        ? `${item.name.ja}は、収録中の自動化レシピでは生産できません。材料として使う工程と基礎データを確認できます。`
      : `${item.name.ja}を生産する全レシピを、クロック100%・機械1台の条件で比較します。`
  const producing =
    indexed.producing.length === 0
      ? '<p class="empty-state">このアイテムを作る自動化レシピは、現在のゲームデータに収録されていません。</p>'
      : `<div class="grid">${indexed.producing.map((recipe) => renderProducingRecipe(recipe, item)).join('')}</div>`
  const consuming =
    indexed.consuming.length === 0
      ? '<p class="empty-state">このアイテムを材料として使う自動化レシピは、現在のゲームデータに収録されていません。</p>'
      : `<ul class="use-list">${indexed.consuming.map((recipe) => renderConsumingRecipe(recipe, item)).join('')}</ul>`
  const ctaNotice = defaultTargetIsAutomatable(item)
    ? ''
    : '<p class="version">目標は読み込めますが、自動化レシピだけでは入手できない材料、発電副産物、手動入手品などが途中にあるため、外部供給や発電条件を追加しないと解が出ない場合があります。</p>'
  const scopeSection =
    hasProducing || hasConsuming
      ? `<section class="card">
          <h2>数値の見方</h2>
          <p>毎分レートはクロック100%の値です。固体は個/分、液体と気体はm³/minで表示します。電力あたり産出は当該工程だけの比較で、上流工程や採掘の電力を含みません。</p>
          <p class="version">ゲームデータ: ${escapeHtml(meta.gameVersion)} / 生成日: ${PUBLISHED_DATE}</p>
        </section>`
      : `<section class="card">
          <h2>このページの収録範囲</h2>
          <p>${escapeHtml(item.name.ja)}には、本サイトが計算対象とする自動化レシピとの入出力関係がありません。これはゲーム内での入手や使用そのものを否定する表示ではなく、生産ライン計算に使えるレシピが0件という意味です。</p>
          <p>英名は${escapeHtml(item.name.en)}、分類は${escapeHtml(category)}、AWESOMEシンクは${escapeHtml(sink)}です。ゲームデータ更新で自動化レシピが追加された場合は、このページもbuild時に更新されます。</p>
          <p class="version">ゲームデータ: ${escapeHtml(meta.gameVersion)} / 生成日: ${PUBLISHED_DATE}</p>
        </section>`

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: 'ホーム', path: '/' },
          { name: 'アイテム一覧', path: '/items/' },
          { name: item.name.ja, path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'ItemPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: 'ja',
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'Thing',
          '@id': `${SITE_URL}${path}#item`,
          name: item.name.ja,
          alternateName: item.name.en,
          identifier: item.id,
          ...(iconIds.has(item.id) ? { image: `${SITE_URL}/icons/${item.id}.png` } : {}),
        },
      },
    ],
  }

  const body = `${renderBreadcrumbs([
    { label: 'ホーム', href: '/' },
    { label: 'アイテム一覧', href: '/items/' },
    { label: item.name.ja },
  ])}
  <header class="hero">
    <div class="hero-row">
      ${itemIcon(item)}
      <div>
        <p class="eyebrow">Satisfactory アイテムデータ</p>
        <h1>${escapeHtml(item.name.ja)}</h1>
        <p class="lead">${escapeHtml(intro)}</p>
        <div class="meta-row">
          <span class="tag accent">${escapeHtml(category)}</span>
          <span class="tag">AWESOMEシンク: ${escapeHtml(sink)}</span>
          <span class="tag">英名: ${escapeHtml(item.name.en)}</span>
          <span class="tag">ID: ${escapeHtml(item.id)}</span>
        </div>
        ${ctaNotice}
        <a class="cta" href="${escapeHtml(targetPlanHref(item))}">ツールでこのアイテムの計画を作る</a>
      </div>
    </div>
  </header>
  <section aria-labelledby="producing-heading">
    <h2 id="producing-heading" class="section-heading">作り方 <span class="count">${indexed.producing.length}件</span></h2>
    ${producing}
  </section>
  <section aria-labelledby="consuming-heading">
    <h2 id="consuming-heading" class="section-heading">使い道 <span class="count">${indexed.consuming.length}件</span></h2>
    ${consuming}
  </section>
  ${scopeSection}`

  return renderDocument({ title, description, canonicalPath: path, structuredData }, body)
}

function renderItemIndex(): string {
  const title = `Satisfactory アイテム一覧 | ${SITE_NAME}`
  const description = `Satisfactoryの全${items.length}アイテムを原料・固体・液体・気体に分類。収録済みレシピの作り方、使い道、毎分レート、設備、電力、材料効率と、レシピがない場合の収録範囲を確認できます。`
  const path = '/items/'
  const sections = itemGroups
    .map(
      (group) => `<section class="index-section" id="${group.id}">
        <h2>${escapeHtml(group.label)} <span class="count">${group.items.length}件</span></h2>
        <ul class="link-list">
          ${group.items
            .map(
              (item) => `<li><a href="${itemUrl(item.id)}">${escapeHtml(item.name.ja)}</a> <small>${escapeHtml(item.name.en)}</small></li>`,
            )
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
          { name: 'ホーム', path: '/' },
          { name: 'アイテム一覧', path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: 'ja',
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: sortedItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name.ja,
            url: `${SITE_URL}${itemUrl(item.id)}`,
          })),
        },
      },
    ],
  }
  const body = `${renderBreadcrumbs([{ label: 'ホーム', href: '/' }, { label: 'アイテム一覧' }])}
    <header class="hero">
      <p class="eyebrow">全${items.length}アイテム</p>
      <h1>Satisfactory アイテム一覧</h1>
      <p class="lead">アイテムを選ぶと、収録済みの作り方と使い道、機械1台あたりの産出、電力効率、材料効率を確認できます。自動化レシピがないアイテムは、その収録範囲を明示します。</p>
    </header>
    ${sections}`
  return renderDocument({ title, description, canonicalPath: path, structuredData }, body)
}

function articleSchema(
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
          { name: 'ホーム', path: '/' },
          { name: '解説記事', path: '/articles/' },
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
        inLanguage: 'ja',
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
    ],
  }
}

function articleCtaHref(cta: ArticleCta): string {
  if (cta.kind === 'sample') {
    const sample = SAMPLE_PLANS.find((entry) => entry.id === cta.sampleId)
    if (sample === undefined) throw new Error(`unknown sample for article CTA: ${cta.sampleId}`)
    return buildShareUrl('/', sample.snapshot)
  }
  const item = itemsById.get(cta.itemId)
  if (item === undefined) throw new Error(`unknown item for article CTA: ${cta.itemId}`)
  return targetPlanHref(item, cta)
}

function renderRelatedItems(itemIds: readonly string[]): string {
  const unique = [...new Set(itemIds)].filter((itemId) => itemsById.has(itemId))
  if (unique.length === 0) return ''
  return `<section>
    <h2>関連アイテム</h2>
    <ul class="link-list">${unique.map((itemId) => `<li>${itemLink(itemId)}</li>`).join('')}</ul>
  </section>`
}

function renderHandwrittenArticle(article: HandwrittenArticle): string {
  const path = `/articles/${article.slug}/`
  const title = `${article.title} | ${SITE_NAME}`
  const breadcrumbId = `${path}#breadcrumb`
  const sections = article.sections
    .map(
      (section) => `<section>
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </section>`,
    )
    .join('')
  const body = `${renderBreadcrumbs([
    { label: 'ホーム', href: '/' },
    { label: '解説記事', href: '/articles/' },
    { label: article.title },
  ])}
    <header class="hero">
      <p class="eyebrow">Satisfactory 実践ガイド</p>
      <h1>${escapeHtml(article.title)}</h1>
      <p class="lead">${escapeHtml(article.description)}</p>
      <p class="version">公開日: ${PUBLISHED_DATE}</p>
    </header>
    <article class="article-body">
      ${sections}
      ${renderRelatedItems(article.relatedItemIds)}
      <section>
        <h2>ツールで試す</h2>
        <p>記事の条件を読み込んだ状態で計画ツールを開きます。目標レートや許可するレシピは、開いた後で変更できます。</p>
        <a class="cta" href="${escapeHtml(articleCtaHref(article.cta))}">${escapeHtml(article.cta.label)}</a>
      </section>
    </article>`
  return renderDocument(
    {
      title,
      description: article.description,
      canonicalPath: path,
      ogType: 'article',
      publishedTime: PUBLISHED_DATE,
      structuredData: articleSchema(path, article.title, article.description, breadcrumbId),
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

function renderCurrentPlanMetrics(solution: Solution): string {
  const targets = solution.targets
    .map(
      (target) => `<li>${itemLink(target.item)}: <span class="num">${fmtRate(target.producedPerMin)} ${rateUnit(target.item)}</span></li>`,
    )
    .join('')
  const generation = solution.powerGeneration
    ? `<li>総発電量: <span class="num">${fmtPower(solution.powerGeneration.totalMW)} MW</span></li>
       ${solution.powerGeneration.fuelUsage
         .map(
           (fuel) =>
             `<li>発電燃料 ${itemLink(fuel.item)}: <span class="num">${fmtRate(fuel.ratePerMin)} ${rateUnit(fuel.item)}</span></li>`,
         )
         .join('')}`
    : ''
  return `<ul>
    ${targets}
    ${generation}
    <li>製造設備の消費電力: <span class="num">${fmtPower(solution.totalClockedPowerMW)} MW</span></li>
    <li>建てる製造・発電設備: <span class="num">${fmtInteger(solution.totalBuildingCount)}台</span></li>
  </ul>`
}

function renderRawResourceTable(solution: Solution): string {
  const rows = solution.rawResources
    .map(
      (resource) => `<tr>
        <td>${itemLink(resource.item)}</td>
        <td class="num">${fmtRate(resource.ratePerMin)}</td>
        <td>${rateUnit(resource.item)}</td>
      </tr>`,
    )
    .join('')
  return `<div class="table-wrap"><table class="comparison-table">
    <thead><tr><th scope="col">外部から必要な原料</th><th scope="col">レート</th><th scope="col">単位</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`
}

function renderBaselineComparison(current: Solution, baseline: SolveResult): string {
  if (baseline.status !== 'optimal') {
    return '<p class="article-note">通常レシピだけでは、同じ目標を現在の原料上限内で達成できません。</p>'
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
        ? '新規使用'
        : currentRate > baselineRate
          ? `${fmtPercent((currentRate - baselineRate) / baselineRate)}増加`
          : `${fmtPercent((baselineRate - currentRate) / baselineRate)}削減`
    return [
      `<tr>
        <td>${itemLink(itemId)}</td>
        <td class="num">${fmtRate(baselineRate)} → ${fmtRate(currentRate)} ${rateUnit(itemId)}</td>
        <td class="num">${change}</td>
      </tr>`,
    ]
  })
  const powerRatio =
    baseline.totalClockedPowerMW <= 0
      ? 0
      : Math.abs(baseline.totalClockedPowerMW - current.totalClockedPowerMW) /
        baseline.totalClockedPowerMW
  const powerDirection =
    current.totalClockedPowerMW < baseline.totalClockedPowerMW ? '削減' : '増加'
  const powerRow = `<tr>
    <td>製造設備の消費電力</td>
    <td class="num">${fmtPower(baseline.totalClockedPowerMW)} → ${fmtPower(current.totalClockedPowerMW)} MW</td>
    <td class="num">${fmtPercent(powerRatio)}${powerDirection}</td>
  </tr>`
  return `<p>代替レシピを無効にした基準構成と、テンプレートの構成を同じ目標で再計算しました。原料の増減と製造電力の変化を一緒に判断してください。</p>
    <div class="table-wrap"><table class="comparison-table">
      <thead><tr><th scope="col">比較項目</th><th scope="col">基準 → テンプレート</th><th scope="col">変化</th></tr></thead>
      <tbody>${resourceRows.join('')}${powerRow}</tbody>
    </table></div>
    <p class="version">消費電力は製造設備と燃料チェーンの値で、採掘設備を含みません。</p>`
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

function renderWaterCirculation(sample: SamplePlan, solution: Solution): string {
  if (sample.guide?.circulationMeaning === undefined) return ''
  const waterByRecipe = new Map<string, number>()
  for (const step of solution.steps) {
    const producedWater = step.outputs
      .filter((output) => output.item === 'Desc_Water_C')
      .reduce((sum, output) => sum + output.ratePerMin, 0)
    if (producedWater <= 0.005) continue
    waterByRecipe.set(
      step.recipeName.ja,
      (waterByRecipe.get(step.recipeName.ja) ?? 0) + producedWater,
    )
  }
  const totalWater = [...waterByRecipe.values()].reduce((sum, rate) => sum + rate, 0)
  const explanation = sample.guide.circulationMeaning
  const breakdown = [...waterByRecipe]
    .map(
      ([recipeName, rate]) =>
        `<li>${escapeHtml(recipeName)}: <span class="num">${fmtRate(rate)} m³/min</span></li>`,
    )
    .join('')
  return `<section>
    <h2>循環の意味</h2>
    <p>${escapeHtml(explanation)}</p>
    ${
      totalWater <= 0.005
        ? ''
        : `<p class="article-note">ライン全体で再利用する副産物水: <span class="num">${fmtRate(totalWater)} m³/min</span></p>
           <h3>循環水の発生工程</h3><ul>${breakdown}</ul>`
    }
  </section>`
}

function renderLoopArticle(entry: SolvedLoopArticle): string {
  const { sample, current, baseline } = entry
  if (sample.guide === undefined) throw new Error(`missing loop guide: ${sample.id}`)
  const headline = `${sample.title}の仕組みと組み方`
  const path = `/articles/${sample.id}/`
  const title = `${headline} | ${SITE_NAME}`
  const description = `${sample.description}工程の仕組み、実際に建てる際の注意、ゲームデータ${meta.gameVersion}で再計算した原料と電力を解説します。`
  const breadcrumbId = `${path}#breadcrumb`
  const circulation = renderWaterCirculation(sample, current)
  const comparison =
    baseline === undefined
      ? `<p>このテンプレートをビルド時にソルバーで再計算した値です。</p>${renderCurrentPlanMetrics(current)}${renderRawResourceTable(current)}`
      : `${renderBaselineComparison(current, baseline)}<h3>テンプレートで必要な原料</h3>${renderRawResourceTable(current)}`
  const body = `${renderBreadcrumbs([
    { label: 'ホーム', href: '/' },
    { label: '解説記事', href: '/articles/' },
    { label: headline },
  ])}
    <header class="hero">
      <p class="eyebrow">ループ構成ガイド</p>
      <h1>${escapeHtml(headline)}</h1>
      <p class="lead">${escapeHtml(sample.description)}</p>
      <p class="version">ゲームデータ: ${escapeHtml(meta.gameVersion)} / 公開日: ${PUBLISHED_DATE}</p>
    </header>
    <article class="article-body">
      <section>
        <h2>この構成で分かること</h2>
        <p>${escapeHtml(sample.highlight ?? sample.description)}</p>
      </section>
      <section>
        <h2>仕組み</h2>
        <ol>${sample.guide.sections.mechanism.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol>
      </section>
      <section>
        <h2>${baseline === undefined ? 'ビルド時の計算結果' : '計算結果と通常構成の比較'}</h2>
        <p class="version">以下は固定の説明値ではなく、静的ページ生成時にソルバーで再計算したゲームデータ ${escapeHtml(meta.gameVersion)} の結果です。</p>
        ${comparison}
      </section>
      ${circulation}
      <section>
        <h2>ゲーム内で組むときの注意</h2>
        <ul>${sample.guide.sections.tips.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      </section>
      ${renderRelatedItems(loopRelatedItemIds(current, sample))}
      <section>
        <h2>テンプレートを開く</h2>
        <p>目標、代替レシピ、発電方式と燃料を読み込んだ状態でツールを開きます。自分の設備に合わせて目標レートを変更できます。</p>
        <a class="cta" href="${escapeHtml(buildShareUrl('/', sample.snapshot))}">ツールで「${escapeHtml(sample.title)}」を開く</a>
      </section>
    </article>`
  return renderDocument(
    {
      title,
      description,
      canonicalPath: path,
      ogType: 'article',
      publishedTime: PUBLISHED_DATE,
      structuredData: articleSchema(path, headline, description, breadcrumbId),
    },
    body,
  )
}

function renderArticlesIndex(): string {
  const title = `Satisfactory 解説記事 | ${SITE_NAME}`
  const description = `Satisfactoryの生産計画、代替レシピ、発電、サマースループ、Excel出力と、7種類の循環・燃料チェーンを日本語で解説します。`
  const path = '/articles/'
  const handwrittenList = handwrittenArticles
    .map(
      (article) => `<li><a href="/articles/${escapeHtml(article.slug)}/"><strong>${escapeHtml(article.title)}</strong><span>${escapeHtml(article.description)}</span></a></li>`,
    )
    .join('')
  const loopList = loopSamples
    .map(
      (sample) => `<li><a href="/articles/${escapeHtml(sample.id)}/"><strong>${escapeHtml(sample.title)}の仕組みと組み方</strong><span>${escapeHtml(sample.description)}</span></a></li>`,
    )
    .join('')
  const articleEntries = [
    ...handwrittenArticles.map((article) => ({ title: article.title, slug: article.slug })),
    ...loopSamples.map((sample) => ({ title: `${sample.title}の仕組みと組み方`, slug: sample.id })),
  ]
  const breadcrumbId = `${path}#breadcrumb`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema(
        [
          { name: 'ホーム', path: '/' },
          { name: '解説記事', path },
        ],
        breadcrumbId,
      ),
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: title,
        description,
        inLanguage: 'ja',
        breadcrumb: { '@id': `${SITE_URL}${breadcrumbId}` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: articleEntries.length,
          itemListElement: articleEntries.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: article.title,
            url: `${SITE_URL}/articles/${article.slug}/`,
          })),
        },
      },
    ],
  }
  const body = `${renderBreadcrumbs([{ label: 'ホーム', href: '/' }, { label: '解説記事' }])}
    <header class="hero">
      <p class="eyebrow">全${articleSlugs.length}記事</p>
      <h1>Satisfactory 解説記事</h1>
      <p class="lead">ツールの操作からレシピ比較、発電、循環ラインまで、実データと計算結果に沿って解説します。</p>
    </header>
    <section>
      <h2>計画ツールの使い方</h2>
      <ul class="article-list">${handwrittenList}</ul>
    </section>
    <section>
      <h2>ループと燃料チェーン</h2>
      <ul class="article-list">${loopList}</ul>
    </section>`
  return renderDocument({ title, description, canonicalPath: path, structuredData }, body)
}

export function sitemapPaths(): readonly string[] {
  return [
    '/',
    '/privacy.html',
    '/items/',
    ...items.map((item) => itemUrl(item.id)),
    '/articles/',
    ...articleSlugs.map((slug) => `/articles/${slug}/`),
  ]
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

export async function generateStaticPages(outputDirectory: string): Promise<StaticPagesManifest> {
  const output = resolve(outputDirectory)
  await mkdir(output, { recursive: true })

  await Promise.all([
    writeHtml(resolve(output, 'items/index.html'), renderItemIndex()),
    ...items.map((item) =>
      writeHtml(resolve(output, 'items', itemSlug(item.id), 'index.html'), renderItemPage(item)),
    ),
    ...handwrittenArticles.map((article) =>
      writeHtml(
        resolve(output, 'articles', article.slug, 'index.html'),
        renderHandwrittenArticle(article),
      ),
    ),
  ])

  const solvedLoops = await solveLoopArticles()
  await Promise.all([
    writeHtml(resolve(output, 'articles/index.html'), renderArticlesIndex()),
    ...solvedLoops.map((entry) =>
      writeHtml(
        resolve(output, 'articles', entry.sample.id, 'index.html'),
        renderLoopArticle(entry),
      ),
    ),
  ])

  const paths = sitemapPaths()
  await Promise.all([
    writeFile(resolve(output, 'static-pages.css'), STATIC_PAGE_CSS, 'utf8'),
    writeFile(resolve(output, 'sitemap.xml'), renderSitemap(paths), 'utf8'),
  ])

  return {
    itemSlugs: itemSlugValues,
    articleSlugs,
    urls: paths.map((path) => `${SITE_URL}${path}`),
  }
}

const entryFile = process.argv[1]
if (entryFile !== undefined && resolve(entryFile) === fileURLToPath(import.meta.url)) {
  const manifest = await generateStaticPages(resolve('dist'))
  console.log(
    `[build-pages] ${manifest.itemSlugs.length} item pages, ${manifest.articleSlugs.length} article pages, ${manifest.urls.length} sitemap URLs`,
  )
}
