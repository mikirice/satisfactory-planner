/**
 * PlanGraph（src/plan/graph.ts）→ React Flow のノード / エッジ。
 *
 * 座標は elkjs の layered（左→右）に任せる。ノードの大きさは描画前に決まらないと
 * レイアウトがズレるので、**ここで計算した固定サイズを CSS 側にもそのまま渡す**
 * （FlowChart.tsx のノードは width/height 指定。中身がはみ出すときは省略表示）。
 *
 * エッジのラベル（「水 66.67 m³/min」など）も **elk に寸法を渡して位置まで決めさせる**。
 * React Flow 既定のラベル（線の中点に置く）は隣の線やノードと重なって読めなくなるため、
 * ここで測った矩形を elk のラベルとして与え、返ってきた座標にそのまま描く
 * （描画側の実寸 = ここでの推定寸法。CSS で幅・高さを固定して一致させること）。
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

/** 矩形（左上原点。重なり判定・テスト用）。 */
export type Rect = { x: number; y: number; width: number; height: number }

export type Point = { x: number; y: number }

/** elk が決めたラベル矩形と文言。 */
export type EdgeLabelBox = Rect & { text: string }

/** カスタムエッジ（FlowChart.tsx の PlanEdge）が描画に使うデータ。 */
export type PlanEdgeData = {
  item: string
  ratePerMin: number
  lines: number
  bottleneck: boolean
  /** elk が引いた折れ線（始点 → 曲がり点 → 終点） */
  points: Point[]
  /** elk が決めたラベルの位置と大きさ */
  label: EdgeLabelBox
}

export type PlanFlowEdge = Edge<PlanEdgeData & Record<string, unknown>, 'plan'>

export type PlanFlowLayout = {
  nodes: PlanFlowNode[]
  edges: PlanFlowEdge[]
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

/**
 * エッジラベルの見た目（CSS の .flow-edge-label と一致させること）。
 * 描画前に寸法が要る（elk に渡す）ので、実測ではなく文字幅の推定で決める。
 */
export const LABEL_STYLE = {
  fontSize: 11,
  lineHeight: 15,
  paddingX: 6,
  paddingY: 3,
  /** 全角1文字あたりの幅（em）。実測より少し大きめに取って文字切れを防ぐ */
  emFullWidth: 1.02,
  /** 半角1文字あたりの幅（em） */
  emHalfWidth: 0.62,
} as const

/** 全角（CJK・かな・全角記号）か。ラベルは日本語＋数値なのでこの2分類で足りる。 */
function isFullWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3041 && codePoint <= 0x33ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  )
}

/** ラベル1つ分の外形（背景プレート込み）。 */
export function measureEdgeLabel(text: string): { width: number; height: number } {
  let em = 0
  for (const char of text) {
    em += isFullWidth(char.codePointAt(0) ?? 0)
      ? LABEL_STYLE.emFullWidth
      : LABEL_STYLE.emHalfWidth
  }
  return {
    width: Math.ceil(em * LABEL_STYLE.fontSize) + LABEL_STYLE.paddingX * 2,
    height: LABEL_STYLE.lineHeight + LABEL_STYLE.paddingY * 2,
  }
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

/** elk のオプション（左→右）。 */
const ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  // ラベルがレイヤー間に自分の場所を作るので、ここの間隔は控えめでよい
  // （150 のままだと「ラベル幅 + 150×2」になって図が横に伸びすぎる）
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.spacing.nodeNode': '44',
  'elk.spacing.edgeNode': '28',
  'elk.spacing.edgeEdge': '18',
  'elk.layered.spacing.edgeNodeBetweenLayers': '32',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // 循環レシピがあるので、逆流するエッジは最小限だけ折り返させる
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  // --- エッジラベル（重なり対策の本体） ---
  // ラベルを線の中央に置き、layered にその場所（レイヤー間のダミー）を確保させる。
  // 寸法を渡さないとラベルはレイアウトの計算外になり、隣の線やノードに重なる。
  'elk.edgeLabels.placement': 'CENTER',
  'elk.layered.edgeLabels.sideSelection': 'ALWAYS_DOWN',
  'elk.spacing.edgeLabel': '6',
  'elk.spacing.labelLabel': '12',
  'elk.spacing.labelNode': '20',
  'elk.spacing.labelPort': '16',
}

/** グラフをレイアウトして React Flow に渡せる形にする。 */
export async function layoutPlanGraph(graph: PlanGraph): Promise<PlanFlowLayout> {
  const children: ElkNode[] = graph.nodes.map((node) => ({
    id: node.id,
    ...nodeSize(node),
  }))
  const edges: ElkExtendedEdge[] = graph.edges.map((edge) => {
    const text = edgeLabel(edge)
    return {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      labels: [{ id: `${edge.id}:label`, text, ...measureEdgeLabel(text) }],
    }
  })

  const laid = await runElkLayout({
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children,
    edges,
  })

  const positions = new Map<string, { x: number; y: number }>()
  const boxes = new Map<string, Rect>()
  for (const child of laid.children ?? []) {
    const box = {
      x: child.x ?? 0,
      y: child.y ?? 0,
      width: child.width ?? 0,
      height: child.height ?? 0,
    }
    positions.set(child.id, { x: box.x, y: box.y })
    boxes.set(child.id, box)
  }

  const geometry = new Map<string, { points: Point[]; label: EdgeLabelBox }>()
  for (const laidEdge of (laid.edges ?? []) as ElkExtendedEdge[]) {
    geometry.set(laidEdge.id, edgeGeometry(laidEdge, boxes))
  }

  return {
    nodes: graph.nodes.map((node) => toFlowNode(node, positions.get(node.id))),
    edges: graph.edges.map((edge) => toFlowEdge(edge, geometry.get(edge.id))),
  }
}

/** elk の返り値から折れ線とラベル矩形を取り出す（欠けていたらノード中心を結ぶ）。 */
function edgeGeometry(
  edge: ElkExtendedEdge,
  boxes: Map<string, Rect>,
): { points: Point[]; label: EdgeLabelBox } {
  const points: Point[] = []
  for (const section of edge.sections ?? []) {
    if (points.length === 0) points.push({ x: section.startPoint.x, y: section.startPoint.y })
    for (const bend of section.bendPoints ?? []) points.push({ x: bend.x, y: bend.y })
    points.push({ x: section.endPoint.x, y: section.endPoint.y })
  }
  if (points.length < 2) {
    // elk が経路を返さなかった場合の保険（図が出ないよりまし）
    const from = boxes.get(edge.sources[0] ?? '')
    const to = boxes.get(edge.targets[0] ?? '')
    points.length = 0
    if (from) points.push({ x: from.x + from.width, y: from.y + from.height / 2 })
    if (to) points.push({ x: to.x, y: to.y + to.height / 2 })
  }

  const raw = edge.labels?.[0]
  const text = raw?.text ?? ''
  const size = measureEdgeLabel(text)
  const fallback = midpoint(points)
  const label: EdgeLabelBox = {
    text,
    width: raw?.width ?? size.width,
    height: raw?.height ?? size.height,
    x: raw?.x ?? fallback.x - size.width / 2,
    y: raw?.y ?? fallback.y - size.height / 2,
  }
  return { points, label }
}

/** 折れ線の中点（長さの半分の位置）。 */
function midpoint(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]!
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += distance(points[i - 1]!, points[i]!)
  let walked = 0
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    const length = distance(a, b)
    if (walked + length >= total / 2) {
      const t = length === 0 ? 0 : (total / 2 - walked) / length
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    walked += length
  }
  return points.at(-1)!
}

const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y)

/**
 * 折れ線 → SVG path（角は少し丸める）。
 * elk の直交ルーティングをそのまま描く。React Flow の smoothstep で描き直すと
 * elk が決めたラベル位置と線がズレるため、経路も elk のものを使う。
 */
export function elkEdgePath(points: readonly Point[], radius = 10): string {
  if (points.length < 2) return ''
  const parts = [`M ${round(points[0]!.x)} ${round(points[0]!.y)}`]
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]!
    const r = Math.min(radius, distance(prev, curr) / 2, distance(curr, next) / 2)
    const from = along(curr, prev, r)
    const to = along(curr, next, r)
    parts.push(`L ${round(from.x)} ${round(from.y)}`)
    parts.push(`Q ${round(curr.x)} ${round(curr.y)} ${round(to.x)} ${round(to.y)}`)
  }
  const last = points.at(-1)!
  parts.push(`L ${round(last.x)} ${round(last.y)}`)
  return parts.join(' ')
}

/** from から to へ length だけ進んだ点。 */
function along(from: Point, to: Point, length: number): Point {
  const d = distance(from, to)
  if (d === 0) return from
  return { x: from.x + ((to.x - from.x) * length) / d, y: from.y + ((to.y - from.y) * length) / d }
}

const round = (value: number): number => Math.round(value * 100) / 100

/** 2つの矩形が重なっている面積（接触は 0）。 */
export function overlapArea(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
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

function toFlowEdge(
  edge: PlanGraphEdge,
  geometry: { points: Point[]; label: EdgeLabelBox } | undefined,
): PlanFlowEdge {
  const color = edge.bottleneck ? EDGE_COLORS.bottleneck : EDGE_COLORS[edge.form]
  const text = edgeLabel(edge)
  const size = measureEdgeLabel(text)
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'plan',
    // 流れる破線は使わない（常時ループするアニメーションを画面に置かない方針）
    animated: false,
    focusable: false,
    style: {
      stroke: color,
      strokeWidth: edge.bottleneck ? 3 : 1.6,
      ...(EDGE_DASH[edge.form] ? { strokeDasharray: EDGE_DASH[edge.form] } : {}),
    },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    className: edge.bottleneck ? 'flow-edge flow-edge--bottleneck' : 'flow-edge',
    data: {
      item: edge.item,
      ratePerMin: edge.ratePerMin,
      lines: edge.lines,
      bottleneck: edge.bottleneck,
      points: geometry?.points ?? [],
      label: geometry?.label ?? { text, x: 0, y: 0, ...size },
    },
  }
}
