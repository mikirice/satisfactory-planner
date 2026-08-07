/**
 * 解 → フローチャートのノード / エッジ（仕様書 v1 §9）。
 *
 * ここは **描画ライブラリに依存しない純データ**。React Flow への変換は src/ui/FlowChart.tsx
 * が担当する（テストを Node 環境で回せるようにするため）。
 *
 * 作り方:
 * - ノード = 原料供給（採掘）/ 生産ステップ / 出力（目標・副産物）
 * - エッジ = アイテムごとに「生産側の各ノード → 消費側の各ノード」を按分して張る。
 *   按分は `生産量 × 消費量 ÷ 総量`。どのラインが実際にどこへ行くかはゲーム内で自由なので、
 *   ここでは比率で割るのが妥当（総量はアイテム収支と必ず一致する）。
 * - 生産量が消費量を上回った分（＝目標産出・副産物）は出力ノードへ流す。これにより
 *   すべてのアイテムで「入ってきた量 = 出ていく量」が保たれる。
 * - 循環レシピ（リサイクル・プラスチック / ゴム）は互いに相手の産出を消費するので、
 *   結果として両方向のエッジが張られ、ループがそのまま図に出る。
 */
import { builtCount } from './aggregate.ts'
import { enumeratePlanFlows, flowTransport, itemForm, resolveTransportChoice } from './flows.ts'
import type { TransportChoice } from './flows.ts'
import { itemsById } from '../data/index.ts'
import type { ItemRate, PowerRangeMW, Solution, SolutionStep } from '../solver/index.ts'

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export type PlanGraphNodeKind = 'source' | 'recipe' | 'output'

type NodeBase = {
  id: string
  kind: PlanGraphNodeKind
}

/** 原料供給（採掘）／持ち込み。 */
export type SourceGraphNode = NodeBase & {
  kind: 'source'
  item: string
  itemNameJa: string
  unitJa: string
  ratePerMin: number
  /** SolveInput.inputs で持ち込んだ分（採掘ではない） */
  external: boolean
}

/** 生産ステップ（レシピ1つ）。 */
export type RecipeGraphNode = NodeBase & {
  kind: 'recipe'
  recipeId: string
  recipeNameJa: string
  buildingId: string
  buildingNameJa: string
  /** 稼働台数（小数） */
  machineCount: number
  /** 実際に建てる台数（切り上げ） */
  buildingCount: number
  /** 建てる台数で回したときのクロック（0〜1） */
  clock: number
  powerMW: number
  powerRangeMW?: PowerRangeMW
  inputs: ItemRate[]
  outputs: ItemRate[]
}

/** 最終出力（目標産出 / 副産物）。 */
export type OutputGraphNode = NodeBase & {
  kind: 'output'
  item: string
  itemNameJa: string
  unitJa: string
  ratePerMin: number
  /** 目標に指定されたアイテムか（false なら副産物） */
  isTarget: boolean
  /** 目標のときの要求レート */
  requestedPerMin?: number
}

export type PlanGraphNode = SourceGraphNode | RecipeGraphNode | OutputGraphNode

export type PlanGraphEdge = {
  id: string
  /** 送り出す側のノードID */
  source: string
  /** 受け取る側のノードID */
  target: string
  item: string
  itemNameJa: string
  ratePerMin: number
  unitJa: string
  form: 'solid' | 'liquid' | 'gas'
  /** 固体=ベルト、液体・気体=パイプ */
  transport: 'belt' | 'pipe'
  transportNameJa: string
  /** 選択中の Mk の1本あたり上限 */
  capacityPerMin: number
  /** 必要本数（切り上げ） */
  lines: number
  /** 1本あたりの使用率。1 を超える＝1本では運べない */
  utilization: number
  /** utilization > 1（＝ lines >= 2）ならボトルネック */
  bottleneck: boolean
}

export type PlanGraph = {
  nodes: PlanGraphNode[]
  edges: PlanGraphEdge[]
  /** ボトルネックのエッジ数（凡例・注意書き用） */
  bottleneckCount: number
}

export type PlanGraphOptions = TransportChoice

/** これ未満のレートは無視する（LPの丸め誤差でノイズのようなエッジが出るのを防ぐ）。 */
const MIN_RATE = 1e-6

// ---------------------------------------------------------------------------
// 組み立て
// ---------------------------------------------------------------------------

/** 解からフローチャート用のノード / エッジを組み立てる。 */
export function buildPlanGraph(solution: Solution, options?: PlanGraphOptions): PlanGraph {
  const resolved = resolveTransportChoice(options)

  const nodes: PlanGraphNode[] = []
  /** item -> そのアイテムを送り出すノードと量 */
  const producers = new Map<string, Port[]>()
  /** item -> そのアイテムを受け取るノードと量 */
  const consumers = new Map<string, Port[]>()

  // 1) 原料供給（Excel の物流シートと同じ列挙を使う）
  const flows = enumeratePlanFlows(solution)
  for (const flow of flows) {
    if (flow.kind !== '原料供給' || flow.ratePerMin <= MIN_RATE) continue
    const id = `source:${flow.item}`
    nodes.push(sourceNode(id, flow.item, flow.ratePerMin, false))
    add(producers, flow.item, { nodeId: id, ratePerMin: flow.ratePerMin })
  }

  // 2) 持ち込み（外部からの供給。UI では未使用だが解には入りうる）
  for (const input of solution.externalInputs) {
    if (input.ratePerMin <= MIN_RATE) continue
    const id = `external:${input.item}`
    nodes.push(sourceNode(id, input.item, input.ratePerMin, true))
    add(producers, input.item, { nodeId: id, ratePerMin: input.ratePerMin })
  }

  // 3) 生産ステップ
  for (const step of solution.steps) {
    const id = recipeNodeId(step)
    nodes.push(recipeNode(id, step))
    for (const flow of step.inputs) {
      if (flow.ratePerMin > MIN_RATE) {
        add(consumers, flow.item, { nodeId: id, ratePerMin: flow.ratePerMin })
      }
    }
    for (const flow of step.outputs) {
      if (flow.ratePerMin > MIN_RATE) {
        add(producers, flow.item, { nodeId: id, ratePerMin: flow.ratePerMin })
      }
    }
  }

  // 4) 消費されずに余った分は出力ノードへ（目標産出 / 副産物）
  const targetById = new Map(solution.targets.map((t) => [t.item, t]))
  for (const [item, ports] of producers) {
    const produced = total(ports)
    const consumed = total(consumers.get(item) ?? [])
    const leftover = produced - consumed
    if (leftover <= MIN_RATE) continue
    const id = `output:${item}`
    const target = targetById.get(item)
    nodes.push({
      id,
      kind: 'output',
      item,
      itemNameJa: itemNameJa(item),
      unitJa: unitJa(item),
      ratePerMin: leftover,
      isTarget: target !== undefined,
      ...(target ? { requestedPerMin: target.requestedPerMin } : {}),
    })
    add(consumers, item, { nodeId: id, ratePerMin: leftover })
  }

  // 5) エッジ（アイテムごとに按分）
  const edges: PlanGraphEdge[] = []
  for (const [item, from] of producers) {
    const to = consumers.get(item) ?? []
    if (to.length === 0) continue
    const denominator = Math.max(total(from), total(to))
    if (denominator <= MIN_RATE) continue
    for (const producer of from) {
      for (const consumer of to) {
        const ratePerMin = (producer.ratePerMin * consumer.ratePerMin) / denominator
        if (ratePerMin <= MIN_RATE) continue
        edges.push(
          makeEdge(item, producer.nodeId, consumer.nodeId, ratePerMin, resolved, edges.length),
        )
      }
    }
  }

  edges.sort(
    (a, b) =>
      b.ratePerMin - a.ratePerMin ||
      a.itemNameJa.localeCompare(b.itemNameJa, 'ja') ||
      a.id.localeCompare(b.id),
  )

  return {
    nodes,
    edges,
    bottleneckCount: edges.filter((e) => e.bottleneck).length,
  }
}

/** ステップ → ノードID（レシピIDが一意なのでそのまま使える）。 */
export function recipeNodeId(step: SolutionStep): string {
  return `recipe:${step.recipeId}`
}

// ---------------------------------------------------------------------------
// 内部
// ---------------------------------------------------------------------------

type Port = { nodeId: string; ratePerMin: number }

function add(map: Map<string, Port[]>, item: string, port: Port): void {
  const list = map.get(item)
  if (list) list.push(port)
  else map.set(item, [port])
}

const total = (ports: readonly Port[]): number =>
  ports.reduce((sum, p) => sum + p.ratePerMin, 0)

function sourceNode(
  id: string,
  item: string,
  ratePerMin: number,
  external: boolean,
): SourceGraphNode {
  return {
    id,
    kind: 'source',
    item,
    itemNameJa: itemNameJa(item),
    unitJa: unitJa(item),
    ratePerMin,
    external,
  }
}

function recipeNode(id: string, step: SolutionStep): RecipeGraphNode {
  const buildingCount = builtCount(step.machineCount)
  return {
    id,
    kind: 'recipe',
    recipeId: step.recipeId,
    recipeNameJa: step.recipeName.ja,
    buildingId: step.buildingId,
    buildingNameJa: step.buildingName.ja,
    machineCount: step.machineCount,
    buildingCount,
    clock: buildingCount === 0 ? 0 : step.machineCount / buildingCount,
    powerMW: step.powerMW,
    ...(step.powerRangeMW ? { powerRangeMW: step.powerRangeMW } : {}),
    inputs: step.inputs,
    outputs: step.outputs,
  }
}

function makeEdge(
  item: string,
  source: string,
  target: string,
  ratePerMin: number,
  resolved: { beltId?: string; pipeId?: string },
  seq: number,
): PlanGraphEdge {
  const transport = flowTransport(item, ratePerMin, resolved)
  return {
    id: `e${seq}:${source}->${target}:${item}`,
    source,
    target,
    item,
    itemNameJa: itemNameJa(item),
    ratePerMin,
    unitJa: unitJa(item),
    form: itemForm(item),
    transport: transport.kind,
    transportNameJa: transport.requirement.nameJa,
    capacityPerMin: transport.requirement.capacityPerMin,
    lines: transport.requirement.lines,
    utilization: transport.singleLineUtilization,
    bottleneck: transport.singleLineUtilization > 1 + 1e-9,
  }
}

const itemNameJa = (id: string): string => itemsById.get(id)?.name.ja ?? id

const unitJa = (id: string): string => (itemsById.get(id)?.form === 'solid' ? '個/分' : 'm³/min')
