/**
 * オーバークロック / Somersloop のソルバー後処理（仕様書ドラフト-v0 §4.3）。
 *
 * LP は稼働台数を連続値で出す（例: 3.5台）。実際のゲームでは整数台の機械に
 * クロック速度を設定して合わせるので、ここでその割り当て案を作る。
 *
 *   消費電力 = 基本電力 × クロック^powerExponent          (powerExponent ≒ log2(2.5))
 *   Somersloop 使用時 = 基本電力 × (1 + 使用数/最大数)^somersloopPowerExponent
 */
import {
  CLOCK_MAX,
  CLOCK_MIN,
  CLOCK_STEP_PER_POWER_SHARD,
  MAX_POWER_SHARDS_PER_MACHINE,
} from '../data/constants.ts'
import type { Building } from '../data/types.ts'

/** クロック c で運転したときの消費電力(MW)。 */
export function clockedPowerMW(basePowerMW: number, clock: number, powerExponent: number): number {
  return basePowerMW * Math.pow(clock, powerExponent)
}

/** Somersloop を n 個挿したときの産出倍率。 */
export function somersloopOutputMultiplier(sloops: number, maxSloops: number): number {
  if (maxSloops <= 0) return 1
  return 1 + Math.min(sloops, maxSloops) / maxSloops
}

/** Somersloop を n 個挿したときの消費電力(MW)。クロック100%基準。 */
export function somersloopPowerMW(
  basePowerMW: number,
  sloops: number,
  maxSloops: number,
  somersloopPowerExponent: number,
): number {
  return basePowerMW * Math.pow(somersloopOutputMultiplier(sloops, maxSloops), somersloopPowerExponent)
}

/** クロック c を出すのに1台あたり必要なパワーシャード数（100%以下なら0）。 */
export function powerShardsForClock(clock: number): number {
  if (clock <= 1) return 0
  const shards = Math.ceil((clock - 1) / CLOCK_STEP_PER_POWER_SHARD - 1e-9)
  return Math.min(shards, MAX_POWER_SHARDS_PER_MACHINE)
}

export type ClockGroup = {
  /** この設定で建てる台数 */
  count: number
  /** クロック速度（1 = 100%） */
  clockSpeed: number
  /** 1台あたりの消費電力(MW) */
  powerMWEach: number
  /** 1台あたりに必要なパワーシャード数 */
  powerShardsEach: number
}

export type ClockPlan = {
  /**
   * - `even`            … 全台を同じクロックに揃える（切り上げ台数）
   * - `fullPlusPartial` … 整数台は100%、端数を1台に寄せる
   * - `overclocked`     … クロック上限まで上げて台数を最小化（パワーシャードが要る）
   */
  strategy: 'even' | 'fullPlusPartial' | 'overclocked'
  /** 建てる総台数 */
  machineCount: number
  groups: ClockGroup[]
  /** この案の総消費電力(MW) */
  totalPowerMW: number
  /** 必要なパワーシャードの総数 */
  totalPowerShards: number
}

export type ClockPlanOptions = {
  /** クロックの上限。パワーシャードを使わない縛りなら 1 を渡す。既定 2.5 */
  maxClock?: number
  /** 可変電力レシピ等で建物の powerConsumptionMW を使いたくないときの上書き(MW/台) */
  basePowerMW?: number
}

/**
 * 連続値の稼働台数 machineCount を、実際に建てる整数台＋クロックの案に変換する。
 * 常に 1 案以上を返し、先頭が消費電力の小さい順に並ぶ。
 */
export function planClocks(
  machineCount: number,
  building: Building,
  options: ClockPlanOptions = {},
): ClockPlan[] {
  const maxClock = Math.min(options.maxClock ?? CLOCK_MAX, CLOCK_MAX)
  const basePowerMW = options.basePowerMW ?? building.powerConsumptionMW
  const exponent = building.powerExponent
  const plans: ClockPlan[] = []

  if (machineCount <= 0) return plans

  const makeGroup = (count: number, clockSpeed: number): ClockGroup => ({
    count,
    clockSpeed,
    powerMWEach: clockedPowerMW(basePowerMW, clockSpeed, exponent),
    powerShardsEach: powerShardsForClock(clockSpeed),
  })
  const finish = (strategy: ClockPlan['strategy'], groups: ClockGroup[]): ClockPlan => ({
    strategy,
    machineCount: groups.reduce((n, g) => n + g.count, 0),
    groups,
    totalPowerMW: groups.reduce((p, g) => p + g.count * g.powerMWEach, 0),
    totalPowerShards: groups.reduce((s, g) => s + g.count * g.powerShardsEach, 0),
  })

  // 1) 全台同じクロック（アンダークロックのみ・最も電力効率が良い）
  const evenCount = Math.max(1, Math.ceil(machineCount - 1e-9))
  const evenClock = clampClock(machineCount / evenCount)
  plans.push(finish('even', [makeGroup(evenCount, evenClock)]))

  // 2) 整数台は100%、端数だけ1台に寄せる（設定が楽・ライン分割しやすい）
  const fullCount = Math.floor(machineCount + 1e-9)
  const remainder = machineCount - fullCount
  if (fullCount >= 1 && remainder > 1e-9) {
    plans.push(
      finish('fullPlusPartial', [makeGroup(fullCount, 1), makeGroup(1, clampClock(remainder))]),
    )
  }

  // 3) 上限までオーバークロックして台数を減らす（パワーシャードが要る）
  if (maxClock > 1) {
    const minCount = Math.max(1, Math.ceil(machineCount / maxClock - 1e-9))
    if (minCount < evenCount) {
      plans.push(finish('overclocked', [makeGroup(minCount, clampClock(machineCount / minCount))]))
    }
  }

  return plans.sort((a, b) => a.totalPowerMW - b.totalPowerMW)
}

/**
 * ゲーム内で設定できる範囲（1%〜250%）に丸める。
 * 稼働台数が 0.01 未満のときだけ、丸めた結果のスループットが要求を上回る
 * （ゲーム側で 1% 未満に落とせないため。過剰生産になるだけで不足はしない）。
 */
function clampClock(clock: number): number {
  return Math.min(CLOCK_MAX, Math.max(CLOCK_MIN, clock))
}
