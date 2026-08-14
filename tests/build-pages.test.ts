import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { handwrittenArticles } from '../content/articles/index.ts'
import { items, recipes } from '../src/data/index.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { decodePlan, readPlanParam } from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import {
  articleSlugs,
  generateStaticPages,
  itemSlug,
  sitemapPaths,
} from '../scripts/build-pages.ts'
import type { StaticPagesManifest } from '../scripts/build-pages.ts'

let outputDirectory = ''
let manifest: StaticPagesManifest

beforeAll(async () => {
  outputDirectory = await mkdtemp(join(tmpdir(), 'satisfactory-static-pages-'))
  manifest = await generateStaticPages(outputDirectory)
}, 30_000)

afterAll(async () => {
  if (outputDirectory !== '') await rm(outputDirectory, { recursive: true, force: true })
})

describe('アイテムslug', () => {
  it('198件すべてが一意のASCII slugになり、代表IDの対応が変わらない', () => {
    expect(manifest.itemSlugs).toHaveLength(198)
    expect(new Set(manifest.itemSlugs).size).toBe(198)
    expect(manifest.itemSlugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(
      true,
    )
    expect(itemSlug('Desc_IronPlate_C')).toBe('iron-plate')
    expect(itemSlug('Desc_AlienDNACapsule_C')).toBe('alien-dna-capsule')
    expect(itemSlug('Desc_Crystal_mk2_C')).toBe('crystal-mk2')
    expect(itemSlug('BP_EquipmentDescriptorCandyCane_C')).toBe(
      'bp-equipment-descriptor-candy-cane',
    )
    const mappingChecksum = createHash('sha256')
      .update(items.map((item) => `${item.id}:${itemSlug(item.id)}`).sort().join('\n'))
      .digest('hex')
    expect(mappingChecksum).toBe('e7275f2124b867da2a0e5d3cab1c81bdc5e9789d4e18afb2ad9f285a7ce2b6f7')
  })
})

describe('アイテム静的ページ', () => {
  it('鉄板ページに全レシピ、毎分レート、比較指標、内部リンクを焼き込む', async () => {
    const html = await readFile(join(outputDirectory, 'items/iron-plate/index.html'), 'utf8')

    expect(html).toContain('鉄板 のレシピと使い道')
    expect(html).toContain('data-recipe-id="Recipe_IronPlate_C"')
    expect(html).toContain('data-recipe-id="Recipe_Alternate_CoatedIronPlate_C"')
    expect(html).toContain('data-recipe-id="Recipe_Alternate_SteelCastedPlate_C"')
    expect(html).toContain('20.00 個/分')
    expect(html).toContain('30.00 個/分')
    expect(html).toContain('4.00 MW')
    expect(html).toContain('5.00 個/分 / MW')
    expect(html).toContain('0.67 個')
    expect(html).toContain('href="/items/iron-ingot/"')
    expect(html).toContain('"@type":"ItemPage"')
    expect(html).toContain('"@type":"BreadcrumbList"')
    expect(html).not.toContain('type="module"')
  })

  it('全アイテムCTAのhashを既存シリアライザで復元できる', async () => {
    for (const item of items) {
      const html = await readFile(
        join(outputDirectory, 'items', itemSlug(item.id), 'index.html'),
        'utf8',
      )
      const href = html.match(
        /class="cta" href="([^"]+)">ツールでこのアイテムの計画を作る<\/a>/,
      )?.[1]
      expect(href, item.id).toBeDefined()
      const encoded = readPlanParam(href!.slice(href!.indexOf('#')))
      expect(encoded, item.id).not.toBeNull()
      const parsed = decodePlan(encoded!)
      expect(parsed.ok, item.id).toBe(true)
      if (!parsed.ok) continue
      expect(parsed.warnings, item.id).toEqual([])
      expect(parsed.input.targets, item.id).toHaveLength(1)
      expect(parsed.input.targets[0]?.item, item.id).toBe(item.id)
      expect(parsed.input.targets[0]?.ratePerMin, item.id).toBeGreaterThan(0)
    }
  })

  it('既定CTAで解けない目標は追加条件が必要なことを明示する', async () => {
    const standardRecipeIds = recipes
      .filter((recipe) => !recipe.isAlternate)
      .map((recipe) => recipe.id)

    for (const item of items) {
      const html = await readFile(
        join(outputDirectory, 'items', itemSlug(item.id), 'index.html'),
        'utf8',
      )
      const href = html.match(/class="cta" href="([^"]+)"/)?.[1]
      const encoded = href === undefined ? null : readPlanParam(href.slice(href.indexOf('#')))
      const parsed = encoded === null ? null : decodePlan(encoded)
      expect(parsed?.ok, item.id).toBe(true)
      if (!parsed?.ok) continue

      const result = await solveProduction({
        targets: parsed.input.targets.map(({ item: targetItem, ratePerMin }) => ({
          item: targetItem,
          ratePerMin,
        })),
        enabledRecipes: [...standardRecipeIds, ...Object.keys(parsed.input.enabledAlternates)],
      })
      const hasNotice = html.includes(
        '外部供給や発電条件を追加しないと解が出ない場合があります',
      )
      expect(hasNotice, item.id).toBe(result.status !== 'optimal')
    }
  })

  it('代替レシピだけで作れるアイテムはCTAから実際に求解できる', async () => {
    const cases = [
      ['bp-item-descriptor-portable-miner', 'Recipe_Alternate_AutomatedMiner_C'],
      ['dissolved-silica', 'Recipe_Alternate_Quartz_Purified_C'],
    ] as const
    const standardRecipeIds = recipes
      .filter((recipe) => !recipe.isAlternate)
      .map((recipe) => recipe.id)

    for (const [slug, alternateRecipeId] of cases) {
      const html = await readFile(join(outputDirectory, 'items', slug, 'index.html'), 'utf8')
      const href = html.match(/class="cta" href="([^"]+)"/)?.[1]
      const encoded = href === undefined ? null : readPlanParam(href.slice(href.indexOf('#')))
      const parsed = encoded === null ? null : decodePlan(encoded)

      expect(parsed?.ok, slug).toBe(true)
      if (!parsed?.ok) continue
      expect(parsed.input.enabledAlternates, slug).toHaveProperty(alternateRecipeId)
      const result = await solveProduction({
        targets: parsed.input.targets.map(({ item, ratePerMin }) => ({ item, ratePerMin })),
        enabledRecipes: [...standardRecipeIds, ...Object.keys(parsed.input.enabledAlternates)],
      })
      expect(result.status, slug).toBe('optimal')
    }
  })

  it('自動化レシピがないアイテムは説明とmeta descriptionで収録範囲を明示する', async () => {
    const html = await readFile(
      join(outputDirectory, 'items/bp-equipment-descriptor-nobelisk-detonator/index.html'),
      'utf8',
    )

    expect(html).toContain('作り方・使い道とも0件')
    expect(html).toContain('生産ライン計算に使えるレシピが0件という意味です')
    expect(html).not.toContain('必要材料、毎分レート、設備、電力、材料効率を')
  })

  it('手動入手品や発電副産物が上流に必要なCTAは追加条件を明示する', async () => {
    const fabric = await readFile(join(outputDirectory, 'items/fabric/index.html'), 'utf8')
    const nuclearWaste = await readFile(
      join(outputDirectory, 'items/nuclear-waste/index.html'),
      'utf8',
    )

    for (const html of [fabric, nuclearWaste]) {
      expect(html).toContain('外部供給や発電条件を追加しないと解が出ない場合があります')
    }
  })
})

describe('記事静的ページ', () => {
  it('手書き5本とループ7本、および記事indexを生成する', async () => {
    const entries = await readdir(join(outputDirectory, 'articles'), { withFileTypes: true })
    const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

    expect(articleSlugs).toHaveLength(12)
    expect(directories.sort()).toEqual([...articleSlugs].sort())
    expect(entries.some((entry) => entry.isFile() && entry.name === 'index.html')).toBe(true)
    for (const slug of articleSlugs) {
      const html = await readFile(join(outputDirectory, 'articles', slug, 'index.html'), 'utf8')
      expect(html, slug).toContain('"@type":"Article"')
      expect(html, slug).toContain('"datePublished":"2026-08-14"')
      expect(html, slug).toContain('class="cta" href="/#plan=')
    }
  })

  it('手書き記事5本の本文が各800〜1500文字に収まる', () => {
    expect(handwrittenArticles).toHaveLength(5)
    for (const article of handwrittenArticles) {
      const length = article.sections.flatMap((section) => section.paragraphs).join('').length
      expect(length, article.slug).toBeGreaterThanOrEqual(800)
      expect(length, article.slug).toBeLessThanOrEqual(1500)
    }
  })

  it('全記事CTAのhashを警告なしで復元できる', async () => {
    for (const slug of articleSlugs) {
      const html = await readFile(join(outputDirectory, 'articles', slug, 'index.html'), 'utf8')
      const href = html.match(/class="cta" href="([^"]*#plan=[^"]+)"/)?.[1]
      expect(href, slug).toBeDefined()
      const encoded = readPlanParam(href!.slice(href!.indexOf('#')))
      expect(encoded, slug).not.toBeNull()
      const parsed = decodePlan(encoded!)
      expect(parsed.ok, slug).toBe(true)
      if (parsed.ok) expect(parsed.warnings, slug).toEqual([])
    }
  })

  it('7件のループ記事がゲーム版とbuild-time solver値を含む', async () => {
    const loopSlugs = SAMPLE_PLANS.filter((sample) => sample.category === 'special').map(
      (sample) => sample.id,
    )
    expect(loopSlugs).toHaveLength(7)
    const oil = await readFile(
      join(outputDirectory, 'articles/oil-loop-complete/index.html'),
      'utf8',
    )
    expect(oil).toContain('ゲームデータ: 1.1.x')
    expect(oil).toContain('900.00 → 200.00 m³/min')
    expect(oil).toContain('77.8%削減')
    expect(oil).toContain('0.00 → 666.67 m³/min')
    expect(oil).toContain('新規使用')
    expect(oil).toContain('「残留ゴム」でゴムにし、循環を起動します')
    expect(oil).toContain('手動投入なしで起動できます')
    const turbofuel = await readFile(
      join(outputDirectory, 'articles/turbofuel-power/index.html'),
      'utf8',
    )
    expect(turbofuel).toContain('SAMを「活性SAM」に変え、鉄鉱石と変換機へ入れて硫黄を用意します')
    expect(turbofuel).toContain('鉄鉱石</a></td>')
    expect(turbofuel).toContain('120.00')
    expect(turbofuel).toContain('SAM</a></td>')
    expect(turbofuel).toContain('16.00')
    const battery = await readFile(
      join(outputDirectory, 'articles/battery-water-loop/index.html'),
      'utf8',
    )
    expect(battery).toContain('ライン全体で再利用する副産物水:')
    expect(battery).toContain('135.00 m³/min')
    expect(battery).toContain('バッテリー: <span class="num">90.00 m³/min')
    expect(battery).toContain('アルミのスクラップ: <span class="num">45.00 m³/min')
    const nuclear = await readFile(
      join(outputDirectory, 'articles/nuclear-reprocessing/index.html'),
      'utf8',
    )
    expect(nuclear).toContain('FICSONIUM燃料棒は再処理チェーンの終点として取り出します')
    expect(nuclear).not.toContain('FICSONIUM燃料棒を発電に使い')
  })
})

describe('sitemap', () => {
  it('生成した全ページとトップ・privacyのURLを1件ずつ収録する', async () => {
    const xml = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    expect(sitemapPaths()).toHaveLength(214)
    expect(manifest.urls).toHaveLength(214)
    expect(locations).toEqual(manifest.urls)
    expect(new Set(locations).size).toBe(locations.length)
    expect(locations).toContain('https://satisfactory-planner.net/')
    expect(locations).toContain('https://satisfactory-planner.net/privacy.html')
    expect(locations).toContain('https://satisfactory-planner.net/items/iron-plate/')
    expect(locations).toContain(
      'https://satisfactory-planner.net/articles/production-planning-tutorial/',
    )
  })
})
