/**
 * English mirror of the handwritten guides (計画書 §5).
 *
 * Each entry is a full translation of the Japanese article with the **same slug** and the
 * **same CTA target**, so `/articles/{slug}/` and `/en/articles/{slug}/` can point at each other
 * with hreflang. The pairing is enforced by tests/build-pages.test.ts; adding a Japanese article
 * without its English counterpart fails there rather than silently shipping a half-mirrored site.
 *
 * The prose is translated article by article, not string by string: sentence structure, examples
 * and emphasis are rewritten so the English reads natively, while every game term uses the
 * official English name from the game data (計画書 §5「機械的でなく1本ずつ品質確認する」).
 */
import type { HandwrittenArticle } from '../types.ts'
import { alternateRecipeMetricsArticleEn } from './alternate-recipe-metrics.ts'
import { excelExportGuideArticleEn } from './excel-export-guide.ts'
import { powerGenerationPlanningArticleEn } from './power-generation-planning.ts'
import { productionPlanningTutorialArticleEn } from './production-planning-tutorial.ts'
import { somersloopAndPowerShardsArticleEn } from './somersloop-and-power-shards.ts'

export const handwrittenArticlesEn = [
  productionPlanningTutorialArticleEn,
  alternateRecipeMetricsArticleEn,
  powerGenerationPlanningArticleEn,
  somersloopAndPowerShardsArticleEn,
  excelExportGuideArticleEn,
] as const satisfies readonly HandwrittenArticle[]

export const handwrittenArticlesEnBySlug: ReadonlyMap<string, HandwrittenArticle> = new Map(
  handwrittenArticlesEn.map((article) => [article.slug, article]),
)
