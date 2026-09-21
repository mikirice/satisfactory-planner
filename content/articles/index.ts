import { aluminumProductionGuideArticle } from './aluminum-production-guide.ts'
import { alternateRecipeMetricsArticle } from './alternate-recipe-metrics.ts'
import { awesomeSinkPointsArticle } from './awesome-sink-points.ts'
import { buildChecklistGuideArticle } from './build-checklist-guide.ts'
import { clockAndEfficiencyArticle } from './clock-and-efficiency.ts'
import { coalPowerStartupArticle } from './coal-power-startup.ts'
import { excelExportGuideArticle } from './excel-export-guide.ts'
import { oilProductsBasicsArticle } from './oil-products-basics.ts'
import { powerGenerationPlanningArticle } from './power-generation-planning.ts'
import { productionPlanningTutorialArticle } from './production-planning-tutorial.ts'
import { somersloopAndPowerShardsArticle } from './somersloop-and-power-shards.ts'
import { strongAlternateRecipesArticle } from './strong-alternate-recipes.ts'
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
  coalPowerStartupArticle,
  oilProductsBasicsArticle,
  aluminumProductionGuideArticle,
  awesomeSinkPointsArticle,
  clockAndEfficiencyArticle,
  buildChecklistGuideArticle,
  strongAlternateRecipesArticle,
] as const satisfies readonly HandwrittenArticle[]

export type HandwrittenArticleSlug = (typeof handwrittenArticles)[number]['slug']
