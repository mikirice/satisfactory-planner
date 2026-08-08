/**
 * Excel 出力の検証（仕様書 v1 §8）。
 *
 * 生成した workbook を **一度 .xlsx にシリアライズしてから ExcelJS で読み戻し**、
 * シート構成・主要セルの値・書式（固定行 / フィルタ / 表示形式 / 塗り）を確認する。
 * メモリ上のオブジェクトだけを見ると、実ファイルに落ちない設定を見逃すため。
 */
import ExcelJS from 'exceljs'
import type { Worksheet } from 'exceljs'
import { beforeAll, describe, expect, it } from 'vitest'

import { recipes } from '../src/data/index.ts'
import {
  BALANCE_COLORS,
  NUM_FMT,
  SHEET_NAMES,
  SHEET_NAME_LIST,
  buildPlanWorkbook,
  downloadPlanWorkbook,
  planFileName,
  planWorkbookBuffer,
} from '../src/export/excel.ts'
import type { ExcelExportInput } from '../src/export/excel.ts'
import { linesRequired, planExtraction, solveProduction } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'

const ALL_RECIPES = recipes.map((r) => r.id)
const GENERATED_AT = new Date(2026, 7, 7, 12, 34)

/** 読み戻した workbook と、元の解をまとめて持つ。 */
type Case = {
  solution: Solution
  input: ExcelExportInput
  workbook: ExcelJS.Workbook
}

async function makeCase(
  input: Omit<ExcelExportInput, 'solution' | 'extraction'> & { solution: Solution },
): Promise<Case> {
  const full: ExcelExportInput = {
    ...input,
    extraction: planExtraction(input.solution),
    generatedAt: GENERATED_AT,
  }
  const buffer = await planWorkbookBuffer(full)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return { solution: input.solution, input: full, workbook }
}

async function solveOk(...args: Parameters<typeof solveProduction>): Promise<Solution> {
  const result = await solveProduction(...args)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

/** ヘッダー名 → 列番号 */
function columns(sheet: Worksheet): Map<string, number> {
  const map = new Map<string, number>()
  const header = sheet.getRow(1)
  for (let col = 1; col <= header.cellCount; col += 1) {
    const value = header.getCell(col).value
    if (typeof value === 'string') map.set(value, col)
  }
  return map
}

/** 指定列が値と一致する最初の行。 */
function findRow(sheet: Worksheet, column: number, value: string): ExcelJS.Row | undefined {
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    if (sheet.getRow(r).getCell(column).value === value) return sheet.getRow(r)
  }
  return undefined
}

function fillArgb(cell: ExcelJS.Cell): string | undefined {
  const fill = cell.fill as { fgColor?: { argb?: string } } | undefined
  return fill?.fgColor?.argb
}

let ironPlate: Case
let plastic: Case

beforeAll(async () => {
  // A: 鉄板 60/min（基本レシピのみ）
  ironPlate = await makeCase({
    solution: await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] }),
    planName: '鉄板ライン',
    objectiveLabel: '資源効率',
    minerId: 'Build_MinerMk3_C',
    enabledAlternateIds: [],
  })

  // B: プラスチック 300/min（代替レシピ全開放 = リサイクル系の循環が入る）
  plastic = await makeCase({
    solution: await solveOk({
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 300 }],
      enabledRecipes: ALL_RECIPES,
    }),
    planName: '循環プラスチック',
    objectiveLabel: '資源効率',
    enabledAlternateIds: recipes.filter((r) => r.isAlternate).map((r) => r.id),
  })
}, 60_000)

describe('ワークブックの構成', () => {
  it('6シートが仕様書の順で並ぶ（両ケース）', () => {
    for (const target of [ironPlate, plastic]) {
      expect(target.workbook.worksheets.map((w) => w.name)).toEqual([...SHEET_NAME_LIST])
    }
  })

  it('表シートはヘッダー行が固定され、オートフィルタが付く', () => {
    for (const target of [ironPlate, plastic]) {
      for (const name of SHEET_NAME_LIST) {
        const sheet = target.workbook.getWorksheet(name)!
        expect(sheet.views[0]?.state, name).toBe('frozen')
        if (name === SHEET_NAMES.summary) {
          // サマリーは1枚の表ではないのでフィルタを付けない
          expect(sheet.autoFilter, name).toBeFalsy()
        } else {
          expect(sheet.autoFilter, name).toBeTruthy()
        }
      }
    }
  })

  it('合計行はオートフィルタの範囲外に置く', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.buildings)!
    const filter = sheet.autoFilter as string
    const lastFilteredRow = Number(/\d+$/.exec(filter)![0])
    expect(sheet.getRow(lastFilteredRow + 1).getCell(1).value).toBe('合計')
  })
})

describe('建物リスト', () => {
  it('鉄板のレシピ行が稼働台数を数値セルで持つ', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.buildings)!
    const col = columns(sheet)
    const row = findRow(sheet, col.get('レシピ')!, '鉄板')!
    const step = ironPlate.solution.steps.find((s) => s.recipeName.ja === '鉄板')!

    const machineCell = row.getCell(col.get('稼働台数')!)
    expect(machineCell.type).toBe(ExcelJS.ValueType.Number)
    expect(machineCell.value).toBeCloseTo(step.machineCount, 6)
    expect(row.getCell(col.get('機械種別')!).value).toBe('製作機')
    expect(row.getCell(col.get('建てる台数')!).value).toBe(3)
    expect(row.getCell(col.get('消費電力(MW)')!).value).toBeCloseTo(step.powerMW, 6)
    expect(row.getCell(col.get('産出')!).value).toBe('鉄板 60.00 個/分')
  })

  it('台数は小数4位・レートと電力は小数2位の表示形式', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.buildings)!
    const col = columns(sheet)
    const row = findRow(sheet, col.get('レシピ')!, '鉄板')!
    expect(row.getCell(col.get('稼働台数')!).numFmt).toBe(NUM_FMT.count)
    expect(row.getCell(col.get('消費電力(MW)')!).numFmt).toBe(NUM_FMT.power)
    expect(row.getCell(col.get('クロック')!).numFmt).toBe(NUM_FMT.percent)
    expect(row.getCell(col.get('建てる台数')!).numFmt).toBe(NUM_FMT.int)
  })

  it('合計行が解の総台数・総電力と一致する', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.buildings)!
    const total = findRow(sheet, 1, '合計')!
    expect(total.getCell(3).value).toBeCloseTo(ironPlate.solution.totalMachineCount, 6)
    expect(total.getCell(4).value).toBe(ironPlate.solution.totalBuildingCount)
    expect(total.getCell(6).value).toBeCloseTo(ironPlate.solution.totalPowerMW, 6)
  })
})

describe('アイテム収支', () => {
  it('余剰・不足・均衡がラベルと塗りの両方で分かる', () => {
    const sheet = plastic.workbook.getWorksheet(SHEET_NAMES.balance)!
    const col = columns(sheet)
    const states = new Set<unknown>()
    for (let r = 2; r <= sheet.rowCount; r += 1) {
      states.add(sheet.getRow(r).getCell(col.get('状態')!).value)
    }
    expect(states.has('余剰')).toBe(true)
    expect(states.has('均衡')).toBe(true)

    const surplus = findRow(sheet, col.get('状態')!, '余剰')!
    expect(fillArgb(surplus.getCell(col.get('差分')!))).toBe(BALANCE_COLORS.surplusFill)
    expect(fillArgb(surplus.getCell(col.get('状態')!))).toBe(BALANCE_COLORS.surplusFill)
    expect(surplus.getCell(col.get('差分')!).type).toBe(ExcelJS.ValueType.Number)
  })

  it('不足行は赤系で塗られる', async () => {
    // 解には不足が出ないので、不足のある収支を持つ解を組み立てて確認する
    const solution: Solution = {
      ...ironPlate.solution,
      itemBalance: [
        ...ironPlate.solution.itemBalance,
        {
          item: 'Desc_IronIngot_C',
          producedPerMin: 0,
          consumedPerMin: 10,
          suppliedPerMin: 0,
          netPerMin: -10,
        },
      ],
    }
    const buffer = await planWorkbookBuffer({ solution, extraction: null })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet(SHEET_NAMES.balance)!
    const col = columns(sheet)
    const shortage = findRow(sheet, col.get('状態')!, '不足')!
    expect(fillArgb(shortage.getCell(col.get('差分')!))).toBe(BALANCE_COLORS.shortageFill)
    expect(shortage.getCell(col.get('差分')!).value).toBeCloseTo(-10, 6)
  })
})

describe('原料', () => {
  it('鉄鉱石の上限比率が数値で、高純度ノードの割当が出る', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.resources)!
    const col = columns(sheet)
    const row = findRow(sheet, col.get('原料')!, '鉄鉱石')!
    const raw = ironPlate.solution.rawResources.find((r) => r.item === 'Desc_OreIron_C')!

    expect(row.getCell(col.get('必要レート')!).value).toBeCloseTo(raw.ratePerMin, 6)
    const ratio = row.getCell(col.get('上限比率')!)
    expect(ratio.type).toBe(ExcelJS.ValueType.Number)
    expect(ratio.value).toBeCloseTo(raw.usageRatio!, 9)
    expect(ratio.numFmt).toBe(NUM_FMT.percent)
    expect(row.getCell(col.get('採掘設備')!).value).toBe('採鉱機 Mk.3')
    expect(row.getCell(col.get('純度')!).value).toBe('高純度')
    expect(row.getCell(col.get('ノード数')!).type).toBe(ExcelJS.ValueType.Number)
  })

  it('採掘計画が無い（extraction=null）場合も原料行は出る', async () => {
    const buffer = await planWorkbookBuffer({
      solution: ironPlate.solution,
      extraction: null,
    })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet(SHEET_NAMES.resources)!
    expect(findRow(sheet, 1, '鉄鉱石')).toBeDefined()
  })
})

describe('建設コスト', () => {
  it('各行の合計が 製造建物 + 採掘設備 と一致する', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.buildCost)!
    const col = columns(sheet)
    let rows = 0
    for (let r = 2; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r)
      const manufacturing = Number(row.getCell(col.get('製造建物')!).value)
      const extraction = Number(row.getCell(col.get('採掘設備')!).value)
      const total = Number(row.getCell(col.get('合計')!).value)
      expect(total).toBeCloseTo(manufacturing + extraction, 6)
      if (row.getCell(1).value !== '合計') rows += 1
    }
    expect(rows).toBeGreaterThan(0)
  })
})

describe('物流', () => {
  it('固体は選択中のベルトで本数を出す', () => {
    const sheet = ironPlate.workbook.getWorksheet(SHEET_NAMES.logistics)!
    const col = columns(sheet)
    const step = ironPlate.solution.steps.find((s) => s.recipeName.ja === '鉄板')!
    const output = step.outputs[0]
    const expected = linesRequired(output.ratePerMin, output.item)

    let found: ExcelJS.Row | undefined
    for (let r = 2; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r)
      if (
        row.getCell(col.get('区分')!).value === '産出' &&
        row.getCell(col.get('アイテム')!).value === '鉄板'
      ) {
        found = row
        break
      }
    }
    expect(found).toBeDefined()
    expect(found!.getCell(col.get('形態')!).value).toBe('固体')
    expect(found!.getCell(col.get('搬送')!).value).toBe('ベルト')
    expect(found!.getCell(col.get('搬送手段')!).value).toBe(expected.nameJa)
    expect(found!.getCell(col.get('必要本数')!).value).toBe(expected.lines)
    expect(found!.getCell(col.get('レート')!).value).toBeCloseTo(output.ratePerMin, 6)
    expect(found!.getCell(col.get('使用率')!).numFmt).toBe(NUM_FMT.percent)
  })

  it('液体はパイプ換算になる（循環プラスチック）', () => {
    const sheet = plastic.workbook.getWorksheet(SHEET_NAMES.logistics)!
    const col = columns(sheet)
    let fluidRows = 0
    for (let r = 2; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r)
      if (row.getCell(col.get('形態')!).value === '液体') {
        fluidRows += 1
        expect(row.getCell(col.get('搬送')!).value).toBe('パイプ')
        expect(row.getCell(col.get('単位')!).value).toBe('m³/min')
        expect(row.getCell(col.get('必要本数')!).type).toBe(ExcelJS.ValueType.Number)
      }
    }
    expect(fluidRows).toBeGreaterThan(0)
  })

  it('ベルト Mk を指定すると本数が変わる', async () => {
    const buffer = await planWorkbookBuffer({
      solution: ironPlate.solution,
      extraction: null,
      beltId: 'Build_ConveyorBeltMk1_C',
    })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet(SHEET_NAMES.logistics)!
    const col = columns(sheet)
    const row = findRow(sheet, col.get('区分')!, '原料供給')!
    const expected = linesRequired(90, 'Desc_OreIron_C', 'Build_ConveyorBeltMk1_C')
    expect(row.getCell(col.get('搬送手段')!).value).toBe(expected.nameJa)
    expect(row.getCell(col.get('必要本数')!).value).toBe(expected.lines)
    expect(expected.lines).toBeGreaterThan(1)
  })
})

describe('サマリー', () => {
  it('プラン名・目的関数・電力・シンクポイントが載る', () => {
    const sheet = plastic.workbook.getWorksheet(SHEET_NAMES.summary)!
    const labels = new Map<string, unknown>()
    for (let r = 1; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r)
      const key = row.getCell(1).value
      if (typeof key === 'string') labels.set(key, row.getCell(2).value)
    }
    expect(labels.get('プラン名')).toBe('循環プラスチック')
    expect(labels.get('目的関数')).toBe('資源効率')
    expect(Number(labels.get('製造（下限）'))).toBeCloseTo(
      plastic.solution.totalPowerRangeMW.minMW,
      6,
    )
    expect(Number(labels.get('合計 (pt/分)'))).toBeCloseTo(plastic.solution.sinkPointsPerMin, 6)
    expect(labels.has('目標産出')).toBe(true)
  })

  it('産出最大化と既保有アイテムの投入がサマリーに載る（シートは増やさない）', async () => {
    // 鉄鉱石 90/min の上限で鉄板を最大化しつつ、鉄インゴットを 30/min 持ち込む
    const solution = await solveOk({
      targets: [],
      maximize: 'Desc_IronPlate_C',
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
      resourceLimits: { Desc_OreIron_C: 90 },
      inputs: { Desc_IronIngot_C: 30, Desc_Cable_C: 10 },
    })
    const target = await makeCase({ solution, planName: '最大化ライン' })
    expect(target.workbook.worksheets.map((w) => w.name)).toEqual([...SHEET_NAME_LIST])

    const sheet = target.workbook.getWorksheet(SHEET_NAMES.summary)!
    const rows: unknown[][] = []
    for (let r = 1; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r)
      rows.push([row.getCell(1).value, row.getCell(2).value, row.getCell(3).value])
    }

    // 目標産出の行は「要求」欄が最大化のラベルになる
    const targetRow = rows.find((r) => r[0] === '鉄板')!
    expect(targetRow[1]).toBe('最大化')
    expect(Number(targetRow[2])).toBeCloseTo(80, 4) // 鉄鉱石90 + インゴット30 → 鉄板80

    const maxRow = rows.find((r) => typeof r[0] === 'string' && r[0].startsWith('最大産出'))!
    expect(Number(maxRow[1])).toBeCloseTo(80, 4)

    // 既保有は「投入」と「使用」を並べる（使い切らないものもある）
    expect(rows.some((r) => r[0] === '既保有アイテムの投入')).toBe(true)
    const ingot = rows.find((r) => r[0] === '鉄のインゴット')!
    expect(Number(ingot[1])).toBe(30)
    expect(Number(ingot[2])).toBeCloseTo(30, 4)
    const cable = rows.find((r) => r[0] === 'ケーブル')!
    expect(Number(cable[1])).toBe(10)
    expect(Number(cable[2])).toBe(0)
  })
})

describe('ファイル名と保存', () => {
  it('satisfactory-plan_<プラン名>_<YYYYMMDD>.xlsx', () => {
    expect(planFileName('鉄板ライン', new Date(2026, 7, 7))).toBe(
      'satisfactory-plan_鉄板ライン_20260807.xlsx',
    )
  })

  it('プラン名が空ならプレースホルダの plan を使う', () => {
    expect(planFileName('  ', new Date(2026, 0, 9))).toBe('satisfactory-plan_plan_20260109.xlsx')
    expect(planFileName(undefined, new Date(2026, 0, 9))).toBe(
      'satisfactory-plan_plan_20260109.xlsx',
    )
  })

  it('ファイル名に使えない文字は _ に潰す', () => {
    expect(planFileName('鉄板/工場: 第2期', new Date(2026, 7, 7))).toBe(
      'satisfactory-plan_鉄板_工場_第2期_20260807.xlsx',
    )
  })

  it('ステップが無い解でもワークブックを組み立てられる', () => {
    const empty: Solution = {
      ...ironPlate.solution,
      steps: [],
      rawResources: [],
      byproducts: [],
      itemBalance: [],
      totalBuildCost: [],
    }
    const workbook = buildPlanWorkbook({ solution: empty, extraction: null })
    expect(workbook.worksheets.map((w) => w.name)).toEqual([...SHEET_NAME_LIST])
  })

  it('Node ではダウンロードできない（ブラウザ専用）', async () => {
    await expect(
      downloadPlanWorkbook({ solution: ironPlate.solution, extraction: null }),
    ).rejects.toThrow('ブラウザ')
  })
})
