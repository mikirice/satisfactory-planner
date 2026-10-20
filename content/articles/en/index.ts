import { sharedCircuitBoardComputerFeedstockBudgetArticleEn } from './shared-circuit-board-computer-feedstock-budget.ts'
import {
  strongAlternateRecipesArticleMergedEn,
  productionPlanningTutorialArticleMergedEn,
  blueprintDesignerWorkflowArticleMergedEn,
  spaceElevatorBatchArticleMergedEn,
  aluminumProductionGuideArticleMergedEn,
  packagedCirculationArticleMergedEn,
} from './merged-article-overrides.ts'
import {
  awesomeSinkPointsArticleRevisionEn,
  fluidTruckDeliveryArticleRevisionEn,
  vehiclePathsArticleRevisionEn,
  conveyorThroughputMonitorArticleRevisionEn,
  hypertubeJunctionArticleRevisionEn,
  freightPlatformArticleRevisionEn,
  pipelineFlowArticleRevisionEn,
  smartSplitterArticleRevisionEn,
} from './editorial-revisions.ts'
import { trainReplenishmentBufferPlanningGuideArticleEn } from './train-replenishment-buffer-planning-guide.ts'
import { powerSystemCapacityAndRecoveryArticleEn } from './power-system-capacity-and-recovery.ts'
import { resourceThroughputCapacityGuideArticleEn } from './resource-throughput-capacity-guide.ts'
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
import { excelExportGuideArticleEn } from './excel-export-guide.ts'
import { oilProductsBasicsArticleEn } from './oil-products-basics.ts'
import { somersloopAndPowerShardsArticleEn } from './somersloop-and-power-shards.ts'

import { minerRateByPurityArticleEn } from './miner-rate-by-purity.ts'
import { priority_merger_use_cases_guide_enArticle } from './priority-merger-use-cases-guide.ts'
import { dimensional_depot_refill_guide_enArticle } from './dimensional-depot-refill-guide.ts'
import { trainSignalsGuideArticleEn } from './train-signals-guide.ts'
import { hardDriveMamWorkflowArticleEn } from './hard-drive-mam-workflow.ts'


export const handwrittenArticlesEn = [
  productionPlanningTutorialArticleMergedEn,
  somersloopAndPowerShardsArticleEn,
  excelExportGuideArticleEn,
  oilProductsBasicsArticleEn,
  aluminumProductionGuideArticleMergedEn,
  awesomeSinkPointsArticleRevisionEn,
  strongAlternateRecipesArticleMergedEn,
  minerRateByPurityArticleEn,
  fluidTruckDeliveryArticleRevisionEn,
  vehiclePathsArticleRevisionEn,
  conveyorThroughputMonitorArticleRevisionEn,
  priority_merger_use_cases_guide_enArticle,
  spaceElevatorBatchArticleMergedEn,
  dimensional_depot_refill_guide_enArticle,
  hypertubeJunctionArticleRevisionEn,
  freightPlatformArticleRevisionEn,
  pipelineFlowArticleRevisionEn,
  smartSplitterArticleRevisionEn,
  trainSignalsGuideArticleEn,
  blueprintDesignerWorkflowArticleMergedEn,
  hardDriveMamWorkflowArticleEn,
  trainReplenishmentBufferPlanningGuideArticleEn,
  packagedCirculationArticleMergedEn,
  sharedCircuitBoardComputerFeedstockBudgetArticleEn,
  powerSystemCapacityAndRecoveryArticleEn,
  resourceThroughputCapacityGuideArticleEn,
] as const satisfies readonly HandwrittenArticle[]

export const handwrittenArticlesEnBySlug: ReadonlyMap<string, HandwrittenArticle> = new Map(
  handwrittenArticlesEn.map((article) => [article.slug, article]),
)
