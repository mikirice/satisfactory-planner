/**
 * PlanGraph（src/plan/graph.ts）→ React Flow のノード / エッジ。
 *
 * 座標は elkjs の layered（左→右）に任せる。ノードの大きさは描画前に決まらないと
 * レイアウトがズレるので、**ここで計算した固定サイズを CSS 側にもそのまま渡す**
 * （FlowChart.tsx のノードは width/height 指定）。高さは「実際に描く行」を積み上げて
 * 出す（NODE_METRICS / nodeRows）。行数と合わない固定値にすると中身が縮められて
 * 文字が重なる・見切れるので、CSS の line-height と必ず揃えること。
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
import { fmtRate, isAlternateRecipe } from './format.ts'

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

/**
 * React Flow のノード種別名。
 *
 * **`plan` を必ず前置きする**。React Flow は種別名から `react-flow__node-<種別>` という
 * クラスを付けるので、`output` / `default` / `input` / `group` を種別名にすると
 * 既定ノードの見た目（padding 10px・border・width 150px・中央寄せ）が当たってしまい、
 * 中身の高さが 22px 削られて文字が重なる。前置きでその衝突を避ける。
 */
export const NODE_TYPE = {
  source: 'planSource',
  recipe: 'planRecipe',
  output: 'planOutput',
} as const

export type SourceFlowNode = Node<{ node: SourceGraphNode }, 'planSource'>
export type RecipeFlowNode = Node<{ node: RecipeGraphNode }, 'planRecipe'>
export type OutputFlowNode = Node<{ node: OutputGraphNode }, 'planOutput'>
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

/**
 * ノードの中身の寸法（**App.css の .flow-node* と1px単位で一致させること**）。
 *
 * ノードの高さは描画前に決めないと elk のレイアウトがズレるので、ここで
 * 「実際に描く行」を積み上げて算出する。CSS 側は行ごとに px の line-height を固定し、
 * `.flow-node > *` を縮ませない（flex-shrink: 0）。数値がズレると行が潰れて
 * 文字同士が重なるので、変更するときは CSS と tests/flow-node-size.test.ts も直す。
 */
export const NODE_METRICS = {
  paddingX: 10,
  paddingY: 8,
  border: 1,
  rowGap: 2,
  /**
   * アイコン（public/icons）の表示サイズ。**アイコンを置く行はこの高さで場所を取る**。
   * アイコンが無い/撤去された場合は空きになるだけで、行が縮んで文字が重なることはない。
   */
  iconSize: 24,
  /** アイコンと文字の間隔 */
  iconGap: 6,
  /** .flow-node__kind（10px・アイコン24px と同じ行に並ぶので行送りは 24 以上） */
  kindFontSize: 10,
  kindLine: 28,
  /** .flow-node__head（レシピノードの「主産物アイコン＋主産物名」の行） */
  headFontSize: 11,
  headLine: 28,
  /** .flow-node__title（13px semibold） */
  titleFontSize: 13,
  titleLine: 18,
  titleMaxLines: 3,
  /**
   * 代替レシピのレシピ名の先頭に置くハードドライブのアイコン（16px＋余白）。
   * 1行目がそのぶん狭くなるので、折り返し行数の計算にも入れる（titleLeadingWidth）。
   */
  titleIconSize: 16,
  titleIconGap: 4,
  /** 太字ぶんの割り増し（em 推定に掛ける） */
  titleBoldFactor: 1.06,
  /** .flow-node__rate（15px） */
  rateFontSize: 15,
  rateLine: 22,
  /** .flow-node__meta（11px） */
  metaFontSize: 11,
  metaLine: 16,
  /** .flow-node__io（投入/産出の枠） */
  ioMarginTop: 4,
  ioBorder: 1,
  ioPaddingTop: 3,
  ioHeadFontSize: 10,
  ioHeadLine: 14,
  ioRowFontSize: 11,
  ioRowLine: 17,
  recipeWidth: 300,
  sourceWidth: 200,
  outputWidth: 200,
} as const

/** ノード1行ぶんの見た目（テストが「潰れていないか」を見るのに使う）。 */
export type NodeRow = { id: string; height: number; fontSize: number }

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
  /** 先頭に置くアイテムアイコン（.flow-edge-label .item-icon）。文字があるときだけ場所を取る */
  iconSize: 16,
  /** アイコンと文字の間隔（CSS の gap と一致させること） */
  iconGap: 4,
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

/**
 * ラベル1つ分の外形（背景プレート込み）。
 *
 * 先頭にアイテムアイコンを置くので、その幅（アイコン＋間隔）も**常に**足す。
 * アイコンが無いアイテム（撤去された場合も含む）はそこが空くだけで、文字は欠けない。
 * 文言が空のときはアイコンも描かないので、余白だけの最小の箱を返す
 * （elk に 0 幅の矩形を渡さないための保険。実際のエッジは必ず文言を持つ）。
 */
export function measureEdgeLabel(text: string): { width: number; height: number } {
  const height = LABEL_STYLE.lineHeight + LABEL_STYLE.paddingY * 2
  if (text === '') return { width: LABEL_STYLE.paddingX * 2, height }

  let em = 0
  for (const char of text) {
    em += isFullWidth(char.codePointAt(0) ?? 0)
      ? LABEL_STYLE.emFullWidth
      : LABEL_STYLE.emHalfWidth
  }
  return {
    width:
      Math.ceil(em * LABEL_STYLE.fontSize) +
      LABEL_STYLE.paddingX * 2 +
      LABEL_STYLE.iconSize +
      LABEL_STYLE.iconGap,
    height,
  }
}

/** 文字列の推定幅（px）。ラベルと同じ全角/半角の em 換算を使う。 */
export function measureTextWidth(text: string, fontSize: number, boldFactor = 1): number {
  let em = 0
  for (const char of text) {
    em += isFullWidth(char.codePointAt(0) ?? 0)
      ? LABEL_STYLE.emFullWidth
      : LABEL_STYLE.emHalfWidth
  }
  return em * fontSize * boldFactor
}

/** ノードの横幅から、文字を置ける幅（padding・border を引いたもの）。 */
export function nodeInnerWidth(width: number): number {
  return width - NODE_METRICS.paddingX * 2 - NODE_METRICS.border * 2
}

/**
 * 見出し（アイテム名 / レシピ名）の行数。
 * 名前は「読めること」を優先して折り返す（…で切らない）。上限は titleMaxLines。
 *
 * `leadingWidth` は名前の前に置く記号の幅（代替レシピのハードドライブアイコン）。
 * 文字と同じ行に並ぶので、折り返しの計算では文字幅に足して見積もる。
 */
export function titleLineCount(text: string, width: number, leadingWidth = 0): number {
  const available = nodeInnerWidth(width)
  if (available <= 0) return 1
  const textWidth =
    measureTextWidth(text, NODE_METRICS.titleFontSize, NODE_METRICS.titleBoldFactor) + leadingWidth
  const lines = Math.ceil(textWidth / available)
  return Math.min(Math.max(lines, 1), NODE_METRICS.titleMaxLines)
}

/**
 * 見出しの前に置く記号の幅（px）。代替レシピはハードドライブのアイコンが1つ付く。
 * FlowChart.tsx の描画と条件を必ず揃えること。
 */
export function titleLeadingWidth(node: PlanGraphNode): number {
  if (node.kind !== 'recipe' || !isAlternateRecipe(node.recipeId)) return 0
  return NODE_METRICS.titleIconSize + NODE_METRICS.titleIconGap
}

/** ノードの横幅（種別ごと）。 */
export function nodeWidth(node: PlanGraphNode): number {
  if (node.kind === 'recipe') return NODE_METRICS.recipeWidth
  if (node.kind === 'source') return NODE_METRICS.sourceWidth
  return NODE_METRICS.outputWidth
}

/**
 * ノードの中に実際に積まれる行（FlowChart.tsx のマークアップと同じ順・同じ数）。
 * 高さはこの合計から出す＝行が入りきらずに潰れる（＝文字が重なる）ことがない。
 */
export function nodeRows(node: PlanGraphNode): NodeRow[] {
  const m = NODE_METRICS
  const width = nodeWidth(node)
  const leading = titleLeadingWidth(node)
  const title = (text: string): NodeRow => ({
    id: 'title',
    height: m.titleLine * titleLineCount(text, width, leading),
    fontSize: m.titleFontSize,
  })

  if (node.kind === 'recipe') {
    const ioRows = Math.max(node.inputs.length, node.outputs.length, 1)
    return [
      // 「何を作るノードか」を一目で分かるようにする行（主産物アイコン＋主産物名）。
      // レシピ名と主産物名は一致しない（例: 代替レシピ）ので、名前とは別の行にする。
      { id: 'head', height: m.headLine, fontSize: m.headFontSize },
      title(node.recipeNameJa),
      { id: 'meta:building', height: m.metaLine, fontSize: m.metaFontSize },
      { id: 'meta:power', height: m.metaLine, fontSize: m.metaFontSize },
      // Somersloop を挿すステップだけ1行増える（FlowChart.tsx の描画と同じ条件）
      ...(node.somersloops > 0
        ? [{ id: 'meta:somersloop', height: m.metaLine, fontSize: m.metaFontSize }]
        : []),
      {
        id: 'io',
        // 上の余白＋区切り線＋見出し＋投入/産出の行（左右の多いほうに合わせる）
        height:
          m.ioMarginTop +
          m.ioBorder +
          m.ioPaddingTop +
          m.ioHeadLine +
          ioRows * m.ioRowLine,
        fontSize: m.ioRowFontSize,
      },
    ]
  }

  const rows: NodeRow[] = [
    { id: 'kind', height: m.kindLine, fontSize: m.kindFontSize },
    title(node.itemNameJa),
    { id: 'rate', height: m.rateLine, fontSize: m.rateFontSize },
  ]
  if (node.kind === 'output' && node.requestedPerMin !== undefined) {
    rows.push({ id: 'meta:requested', height: m.metaLine, fontSize: m.metaFontSize })
  }
  return rows
}

/** 行の積み上げから決まるノードの外形（elk・React Flow・CSS が共有する唯一の寸法）。 */
export function measureNodeSize(node: PlanGraphNode): { width: number; height: number } {
  const m = NODE_METRICS
  const rows = nodeRows(node)
  const content = rows.reduce((sum, row) => sum + row.height, 0)
  const gaps = m.rowGap * Math.max(rows.length - 1, 0)
  return {
    width: nodeWidth(node),
    height: m.paddingY * 2 + m.border * 2 + content + gaps,
  }
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
    ...measureNodeSize(node),
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
  const size = measureNodeSize(node)
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
      return { ...base, type: NODE_TYPE.source, data: { node } }
    case 'recipe':
      return { ...base, type: NODE_TYPE.recipe, data: { node } }
    default:
      return { ...base, type: NODE_TYPE.output, data: { node } }
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
