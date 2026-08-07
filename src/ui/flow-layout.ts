/**
 * PlanGraph（src/plan/graph.ts）→ React Flow のノード / エッジ。
 *
 * 座標は elkjs の layered（左→右）に任せる。ノードの大きさは描画前に決まらないと
 * レイアウトがズレるので、**ここで計算した固定サイズを CSS 側にもそのまま渡す**
 * （FlowChart.tsx のノードは width/height 指定。中身がはみ出すときは省略表示）。
 *
 * 線の見分けは色だけに頼らない（カラーユニバーサル）:
 *   固体 = 実線 / 液体 = 破線 / 気体 = 点線 / ボトルネック = 赤の太線＋ラベルに「要 N本」
 */
import type { Edge, Node } from '@xyflow/react'
import { MarkerType, Position } from '@xyflow/react'
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api'

import type {
  OutputGraphNode,
  PlanGraph,
  PlanGraphEdge,
  PlanGraphNode,
  RecipeGraphNode,
  SourceGraphNode,
} from '../plan/graph.ts'
import { runElkLayout } from './elk-layout.ts'
import { fmtRate } from './format.ts'

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export type SourceFlowNode = Node<{ node: SourceGraphNode }, 'source'>
export type RecipeFlowNode = Node<{ node: RecipeGraphNode }, 'recipe'>
export type OutputFlowNode = Node<{ node: OutputGraphNode }, 'output'>
export type PlanFlowNode = SourceFlowNode | RecipeFlowNode | OutputFlowNode

export type PlanFlowLayout = {
  nodes: PlanFlowNode[]
  edges: Edge[]
}

// ---------------------------------------------------------------------------
// 見た目の寸法（CSS と一致させること）
// ---------------------------------------------------------------------------

export const NODE_SIZE = {
  recipeWidth: 268,
  /** 見出し＋メタ2行＋投入/産出の見出し分 */
  recipeBase: 104,
  recipeRow: 17,
  sourceWidth: 184,
  sourceHeight: 84,
  outputWidth: 184,
  outputHeight: 92,
} as const

/** 線の色（ダークテーマ）。 */
export const EDGE_COLORS = {
  solid: '#93a1b3',
  liquid: '#6fb7f2',
  gas: '#c79bf2',
  bottleneck: '#f0757f',
} as const

/** 形態ごとの線の形（色が見分けられなくても分かるように）。 */
const EDGE_DASH: Record<PlanGraphEdge['form'], string | undefined> = {
  solid: undefined,
  liquid: '8 4',
  gas: '2 5',
}

function nodeSize(node: PlanGraphNode): { width: number; height: number } {
  if (node.kind === 'recipe') {
    const rows = Math.max(node.inputs.length, node.outputs.length, 1)
    return {
      width: NODE_SIZE.recipeWidth,
      height: NODE_SIZE.recipeBase + rows * NODE_SIZE.recipeRow,
    }
  }
  if (node.kind === 'source') {
    return { width: NODE_SIZE.sourceWidth, height: NODE_SIZE.sourceHeight }
  }
  return { width: NODE_SIZE.outputWidth, height: NODE_SIZE.outputHeight }
}

// ---------------------------------------------------------------------------
// レイアウト
// ---------------------------------------------------------------------------

/** elk のオプション（左→右・レイヤー間は広め）。 */
const ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  // ラベル付きの長いエッジが重ならないよう、レイヤー間は広めに取る
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.spacing.nodeNode': '44',
  'elk.spacing.edgeNode': '28',
  'elk.spacing.edgeEdge': '18',
  'elk.layered.spacing.edgeNodeBetweenLayers': '32',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // 循環レシピがあるので、逆流するエッジは最小限だけ折り返させる
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
}

/** グラフをレイアウトして React Flow に渡せる形にする。 */
export async function layoutPlanGraph(graph: PlanGraph): Promise<PlanFlowLayout> {
  const children: ElkNode[] = graph.nodes.map((node) => ({
    id: node.id,
    ...nodeSize(node),
  }))
  const edges: ElkExtendedEdge[] = graph.edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))

  const laid = await runElkLayout({
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children,
    edges,
  })

  const positions = new Map<string, { x: number; y: number }>()
  for (const child of laid.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 })
  }

  return {
    nodes: graph.nodes.map((node) => toFlowNode(node, positions.get(node.id))),
    edges: graph.edges.map(toFlowEdge),
  }
}

function toFlowNode(node: PlanGraphNode, position: { x: number; y: number } | undefined): PlanFlowNode {
  const size = nodeSize(node)
  const base = {
    id: node.id,
    position: position ?? { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
    connectable: false,
    style: { width: size.width, height: size.height },
  }
  switch (node.kind) {
    case 'source':
      return { ...base, type: 'source', data: { node } }
    case 'recipe':
      return { ...base, type: 'recipe', data: { node } }
    default:
      return { ...base, type: 'output', data: { node } }
  }
}

/** 「鉄板 60.00/min」。ボトルネックのときは必要本数を添える。 */
export function edgeLabel(edge: PlanGraphEdge): string {
  const rate =
    edge.form === 'solid'
      ? `${fmtRate(edge.ratePerMin)}/min`
      : `${fmtRate(edge.ratePerMin)} m³/min`
  return edge.bottleneck
    ? `${edge.itemNameJa} ${rate}・要 ${edge.lines}本`
    : `${edge.itemNameJa} ${rate}`
}

function toFlowEdge(edge: PlanGraphEdge): Edge {
  const color = edge.bottleneck ? EDGE_COLORS.bottleneck : EDGE_COLORS[edge.form]
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    // 流れる破線は使わない（常時ループするアニメーションを画面に置かない方針）
    animated: false,
    focusable: false,
    label: edgeLabel(edge),
    labelShowBg: true,
    labelStyle: {
      fill: edge.bottleneck ? EDGE_COLORS.bottleneck : '#dde3ec',
      fontSize: 11,
      fontVariantNumeric: 'tabular-nums',
    },
    labelBgStyle: { fill: '#171b22', fillOpacity: 0.92 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    style: {
      stroke: color,
      strokeWidth: edge.bottleneck ? 3 : 1.6,
      ...(EDGE_DASH[edge.form] ? { strokeDasharray: EDGE_DASH[edge.form] } : {}),
    },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    className: edge.bottleneck ? 'flow-edge flow-edge--bottleneck' : 'flow-edge',
    data: { item: edge.item, ratePerMin: edge.ratePerMin, lines: edge.lines },
  }
}
