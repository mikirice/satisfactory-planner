/**
 * 計算エンジンの公開API。
 *
 *   const result = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
 *   if (result.status === 'optimal') { ... }
 */
export {
  solveProduction,
  findUnreachableTargets,
  findUnusableGenerators,
  generatorStepId,
  resolveMaxClock,
} from './solve.ts'
export type { SolveOptions } from './solve.ts'

export {
  DEFAULT_EPSILON,
  DEFAULT_RESOURCE_WEIGHT_SPEC,
  DEFAULT_TOLERANCE,
  DEFAULT_WEIGHTS,
  POWER_COVER_ROW,
  POWER_TARGET_ROW,
  SCARCITY_REFERENCE_RATE,
  buildProductionModel,
  defaultEnabledRecipeIds,
  generatorVarKey,
  maximizeVarKey,
  netRatePerMin,
  recipePowerMW,
  resolvePowerPlan,
  resolveResourceWeights,
  somersloopPowerFactor,
  somersloopVarKey,
  supportsSomersloop,
  variablePowerRange,
} from './model.ts'
export type {
  GeneratorVariant,
  ProductionModel,
  ResolvedPowerPlan,
  SupplySource,
} from './model.ts'

export {
  clockedPowerMW,
  planClocks,
  powerShardsForClock,
  somersloopOutputMultiplier,
  somersloopPowerMW,
} from './overclock.ts'
export type { ClockGroup, ClockPlan, ClockPlanOptions } from './overclock.ts'

export { linesRequired, linesRequiredByTier, transportKind } from './logistics.ts'
export type { TransportRequirement } from './logistics.ts'

export {
  DEFAULT_MINER_ID,
  MINER_IDS,
  OIL_EXTRACTOR_ID,
  WATER_EXTRACTOR_ID,
  WELL_EXTRACTOR_ID,
  WELL_PRESSURIZER_ID,
  assignPurityNodes,
  planExtraction,
} from './extraction.ts'
export type {
  ExtractionInput,
  ExtractionOptions,
  ExtractionPlan,
  ExtractorGroup,
  NodeAssignment,
  ResourceExtraction,
} from './extraction.ts'

export { disposeGlpk, glpkBackend, loadGlpk, solveWithGlpk } from './glpk-backend.ts'
export { writeLpFormat } from './lp.ts'
export type { LpBackend, LpConstraint, LpModel, LpResult, LpStatus, LpVariable } from './lp.ts'

export type {
  ExternalInputUsage,
  InfeasibleReason,
  InfeasibleResult,
  ItemBalance,
  ItemRate,
  ObjectiveWeights,
  PowerGenerationSummary,
  PowerPlanInput,
  PowerRangeMW,
  RawResourceUsage,
  ResourceWeightSpec,
  Solution,
  SolutionStep,
  SolveInput,
  SolveResult,
  TargetRate,
  TargetResult,
} from './types.ts'
