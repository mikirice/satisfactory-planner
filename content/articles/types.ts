export type ArticleSection = {
  readonly heading: string
  readonly paragraphs: readonly string[]
  readonly tables?: readonly ArticleTable[]
  readonly illustration?: ArticleIllustration
  readonly illustrations?: readonly ArticleIllustration[]
}

export type ArticleIllustration = {
  readonly src: string
  readonly alt: string
  readonly caption: string
  readonly creditLinks?: readonly { readonly label: string; readonly href: string }[]
}

export type ArticleTable = {
  readonly caption?: string
  readonly headers: readonly string[]
  readonly rows: readonly (readonly string[])[]
}

export type ArticleReferences = {
  readonly heading: string
  readonly links: readonly { readonly label: string; readonly href: string }[]
}

export type SampleArticleCta = {
  readonly kind: 'sample'
  readonly label: string
  readonly sampleId: string
}

export type ItemArticleCta = {
  readonly kind: 'item'
  readonly label: string
  readonly itemId: string
  readonly ratePerMin?: number
  readonly alternateRecipeIds?: readonly string[]
  readonly somersloops?: number
  readonly minerId?: string
}

export type ArticleCta = SampleArticleCta | ItemArticleCta

export type HandwrittenArticle = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly sections: readonly ArticleSection[]
  readonly references?: ArticleReferences
  readonly relatedItemIds: readonly string[]
  /**
   * 同じサイト内の関連記事（手書き記事の slug またはループテンプレートの sample id）。
   * 見出しは表示ロケールの記事タイトルから引くので、ここには slug だけを書く。
   * 日英で同じ値にする（翻訳側で並びを変えない）。
   */
  readonly relatedArticleSlugs?: readonly string[]
  /**
   * 公開日（YYYY-MM-DD）。省略時は記事テンプレートの既定日。
   * 追加した記事だけ日付が違うので、記事ごとに持たせる。
   */
  readonly publishedDate?: string
  /** Last factual/content revision date (YYYY-MM-DD); omit if no known update date exists. */
  readonly updatedDate?: string
  /** Article-specific game-version scope when the page explains a newer mechanic than the Planner's bundled dataset. */
  readonly versionNotice?: string
  readonly cta: ArticleCta
}
