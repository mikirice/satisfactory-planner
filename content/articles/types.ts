export type ArticleSection = {
  readonly heading: string
  readonly paragraphs: readonly string[]
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
}

export type ArticleCta = SampleArticleCta | ItemArticleCta

export type HandwrittenArticle = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly sections: readonly ArticleSection[]
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
  readonly cta: ArticleCta
}
