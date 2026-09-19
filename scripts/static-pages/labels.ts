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
import { LOCALE_FLAGS } from '../../src/i18n/endonyms.ts'
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

/**
 * 言語切替リンクの国旗。アプリのスイッチャーと割当をずらさないため、
 * src/i18n/endonyms.ts の表をそのまま引く（StaticLocale は Locale の部分集合）。
 */
export const FLAG: Readonly<Record<StaticLocale, string>> = {
  ja: LOCALE_FLAGS.ja,
  en: LOCALE_FLAGS.en,
}

const jaLabels = {
  siteName: 'Satisfactory 生産計画ツール',
  /**
   * <title> の末尾に付けるサイト名。
   *
   * 日本語話者はゲーム名をカタカナで検索する（Search Console 実測: 「サティスファクトリー
   * ガスフィルター」は CTR 25%、同順位のラテン表記クエリは 0 クリック）。ページ内の
   * どこにもカタカナが無いと、この需要をまるごと取り逃がす。
   *
   * そこで **<title> のサイト名だけ**カタカナにする。ラテン表記の "Satisfactory" は
   * og:site_name・構造化データ・ヘッダーのブランド（siteName）と、アイテムページの
   * eyebrow に残るので、両方の綴りでページが引ける。
   * 1ページに1回だけ出す（見出しや description には足さない＝キーワード詰め込みにしない）。
   */
  titleSiteName: 'サティスファクトリー生産計画ツール',

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

  /** 名前を列挙するときの区切り（結論の文中で材料を並べるのに使う）。 */
  joinList: (names: readonly string[]): string => names.join('・'),

  /**
   * アイテムページの結論。状況の判定は scripts/static-pages/item-insights.ts。
   *
   * **状況ごとに別の関数**にしてある。1つの型枠に数値を差し替えるだけの文を198ページに
   * 貼ると、それこそが「量産された薄いページ」になるため。
   * 収録するのは「表を読み比べないと分からないこと」だけで、下の表を言い換えるだけの
   * 状況は item-insights.ts 側で落としてある（結果、結論が付くのは198件中の少数）。
   * 数値はすべて表と同じ値を同じ書式で整形したもの。
   */
  itemSummary: {
    generatorByproduct: (v: {
      name: string
      generator: string
      fuel: string
      rate: string
      power: string
      consumingCount: number
    }): string =>
      `${v.name}を作るレシピはありません。${v.generator}が${v.fuel}を燃やすと、${v.power} MWの発電と一緒に${v.rate}が出てきます。生産計画では調達するものではなく行き先を決めるもので、下の使い道${v.consumingCount}件がその引き取り先です。`,

    byproductOnly: (v: {
      name: string
      recipe: string
      building: string
      mainProduct: string
      /** レシピ名が生成物名と同じか（同じなら製品名を繰り返さない）。 */
      recipeNamesProduct: boolean
      rate: string
    }): string =>
      `${v.name}だけを目的にしたレシピはありません。${v.recipeNamesProduct ? `「${v.recipe}」` : `${v.mainProduct}を作る「${v.recipe}」`}が${v.building}1台につき${v.rate}こぼすだけなので、${v.name}を使う工程は${v.mainProduct}のラインにぶら下げる形になります。`,

    rawByproduct: (v: {
      name: string
      sourceCount: number
      topRecipe: string
      topMainProduct: string
      topRecipeNamesProduct: boolean
      topRate: string
      secondRecipe?: string
      secondRate?: string
    }): string => {
      const top = v.topRecipeNamesProduct
        ? `「${v.topRecipe}」レシピの${v.topRate}`
        : `${v.topMainProduct}を作る「${v.topRecipe}」の${v.topRate}`
      const second =
        v.secondRecipe === undefined || v.secondRate === undefined
          ? ''
          : `、次いで「${v.secondRecipe}」の${v.secondRate}`
      return `${v.name}はマップから汲み上げる資源ですが、${v.sourceCount}件のレシピが副産物として返してきます。最も多いのは${top}${second}。これを上流へ戻せば、そのぶん汲み上げ設備を減らせます。`
    },

    soleRouteWithByproducts: (v: {
      name: string
      recipe: string
      building: string
      rate: string
      byproductCount: number
      topRecipe: string
      topMainProduct: string
      topRecipeNamesProduct: boolean
      topRate: string
      /** 副産物1台のほうが専用レシピ1台より多いか。 */
      byproductIsLarger: boolean
      /** 副産物1台 ÷ 専用レシピ1台。同数のときは倍率を出さない。 */
      ratio?: string
    }): string => {
      const others =
        v.byproductCount === 1
          ? `別のレシピ1件が${v.name}を副産物として出します`
          : `別のレシピ${v.byproductCount}件が${v.name}を副産物として出します`
      const top = v.topRecipeNamesProduct
        ? `「${v.topRecipe}」`
        : `${v.topMainProduct}を作る「${v.topRecipe}」`
      if (v.byproductIsLarger) {
        const times = v.ratio === undefined ? '' : `＝専用レシピの${v.ratio}倍`
        return `${v.name}を目的に作るレシピは${v.building}の「${v.recipe}」（${v.rate}）の1件だけですが、${others}。${top}は1台で${v.topRate}${times}。専用ラインを建てる前に、工場が今こぼしている量を数えたほうが早いことがあります。`
      }
      return `${v.name}を目的に作るレシピは${v.building}の「${v.recipe}」（${v.rate}）の1件だけです。ただし${others}。${top}は${v.topRate}なので、必要量が小さければ専用ラインを建てずに済みます。`
    },

    soleAlternate: (v: {
      name: string
      recipe: string
      building: string
      rate: string
    }): string =>
      `収録されている作り方は代替レシピ「${v.recipe}」の1件だけで、${v.building}で${v.rate}です。この代替レシピを解放していないと、${v.name}を自動化ラインに組み込む手段はありません。`,

    identicalRoutes: (v: {
      routeCount: number
      building: string
      rate: string
      perPower: string
      ingredients: string
    }): string =>
      `${v.routeCount}件とも${v.building}で${v.rate}、電力あたり${v.perPower}と、このページの数値はすべて同じです。違うのは入れる材料（${v.ingredients}）だけなので、選ぶ基準は効率ではなく、どれが手に入るかになります。`,

    sameOutputDifferentCost: (v: {
      rate: string
      efficientRecipe: string
      efficientBuilding: string
      efficientPerPower: string
      efficientIngredient?: string
      otherBuilding: string
      otherPerPower: string
      otherIngredient?: string
    }): string => {
      const swap =
        v.efficientIngredient === undefined || v.otherIngredient === undefined
          ? `${v.efficientBuilding}で作るか${v.otherBuilding}で作るか`
          : `${v.efficientIngredient}を${v.efficientBuilding}に入れるか、${v.otherIngredient}を${v.otherBuilding}に入れるか`
      return `2件は同じ名前で、産出も材料の量も同じ${v.rate}です。分かれるのは${swap}だけ。電力あたりでは前者が${v.efficientPerPower}、後者が${v.otherPerPower}なので、材料をどちらの形で運ぶかが決まっているなら、そこで選んで構いません。`
    },

    tiedLeaders: (v: {
      rate: string
      firstRecipe: string
      firstBuilding: string
      firstIngredients: string
      secondRecipe: string
      secondBuilding: string
      secondIngredients: string
      runnerUpRecipe: string
      runnerUpRate: string
    }): string =>
      `産出が最も多いのは「${v.firstRecipe}」と「${v.secondRecipe}」で、どちらも${v.rate}——3番手の「${v.runnerUpRecipe}」（${v.runnerUpRate}）を上回ります。並んだ2件を分けるのは材料と設備だけで、前者は${v.firstBuilding}で${v.firstIngredients}、後者は${v.secondBuilding}で${v.secondIngredients}を要求します。`,

    splitWinners: (v: {
      throughputRecipe: string
      throughputBuilding: string
      throughputRate: string
      throughputPerIngredient: string
      efficiencyRecipe: string
      efficiencyPerIngredient: string
      sharedIngredient: string
      /** 共通材料の数え方（個 / m³）。 */
      amountUnit: string
      /** 産出側の数え方（個 / m³）。 */
      outputAmountUnit: string
      /** 材料効率1位が台数1位の何倍か。読者が行動に移すのはこの差の大きさ。 */
      ratio: string
    }): string =>
      `機械1台あたりの産出が最大なのは${v.throughputBuilding}の「${v.throughputRecipe}」で${v.throughputRate}。ただし${v.sharedIngredient}1${v.amountUnit}あたりで見ると勝つのは「${v.efficiencyRecipe}」で、${v.efficiencyPerIngredient}${v.outputAmountUnit}対${v.throughputPerIngredient}${v.outputAmountUnit}——${v.ratio}倍の開きがあります。`,

    recyclingPair: (v: {
      name: string
      throughputRecipe: string
      throughputBuilding: string
      throughputRate: string
      baselineRecipe: string
      baselineRate: string
      loopIngredient: string
      otherIngredients?: string
    }): string => {
      const others = v.otherIngredients === undefined ? '' : `（ほかに${v.otherIngredients}も要ります）`
      return `産出が最も多いのは${v.throughputBuilding}の「${v.throughputRecipe}」で${v.throughputRate}、「${v.baselineRecipe}」の${v.baselineRate}を大きく上回ります。ただし材料の${v.loopIngredient}は${v.name}から作られるものです${others}。この2つは対になっていて単独では起動できないので、先に相手側の工程を回してから循環に入れてください。`
    },
  },

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

  // --- このサイトについて（/about/） ---
  aboutTitle: 'このサイトについて',
  aboutEyebrow: 'サイト情報',
  aboutDescription:
    'Satisfactory 生産計画ツールの概要、収録しているデータ、運営者情報、お問い合わせ先、免責事項、広告とプライバシーの扱いをまとめたページです。',
  aboutLead:
    'Satisfactory 生産計画ツールは、ゲーム「Satisfactory」の工場と生産ラインを設計するための無料の非公式Webツールです。このページでは、ツールの内容と運営について説明します。',
  aboutOverviewHeading: 'ツールの概要',
  aboutOverviewParagraphs: [
    'このサイトは、Satisfactory の生産計画をブラウザだけで組み立てられるようにするために作りました。作りたいアイテムと毎分の目標レートを入力すると、線形計画法のソルバーが必要なレシピ、機械の台数、電力、原料の量を計算します。インストールも会員登録も必要ありません。',
    '計算結果はフローチャートと表で確認でき、Excel ファイルとして書き出せます。計画は共有URLに埋め込めるので、同じ設定を別の端末で開いたり、フレンドに渡したりできます。ゲームを遊びながら手元で使うことを想定した作りです。',
  ],
  aboutFeaturesHeading: '主な機能',
  aboutFeatures: [
    '線形計画法による最適レシピの計算（原料・電力・設備数のいずれを優先するか選べます）',
    '生産ライン全体をたどれるフローチャート表示',
    'Excel ファイルへの書き出し（材料・工程・設備・電力などをシート別に出力）',
    '発電機と燃料を含めた発電計画の同時計算',
    '石油の完全循環や水の再利用など、ループ構成のテンプレート',
    '全アイテムのレシピ辞典（作り方・使い道・毎分レート・電力効率）',
    '日本語を含む12言語対応',
  ],
  aboutDataHeading: 'データについて',
  aboutDataParagraphs: [
    'レシピ、建物、電力、シンクポイントなどの数値はゲームの公式データ（バージョン1.1系）から取り込んでいます。アイテム名やレシピ名はゲーム内の公式訳をそのまま使っているため、ゲーム画面と表記が一致します。',
    'ゲーム側のアップデートでデータが変わった場合は、取り込み直してサイト全体を再生成します。ページ内に記載しているゲームデータのバージョンと生成日を目安にしてください。',
  ],
  aboutOperatorHeading: '運営者情報',
  aboutOperatorParagraphs: [
    'このサイトは日本の個人開発者が個人で開発・運営しています。企業や団体による運営ではなく、Satisfactory の開発元とも関係はありません。',
  ],
  aboutContactHeading: 'お問い合わせ',
  aboutContactParagraphs: [
    '不具合の報告、計算結果の誤りの指摘、機能の要望は GitHub リポジトリの Issues で受け付けています。再現手順や共有URLを添えていただけると調査が早くなります。',
  ],
  aboutContactLinkLabel: 'GitHub の Issues を開く',
  aboutDisclaimerHeading: '免責事項',
  aboutDisclaimerParagraphs: [
    'このサイトは有志が作った非公式のファンツールであり、Coffee Stain Studios とは無関係です。ゲーム内のアイテム名、レシピ名、画像などの権利は Coffee Stain Studios に帰属します。',
    '計算結果はゲームデータに基づく目安です。ゲーム内の仕様変更や入力条件によっては実際の工場と差が出る場合があります。計算結果の利用によって生じた不利益について、運営者は責任を負いません。',
  ],
  aboutAdsHeading: '広告とプライバシー',
  aboutAdsParagraphs: [
    'このサイトは無料で提供しており、運営費をまかなうために広告を掲載する場合があります。広告の配信事業者が Cookie を利用して広告を表示することがあります。',
    '入力した計画のデータはブラウザ内に保存され、サーバーへ送信することはありません。取り扱いの詳細はプライバシーポリシーに記載しています。',
  ],
  aboutPrivacyLinkLabel: 'プライバシーポリシーを読む',
  aboutLinksHeading: 'サイト内の主なページ',
  aboutPlannerLinkLabel: '計画ツールを使う',

  // --- 記事（共通） ---
  articlesIndexTitle: 'Satisfactory 解説記事',
  articlesIndexDescription:
    'Satisfactoryの生産計画、代替レシピ、発電、アルミニウム、シンクポイント、Excel出力と、8種類の循環・燃料チェーンを日本語で解説します。',
  articlesIndexEyebrow: (count: number): string => `全${count}記事`,
  articlesIndexLead:
    'ツールの操作からレシピ比較、発電、循環ラインまで、実データと計算結果に沿って解説します。',
  articlesIndexToolSection: '計画ツールの使い方',
  articlesIndexLoopSection: 'ループと燃料チェーン',

  articleEyebrow: 'Satisfactory 実践ガイド',
  publishedOn: (date: string): string => `公開日: ${date}`,
  relatedItems: '関連アイテム',
  relatedArticles: '関連記事',
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

/** 英語の不定冠詞。建物名は母音始まりが Assembler だけなので、頭文字の判定で足りる。 */
const an = (name: string): string => (/^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`)

const enLabels: StaticPageLabels = {
  siteName: 'Satisfactory Production Planner',
  // 英語はゲーム名の別綴りが無いので、<title> のサイト名も siteName と同じにする。
  titleSiteName: 'Satisfactory Production Planner',

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

  joinList: (names: readonly string[]): string =>
    names.length <= 1
      ? (names[0] ?? '')
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`,

  // 英語は日本語の訳ではなく、英語で読んで自然な言い回しで書き下ろす（faq.ts と同じ方針）。
  itemSummary: {
    generatorByproduct: (v): string =>
      `Nothing is built to make ${v.name}. A ${v.generator} burning ${v.fuel} hands back ${v.rate} alongside its ${v.power} MW, so a plan does not source it — it has to route it away. ${v.consumingCount === 1 ? 'The one recipe under uses below is where it can go.' : `The ${v.consumingCount} recipes under uses below are the places it can go.`}`,

    byproductOnly: (v): string =>
      `No recipe exists to produce ${v.name} on its own. It falls out of “${v.recipe}”${v.recipeNamesProduct ? '' : `, which is really making ${v.mainProduct}`}, at ${v.rate} per ${v.building}. Anything that consumes it has to hang off a ${v.mainProduct} line rather than run on a line of its own.`,

    rawByproduct: (v): string => {
      const top = v.topRecipeNamesProduct
        ? `the ${v.topRecipe} recipe, which releases ${v.topRate}`
        : `“${v.topRecipe}”, which releases ${v.topRate} while it makes ${v.topMainProduct}`
      const second =
        v.secondRecipe === undefined || v.secondRate === undefined
          ? ''
          : `, then “${v.secondRecipe}” at ${v.secondRate}`
      return `${v.name} is pumped straight off the map, but ${v.sourceCount} recipes give it back as a byproduct. The largest return comes from ${top}${second}. Piping that back upstream is what lets a line cut its extractor count.`
    },

    soleRouteWithByproducts: (v): string => {
      const others =
        v.byproductCount === 1
          ? 'one other recipe sheds it as a byproduct'
          : `${v.byproductCount} other recipes shed it as a byproduct`
      const top = v.topRecipeNamesProduct
        ? `“${v.topRecipe}”`
        : `“${v.topRecipe}”, making ${v.topMainProduct},`
      if (v.byproductIsLarger) {
        const times = v.ratio === undefined ? '' : `, ${v.ratio}× the dedicated recipe`
        return `Only one recipe is built for ${v.name}: “${v.recipe}”, ${v.rate} per ${v.building}. But ${others}, and ${top} alone gives ${v.topRate}${times}. Count what the factory already spills before building a line for it.`
      }
      return `The one recipe built for ${v.name} is “${v.recipe}”, ${v.rate} per ${v.building}. It also arrives without asking: ${others}, with ${top} returning ${v.topRate} — often enough on its own when the demand is small.`
    },

    soleAlternate: (v): string =>
      `The only recipe on record is the alternate “${v.recipe}”, ${v.rate} from ${an(v.building)}. Until that alternate is unlocked there is no way to put ${v.name} into an automated line at all.`,

    identicalRoutes: (v): string =>
      `All ${v.routeCount} recipes run in ${an(v.building)} at ${v.rate} and ${v.perPower}; every figure on this page is the same for each of them. The only thing that differs is what goes in — ${v.ingredients} — so choose by what you can actually collect, not by efficiency.`,

    sameOutputDifferentCost: (v): string => {
      const swap =
        v.efficientIngredient === undefined || v.otherIngredient === undefined
          ? `whether you run it in ${an(v.efficientBuilding)} or ${an(v.otherBuilding)}`
          : `whether ${v.efficientIngredient} goes into ${an(v.efficientBuilding)} or ${v.otherIngredient} into ${an(v.otherBuilding)}`
      return `The two recipes share a name, take the same ingredients at the same rates, and both give ${v.rate}. All that differs is ${swap}. On power the first is ahead, ${v.efficientPerPower} against ${v.otherPerPower}, so pick whichever form the ingredient already arrives in.`
    },

    tiedLeaders: (v): string =>
      `Two recipes tie for the highest output, “${v.firstRecipe}” and “${v.secondRecipe}”, both at ${v.rate} — ahead of “${v.runnerUpRecipe}” at ${v.runnerUpRate}. All that separates them is feedstock and building: the first wants ${v.firstIngredients} in ${an(v.firstBuilding)}, the second ${v.secondIngredients} in ${an(v.secondBuilding)}.`,

    splitWinners: (v): string =>
      `“${v.throughputRecipe}” in ${an(v.throughputBuilding)} makes the most per machine, ${v.throughputRate}. Per unit of ${v.sharedIngredient}, though, “${v.efficiencyRecipe}” is the one ahead instead: ${v.efficiencyPerIngredient} against ${v.throughputPerIngredient}, a gap of ${v.ratio}×.`,

    recyclingPair: (v): string => {
      const others = v.otherIngredients === undefined ? '' : ` (it also needs ${v.otherIngredients})`
      return `“${v.throughputRecipe}” is by far the fastest, ${v.throughputRate} in ${an(v.throughputBuilding)} against ${v.baselineRate} for “${v.baselineRecipe}”. The catch is that the ${v.loopIngredient} it runs on is itself made from ${v.name}${others}. The two are a pair and neither starts from nothing, so run the partner step first and close the loop once it is turning.`
    },
  },

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

  aboutTitle: 'About this site',
  aboutEyebrow: 'Site information',
  aboutDescription:
    'What the Satisfactory Production Planner is, the game data it uses, who runs it, how to get in touch, the disclaimer, and how ads and privacy are handled.',
  aboutLead:
    'Satisfactory Production Planner is a free, unofficial web tool for designing factories and production lines in Satisfactory. This page explains what the tool does and who runs it.',
  aboutOverviewHeading: 'What the planner does',
  aboutOverviewParagraphs: [
    'This site exists so that a Satisfactory production line can be planned entirely in the browser. Enter the item you want and the target rate per minute, and a linear programming solver works out the recipes, machine counts, power draw and raw resources you need. There is nothing to install and no account to create.',
    'Results are shown as a flow chart and as tables, and can be exported to an Excel file. A whole plan can be packed into a shareable URL, so the same setup opens on another device or can be handed to a friend. It is built to be used next to the game while you play.',
  ],
  aboutFeaturesHeading: 'Main features',
  aboutFeatures: [
    'Optimal recipe selection with a linear programming solver, weighted toward raw resources, power or building count',
    'A flow chart of the entire production line',
    'Excel export, with ingredients, steps, buildings and power on separate sheets',
    'Power planning that solves generators and fuels together with production',
    'Loop templates such as complete oil recycling and water reuse',
    'A recipe reference for every item: how to make it, what uses it, rates per minute and power efficiency',
    'Twelve interface languages',
  ],
  aboutDataHeading: 'Where the data comes from',
  aboutDataParagraphs: [
    'Recipes, buildings, power figures and sink points are taken from the official game data (version 1.1.x). Item and recipe names use the official in-game translations, so the wording matches what you see in the game.',
    'When a game update changes the data, it is re-imported and the whole site is regenerated. The game data version and the generation date printed on each page tell you what a page was built from.',
  ],
  aboutOperatorHeading: 'Who runs this site',
  aboutOperatorParagraphs: [
    'This site is developed and operated by an individual developer based in Japan. It is not run by a company or organisation, and it has no connection to the developers of Satisfactory.',
  ],
  aboutContactHeading: 'Contact',
  aboutContactParagraphs: [
    'Bug reports, corrections to the calculated numbers and feature requests are handled through the Issues page of the GitHub repository. Including the steps to reproduce the problem, or a share URL, makes it much quicker to look into.',
  ],
  aboutContactLinkLabel: 'Open the GitHub issue tracker',
  aboutDisclaimerHeading: 'Disclaimer',
  aboutDisclaimerParagraphs: [
    'This is an unofficial fan-made tool and is not affiliated with Coffee Stain Studios. Item names, recipe names and images from the game remain the property of Coffee Stain Studios.',
    'The calculated figures are estimates derived from the game data. Game updates or unusual input conditions can make them differ from a real factory, and the operator accepts no liability for decisions made from them.',
  ],
  aboutAdsHeading: 'Ads and privacy',
  aboutAdsParagraphs: [
    'The site is free to use, and advertising may be shown to cover its running costs. Advertising providers may use cookies to serve those ads.',
    'Plans you enter are stored in your own browser and are never sent to a server. The privacy policy explains this in detail.',
  ],
  aboutPrivacyLinkLabel: 'Read the privacy policy',
  aboutLinksHeading: 'Main pages on this site',
  aboutPlannerLinkLabel: 'Open the planner',

  articlesIndexTitle: 'Satisfactory guides',
  articlesIndexDescription:
    'Guides to production planning, alternate recipes, power, aluminum, sink points and the Excel export in Satisfactory, plus eight loop and fuel chain templates.',
  articlesIndexEyebrow: (count: number): string => `${count} guides`,
  articlesIndexLead:
    'From using the planner to comparing recipes, planning power and closing loops — every guide follows the real game data and the solved numbers.',
  articlesIndexToolSection: 'Using the planner',
  articlesIndexLoopSection: 'Loops and fuel chains',

  articleEyebrow: 'Satisfactory field guide',
  publishedOn: (date: string): string => `Published: ${date}`,
  relatedItems: 'Related items',
  relatedArticles: 'Related guides',
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

/**
 * ランディング（/ と /en/）に載せるスクリーンショット。
 * 実物は public/landing/{ja,en}-{name}.webp（原本は 開発/Satisfactory生産計画ツール/screenshots/ の
 * 1440×900 のスクリーンショットを主パネルだけに切り出したもの）。寸法は生成時にファイルから読む。
 * 日本語ページには日本語UIの画像、英語ページには英語UIの画像を使う（混ぜない）。
 */
export type LandingImageName = 'flowchart' | 'infeasible' | 'buildlist' | 'summary'

export type LandingFeature = {
  readonly heading: string
  /** 本文。`{{Desc_…}}` / `{{Build_…}}` はゲーム内公式名に置き換えて出す（faq.ts と同じ）。 */
  readonly paragraphs: readonly string[]
  readonly image: LandingImageName
  /** 画像の内容を言葉で説明する alt（何の画面で、何が写っているか）。 */
  readonly imageAlt: string
  /**
   * 画像を本文の下に全幅で置く（既定は本文と画像を左右に並べる）。
   * 横長で文字の小さい画像（実行不能の説明カード）は横に並べると読めないので、こちらにする。
   */
  readonly stacked?: true
}

export type LandingStep = {
  readonly heading: string
  readonly body: string
}

/**
 * ランディング（/ と /en/）の文面の形。日英で同じ節構成（scripts/build-pages.ts の
 * renderLandingPage が両方をこの形で受け取る）。
 *
 * 節の順番: ヒーロー → 他のツールに無い3つのこと → 3ステップの使い方 →
 * ループテンプレート → 解説記事 → FAQ（faq.ts）→ フッター（templates.ts）。
 * テンプレートと記事の見出しはここに書かず、samples.ts / content/articles から取る。
 */
/**
 * 見出し用の改行位置マーカー。日本語の見出しは文節の境でだけ折り返したいので、
 * 文節の境にこの文字を置き、renderer が（エスケープ後に）<wbr> に変える。
 * 見出し以外の文（lead・本文・alt・説明）には置かない（そのまま表示されてしまう。テストで検査）。
 * 英語の見出しには置かない（単語間の空白で折り返せる）。
 */
export const HEADING_BREAK_MARKER = '|'

export type LandingCopy = {
  readonly title: string
  readonly description: string
  readonly eyebrow: string
  readonly heading: string
  readonly lead: string
  readonly ctaLabel: string
  readonly ctaNote: string
  /** 前回ツールを開いた記録（localStorage）があるときだけ見せる副導線。 */
  readonly continueLabel: string
  readonly heroImageAlt: string

  readonly featuresHeading: string
  readonly features: readonly [LandingFeature, LandingFeature, LandingFeature]

  readonly stepsHeading: string
  readonly steps: readonly [LandingStep, LandingStep, LandingStep]

  readonly templatesHeading: string
  readonly templatesIntro: string
  /** テンプレートカードの末尾に付ける「ツールで開く」の文言。 */
  readonly templatesOpenLabel: string

  readonly guidesHeading: string
  readonly guidesIntro: string
  readonly guidesAllLabel: string

  /** 本文の末尾に置く、もう一方の言語のトップへのリンク（無いページは出さない）。 */
  readonly otherLandingLinkLabel?: string
}

/**
 * ランディングの「解説記事」節に出す4本（順番どおり）。slug は content/articles と一致させる
 * （存在しない slug は build-pages の articleHeadline が投げて生成が止まる）。
 * チュートリアル → 代替レシピ → 石炭発電 → 建設リスト。
 */
export const LANDING_GUIDE_SLUGS = [
  'production-planning-tutorial',
  'alternate-recipe-metrics',
  'coal-power-startup',
  'build-checklist-guide',
] as const

/**
 * 日本語のトップページ（/）専用の文。
 *
 * 計画ツール本体は /app/ にあり、トップは静的なランディング。日本語として自然に読める文を
 * 書き、英語版の訳にはしない（節の構成だけ EN_LANDING と同じ）。
 * 事実（シート数・言語数・保存先・実行不能メッセージの内容）はリポジトリで裏を取ってから書く。
 * title と description は Search Console の再評価中のため凍結（変更しない）。
 * 見出し・本文の主張は /about/ と食い違わないようにする。
 */
export const JA_LANDING = {
  /** 旧トップの <title>（カタカナ表記＝検索の実需要に合わせる。titleSiteName と同じ理由）。凍結。 */
  title: 'サティスファクトリー（Satisfactory）生産計画ツール — 日本語ソルバー＆Excel出力',
  /** 旧トップの meta description。凍結。 */
  description:
    'Satisfactory の生産ラインを日本語で計算する非公式ツール。目標レートを入れるだけで必要なレシピ・建物数・電力・原料を最適化し、Excel（6シート）とフローチャートで出力します。代替レシピ・クロック・サマースループにも対応。インストール不要・ブラウザだけで動きます。',
  eyebrow: '無料の非公式Webツール',
  heading: 'Satisfactory の|生産ラインを、|目標レート|ひとつから|丸ごと|計算する',
  lead: '作りたいアイテムと毎分の目標を入れると、線形計画法のソルバーが採掘から最終製品までの生産ライン全体を一度に解きます。どのレシピを何台の機械で回すか、電力はいくら要るか、原料は毎分いくつ掘るか。答えは表・フローチャート・建設リストで確認でき、Excel にも書き出せます。',
  ctaLabel: '計画ツールを開く',
  ctaNote: 'インストール不要・会員登録不要。ブラウザだけで動きます。',
  continueLabel: '前回の続きを開く',
  heroImageAlt:
    'フローチャート表示: {{Desc_ModularFrameHeavy_C}} 10/分の生産ラインを16ノード・20フローで図示。各工程に機械の種類と台数・消費電力、線にはアイテムの毎分レートが書かれている',

  featuresHeading: 'ほかの|計算ツールには|ない|3つのこと',
  features: [
    {
      heading: '作れないときは、|理由と|直し方を|言葉で|示す',
      paragraphs: [
        '条件が足りないと、ただ「解なし」で止まるツールが多いですが、このツールは何が足りないかを文で説明します。たとえば{{Desc_PlutoniumPellet_C}}を目標にすると、材料の{{Desc_NuclearWaste_C}}は{{Build_GeneratorNuclear_C}}を稼働させたときの副産物としてしか得られない、と原因を名指しし、「発電計画を有効にして{{Build_GeneratorNuclear_C}}を許可する」という直し方まで添えます。',
        '足りないレシピ・原料の上限・目的関数の設定など、行き詰まりの種類ごとに見直す場所が書かれるので、原因を探して設定をいじり回す時間がなくなります。',
      ],
      image: 'infeasible',
      imageAlt:
        '「この条件では生産できません」の説明カード。{{Desc_PlutoniumPellet_C}} 60/分を目標にしたとき、材料の{{Desc_NuclearWaste_C}}が{{Build_GeneratorNuclear_C}}の副産物としてしか得られないことと、発電計画を有効にして許可するという直し方が書かれている',
      stacked: true,
    },
    {
      heading: '建てる|順番に|並んだ|建設リスト',
      paragraphs: [
        '計算結果を、採掘・給水から製造ライン、発電の順に並べ直したリストにします。上から順に建てていけば、次の工程に必要なものが先に揃います。項目ごとに建物の種類と台数、クロック、投入と産出の毎分レートが載ります。',
        'それぞれの流れには、そのレートを1本で運べる最も低い等級のコンベア・ベルトかパイプラインが書かれるので、Mk.いくつのベルトを何本引くかを現地で計算し直さずに済みます。',
      ],
      image: 'buildlist',
      imageAlt:
        '建設リストのタブ。合計304台を「原料の採掘・給水」「製造ライン」の順に並べ、採鉱機 Mk.3 ×5台などの各行に鉱石の純度・クロック・産出レートと、必要なコンベア・ベルトの等級と本数が書かれている',
    },
    {
      heading: 'ライン全体を|一度に|解き、|電力・|床面積・|建物数まで|出す',
      paragraphs: [
        'レシピを1つずつ手でたどるのではなく、生産ライン全体を1回の最適化で解きます。原料・消費電力・建物数のどれを節約するかを選ぶと、その基準で最も少なくなる組み合わせが返ります。サマリーには総消費電力、ファウンデーション換算の概算床面積、建物の台数、建設コスト、シンクポイントが並びます。',
        '結果は Excel（サマリー・建物リスト・アイテム収支・原料・建設コスト・物流の6シート）に書き出せます。計画は共有URLにまとめて渡せるので、別の端末やフレンドの手元でも同じ条件をそのまま開けます。',
      ],
      image: 'summary',
      imageAlt:
        'サマリーのタブ。{{Desc_ModularFrameHeavy_C}} 10/分の計画について、総消費電力 2,586.10 MW、概算床面積 41,688 m²、建物 295 台、建設コストの内訳が表示されている',
    },
  ],

  stepsHeading: '使い方は|3ステップ',
  steps: [
    {
      heading: '目標を|入れる',
      body: '作りたいアイテムを検索して、毎分の目標レートを入力します。複数のアイテムを同時に目標にしたり、手持ちの在庫や別工場からの供給を「既にあるアイテム」として差し引いたりできます。',
    },
    {
      heading: '条件を|選ぶ',
      body: '使ってよい代替レシピを1件ずつ選び、発電計画を有効にするかを決め、原料・消費電力・建物数のどれを節約するかを指定します。変えるたびに結果がすぐ計算し直されます。',
    },
    {
      heading: '結果を|読んで、|共有する',
      body: 'サマリー・生産ステップ・原料・アイテム収支の表、フローチャート、建設リストで結果を確認します。Excel に書き出すか、共有URLをコピーして別の端末やフレンドに渡せます。',
    },
  ],

  templatesHeading: 'ループ|テンプレート',
  templatesIntro:
    '副産物を上流に戻す循環構成は、手計算で帳尻を合わせるのが一番難しいところです。石油製品の完全循環、水を再利用するアルミやバッテリー、原子力の再処理まで、条件を入れた状態でそのまま開けるテンプレートを用意しています。',
  templatesOpenLabel: 'ツールで開く',

  guidesHeading: '解説記事',
  guidesIntro:
    'ツールの使い方から、代替レシピの比較指標の読み方、石炭発電の数え方、建設リストの読み方まで。数値はすべてゲームの公式データから引いています。',
  guidesAllLabel: '記事の一覧を見る',
  /** 英語版の入口（ヘッダーの言語切替と二重だが、本文からも辿れるよう残す）。 */
  otherLandingLinkLabel: 'English',
} as const satisfies LandingCopy

/**
 * 英語のランディングページ（/en/）専用の文。
 *
 * トップ（/）は日本語なので、英語圏の入口として同じ構成の静的ページを1枚置く
 * （ミラーではなく英語の玄関。文は英語で書き、日本語の訳にはしない）。
 * ゲーム用語は `{{Desc_…}}` トークンで書き、公式の英語名に置き換えて出す。
 * title と description は凍結（Search Console の再評価中）。
 */
export const EN_LANDING = {
  /** サイト名を後置しない（見出し自体がサイト名を含むため）。凍結。 */
  title: 'Satisfactory Production Planner — Solver, Flow Chart and Excel Export',
  /** 凍結。 */
  description:
    'Free unofficial planner for Satisfactory factories. Enter a target rate per minute and a linear programming solver returns the recipes, machine counts, power draw and raw resources, with a flow chart, a build list and an Excel export. Runs in the browser, nothing to install.',
  // 他ページと同じくカテゴリ名にする。見出しと同じ文字列だと重複して読める
  eyebrow: 'Free unofficial web tool',
  heading: 'Plan a whole Satisfactory production line from one target rate',
  lead: 'Type the item you want and how many per minute. A linear programming solver works out the entire line in one pass, from the ore nodes to the finished part: which recipes to run, how many machines of each, the power draw and the raw resources per minute. The result is shown as tables, a flow chart and a build list, and can be exported to Excel.',
  ctaLabel: 'Open the planner',
  ctaNote: 'Nothing to install and no account to create. It runs in your browser.',
  continueLabel: 'Continue where you left off',
  heroImageAlt:
    'Flow chart view: a {{Desc_ModularFrameHeavy_C}} line at 10 per minute drawn as 16 nodes and 20 flows. Each node lists the machine type, count and power draw, and each line carries the item rate per minute.',

  featuresHeading: 'Three things other calculators do not do',
  features: [
    {
      heading: 'When a plan is impossible, it tells you why and what to change',
      paragraphs: [
        'Most calculators stop at "infeasible". This one explains what is missing in plain words. Ask for {{Desc_PlutoniumPellet_C}}, for example, and it says that the {{Desc_NuclearWaste_C}} it needs is only produced as a byproduct of running a {{Build_GeneratorNuclear_C}}, then tells you the fix: turn on power generation and allow the {{Build_GeneratorNuclear_C}}.',
        'Missing recipes, resource limits and an optimisation goal that cannot be met each get their own explanation and the setting to review, so you stop guessing at which switch to flip.',
      ],
      image: 'infeasible',
      imageAlt:
        'The "No production plan meets these conditions" card for a {{Desc_PlutoniumPellet_C}} target of 60 per minute. It states that {{Desc_NuclearWaste_C}} is only produced as a byproduct of a running {{Build_GeneratorNuclear_C}} and advises turning on power generation and allowing that generator.',
      stacked: true,
    },
    {
      heading: 'A build list in build order',
      paragraphs: [
        'The solved plan is rearranged into a list that starts with mining and water extraction, then the production lines, then power generation. Build from the top and every step has its inputs ready before you need them. Each entry shows the building, how many to place, the clock speed, and the input and output rates per minute.',
        'Every flow also names the lowest tier of Conveyor Belt or Pipeline that still carries the full rate on one line, so you do not have to work out on site which belt mark you need and how many of them.',
      ],
      image: 'buildlist',
      imageAlt:
        'The Build list tab: 304 machines in total, grouped into "Mining and water extraction" and "Production lines". Rows such as Miner Mk.3 ×5 show node purity, clock speed, output rate and the belt tier and number of lines required.',
    },
    {
      heading: 'The whole line solved at once, with power, floor area and building counts',
      paragraphs: [
        'Instead of walking recipe by recipe, the solver optimises the entire line in a single pass. Choose whether to minimise raw resources, power or the number of buildings, and it returns the combination that is lowest by that measure. The summary lists total power draw, an estimated floor area in foundations, the building count, the build cost and sink points.',
        'The result exports to Excel as six sheets: Summary, Building List, Item Balance, Resources, Build Cost and Logistics. A plan can also be packed into a share URL that reopens the same conditions on another device or for a friend.',
      ],
      image: 'summary',
      imageAlt:
        'The Summary tab for a {{Desc_ModularFrameHeavy_C}} plan at 10 per minute: total power 2,586.10 MW, estimated floor area 41,688 m², 295 buildings, and a build cost table.',
    },
  ],

  stepsHeading: 'How to use it in three steps',
  steps: [
    {
      heading: 'Enter a target',
      body: 'Search for the item you want and type the rate per minute. You can add several targets at once, and subtract what you already have in storage or from another factory as external inputs.',
    },
    {
      heading: 'Choose the conditions',
      body: 'Switch on the alternate recipes you own, decide whether to plan power generation as well, and pick what to minimise: raw resources, power or buildings. The plan is recalculated every time you change something.',
    },
    {
      heading: 'Read the result and share it',
      body: 'Check the Summary, Production steps, Resources and Item balance tables, the flow chart and the build list. Export to Excel, or copy the share URL to open the same plan on another device or send it to a friend.',
    },
  ],

  templatesHeading: 'Loop templates',
  templatesIntro:
    'Setups that feed a byproduct back upstream are the hardest to balance by hand. These templates open the planner with the conditions already filled in: complete oil recycling, water reuse for aluminium and batteries, and nuclear power with reprocessing.',
  templatesOpenLabel: 'Open in the planner',

  guidesHeading: 'Guides',
  guidesIntro:
    'From a first walkthrough of the planner to reading the alternate recipe metrics, counting coal generators and using the build list. Every number comes from the official game data.',
  guidesAllLabel: 'See all guides',
} as const satisfies LandingCopy
