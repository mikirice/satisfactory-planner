import { powerStorageOutageDurationSizingArticleEn } from './power-storage-outage-duration-sizing.ts'
import { variablePowerPeakLoadPlanningArticleEn } from './variable-power-peak-load-planning.ts'
import { packagedNitrogenEmptyFluidTankCirculationPlanningArticleEn } from './packaged-nitrogen-empty-fluid-tank-circulation-planning.ts'
import { sharedQuickwireAllocationArticleEn } from './shared-quickwire-allocation-ai-limiters-high-speed-connectors.ts'
import { heavyModularFrameScrewBeltCapacityGuideArticleEn } from './heavy-modular-frame-screw-belt-capacity-guide.ts'
import { fusedModularFrameNitrogenPipelineCapacityArticleEn } from './fused-modular-frame-nitrogen-pipeline-capacity.ts'
import { finiteBiomassSolidBiofuelYieldGuideArticleEn } from './finite-biomass-solid-biofuel-yield-guide.ts'
import { trainReplenishmentBufferPlanningGuideArticleEn } from './train-replenishment-buffer-planning-guide.ts'
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
import { aluminumProductionGuideArticleEn } from './aluminum-production-guide.ts'
import { alternateRecipeMetricsArticleEn } from './alternate-recipe-metrics.ts'
import { awesomeSinkPointsArticleEn } from './awesome-sink-points.ts'
import { buildChecklistGuideArticleEn } from './build-checklist-guide.ts'
import { clockAndEfficiencyArticleEn } from './clock-and-efficiency.ts'
import { coalPowerStartupArticleEn } from './coal-power-startup.ts'
import { excelExportGuideArticleEn } from './excel-export-guide.ts'
import { oilProductsBasicsArticleEn } from './oil-products-basics.ts'
import { powerGenerationPlanningArticleEn } from './power-generation-planning.ts'
import { productionPlanningTutorialArticleEn } from './production-planning-tutorial.ts'
import { somersloopAndPowerShardsArticleEn } from './somersloop-and-power-shards.ts'
import { strongAlternateRecipesArticleEn } from './strong-alternate-recipes.ts'
import { minerRateByPurityArticleEn } from './miner-rate-by-purity.ts'
import { motorProductionRecipesArticleEn } from './motor-production-recipes.ts'
import { factoryFloorAreaArticleEn } from './factory-floor-area.ts'
import { fluidTruckDeliveryArticleEn } from './fluid-truck-delivery.ts'
import { vehiclePathsArticleEn } from './vehicle-paths.ts'
import { powerConnectorDaisyChainArticleEn } from './power-connector-daisy-chain.ts'
import { conveyor_throughput_monitor_guide_enArticle } from './conveyor-throughput-monitor-guide.ts'
import { priority_merger_use_cases_guide_enArticle } from './priority-merger-use-cases-guide.ts'
import { space_elevator_project_assembly_batch_planning_guide_enArticle } from './space-elevator-project-assembly-batch-planning-guide.ts'
import { dimensional_depot_refill_guide_enArticle } from './dimensional-depot-refill-guide.ts'
import { hypertube_junction_routing_guide_enArticle } from './hypertube-junction-routing-guide.ts'
import { freight_platform_loading_diagnosis_enArticle } from './freight-platform-loading-diagnosis.ts'
import { pipeline_flow_head_lift_troubleshooting_enArticle } from './pipeline-flow-head-lift-troubleshooting.ts'
import { smart_splitter_overflow_storage_guide_enArticle } from './smart-splitter-overflow-storage-guide.ts'
import { trainSignalsGuideArticleEn } from './train-signals-guide.ts'
import { blueprintDesignerWorkflowArticleEn } from './blueprint-designer-workflow.ts'
import { blueprintAutoConnectArticleEn } from './blueprint-auto-connect.ts'
import { powerGridRecoveryArticleEn } from './power-grid-recovery.ts'
import { hardDriveMamWorkflowArticleEn } from './hard-drive-mam-workflow.ts'


export const handwrittenArticlesEn = [
  productionPlanningTutorialArticleEn,
  alternateRecipeMetricsArticleEn,
  powerGenerationPlanningArticleEn,
  somersloopAndPowerShardsArticleEn,
  excelExportGuideArticleEn,
  coalPowerStartupArticleEn,
  oilProductsBasicsArticleEn,
  aluminumProductionGuideArticleEn,
  awesomeSinkPointsArticleEn,
  clockAndEfficiencyArticleEn,
  buildChecklistGuideArticleEn,
  strongAlternateRecipesArticleEn,
  minerRateByPurityArticleEn,
  motorProductionRecipesArticleEn,
  factoryFloorAreaArticleEn,
  fluidTruckDeliveryArticleEn,
  vehiclePathsArticleEn,
  powerConnectorDaisyChainArticleEn,
  conveyor_throughput_monitor_guide_enArticle,
  priority_merger_use_cases_guide_enArticle,
  space_elevator_project_assembly_batch_planning_guide_enArticle,
  dimensional_depot_refill_guide_enArticle,
  hypertube_junction_routing_guide_enArticle,
  freight_platform_loading_diagnosis_enArticle,
  pipeline_flow_head_lift_troubleshooting_enArticle,
  smart_splitter_overflow_storage_guide_enArticle,
  trainSignalsGuideArticleEn,
  blueprintDesignerWorkflowArticleEn,
  blueprintAutoConnectArticleEn,
  powerGridRecoveryArticleEn,
  hardDriveMamWorkflowArticleEn,
  trainReplenishmentBufferPlanningGuideArticleEn,
  finiteBiomassSolidBiofuelYieldGuideArticleEn,
  fusedModularFrameNitrogenPipelineCapacityArticleEn,
  heavyModularFrameScrewBeltCapacityGuideArticleEn,
  sharedQuickwireAllocationArticleEn,
  packagedNitrogenEmptyFluidTankCirculationPlanningArticleEn,
  variablePowerPeakLoadPlanningArticleEn,
  powerStorageOutageDurationSizingArticleEn,
] as const satisfies readonly HandwrittenArticle[]

export const handwrittenArticlesEnBySlug: ReadonlyMap<string, HandwrittenArticle> = new Map(
  handwrittenArticlesEn.map((article) => [article.slug, article]),
)
