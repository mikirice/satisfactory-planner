/**
 * トップ（/）と英語ランディング（/en/）に出す FAQ（どちらも scripts/build-pages.ts が生成する）。
 *
 * 表示する本文と FAQPage の構造化データを**同じ定義から作る**ので、片方だけ古くなることがない。
 * 数値とゲーム内の名前は書き写さずデータから引く:
 *  - 収録件数・データのバージョン … src/data/meta.json と recipes
 *  - クロックの範囲・Somersloop の倍率 … src/data/constants.ts（建物データで裏取りする）
 *  - アイテム名・建物名 … `{{Desc_…}}` / `{{Build_…}}` を名前データで置換（labels.ts と同じ方針）
 *  - Excel のシート名・設定項目の名前 … UI_DICTIONARIES（画面と同じ語を使う）
 *
 * 日本語と英語は訳ではなく、それぞれの言語で読んで自然な文にしてある（設問は同じ7つ）。
 * 事実を1つ足すたびに、リポジトリか公開中のサイトで裏を取ってから書くこと。
 */
import {
  CLOCK_MAX,
  EXTRACTION_CLOCK_CHOICES,
  MANUFACTURING_CLOCK_MIN,
  SOMERSLOOP_FULL_OUTPUT_MULTIPLIER,
} from '../../src/data/constants.ts'
import { buildings, buildingsById, itemsById, meta, recipes } from '../../src/data/index.ts'
import { SUPPORTED_LOCALES } from '../../src/i18n/types.ts'
import { UI_DICTIONARIES } from './labels.ts'
import type { StaticLocale } from './labels.ts'
import { escapeHtml } from './templates.ts'

export type FaqEntry = {
  readonly question: string
  readonly answer: string
}

/** 見出し（本文の h2）。 */
const FAQ_HEADING: Readonly<Record<StaticLocale, string>> = {
  ja: 'よくある質問',
  en: 'Frequently asked questions',
}

const alternateRecipeCount = recipes.filter((recipe) => recipe.isAlternate).length
const languageCount = SUPPORTED_LOCALES.length

const percent = (ratio: number): string => `${Math.round(ratio * 100)}%`
const clockRange = `${percent(MANUFACTURING_CLOCK_MIN)}〜${percent(CLOCK_MAX)}`
const clockRangeEn = `${percent(MANUFACTURING_CLOCK_MIN)} to ${percent(CLOCK_MAX)}`
const extractionClocks = (separator: string): string =>
  EXTRACTION_CLOCK_CHOICES.map(percent).join(separator)

/**
 * Somersloop をフル装着したときの消費電力の倍率。
 * 建物ごとの指数が全部同じであることを確かめてから 2^指数 で出す
 * （データ更新で建物ごとに変わったら、ここで落ちて文面の見直しに気付ける）。
 */
const somersloopPowerMultiplier = ((): number => {
  const exponents = new Set(buildings.map((building) => building.somersloopPowerExponent))
  if (exponents.size !== 1) {
    throw new Error(
      `FAQ: Somersloop の電力指数が建物ごとに異なります（${[...exponents].join(', ')}）。文面を見直してください`,
    )
  }
  return SOMERSLOOP_FULL_OUTPUT_MULTIPLIER ** [...exponents][0]!
})()

const GAME_TERM_PATTERN = /\{\{([A-Za-z0-9_]+)\}\}/g

/** ゲーム内の公式名。データに無いIDは書き間違いなので落とす。 */
function officialName(id: string, locale: StaticLocale): string {
  const name = itemsById.get(id)?.name ?? buildingsById.get(id)?.name
  if (name === undefined) throw new Error(`FAQ: 名前データに無いID: ${id}`)
  return name[locale]
}

/** `{{Desc_…}}` を公式名に置き換える（UI辞書から借りた語に含まれるトークンもここで解ける）。 */
function resolve(text: string, locale: StaticLocale): string {
  return text.replace(GAME_TERM_PATTERN, (_token, id: string) => officialName(id, locale))
}

function japaneseEntries(): readonly FaqEntry[] {
  const ui = UI_DICTIONARIES.ja
  const sheets = Object.values(ui.excel.sheets)
  return [
    {
      question: '無料で使えますか。会員登録やインストールは必要ですか。',
      answer:
        '無料で、会員登録もインストールも要りません。ページを開いて目標のアイテムと毎分のレートを入れれば、そのまま結果が出ます。ゲームのデータはページに同梱していて計算もブラウザの中で走るため、入力を変えるたびにサーバーの応答を待つこともありません。',
    },
    {
      question: 'どのバージョンのデータですか。数値はどこから来ていますか。',
      answer:
        `ゲーム本体のデータファイル（バージョン${meta.gameVersion}）から取り込んだ、アイテム${meta.counts.items}件・レシピ${meta.counts.recipes}件・建物${meta.counts.buildings}種です。レシピや電力の数値は手入力していません。アイテム名とレシピ名はゲーム内の公式訳をそのまま使うので、ゲーム画面と表記が一致します。`,
    },
    {
      question: '代替レシピやサマースループ、オーバークロックにも対応していますか。',
      answer:
        `代替レシピ${alternateRecipeCount}件を1件ずつオン/オフでき、ソルバーは有効にしたものだけから選びます。「{{Desc_WAT1_C}}」は使える数を入れると、フル装着（産出${SOMERSLOOP_FULL_OUTPUT_MULTIPLIER}倍・電力${somersloopPowerMultiplier}倍）の工程を候補に加えます。「${ui.sidebar.clockMax}」は${clockRange}、採掘設備は${extractionClocks('・')}から選べます。`,
    },
    {
      question: '発電も生産と一緒に計画できますか。',
      answer:
        `同じ計算の中で解きます。{{Build_GeneratorCoal_C}}・{{Build_GeneratorFuel_C}}・{{Build_GeneratorNuclear_C}}と使う燃料を選び、「${ui.sidebar.powerTarget}」を入れるか「${ui.sidebar.powerCover}」を指定すると、燃料を作る工程ごと組み込まれます。{{Desc_NuclearWaste_C}}のような副産物も収支に出ます。${ui.sidebar.powerClockNote}`,
    },
    {
      question: '計算結果をExcelに出せますか。',
      answer:
        `${sheets.join('・')}の${sheets.length}シートに分けた .xlsx を書き出せます。ファイルはブラウザの中で作ってそのままダウンロードします。画面では同じ計画をフローチャートと、採掘から順に並ぶ「${ui.tabs.build}」でも確認できます。`,
    },
    {
      question: '入力した計画はどこに保存されますか。共有できますか。',
      answer:
        '計画はブラウザの中で解き、保存先もブラウザ（IndexedDB）です。計画のデータがこのサイトのサーバーへ送られることはありません。共有は計画一式をURLに詰め込む方式なので、リンクを開けば別の端末でもフレンドの手元でも同じ条件を再現できます。ブラウザのサイトデータを消すと保存した計画も消えます。',
    },
    {
      question: '対応している言語は何ですか。',
      answer:
        `画面は${languageCount}言語に対応していて、最初はブラウザの言語設定で選ばれ、アプリ内で切り替えられます。アイテム名・レシピ名・建物名は各言語のゲーム内公式訳をそのまま使います。アイテム辞典と解説記事のページは日本語と英語で用意しています。`,
    },
  ]
}

function englishEntries(): readonly FaqEntry[] {
  const ui = UI_DICTIONARIES.en
  const sheets = Object.values(ui.excel.sheets)
  return [
    {
      question: 'Is the planner free, and do I need an account or an install?',
      answer:
        'It is free, there is no account to create and nothing to install. Open the page, name the item you want and the rate you want it at, and the plan appears. The game data ships with the page and the solving happens in your browser, so edits do not wait on a server.',
    },
    {
      question: 'Which game version is the data from, and where do the numbers come from?',
      answer:
        `Recipes, buildings and power figures are read from the game's own data files for version ${meta.gameVersion}: ${meta.counts.items} items, ${meta.counts.recipes} recipes and ${meta.counts.buildings} buildings. Nothing is retyped by hand, and item and recipe names use the official in-game translations, so the wording matches your screen.`,
    },
    {
      question: 'Does it handle alternate recipes, Somersloops and overclocking?',
      answer:
        `All ${alternateRecipeCount} alternate recipes can be switched on and off individually, and the solver only uses the ones you enable. Enter your {{Desc_WAT1_C}} count and it adds fully amplified variants of the supported recipes, worth ${SOMERSLOOP_FULL_OUTPUT_MULTIPLIER}× the output for ${somersloopPowerMultiplier}× the power. Production clock can be capped from ${clockRangeEn}, extraction at ${extractionClocks(' / ')}.`,
    },
    {
      question: 'Can it plan power generation together with production?',
      answer:
        `Power is solved together with production. Allow the {{Build_GeneratorCoal_C}}, {{Build_GeneratorFuel_C}} or {{Build_GeneratorNuclear_C}}, pick their fuels, then set a "${ui.sidebar.powerTarget}" or tick "${ui.sidebar.powerCover}". Fuel production is planned too, and byproducts such as {{Desc_NuclearWaste_C}} appear in the balance. ${ui.sidebar.powerClockNote}`,
    },
    {
      question: 'Can I get the result into a spreadsheet?',
      answer:
        `The Excel export writes an .xlsx with ${sheets.length} sheets: ${sheets.join(', ')}. The file is built in your browser and downloaded straight away. On screen the same plan is also available as a flow chart and as a "${ui.tabs.build}" that runs in build order, starting from extraction.`,
    },
    {
      question: 'Where are my plans stored, and can I share them?',
      answer:
        'Plans are solved in your browser and saved there as well, in IndexedDB; the plan data is not sent to this site. Sharing packs the whole plan into the URL, so opening the link reproduces the same conditions on another device or for a friend. Clearing site data removes the saved plans.',
    },
    {
      question: 'What languages is the planner available in?',
      answer:
        `The interface is available in ${languageCount} languages. It follows your browser setting at first and can be switched inside the app. Item, recipe and building names come from the game's own translation for each language. The item reference and the written guides on this site are published in Japanese and English.`,
    },
  ]
}

/** 表示にも構造化データにも使う、名前を解決済みの FAQ。 */
export function faqEntries(locale: StaticLocale): readonly FaqEntry[] {
  const source = locale === 'ja' ? japaneseEntries() : englishEntries()
  return source.map((entry) => ({
    question: resolve(entry.question, locale),
    answer: resolve(entry.answer, locale),
  }))
}

/**
 * 見える本文。見出し（h2）＋「質問（h3）→ 回答（p）」の並び。
 * 体裁は置き先のページの既存スタイルに任せる（クラスは `.faq` だけ足す）。
 */
export function renderFaqHtml(locale: StaticLocale, headingId = 'faq-heading'): string {
  const pairs = faqEntries(locale)
    .map((entry) => `<h3>${escapeHtml(entry.question)}</h3><p>${escapeHtml(entry.answer)}</p>`)
    .join('')
  return `<h2 id="${escapeHtml(headingId)}">${escapeHtml(FAQ_HEADING[locale])}</h2><div class="faq">${pairs}</div>`
}

/** FAQPage 構造化データ。mainEntity は本文と同じ `faqEntries` から作る。 */
export function faqPageSchema(locale: StaticLocale, pageUrl: string): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: locale,
    mainEntity: faqEntries(locale).map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}
