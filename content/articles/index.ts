import { powerStorageOutageDurationSizingArticle } from './power-storage-outage-duration-sizing.ts'
import { sharedCircuitBoardComputerFeedstockBudgetArticle } from './shared-circuit-board-computer-feedstock-budget.ts'
import { variablePowerPeakLoadPlanningArticle } from './variable-power-peak-load-planning.ts'
import { packagedNitrogenEmptyFluidTankCirculationPlanningArticle } from './packaged-nitrogen-empty-fluid-tank-circulation-planning.ts'
import { sharedQuickwireAllocationArticle } from './shared-quickwire-allocation-ai-limiters-high-speed-connectors.ts'
import { heavyModularFrameScrewBeltCapacityGuideArticle } from './heavy-modular-frame-screw-belt-capacity-guide.ts'
import { fusedModularFrameNitrogenPipelineCapacityArticle } from './fused-modular-frame-nitrogen-pipeline-capacity.ts'
import { finiteBiomassSolidBiofuelYieldGuideArticle } from './finite-biomass-solid-biofuel-yield-guide.ts'
import { trainReplenishmentBufferPlanningGuideArticle } from './train-replenishment-buffer-planning-guide.ts'
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
import { minerRateByPurityArticle } from './miner-rate-by-purity.ts'
import { motorProductionRecipesArticle } from './motor-production-recipes.ts'
import { factoryFloorAreaArticle } from './factory-floor-area.ts'
import { fluidTruckDeliveryArticle } from './fluid-truck-delivery.ts'
import { vehiclePathsArticle } from './vehicle-paths.ts'
import { powerConnectorDaisyChainArticle } from './power-connector-daisy-chain.ts'
import { conveyor_throughput_monitor_guideArticle } from './conveyor-throughput-monitor-guide.ts'
import { priority_merger_use_cases_guideArticle } from './priority-merger-use-cases-guide.ts'
import { space_elevator_project_assembly_batch_planning_guideArticle } from './space-elevator-project-assembly-batch-planning-guide.ts'
import { dimensional_depot_refill_guideArticle } from './dimensional-depot-refill-guide.ts'
import { hypertube_junction_routing_guideArticle } from './hypertube-junction-routing-guide.ts'
import { freight_platform_loading_diagnosisArticle } from './freight-platform-loading-diagnosis.ts'
import { pipeline_flow_head_lift_troubleshootingArticle } from './pipeline-flow-head-lift-troubleshooting.ts'
import { smart_splitter_overflow_storage_guideArticle } from './smart-splitter-overflow-storage-guide.ts'
import { trainSignalsGuideArticle } from './train-signals-guide.ts'
import { blueprintDesignerWorkflowArticle } from './blueprint-designer-workflow.ts'
import { blueprintAutoConnectArticle } from './blueprint-auto-connect.ts'
import { powerGridRecoveryArticle } from './power-grid-recovery.ts'
import { hardDriveMamWorkflowArticle } from './hard-drive-mam-workflow.ts'
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
  minerRateByPurityArticle,
  motorProductionRecipesArticle,
  factoryFloorAreaArticle,
  fluidTruckDeliveryArticle,
  vehiclePathsArticle,
  powerConnectorDaisyChainArticle,
  conveyor_throughput_monitor_guideArticle,
  priority_merger_use_cases_guideArticle,
  space_elevator_project_assembly_batch_planning_guideArticle,
  dimensional_depot_refill_guideArticle,
  hypertube_junction_routing_guideArticle,
  freight_platform_loading_diagnosisArticle,
  pipeline_flow_head_lift_troubleshootingArticle,
  smart_splitter_overflow_storage_guideArticle,
  trainSignalsGuideArticle,
  blueprintDesignerWorkflowArticle,
  blueprintAutoConnectArticle,
  powerGridRecoveryArticle,
  hardDriveMamWorkflowArticle,
  trainReplenishmentBufferPlanningGuideArticle,
  finiteBiomassSolidBiofuelYieldGuideArticle,
  fusedModularFrameNitrogenPipelineCapacityArticle,
  heavyModularFrameScrewBeltCapacityGuideArticle,
  sharedQuickwireAllocationArticle,
  packagedNitrogenEmptyFluidTankCirculationPlanningArticle,
  variablePowerPeakLoadPlanningArticle,
  powerStorageOutageDurationSizingArticle,
  sharedCircuitBoardComputerFeedstockBudgetArticle,
] as const satisfies readonly HandwrittenArticle[]

export type HandwrittenArticleSlug = (typeof handwrittenArticles)[number]['slug']
