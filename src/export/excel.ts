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
 * - アイテム名・レシピ名は出力ロケールの公式名を使う。
 * - 表シートは必ず「ヘッダー行の固定＋オートフィルタ＋列幅自動調整」。
 *   合計行はフィルタ範囲の外に出す（フィルタで消えると合計が読めなくなるため）。
 * - 集計は src/plan/aggregate.ts と共有する（画面と数字がズレないように）。
 * - Node（vitest）とブラウザの両方で動く。分岐するのはファイル保存だけ。
 */
// exceljs は CJS。名前付き import は素の Node ESM で解決できない環境があるので
// 既定 import（= module.exports）から取り出す。型は名前付きの型 import で付ける。
import ExcelJS from 'exceljs'
import type { Row, Workbook, Worksheet } from 'exceljs'

import {
  buildingsById,
  createDisplayName,
  extractorsById,
  itemsById,
  meta,
  recipesById,
} from '../data/index.ts'
import type { DisplayNameResolver, GameNamePack } from '../data/index.ts'
import { getDictionary, resolveText } from '../i18n/index.ts'
import type { Locale, UiDictionary } from '../i18n/types.ts'
import { estimateFootprint, groupByBuilding, mergeBuildCost } from '../plan/aggregate.ts'
import { enumeratePlanFlows, flowTransport, resolveTransportChoice } from '../plan/flows.ts'
import type { ExtractionPlan, ItemRate, Solution } from '../solver/index.ts'

// ---------------------------------------------------------------------------
// 公開型
// ---------------------------------------------------------------------------

export type ExcelExportInput = {
  solution: Solution
  extraction: ExtractionPlan | null
  /** Workbook UI locale. Defaults to Japanese for backward compatibility. */
  locale?: Locale
  /**
   * Official names of `locale` for the Tier-2 languages, which keep their names in a lazily
   * loaded pack instead of the bundled data. Omitting it falls the names back to English while
   * the labels stay translated (計画書 §4.2).
   */
  namePack?: GameNamePack
  /** プラン名。空なら 'plan' */
  planName?: string
  /** 物流シートで使うベルト（Belt.id）。既定は最速 */
  beltId?: string
  /** 物流シートで使うパイプ（Pipe.id）。既定は最速 */
  pipeId?: string
  /** 目的関数の表示名（サマリーに出す） */
  objectiveLabel?: string
  /** 目的関数の安定 ID（ロケール別ラベルは出力時に解決する） */
  objectiveId?: 'resources' | 'power' | 'buildings'
  /** 有効にした代替レシピの Recipe.id 一覧 */
  enabledAlternateIds?: readonly string[]
  /** 固体ノードの採掘機 Building.id（サマリーに出す） */
  minerId?: string
  /** 生成日時。既定 new Date()（テストから固定できるように） */
  generatedAt?: Date
}

/** Japanese sheet names retained as the backward-compatible public constants. */
export const SHEET_NAMES = getDictionary('ja').excel.sheets

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
type BalanceState = 'surplus' | 'shortage' | 'balanced'
type ExcelText = UiDictionary['excel']

type ExcelContext = {
  numberLocale: string
  dictionary: UiDictionary
  t: ExcelText
  displayName: DisplayNameResolver
  collator: Intl.Collator
  fixedRate: Intl.NumberFormat
  text: (value: string) => string
}

/**
 * 数値表示（セルの表示形式ではなく、文字列として書く桁区切り）に使う BCP-47 タグ。
 * ja/en は既存の出力を変えないため従来のタグを保つ。Tier 2 は識別子がそのまま
 * 妥当な BCP-47（`pt-BR` / `zh-Hans` など）なので Intl にそのまま渡せる。
 */
function numberLocaleFor(locale: Locale): string {
  if (locale === 'ja') return 'ja-JP'
  if (locale === 'en') return 'en-US'
  return locale
}

function createExcelContext(locale: Locale = 'ja', pack?: GameNamePack): ExcelContext {
  const dictionary = getDictionary(locale)
  const displayName = createDisplayName(locale, pack)
  const numberLocale = numberLocaleFor(locale)
  return {
    numberLocale,
    dictionary,
    t: dictionary.excel,
    displayName,
    collator: new Intl.Collator(numberLocale),
    fixedRate: new Intl.NumberFormat(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    text: (value) => resolveText(value, locale, pack),
  }
}

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
  const context = createExcelContext(input.locale, input.namePack)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = context.text(context.t.creator)
  workbook.created = input.generatedAt ?? new Date()
  workbook.modified = workbook.created

  writeSummarySheet(workbook, input, context)
  writeBuildingsSheet(workbook, input, context)
  writeBalanceSheet(workbook, input, context)
  writeResourcesSheet(workbook, input, context)
  writeBuildCostSheet(workbook, input, context)
  writeLogisticsSheet(workbook, input, context)

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
  const context = createExcelContext(input.locale, input.namePack)
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error(context.text(context.t.browserOnlyError))
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

function writeSummarySheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { solution, extraction } = input
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.summary)
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const title = ws.addRow([context.text(t.title)])
  title.getCell(1).font = { bold: true, size: 14 }

  // 1) 見出しブロック
  addKeyValue(ws, t.common.planName, input.planName?.trim() || 'plan')
  const generatedAt = ws.addRow([t.common.generatedAt, input.generatedAt ?? new Date()])
  generatedAt.getCell(1).font = { bold: true }
  generatedAt.getCell(2).numFmt = NUM_FMT.datetime
  addKeyValue(ws, t.common.gameData, meta.gameVersion)
  const objectiveLabel =
    input.objectiveLabel ??
    (input.objectiveId ? context.dictionary.objectives[input.objectiveId].label : undefined)
  if (objectiveLabel) addKeyValue(ws, t.common.objective, context.text(objectiveLabel))
  if (input.minerId) {
    addKeyValue(
      ws,
      t.common.miner,
      context.displayName(buildingsById.get(input.minerId) ?? input.minerId),
    )
  }

  // 2) 目標産出（最大化した行は要求欄を「最大化」にする）
  addSection(ws, t.summary.targetOutput)
  addSummaryHeader(ws, [t.common.item, t.common.requested, t.common.produced, t.common.unit])
  for (const target of solution.targets) {
    const row = ws.addRow([
      itemName(target.item, context),
      target.maximized ? t.summary.maximized : target.requestedPerMin,
      target.producedPerMin,
      itemUnit(target.item, context),
    ])
    if (!target.maximized) row.getCell(2).numFmt = NUM_FMT.rate
    row.getCell(3).numFmt = NUM_FMT.rate
  }
  if (solution.maximizedOutput) {
    addKeyValue(
      ws,
      t.summary.maximumOutput(itemName(solution.maximizedOutput.item, context)),
      solution.maximizedOutput.ratePerMin,
      NUM_FMT.rate,
    )
  }

  // 3) 電力（採掘電力を足した合計も出す）
  const extractionPowerMW = extraction?.totalPowerMW ?? 0
  addSection(ws, t.summary.power)
  addKeyValue(ws, t.summary.manufacturingMin, solution.totalPowerRangeMW.minMW, NUM_FMT.power)
  addKeyValue(ws, t.summary.manufacturingMax, solution.totalPowerRangeMW.maxMW, NUM_FMT.power)
  addKeyValue(ws, t.summary.extraction, extractionPowerMW, NUM_FMT.power)
  addKeyValue(
    ws,
    t.summary.totalMin,
    solution.totalPowerRangeMW.minMW + extractionPowerMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    t.summary.totalMax,
    solution.totalPowerRangeMW.maxMW + extractionPowerMW,
    NUM_FMT.power,
  )

  // 3.5) クロックとサマースループ（クロックを適用した実消費電力はこちら）
  addSection(ws, context.text(t.summary.clockAndSomersloop))
  addKeyValue(ws, t.summary.manufacturingClockMax, solution.maxClock, NUM_FMT.percent)
  addKeyValue(ws, t.summary.extractionClock, extraction?.clock ?? 1, NUM_FMT.percent)
  addKeyValue(
    ws,
    t.summary.clockedManufacturingMin,
    solution.totalClockedPowerRangeMW.minMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    t.summary.clockedManufacturingMax,
    solution.totalClockedPowerRangeMW.maxMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    t.summary.clockedTotalMin,
    solution.totalClockedPowerRangeMW.minMW + extractionPowerMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    t.summary.clockedTotalMax,
    solution.totalClockedPowerRangeMW.maxMW + extractionPowerMW,
    NUM_FMT.power,
  )
  addKeyValue(
    ws,
    context.text(t.summary.powerShards),
    solution.totalPowerShards + (extraction?.totalPowerShards ?? 0),
    NUM_FMT.int,
  )
  addKeyValue(
    ws,
    context.text(t.summary.somersloopsUsed),
    solution.totalSomersloops,
    NUM_FMT.int,
  )
  addKeyValue(
    ws,
    context.text(t.summary.somersloopsAvailable),
    solution.somersloopLimit,
    NUM_FMT.int,
  )

  // 3.7) 発電計画（発電機を使う設定のときだけ）
  const power = solution.powerGeneration
  if (power) {
    addSection(ws, t.summary.powerPlan)
    addKeyValue(ws, t.summary.totalGeneration, power.totalMW, NUM_FMT.power)
    addKeyValue(ws, t.summary.generationTarget, power.targetMW, NUM_FMT.power)
    addKeyValue(ws, t.summary.coverFactory, power.coverFactoryPower ? t.common.yes : t.common.no)
    addKeyValue(ws, t.summary.factoryConsumption, power.factoryPowerMW, NUM_FMT.power)
    addKeyValue(ws, t.summary.netPower, power.netMW, NUM_FMT.power)
    addKeyValue(ws, t.summary.generatorsBuilt, power.totalGeneratorCount, NUM_FMT.int)
    addKeyValue(ws, t.summary.generatorsRunning, power.totalGeneratorMachineCount, NUM_FMT.count)
    addSummaryHeader(ws, [t.common.fuel, t.summary.fuelRate, t.common.unit])
    if (power.fuelUsage.length === 0) ws.addRow([t.summary.noFuel])
    for (const fuel of power.fuelUsage) {
      const row = ws.addRow([
        itemName(fuel.item, context),
        fuel.ratePerMin,
        itemUnit(fuel.item, context),
      ])
      row.getCell(2).numFmt = NUM_FMT.rate
    }
    ws.addRow([t.summary.powerNote])
  }

  // 4) 建物
  addSection(ws, t.common.building)
  addKeyValue(ws, t.summary.runningMachines, solution.totalMachineCount, NUM_FMT.count)
  addKeyValue(ws, t.summary.builtMachines, solution.totalBuildingCount, NUM_FMT.int)
  addKeyValue(ws, t.summary.extractorCount, extraction?.totalBuildingCount ?? 0, NUM_FMT.int)

  // 4.5) 床面積（概算）
  const footprint = estimateFootprint(solution, extraction)
  addSection(ws, t.summary.footprint)
  addKeyValue(ws, t.summary.manufacturingArea, footprint.manufacturingAreaM2, NUM_FMT.area)
  addKeyValue(ws, t.summary.extractionArea, footprint.extractionAreaM2, NUM_FMT.area)
  addKeyValue(ws, t.summary.buildingArea, footprint.buildingAreaM2, NUM_FMT.area)
  addKeyValue(ws, t.summary.aisleFactor, footprint.aisleFactor, NUM_FMT.amount)
  addKeyValue(ws, t.summary.estimatedArea, footprint.totalAreaM2, NUM_FMT.area)
  addKeyValue(ws, t.summary.foundations, footprint.foundations, NUM_FMT.int)
  ws.addRow([t.summary.footprintNote])

  // 5) 必要原料
  addSection(ws, t.summary.requiredResources)
  addSummaryHeader(ws, [
    t.common.item,
    t.summary.requiredRate,
    t.common.unit,
    t.summary.mapLimit,
    t.summary.limitRatio,
  ])
  if (solution.rawResources.length === 0) {
    ws.addRow([t.summary.noResources])
  }
  for (const raw of solution.rawResources) {
    const row = ws.addRow([
      itemName(raw.item, context),
      raw.ratePerMin,
      itemUnit(raw.item, context),
      raw.limitPerMin ?? t.common.unlimited,
      raw.usageRatio ?? PLACEHOLDER,
    ])
    row.getCell(2).numFmt = NUM_FMT.rate
    if (raw.limitPerMin !== null) row.getCell(4).numFmt = NUM_FMT.int
    if (raw.usageRatio !== null) row.getCell(5).numFmt = NUM_FMT.percent
  }

  // 5.5) 既保有アイテムの投入（全量が使われるとは限らないので投入と使用を並べる）
  if (solution.externalInputs.length > 0) {
    addSection(ws, t.summary.externalInputs)
    addSummaryHeader(ws, [t.common.item, t.common.input, t.common.used, t.common.unit])
    for (const external of solution.externalInputs) {
      const row = ws.addRow([
        itemName(external.item, context),
        external.availablePerMin,
        external.ratePerMin,
        itemUnit(external.item, context),
      ])
      row.getCell(2).numFmt = NUM_FMT.rate
      row.getCell(3).numFmt = NUM_FMT.rate
    }
  }

  // 6) シンクポイント
  addSection(ws, t.summary.sinkPoints)
  addKeyValue(ws, t.summary.sinkPointsTotal, solution.sinkPointsPerMin, NUM_FMT.int)

  // 7) 副産物
  addSection(ws, t.summary.byproducts)
  if (solution.byproducts.length === 0) {
    ws.addRow([t.summary.noByproducts])
  } else {
    addSummaryHeader(ws, [t.common.item, t.common.rate, t.common.unit])
    for (const byproduct of solution.byproducts) {
      const row = ws.addRow([
        itemName(byproduct.item, context),
        byproduct.ratePerMin,
        itemUnit(byproduct.item, context),
      ])
      row.getCell(2).numFmt = NUM_FMT.rate
    }
  }

  // 8) 有効な代替レシピ
  addSection(ws, t.summary.enabledAlternates)
  const alternates = (input.enabledAlternateIds ?? [])
    .map((id) => context.displayName(recipesById.get(id) ?? id))
    .sort(context.collator.compare)
  if (alternates.length === 0) ws.addRow([t.common.none])
  for (const name of alternates) ws.addRow([name])

  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 2. 建物リスト
// ---------------------------------------------------------------------------

function writeBuildingsSheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.buildings)
  const headers = [
    t.buildings.machineType,
    t.common.recipe,
    t.buildings.running,
    t.buildings.built,
    t.buildings.clock,
    context.text(t.buildings.powerShards),
    context.text(t.buildings.somersloops),
    t.buildings.power,
    t.buildings.powerMin,
    t.buildings.powerMax,
    t.buildings.generation,
    t.buildings.width,
    t.buildings.depth,
    t.buildings.height,
    t.buildings.areaPerBuilding,
    t.buildings.totalArea,
    t.common.input,
    t.common.produced,
  ]
  addHeaderRow(ws, headers)

  // 機械種別グルーピング（画面の生産ステップ表と同じ並び）
  for (const group of groupByBuilding(input.solution.steps)) {
    for (const step of group.steps) {
      // 消費電力はクロックを適用した実値（画面の生産ステップ表と同じ）
      const footprint = buildingsById.get(step.buildingId)?.footprint
      const row = ws.addRow([
        // ID から引くと Tier 2 の公式名パックで解決できる（表示名だけの値では id が無く en に落ちる）
        context.displayName(buildingsById.get(group.buildingId) ?? group.buildingName),
        context.displayName(recipesById.get(step.recipeId) ?? step.recipeName),
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
        flowText(step.inputs, context),
        flowText(step.outputs, context),
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
    t.common.total,
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

  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 3. アイテム収支
// ---------------------------------------------------------------------------

function writeBalanceSheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.balance)
  const headers = [
    t.common.item,
    t.common.unit,
    t.common.produced,
    t.common.consumed,
    t.balance.externalSupply,
    t.balance.net,
    t.balance.state,
  ]
  addHeaderRow(ws, headers)

  const rows = [...input.solution.itemBalance].sort(
    (a, b) =>
      Math.abs(b.netPerMin) - Math.abs(a.netPerMin) ||
      context.collator.compare(itemName(a.item, context), itemName(b.item, context)),
  )

  for (const balance of rows) {
    const state: BalanceState =
      balance.netPerMin > ZERO
        ? 'surplus'
        : balance.netPerMin < -ZERO
          ? 'shortage'
          : 'balanced'
    const row = ws.addRow([
      itemName(balance.item, context),
      itemUnit(balance.item, context),
      balance.producedPerMin,
      balance.consumedPerMin,
      balance.suppliedPerMin,
      balance.netPerMin,
      t.balance[state],
    ])
    for (const col of [3, 4, 5, 6]) row.getCell(col).numFmt = NUM_FMT.rate

    // 色だけに頼らないよう「状態」列のラベルと必ずセットで塗る（カラーユニバーサル対応）
    if (state !== 'balanced') {
      const fill =
        state === 'shortage' ? BALANCE_COLORS.shortageFill : BALANCE_COLORS.surplusFill
      const font =
        state === 'shortage' ? BALANCE_COLORS.shortageFont : BALANCE_COLORS.surplusFont
      for (const col of [6, 7]) {
        const cell = row.getCell(col)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
        cell.font = { color: { argb: font }, bold: true }
      }
    }
  }

  finishTable(ws, 1, ws.rowCount, headers.length)
  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 4. 原料
// ---------------------------------------------------------------------------

function writeResourcesSheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.resources)
  const headers = [
    t.resources.resource,
    t.common.unit,
    t.resources.requiredRate,
    t.resources.mapLimit,
    t.resources.limitRatio,
    t.resources.extractor,
    t.resources.running,
    t.resources.built,
    t.resources.purity,
    t.resources.nodes,
    t.resources.mapNodes,
    t.resources.ratePerNode,
    t.resources.groupRate,
    context.text(t.resources.pressurizers),
    context.text(t.resources.powerShards),
    t.resources.extractionPower,
    t.resources.nodeShortfall,
  ]
  addHeaderRow(ws, headers)

  const planByItem = new Map((input.extraction?.resources ?? []).map((r) => [r.item, r]))

  for (const raw of input.solution.rawResources) {
    const plan = planByItem.get(raw.item)
    // 採掘計画が無い原料でも1行は出す（設備列は —）
    const head = [
      itemName(raw.item, context),
      itemUnit(raw.item, context),
      raw.ratePerMin,
      raw.limitPerMin ?? t.common.unlimited,
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
          context.displayName(extractorsById.get(group.extractorId) ?? group.extractorName),
          group.machineCount,
          group.buildingCount,
          assignment ? t.resources[assignment.purity] : PLACEHOLDER,
          assignment ? assignment.nodes : PLACEHOLDER,
          assignment
            ? Number.isFinite(assignment.availableNodes)
              ? assignment.availableNodes
              : t.common.noLimit
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
  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 5. 建設コスト
// ---------------------------------------------------------------------------

function writeBuildCostSheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.buildCost)
  const headers = [
    t.buildCost.material,
    t.buildCost.manufacturing,
    t.buildCost.extraction,
    t.common.total,
  ]
  addHeaderRow(ws, headers)

  const rows = mergeBuildCost(input.solution, input.extraction)
  let manufacturing = 0
  let extraction = 0
  let total = 0
  for (const cost of rows) {
    const row = ws.addRow([
      itemName(cost.item, context),
      cost.manufacturing,
      cost.extraction,
      cost.total,
    ])
    for (const col of [2, 3, 4]) row.getCell(col).numFmt = NUM_FMT.amount
    manufacturing += cost.manufacturing
    extraction += cost.extraction
    total += cost.total
  }

  finishTable(ws, 1, ws.rowCount, headers.length)

  const totals = ws.addRow([t.common.total, manufacturing, extraction, total])
  totals.font = { bold: true }
  for (const col of [2, 3, 4]) totals.getCell(col).numFmt = NUM_FMT.amount

  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 6. 物流
// ---------------------------------------------------------------------------

function writeLogisticsSheet(
  workbook: Workbook,
  input: ExcelExportInput,
  context: ExcelContext,
): void {
  const { t } = context
  const ws = workbook.addWorksheet(t.sheets.logistics)
  const headers = [
    t.logistics.kind,
    t.common.recipe,
    t.common.machine,
    t.common.item,
    t.logistics.form,
    t.common.rate,
    t.common.unit,
    t.logistics.transport,
    t.logistics.transportMethod,
    t.logistics.capacity,
    t.logistics.lines,
    t.logistics.utilization,
  ]
  addHeaderRow(ws, headers)

  // 搬送手段の解決とフローの列挙はフローチャートと共有する（src/plan/flows.ts）。
  // ここで独自に列挙すると、グラフのエッジと物流シートの行がズレる。
  const resolved = resolveTransportChoice({ beltId: input.beltId, pipeId: input.pipeId })

  for (const flow of enumeratePlanFlows(input.solution)) {
    const { kind: transport, requirement } = flowTransport(flow.item, flow.ratePerMin, resolved)
    const row = ws.addRow([
      t.logistics[flow.kind],
      flow.step
        ? context.displayName(recipesById.get(flow.step.recipeId) ?? flow.step.recipeName)
        : PLACEHOLDER,
      flow.step
        ? context.displayName(buildingsById.get(flow.step.buildingId) ?? flow.step.buildingName)
        : PLACEHOLDER,
      itemName(flow.item, context),
      itemFormLabel(flow.item, context),
      flow.ratePerMin,
      itemUnit(flow.item, context),
      transport === 'belt' ? t.common.belt : t.common.pipe,
      context.displayName(requirement),
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
  autoFitColumns(ws, context)
}

// ---------------------------------------------------------------------------
// 共通ヘルパー
// ---------------------------------------------------------------------------

const itemName = (id: string, context: ExcelContext): string =>
  context.displayName(itemsById.get(id) ?? id)

const itemUnit = (id: string, context: ExcelContext): string =>
  itemsById.get(id)?.form === 'solid'
    ? context.dictionary.units.solidPerMinute
    : context.dictionary.units.fluidPerMinute

function itemFormLabel(id: string, context: ExcelContext): string {
  switch (itemsById.get(id)?.form) {
    case 'liquid':
      return context.t.common.liquid
    case 'gas':
      return context.t.common.gas
    default:
      return context.t.common.solid
  }
}

/** 「鉄のインゴット 105.00 個/分 / 水 30.00 m³/min」 */
function flowText(flows: readonly ItemRate[], context: ExcelContext): string {
  return flows
    .map(
      (flow) =>
        `${itemName(flow.item, context)} ${context.fixedRate.format(flow.ratePerMin)} ${itemUnit(flow.item, context)}`,
    )
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
function autoFitColumns(ws: Worksheet, context: ExcelContext): void {
  ws.columns.forEach((column) => {
    let width = 0
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      width = Math.max(width, displayWidth(cellText(cell.value, context)))
    })
    column.width = Math.min(48, Math.max(8, width + 2))
  })
}

function cellText(value: unknown, context: ExcelContext): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return value.toLocaleString(context.numberLocale, { maximumFractionDigits: 4 })
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
