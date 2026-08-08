/**
 * 閲覧専用フローチャート（仕様書 v1 §9）。
 *
 * 原料 → レシピ → 最終製品を elkjs の layered レイアウトで左→右に並べる。
 * **編集はしない**（[[やらないリスト]]）: ノードのドラッグ・接続・削除はすべて無効で、
 * 操作はパン / ズーム / ミニマップ / 全体フィットだけ。
 *
 * バンドルが重い（React Flow + elkjs）ので ResultView から lazy import する。
 * レイアウト計算は Worker（elk-layout.ts）に逃がし、終わるまでは待機表示を出す。
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
} from '@xyflow/react'
import type { EdgeProps, EdgeTypes, NodeProps, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { buildPlanGraph } from '../plan/graph.ts'
import type { Solution } from '../solver/index.ts'
import { EDGE_COLORS, NODE_TYPE, elkEdgePath, layoutPlanGraph } from './flow-layout.ts'
import type {
  OutputFlowNode,
  PlanFlowEdge,
  PlanFlowLayout,
  RecipeFlowNode,
  SourceFlowNode,
} from './flow-layout.ts'
import { fmtCount, fmtPercent, fmtPower, fmtPowerRange, fmtRate, itemName } from './format.ts'
import { T } from './text.ts'

type Props = {
  solution: Solution
  /** 物流の本数換算に使うベルト（Belt.id） */
  beltId?: string
  /** 物流の本数換算に使うパイプ（Pipe.id） */
  pipeId?: string
}

export default function FlowChart({ solution, beltId, pipeId }: Props) {
  const graph = useMemo(
    () => buildPlanGraph(solution, { beltId, pipeId }),
    [solution, beltId, pipeId],
  )
  const [layout, setLayout] = useState<PlanFlowLayout | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLayout(null)
    setFailed(null)
    layoutPlanGraph(graph)
      .then((result) => {
        if (!cancelled) setLayout(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailed(error instanceof Error ? error.message : String(error))
      })
    return () => {
      cancelled = true
    }
  }, [graph])

  if (graph.nodes.length === 0) return <p className="hint">{T.flow.empty}</p>
  if (failed !== null) {
    return (
      <p className="callout callout--warn">
        {T.flow.failed}: {failed}
      </p>
    )
  }
  if (!layout) return <p className="hint">{T.flow.loading}</p>

  const transport = graph.edges.find((e) => e.transport === 'belt')?.transportNameJa ?? '—'
  const pipe = graph.edges.find((e) => e.transport === 'pipe')?.transportNameJa ?? '—'

  return (
    <div className="flowchart">
      <ReactFlow
        nodes={layout.nodes}
        edges={layout.edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.1}
        maxZoom={2}
        // --- 閲覧専用（編集系はすべて無効） ---
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        // --- 閲覧の操作だけ有効 ---
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnDoubleClick
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2b323d" />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor="rgba(16,19,24,0.72)" />
        <Panel position="top-left" className="flow-legend">
          <p className="flow-legend__title">{T.flow.legend}</p>
          <ul>
            <li>
              <span className="flow-legend__line flow-legend__line--solid" aria-hidden="true" />
              {T.flow.legendSolid}
            </li>
            <li>
              <span className="flow-legend__line flow-legend__line--liquid" aria-hidden="true" />
              {T.flow.legendLiquid}
            </li>
            <li>
              <span className="flow-legend__line flow-legend__line--gas" aria-hidden="true" />
              {T.flow.legendGas}
            </li>
            <li>
              <span
                className="flow-legend__line flow-legend__line--bottleneck"
                aria-hidden="true"
              />
              {T.flow.legendBottleneck}
            </li>
          </ul>
        </Panel>
        <Panel position="top-right" className="flow-stats">
          <p>{T.flow.stats(graph.nodes.length, graph.edges.length)}</p>
          {graph.bottleneckCount > 0 && (
            <p className="flow-stats__warn">{T.flow.bottleneckCount(graph.bottleneckCount)}</p>
          )}
          <p className="flow-stats__note">{T.flow.transportNote(transport, pipe)}</p>
          <p className="flow-stats__note">{T.flow.readOnly}</p>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// カスタムノード
// ---------------------------------------------------------------------------

/** 原料供給（採掘 / 持ち込み）。 */
function SourceNode({ data }: NodeProps<SourceFlowNode>) {
  const node = data.node
  return (
    <div className="flow-node flow-node--source">
      <p className="flow-node__kind">{node.external ? T.flow.external : T.flow.source}</p>
      <p className="flow-node__title">{node.itemNameJa}</p>
      <p className="flow-node__rate num">
        {fmtRate(node.ratePerMin)} <span className="flow-node__unit">{node.unitJa}</span>
      </p>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
}

/** 生産ステップ（レシピ1つ）。 */
function RecipeNode({ data }: NodeProps<RecipeFlowNode>) {
  const node = data.node
  return (
    <div className="flow-node flow-node--recipe">
      <p className="flow-node__title">{node.recipeNameJa}</p>
      <p className="flow-node__meta">
        {node.buildingNameJa}・{T.flow.machines(node.buildingCount, fmtPercent(node.clock))}
      </p>
      <p className="flow-node__meta">
        {fmtCount(node.machineCount)} 台相当 ・{' '}
        {node.powerRangeMW
          ? fmtPowerRange(node.powerRangeMW.minMW, node.powerRangeMW.maxMW)
          : fmtPower(node.powerMW)}{' '}
        MW
      </p>
      <div className="flow-node__io">
        <ul className="flow-node__col">
          <li className="flow-node__colhead">{T.flow.inputs}</li>
          {node.inputs.map((flow) => (
            <li key={flow.item}>
              <FlowRate item={flow.item} ratePerMin={flow.ratePerMin} />
            </li>
          ))}
        </ul>
        <ul className="flow-node__col flow-node__col--out">
          <li className="flow-node__colhead">{T.flow.outputs}</li>
          {node.outputs.map((flow) => (
            <li key={flow.item}>
              <FlowRate item={flow.item} ratePerMin={flow.ratePerMin} />
            </li>
          ))}
        </ul>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
}

/** 最終出力（目標産出 / 副産物）。 */
function OutputNode({ data }: NodeProps<OutputFlowNode>) {
  const node = data.node
  return (
    <div className={`flow-node flow-node--output${node.isTarget ? ' flow-node--target' : ''}`}>
      <p className="flow-node__kind">{node.isTarget ? T.flow.target : T.flow.byproduct}</p>
      <p className="flow-node__title">{node.itemNameJa}</p>
      <p className="flow-node__rate num">
        {fmtRate(node.ratePerMin)} <span className="flow-node__unit">{node.unitJa}</span>
      </p>
      {node.requestedPerMin !== undefined && (
        <p className="flow-node__meta num">{T.flow.requested(fmtRate(node.requestedPerMin))}</p>
      )}
      <Handle type="target" position={Position.Left} isConnectable={false} />
    </div>
  )
}

function FlowRate({ item, ratePerMin }: { item: string; ratePerMin: number }) {
  return (
    <>
      <span className="flow-node__item">{itemName(item)}</span>
      <span className="flow-node__num num">{fmtRate(ratePerMin)}</span>
    </>
  )
}

// 種別名は NODE_TYPE（plan 前置き）を使う。'output' 等をそのまま使うと
// React Flow 既定ノードの CSS（padding 10px 等）が当たって中身が潰れる。
const NODE_TYPES: NodeTypes = {
  [NODE_TYPE.source]: SourceNode,
  [NODE_TYPE.recipe]: RecipeNode,
  [NODE_TYPE.output]: OutputNode,
}

// ---------------------------------------------------------------------------
// カスタムエッジ
// ---------------------------------------------------------------------------

/**
 * elk が引いた経路とラベル位置をそのまま描くエッジ。
 *
 * 既定の smoothstep ＋ 線の中点ラベルだと、ラベル同士・ラベルとノードが重なって
 * 読めなくなる（elk はラベルを知らないので場所を空けてくれない）。ここでは
 * flow-layout.ts が elk に寸法を渡して決めさせた座標に置く。
 * ラベルは背景プレート付き（他の線と交差しても文字が読める）。
 */
function PlanEdge({ id, data, style, markerEnd }: EdgeProps<PlanFlowEdge>) {
  if (!data) return null
  const { label } = data
  return (
    <>
      {/* 閲覧専用なので当たり判定は要らない（線の上でもパンできるようにする） */}
      <BaseEdge
        id={id}
        path={elkEdgePath(data.points)}
        style={style}
        markerEnd={markerEnd}
        interactionWidth={0}
      />
      <EdgeLabelRenderer>
        <div
          className={`flow-edge-label${data.bottleneck ? ' flow-edge-label--bottleneck' : ''}`}
          style={{
            transform: `translate(${label.x}px, ${label.y}px)`,
            width: label.width,
            height: label.height,
          }}
        >
          {label.text}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const EDGE_TYPES: EdgeTypes = { plan: PlanEdge }

/** ミニマップの色（種別で塗り分ける）。 */
function miniMapColor(node: { type?: string }): string {
  switch (node.type) {
    case NODE_TYPE.source:
      return EDGE_COLORS.solid
    case NODE_TYPE.output:
      return '#f0a13c'
    default:
      return '#3a434f'
  }
}
