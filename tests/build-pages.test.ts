import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { handwrittenArticlesEn } from '../content/articles/en/index.ts'
import { handwrittenArticles as handwrittenArticlesConst } from '../content/articles/index.ts'
import type { HandwrittenArticle } from '../content/articles/types.ts'
import { LOOP_GUIDES_EN } from '../content/loop-guides/en.ts'
import { items, recipes } from '../src/data/index.ts'
import { SUPPORTED_LOCALES } from '../src/i18n/types.ts'
import {
  aboutPagePath,
  articlePagePath,
  articlesIndexPath,
  itemPagePath,
  itemsIndexPath,
} from '../src/plan/item-pages.ts'
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

/**
 * `as const satisfies` で絞られたリテラル型のままだと、任意プロパティ
 * （publishedDate / relatedArticleSlugs）を持たない記事の型に弾かれるため、
 * テストでは共通の型で見る。
 */
const handwrittenArticles: readonly HandwrittenArticle[] = handwrittenArticlesConst

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

  it('レシピ行とアイテム一覧のリンクにアイコンが名前の前で入る（日英とも）', async () => {
    const ja = await readFile(join(outputDirectory, 'items/iron-plate/index.html'), 'utf8')
    const en = await readFile(join(outputDirectory, 'en/items/iron-plate/index.html'), 'utf8')
    const index = await readFile(join(outputDirectory, 'items/index.html'), 'utf8')
    const rowIcon = (id: string): string =>
      `<img class="item-icon-row" src="/icons/${id}.png" alt="" aria-hidden="true" width="20" height="20" loading="lazy" decoding="async" />`
    const countRowIcons = (html: string): number =>
      html.split('class="item-icon-row"').length - 1

    // 作り方の材料リンク: アイコン → 名前 の順で、アイコンはリンクの中
    expect(ja).toContain(
      `<a href="/items/iron-ingot/">${rowIcon('Desc_IronIngot_C')}鉄のインゴット</a>`,
    )
    expect(en).toContain(
      `<a href="/en/items/iron-ingot/">${rowIcon('Desc_IronIngot_C')}Iron Ingot</a>`,
    )
    // 使い道の行（強化鉄板レシピの材料としての鉄板）にも入る
    expect(ja).toContain(
      `<a href="/items/iron-plate/">${rowIcon('Desc_IronPlate_C')}鉄板</a>`,
    )
    // 見出しの72pxアイコンは意味のあるaltのまま（装飾扱いにしない）
    expect(ja).toContain(
      '<img class="item-icon" src="/icons/Desc_IronPlate_C.png" alt="鉄板" width="72" height="72" />',
    )
    expect(countRowIcons(ja)).toBeGreaterThan(20)
    expect(countRowIcons(en)).toBeGreaterThan(20)

    // アイテム一覧（198件）は全カテゴリの名前の前にアイコンが付く
    expect(index).toContain(
      `<li><a href="/items/iron-plate/">${rowIcon('Desc_IronPlate_C')}鉄板</a> <small>Iron Plate</small></li>`,
    )
    expect(countRowIcons(index)).toBe(items.length - 1) // 画像が無いのは SAM 変動機の1件だけ

    // 画像が無いアイテムは行に何も描かない（「画像未収録」の文字は出さない）
    expect(index).toContain('<li><a href="/items/sam-fluctuator/">SAM 変動機</a>')
    const samConsumer = await readFile(
      join(outputDirectory, 'items/sam-fluctuator/index.html'),
      'utf8',
    )
    expect(samConsumer).toContain('<a href="/items/sam-fluctuator/">SAM 変動機</a>')
    // 「画像未収録」の代替表示は見出しの72px枠1つだけ（レシピの行には出さない）
    expect(samConsumer.split('item-icon-missing').length - 1).toBe(1)
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
  it('手書き10本とループ8本、および記事indexを生成する', async () => {
    const entries = await readdir(join(outputDirectory, 'articles'), { withFileTypes: true })
    const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

    expect(articleSlugs).toHaveLength(18)
    expect(directories.sort()).toEqual([...articleSlugs].sort())
    expect(entries.some((entry) => entry.isFile() && entry.name === 'index.html')).toBe(true)
    for (const slug of articleSlugs) {
      const html = await readFile(join(outputDirectory, 'articles', slug, 'index.html'), 'utf8')
      expect(html, slug).toContain('"@type":"Article"')
      expect(html, slug).toContain('class="cta" href="/#plan=')
    }
  })

  /** 公開日は記事ごとに持てる（省略時はテンプレートの既定日）。日英で同じ日付になる。 */
  it('記事の公開日を日英とも記事ごとの値で焼き込む', async () => {
    const expected = new Map(
      handwrittenArticles.map((article) => [article.slug, article.publishedDate ?? '2026-08-14']),
    )
    for (const slug of articleSlugs) {
      const date = expected.get(slug) ?? '2026-08-14'
      for (const prefix of ['articles', 'en/articles']) {
        const html = await readFile(join(outputDirectory, prefix, slug, 'index.html'), 'utf8')
        expect(html, `${prefix}/${slug}`).toContain(`"datePublished":"${date}"`)
        expect(html, `${prefix}/${slug}`).toContain(`"dateModified":"${date}"`)
      }
    }
    expect(expected.get('coal-power-startup')).toBe('2026-08-26')
    expect(expected.get('production-planning-tutorial')).toBe('2026-08-14')
  })

  it('手書き記事10本の本文が各800〜3000文字に収まる（追加5本は1500文字以上）', () => {
    expect(handwrittenArticles).toHaveLength(10)
    const longFormSlugs = new Set([
      'coal-power-startup',
      'oil-products-basics',
      'aluminum-production-guide',
      'awesome-sink-points',
      'clock-and-efficiency',
    ])
    for (const article of handwrittenArticles) {
      const length = article.sections.flatMap((section) => section.paragraphs).join('').length
      expect(length, article.slug).toBeGreaterThanOrEqual(
        longFormSlugs.has(article.slug) ? 1500 : 800,
      )
      expect(length, article.slug).toBeLessThanOrEqual(3000)
    }
    expect([...longFormSlugs].every((slug) =>
      handwrittenArticles.some((article) => article.slug === slug),
    )).toBe(true)
  })

  /** 関連記事の内部リンクは実在する記事だけを指す（記事間の回遊導線）。 */
  it('関連記事リンクが実在する記事ページを指す', async () => {
    const known = new Set(articleSlugs)
    for (const article of handwrittenArticles) {
      for (const slug of article.relatedArticleSlugs ?? []) {
        expect(known.has(slug), `${article.slug} -> ${slug}`).toBe(true)
        expect(slug, article.slug).not.toBe(article.slug)
      }
    }
    const aluminum = await readFile(
      join(outputDirectory, 'articles/aluminum-production-guide/index.html'),
      'utf8',
    )
    expect(aluminum).toContain('<h2>関連記事</h2>')
    expect(aluminum).toContain('href="/articles/aluminum-water-loop/"')
    const aluminumEn = await readFile(
      join(outputDirectory, 'en/articles/aluminum-production-guide/index.html'),
      'utf8',
    )
    expect(aluminumEn).toContain('<h2>Related guides</h2>')
    expect(aluminumEn).toContain('href="/en/articles/aluminum-water-loop/"')
  })

  /** 追加記事の数値はデータ由来。代表値がページに焼き込まれていることだけ確認する。 */
  it('追加した5本がゲームデータ由来の代表値を含む', async () => {
    const read = async (slug: string, locale: 'ja' | 'en'): Promise<string> =>
      readFile(
        join(outputDirectory, locale === 'ja' ? 'articles' : 'en/articles', slug, 'index.html'),
        'utf8',
      )

    // 石炭発電機 75MW / 石炭15個/分 / 水45m³/min（generators.json）
    expect(await read('coal-power-startup', 'ja')).toContain('石炭15個/分と水45m³/min')
    expect(await read('coal-power-startup', 'en')).toContain('15 Coal/min and 45 m³/min of Water')
    // 精製機のプラスチック（原油30 → プラスチック20 + 廃重油10）
    expect(await read('oil-products-basics', 'ja')).toContain('プラスチック20個/分と廃重油10m³/min')
    expect(await read('oil-products-basics', 'en')).toContain('20 Plastic/min plus 10 m³/min')
    // アルミのインゴット60個/分の原料（ソルバーの解と一致）
    expect(await read('aluminum-production-guide', 'ja')).toContain(
      'ボーキサイト60個/分・石炭30個/分・未加工石英30個/分・水60m³/min',
    )
    expect(await read('aluminum-production-guide', 'en')).toContain(
      '60 Bauxite/min, 30 Coal/min, 30 Raw Quartz/min',
    )
    // シンクポイントの集計（recipes.json 全件）
    expect(await read('awesome-sink-points', 'ja')).toContain('280件のうち101件')
    expect(await read('awesome-sink-points', 'en')).toContain('280 recipes that take ingredients')
    // 電力指数（buildings.json powerExponent）
    expect(await read('clock-and-efficiency', 'ja')).toContain('1.321929乗')
    expect(await read('clock-and-efficiency', 'en')).toContain('1.321929')
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

  it('8件のループ記事がゲーム版とbuild-time solver値を含む', async () => {
    const loopSlugs = SAMPLE_PLANS.filter((sample) => sample.category === 'special').map(
      (sample) => sample.id,
    )
    expect(loopSlugs).toHaveLength(8)
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
    // 簡略版は「代替レシピなしとの差」を build-time solver の実値で出す（本文に数値を書かない）
    const simplified = await readFile(
      join(outputDirectory, 'articles/nuclear-simplified/index.html'),
      'utf8',
    )
    expect(simplified).toContain('ウラン</a></td>')
    expect(simplified).toContain('20.00 → 12.50')
    expect(simplified).toContain('37.5%削減')
    expect(simplified).toContain('硫酸を使わないため、混合機も精製機もラインから消えます')
    const simplifiedEn = await readFile(
      join(outputDirectory, 'en/articles/nuclear-simplified/index.html'),
      'utf8',
    )
    expect(simplifiedEn).toContain('Uranium</a></td>')
    expect(simplifiedEn).toContain('20.00 → 12.50')
    expect(simplifiedEn).toContain('the Blender and the Refinery both disappear from the line')
  })
})

describe('このサイトについて', () => {
  /**
   * 運営者・問い合わせ先・免責を JS なしで読めるページとして出す（AdSense の審査要件）。
   * 日英ミラーで用意し、フッターとトップの静的セクションから常に辿れるようにする。
   */
  it('日英の /about/ に運営者情報・問い合わせ先・免責・広告の説明を焼き込む', async () => {
    const ja = await readFile(join(outputDirectory, 'about/index.html'), 'utf8')
    const en = await readFile(join(outputDirectory, 'en/about/index.html'), 'utf8')

    expect(ja).toContain('<title>このサイトについて | Satisfactory 生産計画ツール</title>')
    expect(ja).toContain('日本の個人開発者が個人で開発・運営しています')
    expect(ja).toContain('href="https://github.com/mikirice/satisfactory-planner/issues"')
    expect(ja).toContain('Coffee Stain Studios とは無関係です')
    expect(ja).toContain('広告を掲載する場合があります')
    expect(ja).toContain('href="/privacy.html"')
    expect(en).toContain('href="/en/privacy.html"')
    expect(ja).toContain('href="/items/"')
    expect(ja).toContain('href="/articles/"')
    expect(ja).toContain('"@type":"AboutPage"')
    expect(ja).not.toContain('type="module"')

    expect(en).toContain('<title>About this site | Satisfactory Production Planner</title>')
    expect(en).toContain('individual developer based in Japan')
    expect(en).toContain('href="https://github.com/mikirice/satisfactory-planner/issues"')
    expect(en).toContain('not affiliated with Coffee Stain Studios')
    expect(en).toContain('href="/en/items/"')
    expect(en).toContain('href="/en/articles/"')
    expect(en).toContain('"inLanguage":"en"')
    expect(JAPANESE_CHARACTER.test(mainSection(en))).toBe(false)
  })

  it('日英が相互に hreflang で結ばれ、フッターから辿れる', async () => {
    const ja = await readFile(join(outputDirectory, 'about/index.html'), 'utf8')
    const en = await readFile(join(outputDirectory, 'en/about/index.html'), 'utf8')
    const expected = {
      ja: 'https://satisfactory-planner.net/about/',
      en: 'https://satisfactory-planner.net/en/about/',
      'x-default': 'https://satisfactory-planner.net/about/',
    }

    expect(alternateLinks(ja)).toEqual(expected)
    expect(alternateLinks(en)).toEqual(expected)
    expect(aboutPagePath('ja')).toBe('/about/')
    expect(aboutPagePath('en')).toBe('/en/about/')
    expect(aboutPagePath('de')).toBe('/en/about/')

    // フッターの導線（全静的ページ共通のテンプレート）
    const itemPage = await readFile(join(outputDirectory, 'items/iron-plate/index.html'), 'utf8')
    const enItemPage = await readFile(
      join(outputDirectory, 'en/items/iron-plate/index.html'),
      'utf8',
    )
    expect(itemPage).toContain('<a href="/about/">このサイトについて</a>')
    expect(enItemPage).toContain('<a href="/en/about/">About</a>')
  })
})

describe('sitemap', () => {
  it('日本語ページと英語ミラーのURLを1件ずつ収録する', async () => {
    const xml = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    // 日本語 221（トップ・privacy・about・一覧2・アイテム198・記事18）
    // ＋ 英語ミラー 220（トップだけ無い）
    expect(sitemapPaths()).toHaveLength(441)
    expect(manifest.urls).toHaveLength(441)
    expect(locations).toEqual(manifest.urls)
    expect(new Set(locations).size).toBe(locations.length)
    expect(locations).toContain('https://satisfactory-planner.net/')
    expect(locations).toContain('https://satisfactory-planner.net/privacy.html')
    expect(locations).toContain('https://satisfactory-planner.net/about/')
    expect(locations).toContain('https://satisfactory-planner.net/en/about/')
    expect(locations).toContain('https://satisfactory-planner.net/items/iron-plate/')
    expect(locations).toContain(
      'https://satisfactory-planner.net/articles/production-planning-tutorial/',
    )
    expect(locations).toContain('https://satisfactory-planner.net/en/items/')
    expect(locations).toContain('https://satisfactory-planner.net/en/items/iron-plate/')
    expect(locations).toContain('https://satisfactory-planner.net/en/articles/')
    expect(locations).toContain(
      'https://satisfactory-planner.net/en/articles/production-planning-tutorial/',
    )
    // SPA のトップは1URLで言語が切り替わるので、英語ミラーは作らない
    expect(locations).not.toContain('https://satisfactory-planner.net/en/')
    // プライバシーポリシーは日英で別ファイル（public/privacy.html と public/en/privacy.html）
    expect(locations).toContain('https://satisfactory-planner.net/en/privacy.html')
  })
})

describe('アプリ内リンクと生成ページのパス一致', () => {
  /**
   * アプリ（表のアイテム名リンク）と静的ページ生成は src/plan/item-pages.ts の同じ実装を使う。
   * ここが割れると「リンクだけ404」になるので、既知アイテムと全件の両方で突き合わせる。
   */
  it('既知アイテム3件でリンク先と生成ファイルが一致する', async () => {
    const known = [
      ['Desc_IronPlate_C', '/items/iron-plate/'],
      ['Desc_Water_C', '/items/water/'],
      ['Desc_ModularFrameHeavy_C', '/items/modular-frame-heavy/'],
    ] as const

    for (const [itemId, expectedPath] of known) {
      expect(itemPagePath(itemId)).toBe(expectedPath)
      const html = await readFile(join(outputDirectory, expectedPath, 'index.html'), 'utf8')
      expect(html).toContain(`<link rel="canonical" href="https://satisfactory-planner.net${expectedPath}"`)
    }
  })

  it('全アイテムでアプリのリンク先が生成URLと一致する', () => {
    const generated = new Set(manifest.urls)
    const mismatched = items.filter(
      (item) => !generated.has(`https://satisfactory-planner.net${itemPagePath(item.id)}`),
    )

    expect(mismatched.map((item) => item.id)).toEqual([])
    expect(items.every((item) => itemPagePath(item.id) === `/items/${itemSlug(item.id)}/`)).toBe(
      true,
    )
  })

  it('ページを持たないID（建物・未知ID）にはリンクを作らない', () => {
    expect(itemPagePath('Build_SmelterMk1_C')).toBeNull()
    expect(itemPagePath('Desc_DoesNotExist_C')).toBeNull()
    expect(itemPagePath('Build_SmelterMk1_C', 'en')).toBeNull()
  })

  /**
   * Stage 3: 表示言語で静的ページのリンク先が変わる。ja だけ日本語ページを持ち、
   * en と Tier 2 の10言語は英語ミラーへ送る（src/plan/item-pages.ts が正典）。
   */
  it('日本語は既存URL、英語とTier 2言語は /en/ ミラーへ送る', () => {
    expect(itemPagePath('Desc_IronPlate_C')).toBe('/items/iron-plate/')
    expect(itemPagePath('Desc_IronPlate_C', 'ja')).toBe('/items/iron-plate/')
    expect(itemPagePath('Desc_IronPlate_C', 'en')).toBe('/en/items/iron-plate/')
    expect(itemPagePath('Desc_IronPlate_C', 'de')).toBe('/en/items/iron-plate/')
    expect(itemPagePath('Desc_IronPlate_C', 'zh-Hant')).toBe('/en/items/iron-plate/')

    expect(itemsIndexPath('ja')).toBe('/items/')
    expect(itemsIndexPath('ko')).toBe('/en/items/')
    expect(articlesIndexPath('ja')).toBe('/articles/')
    expect(articlesIndexPath('pt-BR')).toBe('/en/articles/')
    expect(articlePagePath('excel-export-guide', 'ja')).toBe('/articles/excel-export-guide/')
    expect(articlePagePath('excel-export-guide', 'fr')).toBe(
      '/en/articles/excel-export-guide/',
    )
  })

  it('全アイテム・全対応言語でアプリのリンク先が生成URLに存在する', () => {
    const generated = new Set(manifest.urls)
    const missing = SUPPORTED_LOCALES.flatMap((locale) =>
      items
        .filter(
          (item) => !generated.has(`https://satisfactory-planner.net${itemPagePath(item.id, locale)}`),
        )
        .map((item) => `${locale}:${item.id}`),
    )

    expect(missing).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 英語ミラー（Stage 3）
// ---------------------------------------------------------------------------

/** ページの hreflang（言語 → 絶対URL）。 */
function alternateLinks(html: string): Record<string, string> {
  const matches = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g)]
  return Object.fromEntries(matches.map((match) => [match[1]!, match[2]!]))
}

const JAPANESE_CHARACTER = /[々〆〇〻぀-ヿ㐀-鿿ｦ-ﾟ]/

/** 本文（<main>）だけを取り出す。ヘッダーの言語切替（日本語）を判定から外すため。 */
function mainSection(html: string): string {
  const start = html.indexOf('<main')
  const end = html.indexOf('</main>')
  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)
  return html.slice(start, end)
}

describe('英語ミラーの生成', () => {
  it('アイテム198件＋一覧、記事18本＋索引を /en/ に出す', async () => {
    const itemEntries = await readdir(join(outputDirectory, 'en/items'), { withFileTypes: true })
    const articleEntries = await readdir(join(outputDirectory, 'en/articles'), {
      withFileTypes: true,
    })

    expect(
      itemEntries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(),
    ).toEqual([...manifest.itemSlugs].sort())
    expect(itemEntries.some((entry) => entry.isFile() && entry.name === 'index.html')).toBe(true)
    expect(
      articleEntries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(),
    ).toEqual([...articleSlugs].sort())
    expect(articleEntries.some((entry) => entry.isFile() && entry.name === 'index.html')).toBe(
      true,
    )
  })

  it('英訳コンテンツが日本語の記事・ループテンプレートと1対1で揃っている', () => {
    expect(handwrittenArticlesEn.map((article) => article.slug)).toEqual(
      handwrittenArticles.map((article) => article.slug),
    )
    // CTA の飛び先（サンプル / アイテム）は翻訳で変えない
    for (const [index, article] of handwrittenArticlesEn.entries()) {
      const source = handwrittenArticles[index]!
      expect(article.cta.kind, article.slug).toBe(source.cta.kind)
      expect(article.cta.label, article.slug).not.toBe(source.cta.label)
      expect(article.relatedItemIds, article.slug).toEqual(source.relatedItemIds)
    }
    const loopSlugs = articleSlugs.filter(
      (slug) => !handwrittenArticles.some((article) => article.slug === slug),
    )
    expect(Object.keys(LOOP_GUIDES_EN).sort()).toEqual([...loopSlugs].sort())
  })

  it('鉄板ページを英語の公式名・単位・ラベルで焼き込む', async () => {
    const html = await readFile(join(outputDirectory, 'en/items/iron-plate/index.html'), 'utf8')

    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<meta property="og:locale" content="en_US" />')
    expect(html).toContain(
      '<title>Iron Plate recipes and uses | Satisfactory Production Planner</title>',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://satisfactory-planner.net/en/items/iron-plate/" />',
    )
    expect(html).toContain('data-recipe-id="Recipe_IronPlate_C"')
    expect(html).toContain('data-recipe-id="Recipe_Alternate_CoatedIronPlate_C"')
    expect(html).toContain('>Alternate: Steel Cast Plate<')
    expect(html).toContain('20.00 items/min')
    expect(html).toContain('4.00 MW')
    expect(html).toContain('5.00 items/min / MW')
    expect(html).toContain('href="/en/items/iron-ingot/"')
    expect(html).toContain('Plan this item in the planner')
    // 日本語名は照合用に1か所だけ残す（ja ページの「英名: 」の裏返し）
    expect(html).toContain('Japanese: 鉄板')
    expect(html).toContain('"inLanguage":"en"')
    expect(html).not.toContain('type="module"')
  })

  it('レシピが0件のアイテムも英語で収録範囲を説明する', async () => {
    const html = await readFile(
      join(outputDirectory, 'en/items/bp-equipment-descriptor-nobelisk-detonator/index.html'),
      'utf8',
    )

    expect(html).toContain('zero recipes available for production line calculations')
    expect(html).toContain('What this page covers')
  })

  it('英語ページの本文に日本語が残らない（併記の和名だけ許す）', async () => {
    for (const slug of manifest.itemSlugs) {
      const html = await readFile(join(outputDirectory, 'en/items', slug, 'index.html'), 'utf8')
      // 個別ページだけは照合用に日本語名を1か所出す（ja ページの「英名: 」の裏返し）
      const stripped = mainSection(html)
        .replaceAll(/Japanese: [^<]*/g, '')
        .replaceAll(/Its Japanese name is [^,]*/g, '')

      expect(JAPANESE_CHARACTER.test(stripped), slug).toBe(false)
    }
    for (const slug of articleSlugs) {
      const html = await readFile(join(outputDirectory, 'en/articles', slug, 'index.html'), 'utf8')

      expect(JAPANESE_CHARACTER.test(mainSection(html)), slug).toBe(false)
    }
    for (const file of ['en/articles/index.html', 'en/items/index.html']) {
      const index = await readFile(join(outputDirectory, file), 'utf8')

      expect(JAPANESE_CHARACTER.test(mainSection(index)), file).toBe(false)
    }
    // 日本語の一覧は公式英名を併記したまま（ゲーム内表記との突き合わせ用）
    const jaIndex = await readFile(join(outputDirectory, 'items/index.html'), 'utf8')
    expect(jaIndex).toContain('<small>Iron Plate</small>')
  })

  it('ループ記事は英訳の本文と、日本語版と同じbuild-time solver値を持つ', async () => {
    const oil = await readFile(
      join(outputDirectory, 'en/articles/oil-loop-complete/index.html'),
      'utf8',
    )

    expect(oil).toContain('How the Complete Oil Recycling Loop Works and How to Build It')
    expect(oil).toContain('Turn the Polymer Resin byproduct into Rubber with Residual Rubber')
    expect(oil).toContain('900.00 → 200.00 m³/min')
    expect(oil).toContain('77.8% less')
    expect(oil).toContain('0.00 → 666.67 m³/min')
    expect(oil).toContain('Newly used')

    const battery = await readFile(
      join(outputDirectory, 'en/articles/battery-water-loop/index.html'),
      'utf8',
    )
    expect(battery).toContain('Byproduct Water reused across the line')
    expect(battery).toContain('135.00 m³/min')
    expect(battery).toContain('Battery: <span class="num">90.00 m³/min')

    const nuclear = await readFile(
      join(outputDirectory, 'en/articles/nuclear-reprocessing/index.html'),
      'utf8',
    )
    // 代替レシピの基準構成が無いテンプレートは「ビルド時の計算結果」側の表示になる
    expect(nuclear).toContain('Calculated at build time')
    expect(nuclear).toContain('Total power generated')
  })

  it('英語の手書き記事は全文訳とCTAを持ち、共有URLが警告なく復元できる', async () => {
    const tutorial = await readFile(
      join(outputDirectory, 'en/articles/production-planning-tutorial/index.html'),
      'utf8',
    )
    expect(tutorial).toContain('Your First Production Plan — A Guided Tour of the Planner')
    expect(tutorial).toContain('Read the five result tabs')

    for (const slug of articleSlugs) {
      const html = await readFile(join(outputDirectory, 'en/articles', slug, 'index.html'), 'utf8')
      const href = html.match(/class="cta" href="([^"]*#plan=[^"]+)"/)?.[1]
      expect(href, slug).toBeDefined()
      const encoded = readPlanParam(href!.slice(href!.indexOf('#')))
      expect(encoded, slug).not.toBeNull()
      const parsed = decodePlan(encoded!)
      expect(parsed.ok, slug).toBe(true)
      if (parsed.ok) expect(parsed.warnings, slug).toEqual([])
    }
  })

  it('英語アイテムページのCTAも全件が警告なく復元できる', async () => {
    for (const item of items) {
      const html = await readFile(
        join(outputDirectory, 'en/items', itemSlug(item.id), 'index.html'),
        'utf8',
      )
      const href = html.match(/class="cta" href="([^"]+)"/)?.[1]
      const encoded = href === undefined ? null : readPlanParam(href.slice(href.indexOf('#')))
      const parsed = encoded === null ? null : decodePlan(encoded)

      expect(parsed?.ok, item.id).toBe(true)
      if (!parsed?.ok) continue
      expect(parsed.warnings, item.id).toEqual([])
      expect(parsed.input.targets[0]?.item, item.id).toBe(item.id)
    }
  })
})

describe('hreflang', () => {
  it('日英ページが相互に指し合い、x-defaultは日本語版を指す', async () => {
    const pages = [
      ['items/index.html', 'en/items/index.html', '/items/', '/en/items/'],
      ['articles/index.html', 'en/articles/index.html', '/articles/', '/en/articles/'],
      [
        'articles/oil-loop-complete/index.html',
        'en/articles/oil-loop-complete/index.html',
        '/articles/oil-loop-complete/',
        '/en/articles/oil-loop-complete/',
      ],
      [
        'articles/excel-export-guide/index.html',
        'en/articles/excel-export-guide/index.html',
        '/articles/excel-export-guide/',
        '/en/articles/excel-export-guide/',
      ],
      ...manifest.itemSlugs.map((slug) => [
        `items/${slug}/index.html`,
        `en/items/${slug}/index.html`,
        `/items/${slug}/`,
        `/en/items/${slug}/`,
      ]),
    ] as const

    for (const [jaFile, enFile, jaPath, enPath] of pages) {
      const expected = {
        ja: `https://satisfactory-planner.net${jaPath}`,
        en: `https://satisfactory-planner.net${enPath}`,
        'x-default': `https://satisfactory-planner.net${jaPath}`,
      }
      const jaHtml = await readFile(join(outputDirectory, jaFile), 'utf8')
      const enHtml = await readFile(join(outputDirectory, enFile), 'utf8')

      expect(alternateLinks(jaHtml), jaFile).toEqual(expected)
      expect(alternateLinks(enHtml), enFile).toEqual(expected)
    }
  })

  it('ヘッダーの言語切替が相手言語のページを指す', async () => {
    const jaHtml = await readFile(join(outputDirectory, 'items/iron-plate/index.html'), 'utf8')
    const enHtml = await readFile(join(outputDirectory, 'en/items/iron-plate/index.html'), 'utf8')

    expect(jaHtml).toContain(
      '<a class="lang-switch" href="/en/items/iron-plate/" hreflang="en" lang="en"',
    )
    expect(jaHtml).toContain('>🇺🇸 English</a>')
    expect(enHtml).toContain(
      '<a class="lang-switch" href="/items/iron-plate/" hreflang="ja" lang="ja"',
    )
    expect(enHtml).toContain('>🇯🇵 日本語</a>')
  })
})
