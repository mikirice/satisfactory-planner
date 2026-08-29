/**
 * 建設チェックリストの導出（計画書「建設チェックリスト（建設モード）」§3）。
 *
 * 解（Solution）と採掘計画（ExtractionPlan）を「ゲーム内で上から順に建てられる並び」に
 * 組み替えるだけの純関数。**表示レイヤー専用**で、ソルバー・保存形式・共有URLには一切触らない。
 *
 * セクションは依存順に固定する:
 *   1. 原料の採掘・給水（採掘機・汲み上げ機・資源井戸＋加圧機）
 *   2. 製造ライン（レシピ工程を原料 → 目標のトポロジカル順に）
 *   3. 発電（発電計画が有効なときだけ）
 *
 * 入出力には「そのレートを1本で運べる最小の等級」を添える。最上位でも1本に収まらないときは
 * 最上位等級の本数（Mk.6 ×2本）を出す。等級の選定は solver/logistics.ts を再利用する
 * （速度データを二重に持たないため）。
 */
import { belts, pipes } from '../data/index.ts'
import type { ResourcePurity } from '../data/map-limits.ts'
import { linesRequired, powerShardsForClock, transportKind } from '../solver/index.ts'
import type { ExtractionPlan, ItemRate, Solution, SolutionStep } from '../solver/index.ts'
import { WELL_PRESSURIZER_ID } from '../solver/index.ts'
import { stepKey } from './aggregate.ts'

/** これ未満のレートは無いものとして扱う（LP の丸め誤差対策。power-filter.ts と同じ値）。 */
const MIN_RATE = 1e-6

/** セクションID（表示順そのもの）。 */
export type BuildSectionId = 'extraction' | 'manufacturing' | 'power'

/** セクションの並び。導出も表示もこの順に固定する。 */
export const BUILD_SECTION_ORDER: readonly BuildSectionId[] = [
  'extraction',
  'manufacturing',
  'power',
]

/** 1本で運ぶのに必要な搬送等級（足りなければ最上位等級の本数）。 */
export type BuildTransport = {
  /** 運ぶアイテムの Item.id */
  item: string
  /** 工程合計の毎分レート */
  ratePerMin: number
  kind: 'belt' | 'pipe'
  /** 必要等級の Building.id（ベルト / パイプ） */
  tierId: string
  /** その等級1本あたりの上限 */
  capacityPerMin: number
  /** 必要本数。最上位等級でも運びきれないときだけ 2 以上になる */
  lines: number
}

/** 採掘の純度別ノード割当（表示用に必要な分だけ持つ）。 */
export type BuildNodeAssignment = {
  purity: ResourcePurity
  /** 割り当てたノード数（小数） */
  nodes: number
  ratePerMin: number
}

/** チェックリストの1項目（= 1工程 / 1設備グループ）。 */
export type BuildListItem = {
  /**
   * 進捗の保存キーになる安定ID。同じプランを開き直したら同じIDになる必要がある
   * （localStorage の進捗はこのIDで引く）。
   */
  id: string
  section: BuildSectionId
  /** 建てる設備の Building.id */
  buildingId: string
  /** 建てる台数 */
  builtCount: number
  /** 稼働台数（小数・クロック100%換算）。採掘は割当ノード数の合計 */
  machineCount: number
  /** クロック（1 = 100%） */
  clockSpeed: number
  /** 必要なパワーシャードの総数（クロック100%以下なら 0） */
  powerShards: number
  /** 使用する Somersloop の総数（0 = 未使用） */
  somersloops: number
  /** レシピID（製造・発電の項目のみ） */
  recipeId?: string
  /** 発電機の燃料 Item.id（発電の項目のみ） */
  fuelItem?: string
  /** 発電量(MW)（発電の項目のみ） */
  powerProductionMW?: number
  /** 採掘する原料の Item.id（採掘の項目のみ） */
  resourceItem?: string
  /** 純度別ノード割当（採掘の項目のみ） */
  nodes?: BuildNodeAssignment[]
  inputs: BuildTransport[]
  outputs: BuildTransport[]
}

export type BuildSection = {
  id: BuildSectionId
  items: BuildListItem[]
  /** このセクションで建てる台数の合計 */
  totalCount: number
}

export type BuildList = {
  /** 空のセクションは載せない（BUILD_SECTION_ORDER の順） */
  sections: BuildSection[]
  /** 全セクションで建てる台数の合計 */
  totalCount: number
}

// ---------------------------------------------------------------------------
// 搬送等級
// ---------------------------------------------------------------------------

/**
 * そのレートを運ぶのに必要な最小等級。
 * 遅い等級から順に「1本で足りるか」を見て、最初に足りたものを返す。
 * 最上位でも足りなければ最上位等級＋必要本数（Mk.6 ×2本）にする。
 */
export function requiredTransport(item: string, ratePerMin: number): BuildTransport {
  const kind = transportKind(item)
  const tiers = kind === 'belt' ? belts : pipes
  for (const tier of tiers) {
    const requirement = linesRequired(ratePerMin, item, tier.id)
    if (requirement.lines <= 1) {
      return {
        item,
        ratePerMin,
        kind,
        tierId: requirement.id,
        capacityPerMin: requirement.capacityPerMin,
        lines: requirement.lines,
      }
    }
  }
  const top = linesRequired(ratePerMin, item, tiers.at(-1)!.id)
  return {
    item,
    ratePerMin,
    kind,
    tierId: top.id,
    capacityPerMin: top.capacityPerMin,
    lines: top.lines,
  }
}

const toTransports = (flows: readonly ItemRate[]): BuildTransport[] =>
  flows
    .filter((flow) => flow.ratePerMin > MIN_RATE)
    .map((flow) => requiredTransport(flow.item, flow.ratePerMin))

// ---------------------------------------------------------------------------
// 製造ラインの並べ替え
// ---------------------------------------------------------------------------

/**
 * 製造工程を「原料 → 目標」のトポロジカル順に並べる。
 *
 * 投入を作っている工程が先に来るように置いていく。同じ条件の工程が複数あるときは
 * **解に現れた順**（元の添字）で決める＝同じ解からは常に同じ並びになる。
 *
 * ゲームの構成には循環（水の再利用など）があり、厳密な依存順が存在しないことがある。
 * その場合は「未解決の依存がいちばん少ない工程」から置いて必ず全件を並べる
 * （止まったり工程を落としたりしない。循環している箇所だけ順序の保証が無くなる）。
 */
export function topologicalSteps(steps: readonly SolutionStep[]): SolutionStep[] {
  const producers = new Map<string, number[]>()
  steps.forEach((step, index) => {
    for (const flow of step.outputs) {
      if (flow.ratePerMin <= MIN_RATE) continue
      const list = producers.get(flow.item)
      if (list === undefined) producers.set(flow.item, [index])
      else list.push(index)
    }
  })

  const dependencies = steps.map((step, index) => {
    const deps = new Set<number>()
    for (const flow of step.inputs) {
      if (flow.ratePerMin <= MIN_RATE) continue
      for (const producer of producers.get(flow.item) ?? []) {
        if (producer !== index) deps.add(producer)
      }
    }
    return deps
  })

  const placed = new Set<number>()
  const order: number[] = []
  while (order.length < steps.length) {
    let chosen = -1
    let fewestUnmet = Number.POSITIVE_INFINITY
    for (let index = 0; index < steps.length; index += 1) {
      if (placed.has(index)) continue
      let unmet = 0
      for (const dep of dependencies[index]!) if (!placed.has(dep)) unmet += 1
      if (unmet < fewestUnmet) {
        fewestUnmet = unmet
        chosen = index
        if (unmet === 0) break // 依存が全て済んだ工程のうち、いちばん先に現れたもの
      }
    }
    order.push(chosen)
    placed.add(chosen)
  }
  return order.map((index) => steps[index]!)
}

// ---------------------------------------------------------------------------
// 本体
// ---------------------------------------------------------------------------

const isGeneratorStep = (step: SolutionStep): boolean => (step.powerProductionMW ?? 0) > 0

/** 採掘セクションの項目（設備グループごとに1項目。資源井戸の加圧機は別項目にする）。 */
function extractionItems(extraction: ExtractionPlan | null): BuildListItem[] {
  if (extraction === null) return []
  const items: BuildListItem[] = []
  for (const resource of extraction.resources) {
    for (const group of resource.groups) {
      if (group.buildingCount <= 0) continue
      // group.powerShards は加圧機ぶんを含む合計なので、1台あたりから項目別に割り直す
      // （extraction.ts と同じ計算＝二重実装にならない）
      const shardsEach = powerShardsForClock(group.clockSpeed)
      items.push({
        id: `extract:${resource.item}:${group.extractorId}`,
        section: 'extraction',
        buildingId: group.extractorId,
        builtCount: group.buildingCount,
        machineCount: group.machineCount,
        clockSpeed: group.clockSpeed,
        powerShards: shardsEach * group.buildingCount,
        somersloops: 0,
        resourceItem: resource.item,
        nodes: group.assignments.map((assignment) => ({
          purity: assignment.purity,
          nodes: assignment.nodes,
          ratePerMin: assignment.ratePerMin,
        })),
        inputs: [],
        outputs: toTransports([{ item: resource.item, ratePerMin: group.ratePerMin }]),
      })
      if ((group.pressurizerCount ?? 0) > 0) {
        items.push({
          id: `extract:${resource.item}:${group.extractorId}:pressurizer`,
          section: 'extraction',
          buildingId: WELL_PRESSURIZER_ID,
          builtCount: group.pressurizerCount!,
          machineCount: group.pressurizerCount!,
          clockSpeed: group.clockSpeed,
          powerShards: shardsEach * group.pressurizerCount!,
          somersloops: 0,
          resourceItem: resource.item,
          inputs: [],
          outputs: [],
        })
      }
    }
  }
  return items
}

function stepItem(step: SolutionStep, section: BuildSectionId): BuildListItem {
  return {
    id: `${section === 'power' ? 'gen' : 'make'}:${stepKey(step)}`,
    section,
    buildingId: step.buildingId,
    builtCount: step.builtCount,
    machineCount: step.machineCount,
    clockSpeed: step.clockSpeed,
    powerShards: step.powerShards,
    somersloops: step.somersloops,
    recipeId: step.recipeId,
    ...(step.fuelItem === undefined ? {} : { fuelItem: step.fuelItem }),
    ...(step.powerProductionMW === undefined
      ? {}
      : { powerProductionMW: step.powerProductionMW }),
    inputs: toTransports(step.inputs),
    outputs: toTransports(step.outputs),
  }
}

function section(id: BuildSectionId, items: BuildListItem[]): BuildSection {
  return {
    id,
    items,
    totalCount: items.reduce((total, item) => total + item.builtCount, 0),
  }
}

/**
 * 解と採掘計画から建設チェックリストを組み立てる。
 * 建てるものが1つも無ければ `sections` は空になる（画面は空状態を出す）。
 */
export function deriveBuildList(
  solution: Solution,
  extraction: ExtractionPlan | null = null,
): BuildList {
  const manufacturing = topologicalSteps(solution.steps.filter((step) => !isGeneratorStep(step)))
  // 発電は発電量の大きい順（同じなら解に現れた順を保つ安定ソート）
  const generators = solution.steps
    .filter(isGeneratorStep)
    .slice()
    .sort((a, b) => (b.powerProductionMW ?? 0) - (a.powerProductionMW ?? 0))

  const sections = [
    section('extraction', extractionItems(extraction)),
    section(
      'manufacturing',
      manufacturing.filter((step) => step.builtCount > 0).map((step) => stepItem(step, 'manufacturing')),
    ),
    section(
      'power',
      generators.filter((step) => step.builtCount > 0).map((step) => stepItem(step, 'power')),
    ),
  ].filter((entry) => entry.items.length > 0)

  return {
    sections,
    totalCount: sections.reduce((total, entry) => total + entry.totalCount, 0),
  }
}

/** チェックリスト全体の項目を1列に並べる（進捗の集計・テスト用）。 */
export const buildListItems = (list: BuildList): BuildListItem[] =>
  list.sections.flatMap((entry) => entry.items)
