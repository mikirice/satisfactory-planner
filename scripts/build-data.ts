/**
 * Docs.json → 正規化JSON 変換パイプライン。
 *
 *   npm run build-data
 *
 * 入力 : data-source/en-US.json, data-source/ja.json（ゲーム同梱 Docs のミラー / UTF-16LE）
 * 出力 : src/data/items.json, recipes.json, buildings.json, meta.json
 *
 * 設計メモ:
 * - Docs.json は「NativeClass ごとのグループ配列」。各 Class はすべて文字列値の
 *   フラットな辞書で、数値も Unreal の構造体も文字列として入っている。
 * - 液体・気体は内部単位が 1000倍（mL 相当）。form を見て 1/1000 して m³ に統一する。
 * - 日本語名は ja.json の同じ ClassName から引く（手訳しない）。取れない場合は en に
 *   フォールバックし、ビルドログに警告を出す。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  DATA_SCHEMA_VERSION,
  DEFAULT_POWER_EXPONENT,
  DEFAULT_SOMERSLOOP_POWER_EXPONENT,
  FLUID_INTERNAL_UNIT_SCALE,
} from '../src/data/constants.ts'
import type {
  Building,
  BuildingCategory,
  DataMeta,
  Item,
  ItemAmount,
  ItemForm,
  LocalizedName,
  Recipe,
  VariablePower,
} from '../src/data/types.ts'
import {
  DATA_SOURCE_DIR,
  PROJECT_ROOT,
  SOURCE_BASE_URL,
  ensureDocs,
} from './fetch-docs.ts'
import type { DocsClass, DocsGroup } from './docs-parse.ts'
import {
  decodeDocs,
  num,
  parseItemAmounts,
  parseProducedIn,
  shortNativeClass,
} from './docs-parse.ts'

/**
 * 元データのゲームバージョン。
 * data-source/DATA_SOURCES.md の記載と揃えること。
 */
const GAME_VERSION = '1.1.x'

const OUT_DIR = join(PROJECT_ROOT, 'src', 'data')

// ---------------------------------------------------------------------------
// Docs.json 読み込み
// ---------------------------------------------------------------------------

async function readDocs(file: string): Promise<DocsGroup[]> {
  const path = join(DATA_SOURCE_DIR, file)
  if (!existsSync(path)) {
    throw new Error(`missing ${path}. Run: npm run fetch-docs`)
  }
  const text = decodeDocs(await readFile(path))
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) {
    throw new Error(`${file}: unexpected root shape (expected array of NativeClass groups)`)
  }
  return parsed as DocsGroup[]
}

// ---------------------------------------------------------------------------
// パーサ用ヘルパー
// ---------------------------------------------------------------------------

function parseForm(raw: string | undefined): ItemForm {
  switch (raw) {
    case 'RF_LIQUID':
      return 'liquid'
    case 'RF_GAS':
      return 'gas'
    default:
      // RF_SOLID / RF_INVALID / 未設定はすべて固体扱い（個数単位）
      return 'solid'
  }
}

/** "Texture2D /Game/.../IconDesc_IronPlates_256.IconDesc_IronPlates_256" → "IconDesc_IronPlates_256" */
function parseIcon(raw: string | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  const dot = trimmed.lastIndexOf('.')
  return dot >= 0 ? trimmed.slice(dot + 1) : trimmed
}

// ---------------------------------------------------------------------------
// 対象クラスの定義（除外ルールはここに集約）
// ---------------------------------------------------------------------------

/**
 * 生産系の建物だけを対象にする。
 * 除外するもの（意図的）:
 * - 装飾・構造物（壁/床/柱/看板/ライト等）… 生産計算に無関係
 * - 物流（コンベア/パイプ/マージャ/スプリッタ/駅/ドローン/車両）… Phase 2以降で必要になれば追加
 * - ストレージ/ハイパーチューブ/ブループリントデザイナ等の非生産設備
 * - AWESOME Sink / Shop（アイテムを消費するが生産チェーンの変数にはしない）
 * 発電機は「燃料消費と電力収支」に必要なので残す（燃料レシピの取り込みは Phase 2）。
 */
const BUILDING_NATIVE_CLASSES: Record<string, BuildingCategory> = {
  FGBuildableManufacturer: 'manufacturer',
  FGBuildableManufacturerVariablePower: 'manufacturer',
  FGBuildableResourceExtractor: 'extractor',
  FGBuildableWaterPump: 'extractor',
  FGBuildableFrackingExtractor: 'extractor',
  FGBuildableFrackingActivator: 'extractor',
  FGBuildableGeneratorFuel: 'generator',
  FGBuildableGeneratorNuclear: 'generator',
  FGBuildableGeneratorGeoThermal: 'generator',
}

/**
 * Somersloop のスロット数を求める。
 *
 * Docs.json の mProductionShardSlotSize は mOverrideProductionShardSlotSize=True の
 * 建物（組立機=2 / 製造機=4 等）でしか正しい値が入っておらず、override=False の
 * 製錬炉は 0、製作機は 1 と一貫しない。ゲーム内は「Somersloop を挿せる建物は最低1枠」
 * なので、mCanChangeProductionBoost をゲートに使い、そのうえで最低1枠に丸める。
 * 採掘機・発電機・充填機は mCanChangeProductionBoost=False なので 0 になる。
 */
function parseSomersloopSlots(cls: DocsClass): number {
  if (cls.mCanChangeProductionBoost !== 'True') return 0
  return Math.max(1, Math.round(num(cls.mProductionShardSlotSize)))
}

/**
 * アイテム判定: mForm を持ち、表示名が空でないクラスをアイテムとみなす。
 * これにより FGItemDescriptor / FGResourceDescriptor / バイオマス / 核燃料 /
 * 装備 / 弾薬 / パワーシャード等をまとめて拾える。
 * mDisplayName が空の FGBuildingDescriptor（建物のインベントリ表現）は除外される。
 */
function isItemClass(cls: DocsClass): boolean {
  return typeof cls.mForm === 'string' && !!cls.mDisplayName
}

// ---------------------------------------------------------------------------
// 本体
// ---------------------------------------------------------------------------

type Warning = string

async function main(): Promise<void> {
  await ensureDocs(false)

  const warnings: Warning[] = []
  const missingJaNames: string[] = []

  const en = await readDocs('en-US.json')
  const ja = await readDocs('ja.json')

  // ja.json は en-US.json と同じ構造・同じ ClassName を持つ（値だけ翻訳済み）
  const jaNames = new Map<string, string>()
  for (const group of ja) {
    for (const cls of group.Classes) {
      if (cls.mDisplayName) jaNames.set(cls.ClassName, cls.mDisplayName)
    }
  }

  const localized = (id: string, enName: string): LocalizedName => {
    const jaName = jaNames.get(id)
    if (!jaName) {
      missingJaNames.push(id)
      return { ja: enName, en: enName }
    }
    return { ja: jaName, en: enName }
  }

  // --- items -------------------------------------------------------------
  const items = new Map<string, Item>()
  for (const group of en) {
    for (const cls of group.Classes) {
      if (!isItemClass(cls)) continue
      if (items.has(cls.ClassName)) continue
      items.set(cls.ClassName, {
        id: cls.ClassName,
        name: localized(cls.ClassName, cls.mDisplayName),
        form: parseForm(cls.mForm),
        sinkPoints: Math.max(0, Math.round(num(cls.mResourceSinkPoints))),
        icon: parseIcon(cls.mPersistentBigIcon || cls.mSmallIcon),
      })
    }
  }

  // --- buildings ---------------------------------------------------------
  // 建設コスト = 「その建物の Descriptor を産出するレシピ」の材料。
  // Build_XXX_C ↔ Desc_XXX_C の命名規則で紐付ける。
  const buildCostByDescriptor = new Map<string, ItemAmount[]>()
  const buildingDescriptorIds = new Set<string>()
  for (const group of en) {
    if (shortNativeClass(group.NativeClass) !== 'FGBuildingDescriptor') continue
    for (const cls of group.Classes) buildingDescriptorIds.add(cls.ClassName)
  }
  for (const group of en) {
    if (shortNativeClass(group.NativeClass) !== 'FGRecipe') continue
    for (const cls of group.Classes) {
      const products = parseItemAmounts(cls.mProduct)
      if (products.length !== 1) continue
      const descriptorId = products[0].classNameId
      if (!buildingDescriptorIds.has(descriptorId)) continue
      buildCostByDescriptor.set(
        descriptorId,
        parseItemAmounts(cls.mIngredients).map((i) => ({ item: i.classNameId, amount: i.amount })),
      )
    }
  }

  const buildings = new Map<string, Building>()
  for (const group of en) {
    const category = BUILDING_NATIVE_CLASSES[shortNativeClass(group.NativeClass)]
    if (!category) continue
    for (const cls of group.Classes) {
      if (!cls.mDisplayName) continue
      const descriptorId = cls.ClassName.replace(/^Build_/, 'Desc_')
      const buildCost = buildCostByDescriptor.get(descriptorId)
      if (!buildCost) {
        warnings.push(`build cost not found for building ${cls.ClassName} (looked for ${descriptorId})`)
      }
      const minMW = num(cls.mEstimatedMininumPowerConsumption)
      const maxMW = num(cls.mEstimatedMaximumPowerConsumption)
      const variablePower: VariablePower | undefined =
        maxMW > 0 ? { minMW, maxMW } : undefined
      const powerProduction = num(cls.mPowerProduction)

      buildings.set(cls.ClassName, {
        id: cls.ClassName,
        name: localized(cls.ClassName, cls.mDisplayName),
        category,
        powerConsumptionMW: num(cls.mPowerConsumption),
        powerExponent: num(cls.mPowerConsumptionExponent, DEFAULT_POWER_EXPONENT),
        maxSomersloops: parseSomersloopSlots(cls),
        somersloopPowerExponent: num(
          cls.mProductionBoostPowerConsumptionExponent,
          DEFAULT_SOMERSLOOP_POWER_EXPONENT,
        ),
        buildCost: buildCost ?? [],
        ...(powerProduction > 0 ? { powerProductionMW: powerProduction } : {}),
        ...(variablePower ? { variablePower } : {}),
      })
    }
  }

  // --- recipes -----------------------------------------------------------
  // 除外ルール（意図的）:
  // - mProducedIn が上記の生産系建物を1つも含まないレシピ（手作業クラフト専用、
  //   ビルドガンによる建設レシピ、装備ワークショップ専用、カスタマイズ塗装等）
  // - mManufactoringDuration <= 0 のレシピ（レート計算が定義できない）
  const recipes: Recipe[] = []
  for (const group of en) {
    if (shortNativeClass(group.NativeClass) !== 'FGRecipe') continue
    for (const cls of group.Classes) {
      const producedInCandidates = parseProducedIn(cls.mProducedIn)
      const producedIn = producedInCandidates.find((id) => buildings.has(id))
      if (!producedIn) continue

      const durationSec = num(cls.mManufactoringDuration)
      if (!(durationSec > 0)) {
        warnings.push(`recipe ${cls.ClassName} skipped: non-positive duration (${cls.mManufactoringDuration})`)
        continue
      }

      const toAmounts = (raw: string | undefined, kind: string): ItemAmount[] =>
        parseItemAmounts(raw).map(({ classNameId, amount }) => {
          const item = items.get(classNameId)
          if (!item) {
            warnings.push(`recipe ${cls.ClassName}: unknown ${kind} item ${classNameId}`)
            return { item: classNameId, amount }
          }
          // 液体・気体は内部単位が 1000倍。ここで m³ に統一する。
          const scaled = item.form === 'solid' ? amount : amount / FLUID_INTERNAL_UNIT_SCALE
          return { item: classNameId, amount: scaled }
        })

      const enName = cls.mDisplayName ?? cls.ClassName
      const variableFactor = num(cls.mVariablePowerConsumptionFactor)
      const variableConstant = num(cls.mVariablePowerConsumptionConstant)
      const building = buildings.get(producedIn)
      const isVariablePowerBuilding = !!building?.variablePower

      recipes.push({
        id: cls.ClassName,
        name: localized(cls.ClassName, enName),
        isAlternate: cls.ClassName.startsWith('Recipe_Alternate_') || enName.startsWith('Alternate:'),
        producedIn,
        durationSec,
        ingredients: toAmounts(cls.mIngredients, 'ingredient'),
        products: toAmounts(cls.mProduct, 'product'),
        ...(isVariablePowerBuilding && variableFactor > 0
          ? { variablePower: { minMW: variableConstant, maxMW: variableConstant + variableFactor } }
          : {}),
      })
    }
  }

  recipes.sort((a, b) => a.id.localeCompare(b.id))
  const itemList = [...items.values()].sort((a, b) => a.id.localeCompare(b.id))
  const buildingList = [...buildings.values()].sort((a, b) => a.id.localeCompare(b.id))

  // --- 出力 ---------------------------------------------------------------
  const meta: DataMeta = {
    schemaVersion: DATA_SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    sourceUrl: SOURCE_BASE_URL,
    generatedAt: new Date().toISOString(),
    counts: { items: itemList.length, recipes: recipes.length, buildings: buildingList.length },
    missingJaNames: [...new Set(missingJaNames)].sort(),
  }

  await mkdir(OUT_DIR, { recursive: true })
  const write = async (name: string, data: unknown) => {
    await writeFile(join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
  await write('items.json', itemList)
  await write('recipes.json', recipes)
  await write('buildings.json', buildingList)
  await write('meta.json', meta)

  // --- ログ ---------------------------------------------------------------
  console.log(`[build-data] game version : ${GAME_VERSION}`)
  console.log(`[build-data] items        : ${itemList.length}`)
  console.log(`[build-data] recipes      : ${recipes.length} (alternate: ${recipes.filter((r) => r.isAlternate).length})`)
  console.log(`[build-data] buildings    : ${buildingList.length}`)

  const missingJaInOutput = new Set<string>()
  for (const e of [...itemList, ...recipes, ...buildingList]) {
    if (e.name.ja === e.name.en && !jaNames.has(e.id)) missingJaInOutput.add(e.id)
  }
  if (missingJaInOutput.size > 0) {
    console.warn(
      `[build-data] WARNING: ${missingJaInOutput.size} entities have no ja name, fell back to en: ` +
        `${[...missingJaInOutput].slice(0, 20).join(', ')}${missingJaInOutput.size > 20 ? ' ...' : ''}`,
    )
  } else {
    console.log('[build-data] ja names     : OK (no fallback to en)')
  }

  if (warnings.length > 0) {
    console.warn(`[build-data] ${warnings.length} warning(s):`)
    for (const w of warnings.slice(0, 40)) console.warn(`  - ${w}`)
    if (warnings.length > 40) console.warn(`  ... and ${warnings.length - 40} more`)
  }
  console.log(`[build-data] wrote items.json / recipes.json / buildings.json / meta.json to src/data/`)
}

await main()
