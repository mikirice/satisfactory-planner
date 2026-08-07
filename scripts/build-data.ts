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
  BELT_SPEED_TO_ITEMS_PER_MIN,
  DATA_SCHEMA_VERSION,
  DEFAULT_POWER_EXPONENT,
  DEFAULT_SOMERSLOOP_POWER_EXPONENT,
  FLUID_INTERNAL_UNIT_SCALE,
  PIPE_FLOW_LIMIT_TO_M3_PER_MIN,
  SECONDS_PER_MINUTE,
} from '../src/data/constants.ts'
import type {
  Belt,
  Building,
  BuildingCategory,
  DataMeta,
  Extractor,
  ExtractorCategory,
  Item,
  ItemAmount,
  ItemForm,
  LocalizedName,
  Logistics,
  Pipe,
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
// 日本語名のフォールバック
// ---------------------------------------------------------------------------

/** ひらがな・カタカナ・漢字・半角カナのいずれかを含むか。 */
const JAPANESE_CHAR = /[぀-ヿ㐀-鿿ｦ-ﾟ]/

/**
 * ゲーム公式 ja ローカライズ自体が未訳のものだけをここで補う。
 *
 * 通常のアイテム名・レシピ名は手訳しない（README の方針。ゲーム内表記と食い違うため）。
 * ただし ja.json が英語のままだと画面に英語が出てしまうので、その分だけ例外的に訳を置く。
 * 上流（ゲーム側のローカライズ）が訳を入れたらこの行を削除すること。
 *
 * - Recipe_Alternate_PolyesterFabric_C: ja.json が "Alternate: Polyester Fabric" のまま
 *   （1.1.x で確認）。産出物の布地＝Fabric に合わせて「代替: ポリエステル生地」とする
 */
const JA_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  Recipe_Alternate_PolyesterFabric_C: '代替: ポリエステル生地',
}

/**
 * 公式 ja ローカライズでも英字表記が正しいもの（未訳ではない）。
 * 未訳検出（日本語文字を含まない）に引っかかるが、フォールバックしてはいけない。
 */
const INTENTIONALLY_ASCII_JA_NAMES = new Set([
  'Desc_SAM_C', // 公式 ja でも "SAM"
  'Desc_Ficsonium_C', // 公式 ja でも "FICSONIUM"
  'Recipe_Ficsonium_C',
])

/**
 * ja.json が英語のままだったときの一般フォールバック。
 * 代替レシピは接頭辞だけでも日本語化しておくと一覧で見分けがつく。
 */
function fallbackJaName(enName: string): string {
  return enName.startsWith('Alternate:') ? `代替:${enName.slice('Alternate:'.length)}` : enName
}

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
 * 抽出設備の NativeClass → カテゴリ。
 * FGBuildableResourceExtractor だけは採掘機と石油採掘機の両方を含むので
 * mExtractorTypeName / 対象資源で後段で振り分ける。
 */
const EXTRACTOR_NATIVE_CLASSES = new Set([
  'FGBuildableResourceExtractor',
  'FGBuildableWaterPump',
  'FGBuildableFrackingExtractor',
  'FGBuildableFrackingActivator',
])

function extractorCategory(nativeClass: string, cls: DocsClass): ExtractorCategory {
  switch (nativeClass) {
    case 'FGBuildableWaterPump':
      return 'waterExtractor'
    case 'FGBuildableFrackingExtractor':
      return 'wellExtractor'
    case 'FGBuildableFrackingActivator':
      return 'wellPressurizer'
    default:
      // Miner Mk.1〜3 は mExtractorTypeName="Miner"、石油採掘機は "None"
      return cls.mExtractorTypeName === 'Miner' ? 'miner' : 'oilExtractor'
  }
}

/** "(RF_LIQUID,RF_GAS)" → ['liquid', 'gas'] */
function parseAllowedForms(raw: string | undefined): ItemForm[] {
  if (!raw) return []
  const forms: ItemForm[] = []
  for (const token of raw.matchAll(/RF_[A-Z]+/g)) {
    switch (token[0]) {
      case 'RF_SOLID':
        forms.push('solid')
        break
      case 'RF_LIQUID':
        forms.push('liquid')
        break
      case 'RF_GAS':
        forms.push('gas')
        break
      default:
        // RF_HEAT（間欠泉）等は生産チェーンの対象外なので無視する
        break
    }
  }
  return [...new Set(forms)]
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
  const untranslatedJaNames: string[] = []

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
    const override = JA_NAME_OVERRIDES[id]
    if (override) {
      untranslatedJaNames.push(id)
      return { ja: override, en: enName }
    }
    const jaName = jaNames.get(id)
    if (!jaName) {
      // ja.json にエントリ自体が無い
      missingJaNames.push(id)
      return { ja: fallbackJaName(enName), en: enName }
    }
    // エントリはあるが英語のまま（上流のローカライズ漏れ）
    if (!JAPANESE_CHAR.test(jaName) && !INTENTIONALLY_ASCII_JA_NAMES.has(id)) {
      untranslatedJaNames.push(id)
      return { ja: fallbackJaName(jaName), en: enName }
    }
    return { ja: jaName, en: enName }
  }

  // --- items -------------------------------------------------------------
  // 原料（マップから直接採取するアイテム）は FGResourceDescriptor に列挙されている。
  const rawResourceIds = new Set<string>()
  for (const group of en) {
    if (shortNativeClass(group.NativeClass) !== 'FGResourceDescriptor') continue
    for (const cls of group.Classes) rawResourceIds.add(cls.ClassName)
  }

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
        isRawResource: rawResourceIds.has(cls.ClassName),
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

  // --- extractors --------------------------------------------------------
  // 採掘・抽出はレシピとして定義されていないので、建物クラスの
  // mItemsPerCycle / mExtractCycleTime から抽出レートを組み立てる。
  // 純度倍率（Impure 0.5 / Normal 1 / Pure 2）は constants.ts の PURITY_MULTIPLIER。
  const extractors: Extractor[] = []
  for (const group of en) {
    const nativeClass = shortNativeClass(group.NativeClass)
    if (!EXTRACTOR_NATIVE_CLASSES.has(nativeClass)) continue
    for (const cls of group.Classes) {
      if (!cls.mDisplayName) continue
      if (!buildings.has(cls.ClassName)) {
        warnings.push(`extractor ${cls.ClassName} has no matching building entry`)
        continue
      }
      const category = extractorCategory(nativeClass, cls)
      const allowedForms = parseAllowedForms(cls.mAllowedResourceForms)
      // 液体・気体を扱う設備は mItemsPerCycle も内部単位（1000倍）
      const isFluid = allowedForms.length > 0 && !allowedForms.includes('solid')
      const rawPerCycle = num(cls.mItemsPerCycle)
      const itemsPerCycle = isFluid ? rawPerCycle / FLUID_INTERNAL_UNIT_SCALE : rawPerCycle
      const cycleTimeSec = num(cls.mExtractCycleTime)
      const baseRatePerMin =
        cycleTimeSec > 0 ? (itemsPerCycle * SECONDS_PER_MINUTE) / cycleTimeSec : 0

      // mOnlyAllowCertainResources=False の採掘機は「全ての固体ノード」なので null
      const restricted = cls.mOnlyAllowCertainResources === 'True'
      const allowedResources = restricted
        ? parseProducedIn(cls.mAllowedResources).filter((id) => items.has(id))
        : null
      if (restricted && (!allowedResources || allowedResources.length === 0)) {
        warnings.push(`extractor ${cls.ClassName}: mAllowedResources could not be resolved`)
      }

      extractors.push({
        id: cls.ClassName,
        name: localized(cls.ClassName, cls.mDisplayName),
        category,
        itemsPerCycle,
        extractCycleTimeSec: cycleTimeSec,
        baseRatePerMin,
        powerConsumptionMW: num(cls.mPowerConsumption),
        powerExponent: num(cls.mPowerConsumptionExponent, DEFAULT_POWER_EXPONENT),
        allowedResources,
        allowedForms,
        // 水の汲み上げ機は水面に置くだけで純度の概念がない
        purityAffected: category !== 'waterExtractor' && category !== 'wellPressurizer',
      })
    }
  }

  // --- logistics（ベルト / パイプ） ----------------------------------------
  // "Clean ..." 系（*_NoIndicator_C）は見た目違いの同性能品なので除外する。
  const belts: Belt[] = []
  const pipes: Pipe[] = []
  for (const group of en) {
    const nativeClass = shortNativeClass(group.NativeClass)
    for (const cls of group.Classes) {
      if (!cls.mDisplayName || cls.ClassName.includes('NoIndicator')) continue
      if (nativeClass === 'FGBuildableConveyorBelt') {
        belts.push({
          id: cls.ClassName,
          name: localized(cls.ClassName, cls.mDisplayName),
          itemsPerMin: num(cls.mSpeed) * BELT_SPEED_TO_ITEMS_PER_MIN,
        })
      } else if (nativeClass === 'FGBuildablePipeline') {
        pipes.push({
          id: cls.ClassName,
          name: localized(cls.ClassName, cls.mDisplayName),
          m3PerMin: num(cls.mFlowLimit) * PIPE_FLOW_LIMIT_TO_M3_PER_MIN,
        })
      }
    }
  }
  belts.sort((a, b) => a.itemsPerMin - b.itemsPerMin)
  pipes.sort((a, b) => a.m3PerMin - b.m3PerMin)
  const logistics: Logistics = { belts, pipes }
  if (belts.length === 0) warnings.push('no conveyor belts found (FGBuildableConveyorBelt)')
  if (pipes.length === 0) warnings.push('no pipelines found (FGBuildablePipeline)')

  recipes.sort((a, b) => a.id.localeCompare(b.id))
  extractors.sort((a, b) => a.id.localeCompare(b.id))
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
    untranslatedJaNames: [...new Set(untranslatedJaNames)].sort(),
  }

  await mkdir(OUT_DIR, { recursive: true })
  const write = async (name: string, data: unknown) => {
    await writeFile(join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
  await write('items.json', itemList)
  await write('recipes.json', recipes)
  await write('buildings.json', buildingList)
  await write('extractors.json', extractors)
  await write('logistics.json', logistics)
  await write('meta.json', meta)

  // --- ログ ---------------------------------------------------------------
  console.log(`[build-data] game version : ${GAME_VERSION}`)
  console.log(`[build-data] items        : ${itemList.length}`)
  console.log(`[build-data] recipes      : ${recipes.length} (alternate: ${recipes.filter((r) => r.isAlternate).length})`)
  console.log(`[build-data] buildings    : ${buildingList.length}`)
  console.log(`[build-data] raw resources: ${itemList.filter((i) => i.isRawResource).length}`)
  console.log(
    `[build-data] extractors   : ${extractors.length} (${extractors
      .map((e) => `${e.name.en}=${e.baseRatePerMin}/min`)
      .join(', ')})`,
  )
  console.log(
    `[build-data] logistics    : belts ${belts.length} (max ${belts.at(-1)?.itemsPerMin}/min) / ` +
      `pipes ${pipes.length} (max ${pipes.at(-1)?.m3PerMin} m³/min)`,
  )

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

  if (meta.untranslatedJaNames.length > 0) {
    console.warn(
      `[build-data] WARNING: ${meta.untranslatedJaNames.length} entities are untranslated in the ` +
        `official ja localization, applied a fallback: ${meta.untranslatedJaNames.join(', ')}`,
    )
  }

  if (warnings.length > 0) {
    console.warn(`[build-data] ${warnings.length} warning(s):`)
    for (const w of warnings.slice(0, 40)) console.warn(`  - ${w}`)
    if (warnings.length > 40) console.warn(`  ... and ${warnings.length - 40} more`)
  }
  console.log(
    '[build-data] wrote items.json / recipes.json / buildings.json / extractors.json / ' +
      'logistics.json / meta.json to src/data/',
  )
}

await main()
