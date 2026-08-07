/**
 * アイテムフローの列挙（Excel の物流シートとフローチャートの共通ロジック）。
 *
 * 「原料供給 / 各ステップの投入 / 各ステップの産出」という並びは Excel の物流シートが
 * 先に持っていたもの。グラフ側が同じ列挙を使うことで、**画面のエッジと Excel の行が
 * 同じ数字**になる。二重実装すると片方だけ直して数字がズレる（aggregate.ts と同じ方針）。
 */
import { belts, itemsById, pipes } from '../data/index.ts'
import { linesRequired, transportKind } from '../solver/index.ts'
import type { ItemRate, Solution, SolutionStep, TransportRequirement } from '../solver/index.ts'

export type PlanFlowKind = '原料供給' | '投入' | '産出'

export type PlanFlow = {
  kind: PlanFlowKind
  /** 原料供給は工程を持たないので null */
  step: SolutionStep | null
  item: string
  ratePerMin: number
}

/**
 * 解に含まれるフローを列挙する（原料供給 → 各ステップの投入・産出の順）。
 * 順序は Excel の物流シートの行順そのもの。変えると Excel の見た目が変わる。
 */
export function enumeratePlanFlows(solution: Solution): PlanFlow[] {
  const flows: PlanFlow[] = []
  for (const raw of solution.rawResources) {
    flows.push({ kind: '原料供給', step: null, item: raw.item, ratePerMin: raw.ratePerMin })
  }
  for (const step of solution.steps) {
    for (const flow of step.inputs) push(flows, '投入', step, flow)
    for (const flow of step.outputs) push(flows, '産出', step, flow)
  }
  return flows
}

function push(flows: PlanFlow[], kind: PlanFlowKind, step: SolutionStep, flow: ItemRate): void {
  flows.push({ kind, step, item: flow.item, ratePerMin: flow.ratePerMin })
}

/** 搬送手段の選択（未指定・不明なIDは最速の Mk にフォールバック）。 */
export type TransportChoice = {
  /** Belt.id。既定は最速 */
  beltId?: string
  /** Pipe.id。既定は最速 */
  pipeId?: string
}

/** 選択が実在するか確かめて、無ければ最速の Mk に落とす。 */
export function resolveTransportChoice(choice: TransportChoice | undefined): {
  beltId: string | undefined
  pipeId: string | undefined
} {
  return {
    beltId: belts.some((b) => b.id === choice?.beltId) ? choice?.beltId : belts.at(-1)?.id,
    pipeId: pipes.some((p) => p.id === choice?.pipeId) ? choice?.pipeId : pipes.at(-1)?.id,
  }
}

export type FlowTransport = {
  /** 固体はベルト、液体・気体はパイプ */
  kind: 'belt' | 'pipe'
  requirement: TransportRequirement
  /**
   * **1本あたり**の使用率（レート ÷ 1本の上限）。1 を超えたら1本では運べない＝ボトルネック。
   * `TransportRequirement.utilization` は必要本数で割った後の値なので必ず 1 以下になる。
   * ボトルネック判定にはこちらを使う。
   */
  singleLineUtilization: number
}

/** 1フローの搬送手段と必要本数。beltId / pipeId は解決済みのものを渡す。 */
export function flowTransport(
  item: string,
  ratePerMin: number,
  resolved: { beltId?: string; pipeId?: string },
): FlowTransport {
  const kind = transportKind(item)
  const requirement = linesRequired(
    ratePerMin,
    item,
    kind === 'belt' ? resolved.beltId : resolved.pipeId,
  )
  return {
    kind,
    requirement,
    singleLineUtilization:
      requirement.capacityPerMin > 0 ? ratePerMin / requirement.capacityPerMin : 0,
  }
}

/** アイテムの形態（固体 / 液体 / 気体）。 */
export function itemForm(item: string): 'solid' | 'liquid' | 'gas' {
  const form = itemsById.get(item)?.form
  return form === 'liquid' || form === 'gas' ? form : 'solid'
}
