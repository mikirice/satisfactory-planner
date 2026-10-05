/**
 * Interactive production graph: click recipe nodes to compare and select a production recipe.
 * ELK routes each item through a fixed port aligned with its input/output row.
 * Node dragging and manual wiring remain disabled; production changes are solved as a whole.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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

import { RecipePickerPage } from './RecipePickerPage.tsx'
import { ResourceSettingsPage, ExtractionWarning } from './ResourceSettingsPage.tsx'
import { resourceExtractionText } from '../i18n/resource-extraction.ts'
import type { RecipeGraphNode, SourceGraphNode } from '../plan/graph.ts'
import { buildPlanGraph } from '../plan/graph.ts'
import { filterPowerFromGraph, findPowerOnlySteps } from '../plan/power-filter.ts'
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import { recipePickerText } from '../i18n/recipe-picker.ts'
import { useLocale } from '../i18n/index.ts'
import {
  EDGE_COLORS,
  LABEL_STYLE,
  NODE_METRICS,
  NODE_TYPE,
  elkEdgePath,
  layoutPlanGraph,
  resourcePortId,
  resourcePortY,
  nodeRows,
} from './flow-layout.ts'
import type {
  OutputFlowNode,
  PlanFlowEdge,
  PlanFlowLayout,
  PlanFlowNode,
  RecipeFlowNode,
  SourceFlowNode,
} from './flow-layout.ts'
import {
  fmtPower,
  fmtPowerRange,
  fmtRate,
  isAlternateRecipe,
  itemName,
  itemUnit,
  recipeMainItem,
} from './format.ts'
import { AlternateIcon, ItemIcon } from './ItemIcon.tsx'
import { PowerFilterToggle } from './PowerFilterToggle.tsx'
import { T } from './text.ts'

type Props = {
  solution: Solution
  extraction?: ExtractionPlan | null
  /** 物流の本数換算に使うベルト（Belt.id） */
  beltId?: string
  /** 物流の本数換算に使うパイプ（Pipe.id） */
  pipeId?: string
  /** 発電関連を表示から外すか（表示だけの絞り込み。既定 false） */
  hidePower?: boolean
  onHidePowerChange?: (next: boolean) => void
}

export default function FlowChart({
  solution,
  extraction,
  beltId,
  pipeId,
  hidePower = false,
  onHidePowerChange,
}: Props) {
  const { locale, namePack } = useLocale()
  // 発電計画が無効な解ではトグルそのものを出さない
  const canFilterPower = solution.powerGeneration !== undefined
  const filter = useMemo(() => findPowerOnlySteps(solution), [solution])
  const hiding = hidePower && canFilterPower
  const graph = useMemo(() => {
    const full = buildPlanGraph(solution, { beltId, pipeId, locale, namePack, extraction })
    return hiding ? filterPowerFromGraph(full, filter) : full
  }, [solution, extraction, beltId, pipeId, locale, namePack, hiding, filter])
  const [layout, setLayout] = useState<PlanFlowLayout | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [editingNode, setEditingNode] = useState<RecipeGraphNode | null>(null)
  const [editingSource, setEditingSource] = useState<SourceGraphNode | null>(null)
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

  // トグルは待機中・空・失敗のときも出したままにする（隠したまま戻せなくなるので）
  const frame = (body: ReactNode) => (
    <div className="stack">
      {canFilterPower && (
        <PowerFilterToggle
          hidePower={hidePower}
          hiddenStepCount={filter.hiddenStepCount}
          onChange={onHidePowerChange}
        />
      )}
      {body}
    </div>
  )

  if (graph.nodes.length === 0) return frame(<p className="hint">{T.flow.empty}</p>)
  if (failed !== null) {
    return frame(
      <p className="callout callout--warn">
        {T.flow.failed}: {failed}
      </p>,
    )
  }
  if (!layout) return frame(<p className="hint">{T.flow.loading}</p>)

  const transport = graph.edges.find((e) => e.transport === 'belt')?.transportName ?? '—'
  const pipe = graph.edges.find((e) => e.transport === 'pipe')?.transportName ?? '—'

  return frame(
    <div className={`flowchart${expanded ? ' flowchart--expanded' : ''}`}>
      <button type="button" className="button flowchart__expand" onClick={() => setExpanded(!expanded)}>
        {expanded ? recipePickerText(locale).collapse : recipePickerText(locale).expand}
      </button>
      <ReactFlow<PlanFlowNode, PlanFlowEdge>
        nodes={layout.nodes.map((node) => node.type === NODE_TYPE.recipe ? { ...node, data: { ...node.data, onOpen: setEditingNode } }
          : node.type === NODE_TYPE.source ? { ...node, data: { ...node.data, onOpen: setEditingSource } } : node)}
        edges={layout.edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={(_, node) => { if (node.data.node.kind === 'recipe') setEditingNode(node.data.node) }}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.55, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        // --- 閲覧専用（編集系はすべて無効） ---
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={false}
        edgesReconnectable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        // --- 閲覧の操作だけ有効 ---
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
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
            {graph.nodes.some((n) => n.kind === 'source' && n.external) && (
              <li>
                <span className="flow-legend__swatch flow-legend__swatch--external" aria-hidden="true" />
                {T.flow.legendExternal}
              </li>
            )}
          </ul>
        </Panel>
        <Panel position="top-right" className="flow-stats">
          <p>{T.flow.stats(graph.nodes.length, graph.edges.length)}</p>
          {graph.bottleneckCount > 0 && (
            <p className="flow-stats__warn">{T.flow.bottleneckCount(graph.bottleneckCount)}</p>
          )}
          <p className="flow-stats__note">{T.flow.transportNote(transport, pipe)}</p>
          <p className="flow-stats__note">{recipePickerText(locale).help}</p>
        </Panel>
      </ReactFlow>
      {editingNode && <RecipePickerPage node={editingNode} onClose={() => setEditingNode(null)} />}
      {editingSource && <ResourceSettingsPage node={editingSource} onClose={() => setEditingSource(null)} />}
    </div>,
  )
}

// ---------------------------------------------------------------------------
// カスタムノード
// ---------------------------------------------------------------------------

/** 原料供給（採掘 / 既保有アイテムの持ち込み）。 */
function SourceNode({ data }: NodeProps<SourceFlowNode>) {
  const node = data.node
  const { locale } = useLocale()
  const P = resourceExtractionText(locale)
  // 既保有は採掘と意味が違う（マップの上限に関係しない）ので枠の色と種別ラベルで分ける
  return (
    <div className={`flow-node ${node.external ? 'flow-node--external' : 'flow-node--source'}`}
      role={node.external ? undefined : 'button'} tabIndex={node.external ? undefined : 0}
      aria-label={node.external ? undefined : `${P.title}：${node.itemName}`}
      onClick={() => { if (!node.external) data.onOpen?.(node) }}
      onKeyDown={event => { if (!node.external && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); data.onOpen?.(node) } }}>
      <p className="flow-node__kind">
        <ItemIcon id={node.item} name={node.itemName} size={NODE_METRICS.iconSize} />
        <span>{node.external ? T.flow.external : T.flow.source}</span>
      </p>
      <p className="flow-node__title">{node.itemName}</p>
      <p className="flow-node__rate num">
        {fmtRate(node.ratePerMin)} <span className="flow-node__unit">{itemUnit(node.item)}</span>
      </p>
      {!node.external && <>{node.machines?.map((machine, index) => <p className="flow-node__machine" key={index}>
        <span>{itemName(machine.extractorId)} {P.purityNames[machine.purity]} ({recipePickerText(locale).clock}{Number((machine.clock * 100).toFixed(2))}%)</span>
        <span className="num">{fmtRate(machine.required)} / {fmtRate(machine.maximum)}</span></p>)}
        <ExtractionWarning shortfall={node.shortfall ?? 0} idle={node.idle ?? 0} /></>}
      <Handle id={resourcePortId(node.id, 'out', node.item)} type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
}

/** 生産ステップ（レシピ1つ）。 */
function RecipeNode({ data }: NodeProps<RecipeFlowNode>) {
  const { locale } = useLocale()
  const P = recipePickerText(locale)
  const node = data.node
  // 「何を作るノードか」。レシピ名＝主産物名とは限らない（代替レシピ・副産物つき）ので
  // レシピ定義の先頭の産物を見出しに出す。
  // 発電機は疑似レシピ（産物なし・核廃棄物だけ）なので、燃料＝先頭の投入を見出しにする。
  const mainItem =
    recipeMainItem(node.recipeId) ?? node.outputs[0]?.item ?? node.inputs[0]?.item ?? ''
  return (
    <div className="flow-node flow-node--recipe" role="button" tabIndex={0}
      aria-label={`${P.open}${node.recipeName}`}
      onClick={() => data.onOpen?.(node)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); data.onOpen?.(node) }
      }}>

      <p className="flow-node__head">
        <ItemIcon id={mainItem} name={itemName(mainItem)} size={NODE_METRICS.iconSize} />
        <span className="flow-node__headname">{itemName(mainItem)}</span>
      </p>
      {/* 代替レシピはハードドライブのアイコンを名前の先頭に置く。
          1行目が狭くなるぶんは flow-layout.ts の titleLeadingWidth が高さに織り込む */}
      <p className="flow-node__title" style={{ height: nodeRows(node).find((row) => row.id === 'title')?.height }}>
        {isAlternateRecipe(node.recipeId) && <AlternateIcon size={NODE_METRICS.titleIconSize} />}
        {node.recipeName}
      </p>
      <p className="flow-node__meta">
        {node.buildingName} {P.count(node.buildingCount)} ({P.clock}{Number((node.clock * 100).toFixed(2))}%)
      </p>
      <p className="flow-node__meta">
        {/* 発電機は電力を消費しない。代わりに発電量を出す（電力のエッジは張らない） */}
        {node.powerProductionMW > 0 ? (
          T.flow.powerProduction(fmtPower(node.powerProductionMW))
        ) : (
          <>
            {node.powerRangeMW
              ? fmtPowerRange(node.powerRangeMW.minMW, node.powerRangeMW.maxMW)
              : fmtPower(node.powerMW)}{' '}
            {T.units.megawatt}
          </>
        )}
      </p>
      {/* 行が1つ増えるので flow-layout.ts の nodeRows と条件を必ず揃えること */}
      {node.somersloops > 0 && (
        <p className="flow-node__meta">
          {T.flow.somersloops(node.somersloops)}
          {node.powerShards > 0 ? `${T.flow.metaSeparator}${T.flow.shards(node.powerShards)}` : ''}
        </p>
      )}
      <div className="flow-node__io">
        <ul className="flow-node__col">
          <li className="flow-node__colhead">{T.flow.inputs}</li>
          {node.inputs.map((flow) => (
            <li key={flow.item} data-resource-item={flow.item}>
              <FlowRate item={flow.item} ratePerMin={flow.ratePerMin} />
            </li>
          ))}
        </ul>
        <ul className="flow-node__col flow-node__col--out">
          <li className="flow-node__colhead">{T.flow.outputs}</li>
          {node.outputs.map((flow) => (
            <li key={flow.item} data-resource-item={flow.item}>
              <FlowRate item={flow.item} ratePerMin={flow.ratePerMin} singleOutputLimit={flow.singleOutputLimit} />
            </li>
          ))}
        </ul>
      </div>
      {node.inputs.map((flow) => <Handle key={`in:${flow.item}`}
        id={resourcePortId(node.id, 'in', flow.item)} type="target" position={Position.Left}
        style={{ top: resourcePortY(node, 'in', flow.item) }} isConnectable={false} />)}
      {node.outputs.map((flow) => <Handle key={`out:${flow.item}`}
        id={resourcePortId(node.id, 'out', flow.item)} type="source" position={Position.Right}
        style={{ top: resourcePortY(node, 'out', flow.item) }} isConnectable={false} />)}
    </div>
  )
}

/** 最終出力（目標産出 / 副産物）。 */
function OutputNode({ data }: NodeProps<OutputFlowNode>) {
  const node = data.node
  return (
    <div className={`flow-node flow-node--output${node.isTarget ? ' flow-node--target' : ''}`}>
      <p className="flow-node__kind">
        <ItemIcon id={node.item} name={node.itemName} size={NODE_METRICS.iconSize} />
        <span>{node.isTarget ? T.flow.target : T.flow.byproduct}</span>
      </p>
      <p className="flow-node__title">{node.itemName}</p>
      <p className="flow-node__rate num">
        {fmtRate(node.ratePerMin)} <span className="flow-node__unit">{itemUnit(node.item)}</span>
      </p>
      {node.requestedPerMin !== undefined && (
        <p className="flow-node__meta num">{T.flow.requested(fmtRate(node.requestedPerMin))}</p>
      )}
      <Handle id={resourcePortId(node.id, 'in', node.item)} type="target" position={Position.Left} isConnectable={false} />
    </div>
  )
}

function FlowRate({ item, ratePerMin, singleOutputLimit }: { item: string; ratePerMin: number; singleOutputLimit?: number }) {
  const { locale } = useLocale()
  const P = recipePickerText(locale)
  return (
    <>
      <ItemIcon id={item} name={itemName(item)} size={24} />
      <span className="flow-node__item" title={itemName(item)}>{itemName(item)}</span>
      <span className="flow-node__num num">{fmtRate(ratePerMin)}</span>
      {singleOutputLimit !== undefined && <span className="flow-node__output-limit num">{P.limit} {fmtRate(singleOutputLimit)}</span>}
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
          {/* アイコンの場所は measureEdgeLabel が幅に入れてある（無ければ空くだけ） */}
          <ItemIcon id={data.item} name={itemName(data.item)} size={LABEL_STYLE.iconSize} />
          <span>{label.text}</span>
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
