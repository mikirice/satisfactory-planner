/**
 * 「発電関連を表示から外す」ための絞り込み（表示専用）。
 *
 * 発電計画を有効にすると、発電機と燃料チェーンが `Solution.steps` に混ざる。
 * 工場の構成だけを見たいときのために、**表示側だけ**で発電機と
 * 「発電のためだけに存在するステップ」を落とす。
 *
 * ここは解を書き換えない（レートも台数も一切いじらない）。サマリー・原料・収支・Excel は
 * 常に全体の数字を出したままで、生産ステップ表とフローチャートの見た目だけが変わる。
 *
 * 判定は**工場側を伸ばす**向きで行う（発電側を伸ばすと、循環レシピが
 * 「互いに相手が未確定」で永遠に確定しないため）:
 *   1. 目標産出のアイテムを作っている非発電ステップを工場とみなす
 *   2. 工場ステップの投入を作っているステップも工場（不動点まで伝播）
 *   3. 残り（＝発電機と、発電機の燃料にしか流れないステップ）が非表示対象
 *
 * 種を「目標産出」に限るのが大事なところ。燃料の精製は原油 → 燃料 のついでに
 * ポリマー樹脂を副産物として吐くが、これは捨てているだけで工場が使っているわけではない。
 * 「副産物が出ている＝工場」にすると発電専用の精製所が丸ごと残ってしまう。
 */
import { stepKey } from './aggregate.ts'
import type { PlanGraph, PlanGraphEdge, PlanGraphNode } from './graph.ts'
import type { Solution, SolutionStep } from '../solver/index.ts'

/** これ未満のレートは無いものとして扱う（LPの丸め誤差対策。graph.ts と同じ値）。 */
const MIN_RATE = 1e-6

export type PowerVisibilityFilter = {
  /** 隠すステップの stepKey（発電機＋発電専用チェーン） */
  hiddenStepKeys: ReadonlySet<string>
  /** 隠す原料 / 持ち込みアイテム（発電チェーンだけが使うもの） */
  hiddenSourceItems: ReadonlySet<string>
  /** 隠すステップ数（注記の N） */
  hiddenStepCount: number
}

const EMPTY_FILTER: PowerVisibilityFilter = {
  hiddenStepKeys: new Set(),
  hiddenSourceItems: new Set(),
  hiddenStepCount: 0,
}

/**
 * 解から「発電機＋発電専用チェーン」を割り出す。
 * 発電機が1台もない解では何も隠さない（空の絞り込みを返す）。
 */
export function findPowerOnlySteps(solution: Solution): PowerVisibilityFilter {
  const steps = solution.steps
  const isGenerator = steps.map((step) => (step.powerProductionMW ?? 0) > 0)
  if (!isGenerator.some(Boolean)) return EMPTY_FILTER

  // item -> それを産出 / 消費するステップの添字
  const producers = new Map<string, number[]>()
  const consumers = new Map<string, number[]>()
  steps.forEach((step, index) => {
    for (const flow of step.outputs) {
      if (flow.ratePerMin > MIN_RATE) push(producers, flow.item, index)
    }
    for (const flow of step.inputs) {
      if (flow.ratePerMin > MIN_RATE) push(consumers, flow.item, index)
    }
  })

  // 1) 種: 目標産出のアイテムを作っている非発電ステップ（産出最大化のアイテムも targets に入る）
  const factory = new Set<number>()
  const queue: number[] = []
  const markFactory = (index: number): void => {
    if (isGenerator[index] || factory.has(index)) return
    factory.add(index)
    queue.push(index)
  }
  for (const target of solution.targets) {
    for (const index of producers.get(target.item) ?? []) markFactory(index)
  }

  // 2) 工場ステップの投入を作っているステップも工場（発電機は決して工場に入れない）
  while (queue.length > 0) {
    const index = queue.pop()!
    for (const flow of steps[index]!.inputs) {
      if (flow.ratePerMin <= MIN_RATE) continue
      for (const producer of producers.get(flow.item) ?? []) markFactory(producer)
    }
  }

  // 3) 工場に入らなかったステップが非表示対象（発電機を含む）
  const hiddenStepKeys = new Set<string>()
  steps.forEach((step, index) => {
    if (!factory.has(index)) hiddenStepKeys.add(stepKey(step))
  })

  // 原料供給 / 持ち込みは「工場側の消費者が1つも無い」ものだけ隠す
  const hiddenSourceItems = new Set<string>()
  const sourceItems = [
    ...solution.rawResources.filter((r) => r.ratePerMin > MIN_RATE).map((r) => r.item),
    ...solution.externalInputs.filter((i) => i.ratePerMin > MIN_RATE).map((i) => i.item),
  ]
  for (const item of sourceItems) {
    const usedByFactory = (consumers.get(item) ?? []).some((index) => factory.has(index))
    if (!usedByFactory) hiddenSourceItems.add(item)
  }

  return { hiddenStepKeys, hiddenSourceItems, hiddenStepCount: hiddenStepKeys.size }
}

/** 表示するステップだけを返す（順序は元のまま）。 */
export function visibleSteps(
  steps: readonly SolutionStep[],
  filter: PowerVisibilityFilter,
): SolutionStep[] {
  if (filter.hiddenStepCount === 0) return [...steps]
  return steps.filter((step) => !filter.hiddenStepKeys.has(stepKey(step)))
}

/**
 * グラフから発電関連のノード / エッジを落とす。
 *
 * 隠したステップに繋がっていたエッジは消えるが、**原料供給ノードのレートは元のまま**にする
 * （採掘量は解の値であって、表示を絞ったから減るものではない。原料タブと数字を揃えるため）。
 * 産出先が全部消えた出力ノード（隠した発電機の副産物など）は宙に浮くので一緒に落とす。
 */
export function filterPowerFromGraph(
  graph: PlanGraph,
  filter: PowerVisibilityFilter,
): PlanGraph {
  if (filter.hiddenStepCount === 0 && filter.hiddenSourceItems.size === 0) return graph

  const hiddenNodeIds = new Set<string>()
  for (const key of filter.hiddenStepKeys) hiddenNodeIds.add(`recipe:${key}`)
  for (const item of filter.hiddenSourceItems) {
    hiddenNodeIds.add(`source:${item}`)
    hiddenNodeIds.add(`external:${item}`)
  }

  let nodes = graph.nodes.filter((node) => !hiddenNodeIds.has(node.id))
  let edges = graph.edges.filter(
    (edge) => !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target),
  )

  // 入ってくる線が無くなった出力ノードを落とす（落とすと更に線が消えることは無い＝1回で足りる）
  const incoming = new Set(edges.map((edge) => edge.target))
  const dangling = new Set(
    nodes.filter((node) => node.kind === 'output' && !incoming.has(node.id)).map((n) => n.id),
  )
  if (dangling.size > 0) {
    nodes = nodes.filter((node: PlanGraphNode) => !dangling.has(node.id))
    edges = edges.filter((edge: PlanGraphEdge) => !dangling.has(edge.source))
  }

  return { nodes, edges, bottleneckCount: edges.filter((e) => e.bottleneck).length }
}

function push(map: Map<string, number[]>, item: string, index: number): void {
  const list = map.get(item)
  if (list) list.push(index)
  else map.set(item, [index])
}
