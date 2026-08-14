/**
 * 静的ページ（/items/…, /articles/…, /en/…）専用のミニ辞書。
 *
 * 方針（計画書 §5・Stage 3）:
 *  - **UI と重なる語は書かない**。「作り方」「使い道」「製造設備」「個/分」などはアプリの
 *    UiDictionary（src/i18n/locales/*.ts）から引く。訳語が2か所に分かれると必ずズレるため。
 *  - ここに置くのは**静的ページにしか出ない文**（meta description、リード文、収録範囲の
 *    注記、記事テンプレートの見出しなど）だけ。
 *  - 日本語の値は Stage 2 までに公開済みのページと**同じ文字列**を保つ。文言を変えると
 *    既存ページの内容と tests/build-pages.test.ts の固定値が同時に動くため。
 *  - ゲーム内の固有名詞は書かない（names データが唯一の語彙源。計画書 §8）。
 */
import { en as enUi } from '../../src/i18n/locales/en.ts'
import { ja as jaUi } from '../../src/i18n/locales/ja.ts'
import type { UiDictionary } from '../../src/i18n/types.ts'

/** 静的ページを出力する言語。Tier 2 は当面 en ミラーへ寄せる（src/plan/item-pages.ts 参照）。 */
export const STATIC_LOCALES = ['ja', 'en'] as const

export type StaticLocale = (typeof STATIC_LOCALES)[number]

/** そのロケールのアプリ辞書（UI と共通の語はここから引く）。 */
export const UI_DICTIONARIES: Readonly<Record<StaticLocale, UiDictionary>> = {
  ja: jaUi,
  en: enUi,
}

/** <html lang> と og:locale。 */
export const HTML_LANG: Readonly<Record<StaticLocale, string>> = { ja: 'ja', en: 'en' }
export const OG_LOCALE: Readonly<Record<StaticLocale, string>> = { ja: 'ja_JP', en: 'en_US' }

/** 言語切替リンクの表記（自称表記。src/i18n/endonyms.ts と同じ語）。 */
export const ENDONYM: Readonly<Record<StaticLocale, string>> = { ja: '日本語', en: 'English' }

const jaLabels = {
  siteName: 'Satisfactory 生産計画ツール',

  // --- レイアウト（templates.ts） ---
  skipToContent: '本文へ移動',
  breadcrumbNavLabel: 'パンくず',
  siteNavLabel: 'サイト内ナビゲーション',
  footerNavLabel: 'フッターナビゲーション',
  home: 'ホーム',
  planner: '計画ツール',
  /** 言語切替リンクの読み上げ文（表示は ENDONYM のまま）。 */
  switchLanguageTo: (language: string): string => `${language}で読む`,

  // --- アイテムページ ---
  itemPageTitle: (name: string): string => `${name} のレシピと使い道`,
  itemEyebrow: 'Satisfactory アイテムデータ',
  iconMissing: '画像未収録',
  iconMissingFor: (name: string): string => `${name}の画像は未収録`,
  recipeCount: (count: number): string => `${count}件`,
  itemCount: (count: number): string => `${count}件`,
  sinkTag: (value: string): string => `AWESOMEシンク: ${value}`,
  sinkPoints: (points: string, unit: string): string => `${points} pt/${unit}`,
  sinkUnavailable: '投入不可',
  /** もう一方の言語での名前（ja ページには英名、en ページには日本語名を出す）。 */
  otherNameTag: (name: string): string => `英名: ${name}`,
  idTag: (id: string): string => `ID: ${id}`,
  itemCta: 'ツールでこのアイテムの計画を作る',
  /** CTA の共有URLに載せるプラン名（開いた直後の見出しになる）。 */
  itemPlanName: (name: string): string => `${name} 生産計画`,
  itemCtaNotice:
    '目標は読み込めますが、自動化レシピだけでは入手できない材料、発電副産物、手動入手品などが途中にあるため、外部供給や発電条件を追加しないと解が出ない場合があります。',

  itemDescriptionBoth: (
    name: string,
    otherName: string,
    producing: number,
    consuming: number,
    gameVersion: string,
  ): string =>
    `${name}（${otherName}）の作り方${producing}件と使い道${consuming}件を掲載。必要材料、毎分レート、設備、電力、材料効率をゲームデータ${gameVersion}で比較できます。`,
  itemDescriptionProducingOnly: (
    name: string,
    otherName: string,
    producing: number,
  ): string =>
    `${name}（${otherName}）の作り方${producing}件を掲載。毎分レート、設備、電力、材料効率と、材料として使う自動化レシピが0件であることを確認できます。`,
  itemDescriptionConsumingOnly: (
    name: string,
    otherName: string,
    consuming: number,
  ): string =>
    `${name}（${otherName}）を使うレシピ${consuming}件を掲載。消費レート、製品、分類、シンクポイントと、自動化する作り方が未収録であることを確認できます。`,
  itemDescriptionNeither: (name: string, otherName: string, gameVersion: string): string =>
    `${name}（${otherName}）の分類、シンクポイント、アイテムIDを掲載。本サイトの計算対象では作り方・使い道とも0件であることをゲームデータ${gameVersion}に基づいて示します。`,

  itemIntroRaw: (name: string): string =>
    `${name}はマップから外部供給する原料です。変換や副産物として得るレシピがある場合は作り方に、材料として使う工程は使い道に表示します。`,
  itemIntroNeither: (name: string): string =>
    `${name}は、本サイトが計算対象とする自動化レシピで産出・消費されないアイテムです。分類、英名、ID、シンク可否を参照できます。`,
  itemIntroConsumingOnly: (name: string): string =>
    `${name}は、収録中の自動化レシピでは生産できません。材料として使う工程と基礎データを確認できます。`,
  itemIntroDefault: (name: string): string =>
    `${name}を生産する全レシピを、クロック100%・機械1台の条件で比較します。`,

  producingEmpty:
    'このアイテムを作る自動化レシピは、現在のゲームデータに収録されていません。',
  consumingEmpty:
    'このアイテムを材料として使う自動化レシピは、現在のゲームデータに収録されていません。',

  ingredientComparisonHeading: '材料1単位あたりの比較',
  noIngredients: '材料を使わないレシピです。',
  none: 'なし',
  unknown: '不明',
  powerFixed: (value: string): string => `${value} MW`,
  powerRange: (min: string, max: string, average: string): string =>
    `${min}〜${max} MW（平均 ${average} MW）`,
  averagePowerNote: '（平均電力で計算）',
  perPowerUnit: (unit: string): string => `${unit} / MW`,
  consumingRecipeMeta: (building: string, seconds: string): string =>
    `${building}、${seconds}秒サイクル`,

  scopeHeading: '数値の見方',
  scopeBody:
    '毎分レートはクロック100%の値です。固体は個/分、液体と気体はm³/minで表示します。電力あたり産出は当該工程だけの比較で、上流工程や採掘の電力を含みません。',
  scopeEmptyHeading: 'このページの収録範囲',
  scopeEmptyBody: (name: string): string =>
    `${name}には、本サイトが計算対象とする自動化レシピとの入出力関係がありません。これはゲーム内での入手や使用そのものを否定する表示ではなく、生産ライン計算に使えるレシピが0件という意味です。`,
  scopeEmptyFacts: (otherName: string, category: string, sink: string): string =>
    `英名は${otherName}、分類は${category}、AWESOMEシンクは${sink}です。ゲームデータ更新で自動化レシピが追加された場合は、このページもbuild時に更新されます。`,
  generatedLine: (gameVersion: string, date: string): string =>
    `ゲームデータ: ${gameVersion} / 生成日: ${date}`,

  // --- アイテム一覧 ---
  itemsIndexTitle: 'Satisfactory アイテム一覧',
  itemsIndexDescription: (count: number): string =>
    `Satisfactoryの全${count}アイテムを原料・固体・液体・気体に分類。収録済みレシピの作り方、使い道、毎分レート、設備、電力、材料効率と、レシピがない場合の収録範囲を確認できます。`,
  itemsIndexEyebrow: (count: number): string => `全${count}アイテム`,
  /**
   * 一覧で各アイテムにもう一方の言語名を併記するか。
   * 日本語ページは公式英名を併記する（ゲーム内表記・Wiki と突き合わせるため）。
   * 英語ページに日本語名を198件並べても読者の役には立たないので出さない
   * （個別ページの「Japanese: …」タグだけ残す）。
   */
  itemsIndexShowsOtherName: true,
  itemsIndexLead:
    'アイテムを選ぶと、収録済みの作り方と使い道、機械1台あたりの産出、電力効率、材料効率を確認できます。自動化レシピがないアイテムは、その収録範囲を明示します。',

  // --- 記事（共通） ---
  articlesIndexTitle: 'Satisfactory 解説記事',
  articlesIndexDescription:
    'Satisfactoryの生産計画、代替レシピ、発電、サマースループ、Excel出力と、7種類の循環・燃料チェーンを日本語で解説します。',
  articlesIndexEyebrow: (count: number): string => `全${count}記事`,
  articlesIndexLead:
    'ツールの操作からレシピ比較、発電、循環ラインまで、実データと計算結果に沿って解説します。',
  articlesIndexToolSection: '計画ツールの使い方',
  articlesIndexLoopSection: 'ループと燃料チェーン',

  articleEyebrow: 'Satisfactory 実践ガイド',
  publishedOn: (date: string): string => `公開日: ${date}`,
  relatedItems: '関連アイテム',
  tryInPlannerHeading: 'ツールで試す',
  tryInPlannerBody:
    '記事の条件を読み込んだ状態で計画ツールを開きます。目標レートや許可するレシピは、開いた後で変更できます。',

  // --- ループ記事 ---
  loopEyebrow: 'ループ構成ガイド',
  /**
   * ループ記事の見出し。英語は定型文だと不自然になる構成があるため、
   * en では content/loop-guides/en.ts の headline を使う（この関数は ja 専用の定型）。
   */
  loopHeadline: (title: string): string => `${title}の仕組みと組み方`,
  loopDescription: (description: string, gameVersion: string): string =>
    `${description}工程の仕組み、実際に建てる際の注意、ゲームデータ${gameVersion}で再計算した原料と電力を解説します。`,
  loopPublishedLine: (gameVersion: string, date: string): string =>
    `ゲームデータ: ${gameVersion} / 公開日: ${date}`,
  loopInsightHeading: 'この構成で分かること',
  loopMechanismHeading: '仕組み',
  loopTipsHeading: 'ゲーム内で組むときの注意',
  loopResultHeading: 'ビルド時の計算結果',
  loopComparisonHeading: '計算結果と通常構成の比較',
  loopSolverNote: (gameVersion: string): string =>
    `以下は固定の説明値ではなく、静的ページ生成時にソルバーで再計算したゲームデータ ${gameVersion} の結果です。`,
  loopCurrentPlanNote: 'このテンプレートをビルド時にソルバーで再計算した値です。',
  loopCirculationHeading: '循環の意味',
  loopReusedWater: 'ライン全体で再利用する副産物水',
  loopCirculationBreakdown: '循環水の発生工程',
  loopOpenHeading: 'テンプレートを開く',
  loopOpenBody:
    '目標、代替レシピ、発電方式と燃料を読み込んだ状態でツールを開きます。自分の設備に合わせて目標レートを変更できます。',
  loopOpenCta: (title: string): string => `ツールで「${title}」を開く`,

  loopTotalGeneration: '総発電量',
  loopFuelUsage: (name: string): string => `発電燃料 ${name}`,
  loopProductionPower: '製造設備の消費電力',
  loopBuildings: '建てる製造・発電設備',
  loopBuildingCount: (count: string): string => `${count}台`,

  loopRawTableCaption: '外部から必要な原料',
  loopRawTableRate: 'レート',
  loopRawTableUnit: '単位',
  loopTemplateResourcesHeading: 'テンプレートで必要な原料',
  loopBaselineInfeasible:
    '通常レシピだけでは、同じ目標を現在の原料上限内で達成できません。',
  loopComparisonIntro:
    '代替レシピを無効にした基準構成と、テンプレートの構成を同じ目標で再計算しました。原料の増減と製造電力の変化を一緒に判断してください。',
  loopComparisonMetric: '比較項目',
  loopComparisonBaseline: '基準 → テンプレート',
  loopComparisonChange: '変化',
  loopComparisonPowerNote:
    '消費電力は製造設備と燃料チェーンの値で、採掘設備を含みません。',
  loopChangeNew: '新規使用',
  loopChangeIncrease: (percent: string): string => `${percent}増加`,
  loopChangeDecrease: (percent: string): string => `${percent}削減`,
}

export type StaticPageLabels = typeof jaLabels

const enLabels: StaticPageLabels = {
  siteName: 'Satisfactory Production Planner',

  skipToContent: 'Skip to main content',
  breadcrumbNavLabel: 'Breadcrumb',
  siteNavLabel: 'Site navigation',
  footerNavLabel: 'Footer navigation',
  home: 'Home',
  planner: 'Planner',
  switchLanguageTo: (language: string): string => `Read this page in ${language}`,

  itemPageTitle: (name: string): string => `${name} recipes and uses`,
  itemEyebrow: 'Satisfactory item data',
  iconMissing: 'No image',
  iconMissingFor: (name: string): string => `No image on record for ${name}`,
  recipeCount: (count: number): string => (count === 1 ? '1 recipe' : `${count} recipes`),
  itemCount: (count: number): string => (count === 1 ? '1 item' : `${count} items`),
  sinkTag: (value: string): string => `AWESOME Sink: ${value}`,
  sinkPoints: (points: string, unit: string): string => `${points} pt/${unit}`,
  sinkUnavailable: 'Cannot be sunk',
  otherNameTag: (name: string): string => `Japanese: ${name}`,
  idTag: (id: string): string => `ID: ${id}`,
  itemCta: 'Plan this item in the planner',
  itemPlanName: (name: string): string => `${name} production plan`,
  itemCtaNotice:
    'The target loads, but the chain passes through ingredients that no automated recipe produces, power byproducts or hand-gathered items, so it may need an external supply or a power setup before it can be solved.',

  // 英語ページの meta description に日本語名は出さない（読者に意味がないため）。
  // 日本語名はページ内の「Japanese: …」タグと収録範囲の説明にだけ残す。
  itemDescriptionBoth: (
    name: string,
    _otherName: string,
    producing: number,
    consuming: number,
    gameVersion: string,
  ): string =>
    `${producing} ways to make ${name} and ${consuming} recipes that use it. Compare ingredients, rate per minute, building, power draw and ingredient efficiency on game data ${gameVersion}.`,
  itemDescriptionProducingOnly: (
    name: string,
    _otherName: string,
    producing: number,
  ): string =>
    `${producing} ways to make ${name}, with rate per minute, building, power draw and ingredient efficiency — and confirmation that no automated recipe uses it as an ingredient.`,
  itemDescriptionConsumingOnly: (
    name: string,
    _otherName: string,
    consuming: number,
  ): string =>
    `${consuming} recipes that use ${name}, with consumption rate, products, category and sink points — and confirmation that no automated recipe produces it.`,
  itemDescriptionNeither: (name: string, _otherName: string, gameVersion: string): string =>
    `Category, sink points and item ID for ${name}, and why game data ${gameVersion} lists no way to make it and no recipe that uses it in production planning.`,

  itemIntroRaw: (name: string): string =>
    `${name} is a raw resource supplied from the map. Recipes that convert it or return it as a byproduct appear under how to make it, and every step that consumes it appears under uses.`,
  itemIntroNeither: (name: string): string =>
    `${name} is neither produced nor consumed by any automated recipe this site plans with. You can still look up its category, its name in the other language, its ID and whether it can be sunk.`,
  itemIntroConsumingOnly: (name: string): string =>
    `${name} cannot be produced by any recipe on record here. The steps that use it as an ingredient and its basic data are listed below.`,
  itemIntroDefault: (name: string): string =>
    `Every recipe that produces ${name}, compared at 100% clock speed on a single machine.`,

  producingEmpty: 'No automated recipe in the current game data produces this item.',
  consumingEmpty: 'No automated recipe in the current game data uses this item as an ingredient.',

  ingredientComparisonHeading: 'Output per unit of ingredient',
  noIngredients: 'This recipe uses no ingredients.',
  none: 'None',
  unknown: 'Unknown',
  powerFixed: (value: string): string => `${value} MW`,
  powerRange: (min: string, max: string, average: string): string =>
    `${min}–${max} MW (average ${average} MW)`,
  averagePowerNote: ' (at average power)',
  perPowerUnit: (unit: string): string => `${unit} / MW`,
  consumingRecipeMeta: (building: string, seconds: string): string =>
    `${building}, ${seconds} s cycle`,

  scopeHeading: 'How to read these numbers',
  scopeBody:
    'Rates per minute are given at 100% clock speed. Solids are shown in items/min, fluids and gases in m³/min. Output per MW compares the step on its own; it excludes the power used upstream and by extraction.',
  scopeEmptyHeading: 'What this page covers',
  scopeEmptyBody: (name: string): string =>
    `${name} has no input or output relationship with the automated recipes this site plans with. That is not a statement about obtaining or using it in game — it only means there are zero recipes available for production line calculations.`,
  scopeEmptyFacts: (otherName: string, category: string, sink: string): string =>
    `Its Japanese name is ${otherName}, its category is ${category}, and the AWESOME Sink value is ${sink}. If a game data update adds an automated recipe, this page is rebuilt with it.`,
  generatedLine: (gameVersion: string, date: string): string =>
    `Game data: ${gameVersion} / Generated: ${date}`,

  itemsIndexTitle: 'Satisfactory item list',
  itemsIndexDescription: (count: number): string =>
    `All ${count} Satisfactory items sorted into raw resources, solids, fluids and gases. See how each one is made, what uses it, rates per minute, buildings, power and ingredient efficiency — and what is on record when no recipe exists.`,
  itemsIndexEyebrow: (count: number): string => `${count} items`,
  itemsIndexShowsOtherName: false,
  itemsIndexLead:
    'Pick an item to see the recipes that make it and the recipes that use it, together with output per machine, output per MW and output per ingredient. Items without an automated recipe say so explicitly.',

  articlesIndexTitle: 'Satisfactory guides',
  articlesIndexDescription:
    'Guides to production planning, alternate recipes, power, Somersloops and the Excel export in Satisfactory, plus seven loop and fuel chain templates.',
  articlesIndexEyebrow: (count: number): string => `${count} guides`,
  articlesIndexLead:
    'From using the planner to comparing recipes, planning power and closing loops — every guide follows the real game data and the solved numbers.',
  articlesIndexToolSection: 'Using the planner',
  articlesIndexLoopSection: 'Loops and fuel chains',

  articleEyebrow: 'Satisfactory field guide',
  publishedOn: (date: string): string => `Published: ${date}`,
  relatedItems: 'Related items',
  tryInPlannerHeading: 'Try it in the planner',
  tryInPlannerBody:
    'Opens the planner with the conditions from this guide already loaded. Target rates and the recipes you allow can be changed once it is open.',

  loopEyebrow: 'Loop template guide',
  loopHeadline: (title: string): string => `How ${title} works and how to build it`,
  loopDescription: (description: string, gameVersion: string): string =>
    `${description} How the steps work, what to watch out for when you build it, and the raw resources and power recalculated on game data ${gameVersion}.`,
  loopPublishedLine: (gameVersion: string, date: string): string =>
    `Game data: ${gameVersion} / Published: ${date}`,
  loopInsightHeading: 'What this layout shows',
  loopMechanismHeading: 'How it works',
  loopTipsHeading: 'Notes for building it in game',
  loopResultHeading: 'Calculated at build time',
  loopComparisonHeading: 'Results compared with the standard layout',
  loopSolverNote: (gameVersion: string): string =>
    `These are not fixed illustrative figures: they are solved again on game data ${gameVersion} every time the static pages are generated.`,
  loopCurrentPlanNote: 'These figures come from solving this template at build time.',
  loopCirculationHeading: 'What the loop reuses',
  loopReusedWater: 'Byproduct Water reused across the line',
  loopCirculationBreakdown: 'Where the circulating Water is produced',
  loopOpenHeading: 'Open the template',
  loopOpenBody:
    'Opens the planner with the targets, alternate recipes, generator types and fuels already loaded. Change the target rates to match your own factory.',
  loopOpenCta: (title: string): string => `Open “${title}” in the planner`,

  loopTotalGeneration: 'Total power generated',
  loopFuelUsage: (name: string): string => `${name} burned in generators`,
  loopProductionPower: 'Production power',
  loopBuildings: 'Production and power buildings to build',
  loopBuildingCount: (count: string): string => count,

  loopRawTableCaption: 'Raw resource required from outside',
  loopRawTableRate: 'Rate',
  loopRawTableUnit: 'Unit',
  loopTemplateResourcesHeading: 'Raw resources the template needs',
  loopBaselineInfeasible:
    'With standard recipes alone, the same target cannot be met within the current resource limits.',
  loopComparisonIntro:
    'The template was solved against a baseline with every alternate recipe disabled, using the same target. Read the change in raw resources together with the change in production power.',
  loopComparisonMetric: 'Metric',
  loopComparisonBaseline: 'Baseline → template',
  loopComparisonChange: 'Change',
  loopComparisonPowerNote:
    'Power covers the production buildings and the fuel chain; extraction machines are not included.',
  loopChangeNew: 'Newly used',
  loopChangeIncrease: (percent: string): string => `${percent} more`,
  loopChangeDecrease: (percent: string): string => `${percent} less`,
}

export const STATIC_PAGE_LABELS: Readonly<Record<StaticLocale, StaticPageLabels>> = {
  ja: jaLabels,
  en: enLabels,
}
