/**
 * Excel(.xlsx) 出力（仕様書 v1 §8 が唯一の仕様源）。
 *
 * シート構成（この順に並べる）:
 *   1. サマリー     — 目標産出 / 総電力 / 総建物台数 / 必要原料 / 有効代替レシピ / シンクポイント
 *   2. 建物リスト   — レシピ・機械種別・台数・クロック・電力（機械種別でまとめて並べる）
 *   3. アイテム収支 — 産出 / 消費 / 差分。不足=赤系・余剰=青系の塗り＋状態ラベル
 *   4. 原料         — 必要レート・マップ上限比率・採掘機の台数・純度別ノード割当
 *   5. 建設コスト   — 製造建物と採掘設備の建材合計
 *   6. 物流         — 各フローのベルト/パイプ本数（独自項目）
 *
 * 方針:
 * - **数値は必ず数値セル**で書き、見た目は numFmt に任せる（文字列にすると集計できない）。
 *   丸めの粒度は仕様書 §8 の「レート小数2位・台数小数4位」に合わせる。
 * - アイテム名・レシピ名は日本語（src/data の LocalizedName.ja）。
 * - 表シートは必ず「ヘッダー行の固定＋オートフィルタ＋列幅自動調整」。
 *   合計行はフィルタ範囲の外に出す（フィルタで消えると合計が読めなくなるため）。
 * - 集計は src/plan/aggregate.ts と共有する（画面と数字がズレないように）。
 * - Node（vitest）とブラウザの両方で動く。分岐するのはファイル保存だけ。
 */
// exceljs は CJS。名前付き import は素の Node ESM で解決できない環境があるので
// 既定 import（= module.exports）から取り出す。型は名前付きの型 import で付ける。
import ExcelJS from 'exceljs'
import type { Row, Workbook, Worksheet } from 'exceljs'

import { itemsById, meta, recipesById, buildingsById } from '../data/index.ts'
import { estimateFootprint, groupByBuilding, mergeBuildCost } from '../plan/aggregate.ts'
import { enumeratePlanFlows, flowTransport, resolveTransportChoice } from '../plan/flows.ts'
import type { ExtractionPlan, ItemRate, Solution } from '../solver/index.ts'

// ---------------------------------------------------------------------------
// 公開型
// ---------------------------------------------------------------------------

export type ExcelExportInput = {
  solution: Solution
  extraction: ExtractionPlan | null
  /** プラン名。空なら 'plan' */
  planName?: string
  /** 物流シートで使うベルト（Belt.id）。既定は最速 */
  beltId?: string
  /** 物流シートで使うパイプ（Pipe.id）。既定は最速 */
  pipeId?: string
  /** 目的関数の表示名（サマリーに出す） */
  objectiveLabel?: string
  /** 有効にした代替レシピの Recipe.id 一覧 */
  enabledAlternateIds?: readonly string[]
  /** 固体ノードの採掘機 Building.id（サマリーに出す） */
  minerId?: string
  /** 生成日時。既定 new Date()（テストから固定できるように） */
  generatedAt?: Date
}

export const SHEET_NAMES = {
  summary: 'サマリー',
  buildings: '建物リスト',
  balance: 'アイテム収支',
  resources: '原料',
  buildCost: '建設コスト',
  logistics: '物流',
} as const

/** シート名（仕様書 §8 の並び順） */
export const SHEET_NAME_LIST: readonly string[] = [
  SHEET_NAMES.summary,
  SHEET_NAMES.buildings,
  SHEET_NAMES.balance,
  SHEET_NAMES.resources,
  SHEET_NAMES.buildCost,
  SHEET_NAMES.logistics,
]

/** 表示書式（仕様書 §8: レート小数2位・台数小数4位）。 */
export const NUM_FMT = {
  /** レート・電力・建材量 */
  rate: '#,##0.00',
  power: '#,##0.00',
  amount: '#,##0.00',
  /** 稼働台数（端数がクロックになるので細かく見せる） */
  count: '#,##0.0000',
  /** 建てる台数・必要本数・ノード数・シンクポイント */
  int: '#,##0',
  /** 面積(m²)。概算なので小数1位まで */
  area: '#,##0.0',
  /** 上限比率・クロック・使用率 */
  percent: '0.0%',
  datetime: 'yyyy/mm/dd hh:mm',
} as const

/** 収支の色（色だけに頼らないよう「状態」列のラベルと併用する）。 */
export const BALANCE_COLORS = {
  shortageFill: 'FFFDE7E9',
  shortageFont: 'FF9F1239',
  surplusFill: 'FFE7F0FD',
  surplusFont: 'FF1E40AF',
} as const

const HEADER_FILL = 'FFEFF1F5'
const HEADER_BORDER = 'FFCBD5E1'
const PLACEHOLDER = '—'
/** 収支の 0 判定（画面の BalanceTable と揃える） */
const ZERO = 1e-9

// ---------------------------------------------------------------------------
// 公開API
// ---------------------------------------------------------------------------

/**
 * ファイル名 `satisfactory-plan_<プラン名>_<YYYYMMDD>.xlsx`（仕様書 §8）。
 * プラン名はファイル名に使えない文字を `_` に潰す。空なら 'plan'。
 */
export function planFileName(planName: string | undefined, date: Date = new Date()): string {
  return `satisfactory-plan_${sanitizePlanName(planName)}_${yyyymmdd(date)}.xlsx`
}

/** ワークブックを組み立てる（保存はしない）。 */
export function buildPlanWorkbook(input: ExcelExportInput): Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Satisfactory 生産計画ツール'
  workbook.created = input.generatedAt ?? new Date()
  workbook.modified = workbook.created

  writeSummarySheet(workbook, input)
  writeBuildingsSheet(workbook, input)
  writeBalanceSheet(workbook, input)
  writeResourcesSheet(workbook, input)
  writeBuildCostSheet(workbook, input)
  writeLogisticsSheet(workbook, input)

  return workbook
}

/** .xlsx のバイト列。Node / ブラウザ共通。 */
export async function planWorkbookBuffer(input: ExcelExportInput): Promise<ArrayBuffer> {
  const buffer = await buildPlanWorkbook(input).xlsx.writeBuffer()
  return buffer as unknown as ArrayBuffer
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** ブラウザでダウンロードさせる。document が無い環境では例外。 */
export async function downloadPlanWorkbook(input: ExcelExportInput): Promise<void> {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('Excel のダウンロードはブラウザでのみ実行できます')
  }
  const buffer = await planWorkbookBuffer(input)
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }))
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = planFileName(input.planName, input.generatedAt)
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    // click() は同期なので即時 revoke してよい
    URL.revokeObjectURL(url)
  }
}

// ---------------------------------------------------------------------------
// 1. サマリー
// ---------------------------------------------------------------------------

function writeSummarySheet(workbook: Workbook, input: ExcelExportInput): void {
  const { solution, extraction } = input
  const ws = workbook.addWorksheet(SHEET_NAMES.summary)
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const title = ws.addRow(['Satisfactory 生産計画'])
  title.getCell(1).font = { bold: true, size: 14 }

  // 1) 見出しブロック
  addKeyValue(ws, 'プラン名', input.planName?.trim() || 'plan')
  const generatedAt = ws.addRow(['生成日時', input.generatedAt ?? new Date()])
  generatedAt.getCell(1).font = { bold: true }
  generatedAt.getCell(2).numFmt = NUM_FMT.datetime
  addKeyValue(ws, 'ゲームデータ', meta.gameVersion)
  if (input.objectiveLabel) addKeyValue(ws, '目的関数', input.objectiveLabel)
  if (input.minerId) {
    addKeyValue(ws, '採掘機', buildingsById.get(input.minerId)?.name.ja ?? input.minerId)
  }

  // 2) 目標産出（最大化した行は要求欄を「最大化」にする）
  addSection(ws, '目標産出')
  addSummaryHeader(ws, ['アイテム', '要求', '産出', '単位'])
  for (const target of solution.targets) {
    const row = ws.addRow([
      itemNameJa(target.item),
      target.maximized ? '最大化' : target.requestedPerMin,
      target.producedPerMin,
      itemUnitJa(target.item),
    ])
    if (!target.maximized) row.getCell(2).numFmt = NUM_FMT.rate
    row.getCell(3).numFmt = NUM_FMT.rate
  }
  if (solution.maximizedOutput) {
    addKeyValue(
      ws,
      `最大産出（${itemNameJa(solution.maximizedOutput.item)}）`,
      solution.maximizedOutput.ratePerMin,
      NUM_FMT.rate,
    )
  }

  // 3) 電力（採掘電力を足した合計も出す）
  const extractionPowerMW = extraction?.totalPowerMW ?? 0
  addSection(ws, '電力 (MW)')
  addKeyValue(ws, '製造（下限）', solution.totalPowerRangeMW.minMW, NUM_FMT.power)
  addKeyValue(ws, '製造（上限）', solution.totalPowerRangeMW.maxMW, NUM_FMT.power)
  addKeyValue(ws, '採掘', extractionPowerMW, NUM_FMT.power)
  addKeyValue(ws, '合計（下限）', solution.totalPowerRangeMW.minMW + extractionPowerMW, NUM_FMT.power)
  addKeyValue(ws, '合計（上限）', solution.totalPowerRangeMW.maxMW + extractionPowerMW, NUM_FMT.power)

  // 3.5) クロックとサマースループ（クロックを適用した実消費電力はこちら）
  addSection(ws, 'クロックとサマースループ')
  addKeyValue(ws, '製造クロック上限', solution.maxClock, NUM_FMT.percent)
  addKeyValue(ws, '採掘クロック', extraction?.clock ?? 1, NUM_FMT.percent)
  addKeyValue(
    ws,
    '製造電力（クロック適用・下限）',
    solution.totalClockedPowerRangeMW.minMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    '製造電力（クロック適用・上限）',
    solution.totalClockedPowerRangeMW.maxMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    '合計電力（クロック適用・下限）',
    solution.totalClockedPowerRangeMW.minMW + extractionPowerMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    '合計電力（クロック適用・上限）',
    solution.totalClockedPowerRangeMW.maxMW + extractionPowerMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    'パワーシャード（個）',
    solution.totalPowerShards + (extraction?.totalPowerShards ?? 0),
    NUM_FMT.int,
  )
  addKeyValue(ws, 'サマースループ 使用数（個）', solution.totalSomersloops, NUM_FMT.int)
  addKeyValue(ws, 'サマースループ 使用可能数（個）', solution.somersloopLimit, NUM_FMT.int)

  // 3.7) 発電計画（発電機を使う設定のときだけ）
  const power = solution.powerGeneration
  if (power) {
    addSection(ws, '発電計画')
    addKeyValue(ws, '総発電量 (MW)', power.totalMW, NUM_FMT.power)
    addKeyValue(ws, '目標発電量 (MW)', power.targetMW, NUM_FMT.power)
    addKeyValue(ws, '工場の消費電力を賄う', power.coverFactoryPower ? 'はい' : 'いいえ')
    addKeyValue(ws, '製造の消費電力（クロック100%換算・MW）', power.factoryPowerMW, NUM_FMT.power)
    addKeyValue(ws, '差引 (MW)', power.netMW, NUM_FMT.power)
    addKeyValue(ws, '発電機（建てる台数）', power.totalGeneratorCount, NUM_FMT.int)
    addKeyValue(ws, '発電機（稼働台数）', power.totalGeneratorMachineCount, NUM_FMT.count)
    addSummaryHeader(ws, ['燃料', '消費レート', '単位'])
    if (power.fuelUsage.length === 0) ws.addRow(['燃料を使っていません'])
    for (const fuel of power.fuelUsage) {
      const row = ws.addRow([itemNameJa(fuel.item), fuel.ratePerMin, itemUnitJa(fuel.item)])
      row.getCell(2).numFmt = NUM_FMT.rate
    }
    ws.addRow(['※ 発電機のクロックは100%固定です。採掘設備の電力は発電計画に含めていません。'])
  }

  // 4) 建物
  addSection(ws, '建物')
  addKeyValue(ws, '稼働台数（小数）', solution.totalMachineCount, NUM_FMT.count)
  addKeyValue(ws, '建てる台数', solution.totalBuildingCount, NUM_FMT.int)
  addKeyValue(ws, '採掘設備台数', extraction?.totalBuildingCount ?? 0, NUM_FMT.int)

  // 4.5) 床面積（概算）
  const footprint = estimateFootprint(solution, extraction)
  addSection(ws, '床面積（概算）')
  addKeyValue(ws, '製造建物の設置面積 (m²)', footprint.manufacturingAreaM2, NUM_FMT.area)
  addKeyValue(ws, '採掘設備の設置面積 (m²)', footprint.extractionAreaM2, NUM_FMT.area)
  addKeyValue(ws, '設置面積の合計 (m²)', footprint.buildingAreaM2, NUM_FMT.area)
  addKeyValue(ws, '通路係数', footprint.aisleFactor, NUM_FMT.amount)
  addKeyValue(ws, '概算床面積 (m²)', footprint.totalAreaM2, NUM_FMT.area)
  addKeyValue(ws, 'ファウンデーション（8m×8m・枚）', footprint.foundations, NUM_FMT.int)
  ws.addRow(['※ 建物のクリアランスから出した概算です。実際の広さは配置によって変わります。'])

  // 5) 必要原料
  addSection(ws, '必要原料')
  addSummaryHeader(ws, ['アイテム', '必要レート', '単位', 'マップ上限', '上限比率'])
  if (solution.rawResources.length === 0) {
    ws.addRow(['原料を使っていません'])
  }
  for (const raw of solution.rawResources) {
    const row = ws.addRow([
      itemNameJa(raw.item),
      raw.ratePerMin,
      itemUnitJa(raw.item),
      raw.limitPerMin ?? '無制限',
      raw.usageRatio ?? PLACEHOLDER,
    ])
    row.getCell(2).numFmt = NUM_FMT.rate
    if (raw.limitPerMin !== null) row.getCell(4).numFmt = NUM_FMT.int
    if (raw.usageRatio !== null) row.getCell(5).numFmt = NUM_FMT.percent
  }

  // 5.5) 既保有アイテムの投入（全量が使われるとは限らないので投入と使用を並べる）
  if (solution.externalInputs.length > 0) {
    addSection(ws, '既保有アイテムの投入')
    addSummaryHeader(ws, ['アイテム', '投入', '使用', '単位'])
    for (const external of solution.externalInputs) {
      const row = ws.addRow([
        itemNameJa(external.item),
        external.availablePerMin,
        external.ratePerMin,
        itemUnitJa(external.item),
      ])
      row.getCell(2).numFmt = NUM_FMT.rate
      row.getCell(3).numFmt = NUM_FMT.rate
    }
  }

  // 6) シンクポイント
  addSection(ws, 'シンクポイント')
  addKeyValue(ws, '合計 (pt/分)', solution.sinkPointsPerMin, NUM_FMT.int)

  // 7) 副産物
  addSection(ws, '副産物')
  if (solution.byproducts.length === 0) {
    ws.addRow(['副産物はありません'])
  } else {
    addSummaryHeader(ws, ['アイテム', 'レート', '単位'])
    for (const byproduct of solution.byproducts) {
      const row = ws.addRow([
        itemNameJa(byproduct.item),
        byproduct.ratePerMin,
        itemUnitJa(byproduct.item),
      ])
      row.getCell(2).numFmt = NUM_FMT.rate
    }
  }

  // 8) 有効な代替レシピ
  addSection(ws, '有効な代替レシピ')
  const alternates = (input.enabledAlternateIds ?? [])
    .map((id) => recipesById.get(id)?.name.ja ?? id)
    .sort((a, b) => a.localeCompare(b, 'ja'))
  if (alternates.length === 0) ws.addRow(['なし'])
  for (const name of alternates) ws.addRow([name])

  autoFitColumns(ws)
}

// ---------------------------------------------------------------------------
// 2. 建物リスト
// ---------------------------------------------------------------------------

function writeBuildingsSheet(workbook: Workbook, input: ExcelExportInput): void {
  const ws = workbook.addWorksheet(SHEET_NAMES.buildings)
  const headers = [
    '機械種別',
    'レシピ',
    '稼働台数',
    '建てる台数',
    'クロック',
    'パワーシャード',
    'サマースループ',
    '消費電力(MW)',
    '電力下限(MW)',
    '電力上限(MW)',
    '発電量(MW)',
    '幅(m)',
    '奥行(m)',
    '高さ(m)',
    '設置面積(m²/台)',
    '設置面積合計(m²)',
    '投入',
    '産出',
  ]
  addHeaderRow(ws, headers)

  // 機械種別グルーピング（画面の生産ステップ表と同じ並び）
  for (const group of groupByBuilding(input.solution.steps)) {
    for (const step of group.steps) {
      // 消費電力はクロックを適用した実値（画面の生産ステップ表と同じ）
      const footprint = buildingsById.get(step.buildingId)?.footprint
      const row = ws.addRow([
        group.buildingNameJa,
        step.recipeName.ja,
        step.machineCount,
        step.builtCount,
        step.clockSpeed,
        step.powerShards,
        step.somersloops,
        step.clockedPowerMW,
        step.clockedPowerRangeMW?.minMW ?? step.clockedPowerMW,
        step.clockedPowerRangeMW?.maxMW ?? step.clockedPowerMW,
        // 発電機の行だけ発電量が入る（製造建物は 0）
        step.powerProductionMW ?? 0,
        footprint?.widthM ?? PLACEHOLDER,
        footprint?.depthM ?? PLACEHOLDER,
        footprint?.heightM ?? PLACEHOLDER,
        footprint?.areaM2 ?? PLACEHOLDER,
        step.footprintAreaM2,
        flowText(step.inputs),
        flowText(step.outputs),
      ])
      row.getCell(3).numFmt = NUM_FMT.count
      row.getCell(4).numFmt = NUM_FMT.int
      row.getCell(5).numFmt = NUM_FMT.percent
      for (const col of [6, 7]) row.getCell(col).numFmt = NUM_FMT.int
      for (const col of [8, 9, 10, 11]) row.getCell(col).numFmt = NUM_FMT.power
      if (footprint) for (const col of [12, 13, 14, 15]) row.getCell(col).numFmt = NUM_FMT.area
      row.getCell(16).numFmt = NUM_FMT.area
    }
  }

  const lastDataRow = ws.rowCount
  finishTable(ws, 1, lastDataRow, headers.length)

  // 合計行はフィルタ範囲の外（フィルタで隠れると読めなくなるため）
  const totals = ws.addRow([
    '合計',
    '',
    input.solution.totalMachineCount,
    input.solution.totalBuildingCount,
    '',
    input.solution.totalPowerShards,
    input.solution.totalSomersloops,
    input.solution.totalClockedPowerMW,
    input.solution.totalClockedPowerRangeMW.minMW,
    input.solution.totalClockedPowerRangeMW.maxMW,
    input.solution.powerGeneration?.totalMW ?? 0,
    '',
    '',
    '',
    '',
    input.solution.totalFootprintAreaM2,
  ])
  totals.font = { bold: true }
  totals.getCell(3).numFmt = NUM_FMT.count
  totals.getCell(4).numFmt = NUM_FMT.int
  for (const col of [6, 7]) totals.getCell(col).numFmt = NUM_FMT.int
  for (const col of [8, 9, 10, 11]) totals.getCell(col).numFmt = NUM_FMT.power
  totals.getCell(16).numFmt = NUM_FMT.area

  autoFitColumns(ws)
}

// ---------------------------------------------------------------------------
// 3. アイテム収支
// ---------------------------------------------------------------------------

function writeBalanceSheet(workbook: Workbook, input: ExcelExportInput): void {
  const ws = workbook.addWorksheet(SHEET_NAMES.balance)
  const headers = ['アイテム', '単位', '産出', '消費', '外部供給', '差分', '状態']
  addHeaderRow(ws, headers)

  const rows = [...input.solution.itemBalance].sort(
    (a, b) =>
      Math.abs(b.netPerMin) - Math.abs(a.netPerMin) ||
      itemNameJa(a.item).localeCompare(itemNameJa(b.item), 'ja'),
  )

  for (const balance of rows) {
    const state =
      balance.netPerMin > ZERO ? '余剰' : balance.netPerMin < -ZERO ? '不足' : '均衡'
    const row = ws.addRow([
      itemNameJa(balance.item),
      itemUnitJa(balance.item),
      balance.producedPerMin,
      balance.consumedPerMin,
      balance.suppliedPerMin,
      balance.netPerMin,
      state,
    ])
    for (const col of [3, 4, 5, 6]) row.getCell(col).numFmt = NUM_FMT.rate

    // 色だけに頼らないよう「状態」列のラベルと必ずセットで塗る（カラーユニバーサル対応）
    if (state !== '均衡') {
      const fill = state === '不足' ? BALANCE_COLORS.shortageFill : BALANCE_COLORS.surplusFill
      const font = state === '不足' ? BALANCE_COLORS.shortageFont : BALANCE_COLORS.surplusFont
      for (const col of [6, 7]) {
        const cell = row.getCell(col)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
        cell.font = { color: { argb: font }, bold: true }
      }
    }
  }

  finishTable(ws, 1, ws.rowCount, headers.length)
  autoFitColumns(ws)
}

// ---------------------------------------------------------------------------
// 4. 原料
// ---------------------------------------------------------------------------

function writeResourcesSheet(workbook: Workbook, input: ExcelExportInput): void {
  const ws = workbook.addWorksheet(SHEET_NAMES.resources)
  const headers = [
    '原料',
    '単位',
    '必要レート',
    'マップ上限',
    '上限比率',
    '採掘設備',
    '稼働台数',
    '建てる台数',
    '純度',
    'ノード数',
    'マップのノード数',
    'ノードあたりレート',
    'このノード群のレート',
    '加圧機(台)',
    'パワーシャード',
    '採掘電力(MW)',
    'ノード不足',
  ]
  addHeaderRow(ws, headers)

  const planByItem = new Map((input.extraction?.resources ?? []).map((r) => [r.item, r]))

  for (const raw of input.solution.rawResources) {
    const plan = planByItem.get(raw.item)
    // 採掘計画が無い原料でも1行は出す（設備列は —）
    const head = [
      itemNameJa(raw.item),
      itemUnitJa(raw.item),
      raw.ratePerMin,
      raw.limitPerMin ?? '無制限',
      raw.usageRatio ?? PLACEHOLDER,
    ]
    const styleHead = (row: Row): void => {
      row.getCell(3).numFmt = NUM_FMT.rate
      if (raw.limitPerMin !== null) row.getCell(4).numFmt = NUM_FMT.int
      if (raw.usageRatio !== null) row.getCell(5).numFmt = NUM_FMT.percent
    }

    if (!plan || plan.groups.length === 0) {
      const row = ws.addRow([
        ...head,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        PLACEHOLDER,
        plan?.powerShards ?? 0,
        plan?.powerMW ?? 0,
        plan?.shortfallPerMin ?? 0,
      ])
      styleHead(row)
      row.getCell(15).numFmt = NUM_FMT.int
      row.getCell(16).numFmt = NUM_FMT.power
      row.getCell(17).numFmt = NUM_FMT.rate
      continue
    }

    for (const group of plan.groups) {
      const assignments = group.assignments.length > 0 ? group.assignments : [null]
      assignments.forEach((assignment, index) => {
        const first = index === 0
        const row = ws.addRow([
          ...head,
          group.extractorName.ja,
          group.machineCount,
          group.buildingCount,
          assignment ? PURITY_JA[assignment.purity] : PLACEHOLDER,
          assignment ? assignment.nodes : PLACEHOLDER,
          assignment
            ? Number.isFinite(assignment.availableNodes)
              ? assignment.availableNodes
              : '制限なし'
            : PLACEHOLDER,
          assignment ? assignment.ratePerNodePerMin : PLACEHOLDER,
          assignment ? assignment.ratePerMin : PLACEHOLDER,
          // 加圧機・シャード・採掘電力は設備グループの先頭行だけ（合計すると二重になるため）
          first ? (group.pressurizerCount ?? 0) : '',
          first ? group.powerShards : '',
          first ? group.powerMW + (group.pressurizerPowerMW ?? 0) : '',
          // ノード不足は原料ごとの値なので、他の原料列と同じく全行に出す
          plan.shortfallPerMin,
        ])
        styleHead(row)
        row.getCell(17).numFmt = NUM_FMT.rate
        row.getCell(7).numFmt = NUM_FMT.count
        row.getCell(8).numFmt = NUM_FMT.int
        if (assignment) {
          row.getCell(10).numFmt = NUM_FMT.count
          if (Number.isFinite(assignment.availableNodes)) row.getCell(11).numFmt = NUM_FMT.int
          row.getCell(12).numFmt = NUM_FMT.rate
          row.getCell(13).numFmt = NUM_FMT.rate
        }
        if (first) {
          row.getCell(14).numFmt = NUM_FMT.int
          row.getCell(15).numFmt = NUM_FMT.int
          row.getCell(16).numFmt = NUM_FMT.power
        }
      })
    }
  }

  finishTable(ws, 1, ws.rowCount, headers.length)
  autoFitColumns(ws)
}

const PURITY_JA = { pure: '高純度', normal: '通常', impure: '低純度' } as const

// ---------------------------------------------------------------------------
// 5. 建設コスト
// ---------------------------------------------------------------------------

function writeBuildCostSheet(workbook: Workbook, input: ExcelExportInput): void {
  const ws = workbook.addWorksheet(SHEET_NAMES.buildCost)
  const headers = ['建材', '製造建物', '採掘設備', '合計']
  addHeaderRow(ws, headers)

  const rows = mergeBuildCost(input.solution, input.extraction)
  let manufacturing = 0
  let extraction = 0
  let total = 0
  for (const cost of rows) {
    const row = ws.addRow([itemNameJa(cost.item), cost.manufacturing, cost.extraction, cost.total])
    for (const col of [2, 3, 4]) row.getCell(col).numFmt = NUM_FMT.amount
    manufacturing += cost.manufacturing
    extraction += cost.extraction
    total += cost.total
  }

  finishTable(ws, 1, ws.rowCount, headers.length)

  const totals = ws.addRow(['合計', manufacturing, extraction, total])
  totals.font = { bold: true }
  for (const col of [2, 3, 4]) totals.getCell(col).numFmt = NUM_FMT.amount

  autoFitColumns(ws)
}

// ---------------------------------------------------------------------------
// 6. 物流
// ---------------------------------------------------------------------------

function writeLogisticsSheet(workbook: Workbook, input: ExcelExportInput): void {
  const ws = workbook.addWorksheet(SHEET_NAMES.logistics)
  const headers = [
    '区分',
    'レシピ',
    '機械',
    'アイテム',
    '形態',
    'レート',
    '単位',
    '搬送',
    '搬送手段',
    '1本あたり上限',
    '必要本数',
    '使用率',
  ]
  addHeaderRow(ws, headers)

  // 搬送手段の解決とフローの列挙はフローチャートと共有する（src/plan/flows.ts）。
  // ここで独自に列挙すると、グラフのエッジと物流シートの行がズレる。
  const resolved = resolveTransportChoice({ beltId: input.beltId, pipeId: input.pipeId })

  for (const flow of enumeratePlanFlows(input.solution)) {
    const { kind: transport, requirement } = flowTransport(flow.item, flow.ratePerMin, resolved)
    const row = ws.addRow([
      flow.kind,
      flow.step?.recipeName.ja ?? PLACEHOLDER,
      flow.step?.buildingName.ja ?? PLACEHOLDER,
      itemNameJa(flow.item),
      itemFormJa(flow.item),
      flow.ratePerMin,
      itemUnitJa(flow.item),
      transport === 'belt' ? 'ベルト' : 'パイプ',
      requirement.nameJa,
      requirement.capacityPerMin,
      requirement.lines,
      requirement.utilization,
    ])
    row.getCell(6).numFmt = NUM_FMT.rate
    row.getCell(10).numFmt = NUM_FMT.rate
    row.getCell(11).numFmt = NUM_FMT.int
    row.getCell(12).numFmt = NUM_FMT.percent
  }

  finishTable(ws, 1, ws.rowCount, headers.length)
  autoFitColumns(ws)
}

// ---------------------------------------------------------------------------
// 共通ヘルパー
// ---------------------------------------------------------------------------

const itemNameJa = (id: string): string => itemsById.get(id)?.name.ja ?? id

const itemUnitJa = (id: string): string =>
  itemsById.get(id)?.form === 'solid' ? '個/分' : 'm³/min'

function itemFormJa(id: string): string {
  switch (itemsById.get(id)?.form) {
    case 'liquid':
      return '液体'
    case 'gas':
      return '気体'
    default:
      return '固体'
  }
}

/** 「鉄のインゴット 105.00 個/分 / 水 30.00 m³/min」 */
function flowText(flows: readonly ItemRate[]): string {
  return flows
    .map((f) => `${itemNameJa(f.item)} ${f.ratePerMin.toFixed(2)} ${itemUnitJa(f.item)}`)
    .join(' / ')
}

function addHeaderRow(ws: Worksheet, headers: readonly string[]): Row {
  const row = ws.addRow([...headers])
  row.font = { bold: true }
  row.alignment = { vertical: 'middle', wrapText: false }
  for (let col = 1; col <= headers.length; col += 1) {
    const cell = row.getCell(col)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = { bottom: { style: 'thin', color: { argb: HEADER_BORDER } } }
  }
  return row
}

/** ヘッダー行の固定＋オートフィルタ。合計行は lastDataRow に含めない。 */
function finishTable(
  ws: Worksheet,
  headerRow: number,
  lastDataRow: number,
  lastColumn: number,
): void {
  ws.views = [{ state: 'frozen', ySplit: headerRow }]
  ws.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: Math.max(lastDataRow, headerRow), column: lastColumn },
  }
}

/** サマリー内の小見出し（前に空行を1つ入れる）。 */
function addSection(ws: Worksheet, title: string): void {
  ws.addRow([])
  const row = ws.addRow([title])
  row.getCell(1).font = { bold: true, size: 12 }
}

function addSummaryHeader(ws: Worksheet, headers: readonly string[]): void {
  const row = ws.addRow([...headers])
  for (let col = 1; col <= headers.length; col += 1) {
    const cell = row.getCell(col)
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  }
}

function addKeyValue(ws: Worksheet, label: string, value: string | number, numFmt?: string): void {
  const row = ws.addRow([label, value])
  row.getCell(1).font = { bold: true }
  if (numFmt) row.getCell(2).numFmt = numFmt
}

/**
 * 列幅の自動調整。全角を2、半角を1として数え、8〜48 文字の範囲に収める。
 * 数値セルは numFmt どおりの桁数で見えるので、小数4位まで見た文字数で概算する。
 */
function autoFitColumns(ws: Worksheet): void {
  ws.columns.forEach((column) => {
    let width = 0
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      width = Math.max(width, displayWidth(cellText(cell.value)))
    })
    column.width = Math.min(48, Math.max(8, width + 2))
  })
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return value.toLocaleString('ja-JP', { maximumFractionDigits: 4 })
  }
  if (value instanceof Date) return '0000/00/00 00:00'
  return String(value)
}

function displayWidth(text: string): number {
  let width = 0
  for (const char of text) {
    width += (char.codePointAt(0) ?? 0) > 0x7f ? 2 : 1
  }
  return width
}

/**
 * ファイル名に使えない文字（Windows/macOS 共通の禁止文字）・制御文字・空白を `_` に潰す。
 * 空になったら 'plan'。長すぎるファイル名も嫌なので48文字で切る。
 */
function sanitizePlanName(planName: string | undefined): string {
  const cleaned = (planName ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  return cleaned.length > 0 ? cleaned : 'plan'
}

function yyyymmdd(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}
