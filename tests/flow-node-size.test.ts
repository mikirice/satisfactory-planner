/**
 * ノードの寸法（src/ui/flow-layout.ts）の検証。
 *
 * 症状: 目標産出ノードで大きなレート数字がアイテム名に重なり、「要求 60.00」が
 * 下端で見切れていた。原因は「高さが固定値で、実際に描く行数と合っていない」こと。
 * 高さが足りないと flex の子（各行）が縮められ、文字が隣の行に重なる。
 *
 * ここでは DOM ではなく **寸法計算** を見る:
 *   ノードの高さ == 余白 + 罫 + 実際の行の高さの合計 + 行間
 * が常に成り立てば、行が潰れる余地がない（＝重なりも見切れも起きない）。
 * CSS 側は行ごとに px の line-height を固定し `.flow-node > *` を縮ませないこと。
 */
import { describe, expect, it } from 'vitest'

import { items, recipes } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import type { PlanGraph, PlanGraphNode } from '../src/plan/graph.ts'
import { solveProduction } from '../src/solver/index.ts'
import {
  NODE_METRICS,
  layoutPlanGraph,
  measureNodeSize,
  measureTextWidth,
  nodeInnerWidth,
  nodeRows,
  nodeWidth,
  titleLeadingWidth,
  titleLineCount,
} from '../src/ui/flow-layout.ts'

const ALL_RECIPES = recipes.map((r) => r.id)

async function planGraph(targets: { item: string; ratePerMin: number }[]): Promise<PlanGraph> {
  const result = await solveProduction({ targets, enabledRecipes: ALL_RECIPES })
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return buildPlanGraph(result, { beltId: 'Build_ConveyorBeltMk1_C' })
}

// 報告のあった構成（強化鉄板 60/min）と、ノード種別が一通り出る大きめの構成
const reinforcedGraph = await planGraph([{ item: 'Desc_IronPlateReinforced_C', ratePerMin: 60 }])
const computerGraph = await planGraph([{ item: 'Desc_Computer_C', ratePerMin: 10 }])
const allNodes: PlanGraphNode[] = [...reinforcedGraph.nodes, ...computerGraph.nodes]

/** 行の積み上げから出した「中身が必要とする高さ」。 */
function stackedHeight(node: PlanGraphNode): number {
  const rows = nodeRows(node)
  const content = rows.reduce((sum, row) => sum + row.height, 0)
  return (
    NODE_METRICS.paddingY * 2 +
    NODE_METRICS.border * 2 +
    content +
    NODE_METRICS.rowGap * Math.max(rows.length - 1, 0)
  )
}

describe('ノードの高さ', () => {
  it('種別が3つとも出る構成で検証している（前提の確認）', () => {
    const kinds = new Set(allNodes.map((n) => n.kind))
    expect(kinds).toEqual(new Set(['source', 'recipe', 'output']))
    expect(allNodes.length).toBeGreaterThan(10)
  })

  it('高さ = 余白 + 罫 + 行の合計 + 行間（中身がちょうど収まる）', () => {
    for (const node of allNodes) {
      expect(measureNodeSize(node).height, node.id).toBe(stackedHeight(node))
    }
  })

  it('どの行も文字が潰れない高さを持つ（行送り >= 文字サイズ×1.15）', () => {
    for (const node of allNodes) {
      for (const row of nodeRows(node)) {
        expect(row.height, `${node.id} / ${row.id}`).toBeGreaterThanOrEqual(row.fontSize * 1.15)
      }
    }
  })

  it('アイテム名・レシピ名は折り返しても収まる（省略せずに読める）', () => {
    for (const node of allNodes) {
      const text = node.kind === 'recipe' ? node.recipeNameJa : node.itemNameJa
      const width = nodeWidth(node)
      // 代替レシピは名前の前にハードドライブのアイコンが入るぶんだけ1行目が狭くなる
      const leading = titleLeadingWidth(node)
      const lines = titleLineCount(text, width, leading)
      const textWidth =
        measureTextWidth(text, NODE_METRICS.titleFontSize, NODE_METRICS.titleBoldFactor) + leading
      expect(lines, node.id).toBeLessThanOrEqual(NODE_METRICS.titleMaxLines)
      expect(textWidth, `${node.id}: ${text}`).toBeLessThanOrEqual(lines * nodeInnerWidth(width))

      const titleRow = nodeRows(node).find((row) => row.id === 'title')!
      expect(titleRow.height).toBe(NODE_METRICS.titleLine * lines)
    }
  })

  it('目標ノードは「要求」の行ぶんだけ副産物ノードより高い', () => {
    const target = reinforcedGraph.nodes.find(
      (n) => n.kind === 'output' && n.requestedPerMin !== undefined,
    )
    expect(target).toBeDefined()
    const rows = nodeRows(target!).map((row) => row.id)
    expect(rows).toEqual(['kind', 'title', 'rate', 'meta:requested'])
  })

  it('データ中でいちばん長い名前でも上限行数に収まる', () => {
    const longestRecipe = [...recipes]
      .map((r) => r.name.ja)
      .sort((a, b) => b.length - a.length)[0]!
    const longestItem = [...items].map((i) => i.name.ja).sort((a, b) => b.length - a.length)[0]!

    for (const [text, width] of [
      [longestRecipe, NODE_METRICS.recipeWidth],
      [longestItem, NODE_METRICS.outputWidth],
    ] as const) {
      const lines = titleLineCount(text, width)
      const textWidth = measureTextWidth(
        text,
        NODE_METRICS.titleFontSize,
        NODE_METRICS.titleBoldFactor,
      )
      expect(lines).toBeLessThan(NODE_METRICS.titleMaxLines + 1)
      expect(textWidth, text).toBeLessThanOrEqual(lines * nodeInnerWidth(width))
    }
  })

  it('レシピノードは投入/産出の行数ぶん伸びる', () => {
    const recipeNodes = allNodes.filter((n) => n.kind === 'recipe')
    const rowsOf = (node: PlanGraphNode & { kind: 'recipe' }): number =>
      Math.max(node.inputs.length, node.outputs.length, 1)
    const small = recipeNodes.reduce((a, b) => (rowsOf(a) <= rowsOf(b) ? a : b))
    const big = recipeNodes.reduce((a, b) => (rowsOf(a) >= rowsOf(b) ? a : b))
    expect(rowsOf(big)).toBeGreaterThan(rowsOf(small))
    expect(measureNodeSize(big).height - measureNodeSize(small).height).toBe(
      (rowsOf(big) - rowsOf(small)) * NODE_METRICS.ioRowLine +
        (titleLineCount(big.recipeNameJa, NODE_METRICS.recipeWidth) -
          titleLineCount(small.recipeNameJa, NODE_METRICS.recipeWidth)) *
          NODE_METRICS.titleLine,
    )
  })
})

describe('レイアウトに渡す寸法', () => {
  it('React Flow のノード style は measureNodeSize と一致する（elk と同じ箱）', async () => {
    const layout = await layoutPlanGraph(reinforcedGraph)
    const byId = new Map(reinforcedGraph.nodes.map((n) => [n.id, n]))

    expect(layout.nodes.length).toBe(reinforcedGraph.nodes.length)
    for (const flowNode of layout.nodes) {
      const size = measureNodeSize(byId.get(flowNode.id)!)
      expect(flowNode.style?.width, flowNode.id).toBe(size.width)
      expect(flowNode.style?.height, flowNode.id).toBe(size.height)
    }
  })

  it('ノード種別名は React Flow 既定ノード（output 等）と衝突しない', async () => {
    const layout = await layoutPlanGraph(reinforcedGraph)
    const builtIn = new Set(['input', 'default', 'output', 'group'])
    for (const flowNode of layout.nodes) {
      expect(builtIn.has(flowNode.type ?? ''), flowNode.type).toBe(false)
      expect(flowNode.type?.startsWith('plan')).toBe(true)
    }
  })
})
