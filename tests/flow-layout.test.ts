/**
 * フローチャートのレイアウト（src/ui/flow-layout.ts）の検証。
 *
 * 見た目そのものではなく **矩形の重なり** を見る。エッジラベル（「水 66.67 m³/min」等）が
 * 互いに重なる／ノードに重なると数字が読めなくなり、図の意味がなくなるため、
 * elk が返した座標で重なりが出ないことをここで担保する。
 *
 * 再現ケースは実際に不具合が出た構成（プラスチック 300/min・代替レシピ全ON・ベルト Mk.1）。
 * ベルトを Mk.1 にすると「要 N本」が付いてラベルが伸び、いちばん重なりやすくなる。
 */
import { describe, expect, it } from 'vitest'

import { recipes } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import type { PlanGraph } from '../src/plan/graph.ts'
import { solveProduction } from '../src/solver/index.ts'
import {
  elkEdgePath,
  layoutPlanGraph,
  measureEdgeLabel,
  overlapArea,
} from '../src/ui/flow-layout.ts'
import type { PlanFlowLayout, Rect } from '../src/ui/flow-layout.ts'

const MK1_BELT = 'Build_ConveyorBeltMk1_C'
const ALL_RECIPES = recipes.map((r) => r.id)

async function planGraph(
  targets: { item: string; ratePerMin: number }[],
  beltId: string,
): Promise<PlanGraph> {
  const result = await solveProduction({ targets, enabledRecipes: ALL_RECIPES })
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return buildPlanGraph(result, { beltId })
}

const labelRects = (layout: PlanFlowLayout): (Rect & { text: string })[] =>
  layout.edges.map((edge) => edge.data!.label)

const nodeRects = (layout: PlanFlowLayout): (Rect & { id: string })[] =>
  layout.nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: Number(node.style?.width ?? 0),
    height: Number(node.style?.height ?? 0),
  }))

/** 重なっている組を「面積つきの説明文」で返す（落ちたときに現物が読めるように）。 */
function overlaps(layout: PlanFlowLayout): string[] {
  const labels = labelRects(layout)
  const nodes = nodeRects(layout)
  const found: string[] = []
  for (const [i, label] of labels.entries()) {
    for (const other of labels.slice(i + 1)) {
      const area = overlapArea(label, other)
      if (area > 0) found.push(`ラベル×ラベル ${area.toFixed(1)}px²: "${label.text}" / "${other.text}"`)
    }
    for (const node of nodes) {
      const area = overlapArea(label, node)
      if (area > 0) found.push(`ラベル×ノード ${area.toFixed(1)}px²: "${label.text}" / ${node.id}`)
    }
  }
  return found
}

// 症状の再現構成と、規模の違う比較用ケース
const plasticGraph = await planGraph([{ item: 'Desc_Plastic_C', ratePerMin: 300 }], MK1_BELT)
const bigGraph = await planGraph(
  [
    { item: 'Desc_ModularFrameHeavy_C', ratePerMin: 10 },
    { item: 'Desc_Computer_C', ratePerMin: 10 },
  ],
  MK1_BELT,
)

describe('ラベルの重なり', () => {
  it('プラスチック300/min・代替全ON・ベルトMk.1（不具合の再現構成）で重なりが出ない', async () => {
    // 廃重油 → 希釈燃料 / 残留ゴム のあたりでラベルが密集する構成
    expect(plasticGraph.edges.length).toBeGreaterThanOrEqual(10)
    expect(plasticGraph.edges.some((e) => e.bottleneck)).toBe(true)

    const layout = await layoutPlanGraph(plasticGraph)
    expect(overlaps(layout)).toEqual([])
  })

  it('30ノード級（重工業フレーム＋コンピューター）でも重なりが出ない', async () => {
    expect(bigGraph.nodes.length).toBeGreaterThanOrEqual(20)

    const layout = await layoutPlanGraph(bigGraph)
    expect(overlaps(layout)).toEqual([])
  })

  it('ラベルは elk が決めた座標を持ち、経路の点も付いてくる', async () => {
    const layout = await layoutPlanGraph(plasticGraph)

    for (const edge of layout.edges) {
      const data = edge.data!
      expect(data.points.length).toBeGreaterThanOrEqual(2)
      expect(data.label.text).not.toBe('')
      expect(data.label.width).toBe(measureEdgeLabel(data.label.text).width)
      expect(Number.isFinite(data.label.x)).toBe(true)
      expect(Number.isFinite(data.label.y)).toBe(true)
    }
    // 全部が同じ場所（＝ elk がラベルを配置していない）ではないこと
    const xs = new Set(layout.edges.map((e) => e.data!.label.x))
    expect(xs.size).toBeGreaterThan(1)
  })

  it('ラベルは自分のエッジの経路の近くに置かれる', async () => {
    const layout = await layoutPlanGraph(plasticGraph)

    for (const edge of layout.edges) {
      const { points, label } = edge.data!
      const cx = label.x + label.width / 2
      const cy = label.y + label.height / 2
      // 経路のいずれかの線分から、ラベル高さ + 余白の範囲内にあること
      const near = points.slice(1).some((point, index) => {
        const prev = points[index]!
        const minX = Math.min(prev.x, point.x) - label.width / 2
        const maxX = Math.max(prev.x, point.x) + label.width / 2
        const minY = Math.min(prev.y, point.y) - label.height * 2
        const maxY = Math.max(prev.y, point.y) + label.height * 2
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY
      })
      expect(near, `${label.text} が経路から離れている`).toBe(true)
    }
  })
})

describe('ラベルの寸法推定', () => {
  it('全角と半角で幅が変わり、パディング込みの外形を返す', () => {
    const wide = measureEdgeLabel('プラスチック 300.00/min・要 5本')
    const narrow = measureEdgeLabel('水 66.67 m³/min')

    expect(wide.width).toBeGreaterThan(narrow.width)
    expect(wide.height).toBe(narrow.height)
    // 空文字でもパディング分は残る（0 幅の矩形を elk に渡さない）
    expect(measureEdgeLabel('').width).toBe(12)
  })

  it('CSS の実測より小さく見積もらない（文字切れ防止の安全側）', () => {
    // 11px の一般的なサンセリフで半角は 0.6em 前後、全角は 1em。推定はそれ以上にする
    const text = '鉄板 60.00/min'
    const halfWidth = [...text].filter((c) => c.charCodeAt(0) < 0x2e80).length
    const fullWidth = [...text].length - halfWidth
    const conservative = halfWidth * 11 * 0.6 + fullWidth * 11 + 12

    expect(measureEdgeLabel(text).width).toBeGreaterThanOrEqual(conservative)
  })
})

describe('折れ線 → SVG path', () => {
  it('曲がり点は角を丸めた path になる', () => {
    const path = elkEdgePath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ])

    expect(path.startsWith('M 0 0')).toBe(true)
    expect(path).toContain('Q 100 0')
    expect(path.endsWith('L 100 100')).toBe(true)
  })

  it('点が足りないときは空文字（描かない）', () => {
    expect(elkEdgePath([])).toBe('')
    expect(elkEdgePath([{ x: 1, y: 2 }])).toBe('')
  })

  it('短い線分では丸め半径を線分の長さに収める', () => {
    const path = elkEdgePath(
      [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 40 },
      ],
      10,
    )

    // 半径 10 のままだと 4px の線分を飛び越えて座標が逆走する
    expect(path).toContain('L 2 0')
    expect(path).toContain('Q 4 0 4 2')
  })
})
