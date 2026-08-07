/**
 * 計算エンジンの公開API。
 *
 *   const result = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
 *   if (result.status === 'optimal') { ... }
 */
export { solveProduction, findUnreachableTargets } from './solve.ts'
export type { SolveOptions } from './solve.ts'

export {
  DEFAULT_EPSILON,
  DEFAULT_RESOURCE_WEIGHT_SPEC,
  DEFAULT_TOLERANCE,
  DEFAULT_WEIGHTS,
  SCARCITY_REFERENCE_RATE,
  buildProductionModel,
  defaultEnabledRecipeIds,
  netRatePerMin,
  recipePowerMW,
  resolveResourceWeights,
  variablePowerRange,
} from './model.ts'
export type { ProductionModel, SupplySource } from './model.ts'

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

export { disposeGlpk, glpkBackend, loadGlpk, solveWithGlpk } from './glpk-backend.ts'
export { writeLpFormat } from './lp.ts'
export type { LpBackend, LpConstraint, LpModel, LpResult, LpStatus, LpVariable } from './lp.ts'

export type {
  InfeasibleReason,
  InfeasibleResult,
  ItemBalance,
  ItemRate,
  ObjectiveWeights,
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
