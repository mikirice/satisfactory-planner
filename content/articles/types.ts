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
  readonly cta: ArticleCta
}
