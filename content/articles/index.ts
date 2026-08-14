import { alternateRecipeMetricsArticle } from './alternate-recipe-metrics.ts'
import { excelExportGuideArticle } from './excel-export-guide.ts'
import { powerGenerationPlanningArticle } from './power-generation-planning.ts'
import { productionPlanningTutorialArticle } from './production-planning-tutorial.ts'
import { somersloopAndPowerShardsArticle } from './somersloop-and-power-shards.ts'
import type { HandwrittenArticle } from './types.ts'

export type {
  ArticleCta,
  ArticleSection,
  HandwrittenArticle,
  ItemArticleCta,
  SampleArticleCta,
} from './types.ts'

export const handwrittenArticles = [
  productionPlanningTutorialArticle,
  alternateRecipeMetricsArticle,
  powerGenerationPlanningArticle,
  somersloopAndPowerShardsArticle,
  excelExportGuideArticle,
] as const satisfies readonly HandwrittenArticle[]

export type HandwrittenArticleSlug = (typeof handwrittenArticles)[number]['slug']
