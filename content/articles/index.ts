import { sharedCircuitBoardComputerFeedstockBudgetArticle } from './shared-circuit-board-computer-feedstock-budget.ts'
import {
  strongAlternateRecipesArticleMerged,
  productionPlanningTutorialArticleMerged,
  blueprintDesignerWorkflowArticleMerged,
  spaceElevatorBatchArticleMerged,
  aluminumProductionGuideArticleMerged,
  packagedCirculationArticleMerged,
} from './merged-article-overrides.ts'
import {
  awesomeSinkPointsArticleRevision,
  fluidTruckDeliveryArticleRevision,
  vehiclePathsArticleRevision,
  conveyorThroughputMonitorArticleRevision,
  hypertubeJunctionArticleRevision,
  freightPlatformArticleRevision,
  pipelineFlowArticleRevision,
  smartSplitterArticleRevision,
} from './editorial-revisions.ts'

import { trainReplenishmentBufferPlanningGuideArticle } from './train-replenishment-buffer-planning-guide.ts'

import { excelExportGuideArticle } from './excel-export-guide.ts'
import { oilProductsBasicsArticle } from './oil-products-basics.ts'

import { somersloopAndPowerShardsArticle } from './somersloop-and-power-shards.ts'

import { minerRateByPurityArticle } from './miner-rate-by-purity.ts'
import { priority_merger_use_cases_guideArticle } from './priority-merger-use-cases-guide.ts'

import { dimensional_depot_refill_guideArticle } from './dimensional-depot-refill-guide.ts'
import { trainSignalsGuideArticle } from './train-signals-guide.ts'

import { hardDriveMamWorkflowArticle } from './hard-drive-mam-workflow.ts'
import type { HandwrittenArticle } from './types.ts'

import { powerSystemCapacityAndRecoveryArticle } from './power-system-capacity-and-recovery.ts'
import { resourceThroughputCapacityGuideArticle } from './resource-throughput-capacity-guide.ts'
export type {
  ArticleCta,
  ArticleSection,
  HandwrittenArticle,
  ItemArticleCta,
  SampleArticleCta,
} from './types.ts'

export const handwrittenArticles = [
  productionPlanningTutorialArticleMerged,
  somersloopAndPowerShardsArticle,
  excelExportGuideArticle,
  oilProductsBasicsArticle,
  aluminumProductionGuideArticleMerged,
  awesomeSinkPointsArticleRevision,
  strongAlternateRecipesArticleMerged,
  minerRateByPurityArticle,
  fluidTruckDeliveryArticleRevision,
  vehiclePathsArticleRevision,
  conveyorThroughputMonitorArticleRevision,
  priority_merger_use_cases_guideArticle,
  spaceElevatorBatchArticleMerged,
  dimensional_depot_refill_guideArticle,
  hypertubeJunctionArticleRevision,
  freightPlatformArticleRevision,
  pipelineFlowArticleRevision,
  smartSplitterArticleRevision,
  trainSignalsGuideArticle,
  blueprintDesignerWorkflowArticleMerged,
  hardDriveMamWorkflowArticle,
  trainReplenishmentBufferPlanningGuideArticle,
  packagedCirculationArticleMerged,
  sharedCircuitBoardComputerFeedstockBudgetArticle,
  powerSystemCapacityAndRecoveryArticle,
  resourceThroughputCapacityGuideArticle,
] as const satisfies readonly HandwrittenArticle[]

export type HandwrittenArticleSlug = (typeof handwrittenArticles)[number]['slug']
