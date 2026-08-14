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
  BuildingFootprint,
  DataMeta,
  Extractor,
  ExtractorCategory,
  Generator,
  GeneratorCategory,
  GeneratorFuel,
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
  TIER2_DOCS_FILES,
  ensureDocs,
} from './fetch-docs.ts'
import type { Tier2Locale } from './fetch-docs.ts'
import type { DocsClass, DocsGroup } from './docs-parse.ts'
import {
  decodeDocs,
  num,
  parseClearanceBounds,
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
 * ClassName は旧来の `Recipe_Alternate_*` のままだが、現在はハードドライブではなく
 * MAM 硫黄研究で直接解除する進行レシピ。プランナーは Tier/MAM の解除済みを前提に
 * するため、ユーザーが任意に ON/OFF する代替レシピには含めない。
 */
const BASE_RECIPE_ID_OVERRIDES = new Set([
  'Recipe_Alternate_EnrichedCoal_C',
  'Recipe_Alternate_Turbofuel_C',
])

function baseRecipeName(name: LocalizedName): LocalizedName {
  return {
    ja: name.ja.replace(/^代替:\s*/, ''),
    en: name.en.replace(/^Alternate:\s*/, ''),
  }
}

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

// ---------------------------------------------------------------------------
// 外形（床面積の概算）
// ---------------------------------------------------------------------------

/** Unreal 単位(cm) → m。 */
const UNREAL_CM_TO_M = 100

/**
 * mClearanceData から外形が取れなかった建物を補う既知値（幅m × 奥行m × 高さm）。
 *
 * 出典: https://satisfactory.wiki.gg/wiki/Category:Buildings の各建物ページ
 * "Dimensions" 欄（2026-08-08 参照）。
 * 1.1.x の Docs.json では全 23 建物にクリアランスが入っているのでこの表は空でよいが、
 * ゲーム更新でクリアランスが消えた建物が出ても床面積が 0 にならないよう残しておく
 * （build-data のログに WARNING を出すので、そのときここに追記する）。
 */
const FOOTPRINT_FALLBACKS: Readonly<Record<string, [number, number, number]>> = {
  // 例: Build_ConstructorMk1_C: [7.9, 9.9, 8.3],
}

function resolveFootprint(cls: DocsClass, warnings: Warning[]): BuildingFootprint {
  const bounds = parseClearanceBounds(cls.mClearanceData)
  if (bounds) {
    return makeFootprint(
      (bounds.max.x - bounds.min.x) / UNREAL_CM_TO_M,
      (bounds.max.y - bounds.min.y) / UNREAL_CM_TO_M,
      (bounds.max.z - bounds.min.z) / UNREAL_CM_TO_M,
      'docs',
    )
  }
  const fallback = FOOTPRINT_FALLBACKS[cls.ClassName]
  if (fallback) {
    warnings.push(`footprint of ${cls.ClassName} came from the wiki fallback table`)
    return makeFootprint(fallback[0], fallback[1], fallback[2], 'fallback')
  }
  warnings.push(
    `footprint not found for ${cls.ClassName} (no mClearanceData, no fallback) — ` +
      'add it to FOOTPRINT_FALLBACKS in scripts/build-data.ts',
  )
  return makeFootprint(0, 0, 0, 'fallback')
}

function makeFootprint(
  widthM: number,
  depthM: number,
  heightM: number,
  source: BuildingFootprint['source'],
): BuildingFootprint {
  const round = (n: number): number => Math.round(n * 100) / 100
  const w = round(Math.max(0, widthM))
  const d = round(Math.max(0, depthM))
  return { widthM: w, depthM: d, heightM: round(Math.max(0, heightM)), areaM2: round(w * d), source }
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

// ---------------------------------------------------------------------------
// 発電機
// ---------------------------------------------------------------------------

/**
 * 発電機の NativeClass → 収録するか（カテゴリ）。
 *
 * FGBuildableGeneratorFuel には石炭発電機・燃料式発電機・バイオマスバーナーが同居するので、
 * ClassName で振り分ける（GENERATOR_CATEGORIES）。
 * FGBuildableGeneratorGeoThermal（地熱発電機）はここに含めない
 * ＝ 出力が mVariablePowerProductionFactor で間欠変動し、定常レートの LP に載せられないため。
 */
const GENERATOR_NATIVE_CLASSES = new Set(['FGBuildableGeneratorFuel', 'FGBuildableGeneratorNuclear'])

/**
 * 収録する発電機と、その分類（UI の許可チェックの単位）。
 *
 * ここに無い発電機は意図的に除外する:
 * - `Build_GeneratorBiomass_Automated_C`（バイオマスバーナー）… 燃料の葉・木材・菌糸は
 *   マップから手で拾う前提で、生産チェーンとして自動供給できないため
 * - `Build_GeneratorGeoThermal_C`（地熱発電機）… 出力が間欠変動するため（初期スコープ外）
 */
const GENERATOR_CATEGORIES: Readonly<Record<string, GeneratorCategory>> = {
  Build_GeneratorCoal_C: 'coal',
  Build_GeneratorFuel_C: 'fuel',
  Build_GeneratorNuclear_C: 'nuclear',
}

/** mFuel の1要素（Docs.json では文字列ではなくオブジェクトの配列で入っている）。 */
type DocsFuelEntry = {
  mFuelClass?: string
  mSupplementalResourceClass?: string
  mByproduct?: string
  mByproductAmount?: string
}

/** "…/Desc_Coal.Desc_Coal_C" でも "Desc_Coal_C" でも最後の ClassName トークンを返す。 */
function lastClassToken(raw: string | undefined): string {
  if (!raw) return ''
  const tokens = [...raw.matchAll(/(?<![A-Za-z0-9_])([A-Za-z0-9_]+_C)(?![A-Za-z0-9_])/g)]
  return tokens.at(-1)?.[1] ?? ''
}

/**
 * アイテム1単位あたりのエネルギー量(MJ)。
 * 液体・気体の mEnergyValue は内部単位（mL）あたりなので m³ に揃えるため 1000倍する
 * （個数側の 1/1000 と逆向き。例: 燃料 0.75 MJ/mL = 750 MJ/m³）。
 */
function energyMJPerUnit(item: Item, rawEnergyValue: string | undefined): number {
  const value = num(rawEnergyValue)
  return item.form === 'solid' ? value : value * FLUID_INTERNAL_UNIT_SCALE
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

type NamedEntity = {
  id: string
  name: LocalizedName
}

/**
 * Build a stable ClassName-keyed official-name pack from the normalized output entities.
 * Buildings intentionally overlap extractors/generators; equal duplicates are collapsed, while
 * conflicting names fail the data build instead of making the chosen label depend on array order.
 */
function buildNamePack(
  locale: keyof LocalizedName,
  collections: readonly (readonly NamedEntity[])[],
): Record<string, string> {
  const byId = new Map<string, string>()
  for (const collection of collections) {
    for (const entity of collection) {
      const name = entity.name[locale]
      const existing = byId.get(entity.id)
      if (existing !== undefined && existing !== name) {
        throw new Error(
          `[build-data] conflicting ${locale} names for ${entity.id}: ` +
            `${JSON.stringify(existing)} / ${JSON.stringify(name)}`,
        )
      }
      byId.set(entity.id, name)
    }
  }
  return Object.fromEntries(
    [...byId].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  )
}

/**
 * Tier 2 の言語別 names パック（ClassName → 公式表示名）を作る。
 *
 * 英語の pack と同じキー集合を必ず持たせ、その言語の Docs に無いものだけ en に落とす
 * （計画書 §4.2「欠落訳は en フォールバック＋未訳数を記録」）。
 * 「英語と同じ文字列」は未訳とは限らない（SAM・FICSONIUM のような固有表記）ので、
 * *欠落* と *英語と同一* を分けて数え、判断材料としてログに出す。
 */
type NamePackReport = {
  locale: Tier2Locale
  names: Record<string, string>
  missing: string[]
  sameAsEnglish: string[]
}

async function buildTier2NamePack(
  locale: Tier2Locale,
  namesEn: Readonly<Record<string, string>>,
): Promise<NamePackReport> {
  const groups = await readDocs(TIER2_DOCS_FILES[locale])
  const localizedNames = new Map<string, string>()
  for (const group of groups) {
    for (const cls of group.Classes) {
      if (cls.mDisplayName) localizedNames.set(cls.ClassName, cls.mDisplayName)
    }
  }

  const names: Record<string, string> = {}
  const missing: string[] = []
  const sameAsEnglish: string[] = []
  for (const [id, enName] of Object.entries(namesEn)) {
    const localized = localizedNames.get(id)
    if (localized === undefined || localized === '') {
      missing.push(id)
      names[id] = enName
      continue
    }
    if (localized === enName) sameAsEnglish.push(id)
    names[id] = localized
  }
  return { locale, names, missing, sameAsEnglish }
}

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
  /** Item.id → 1単位あたりのエネルギー量(MJ)。発電機の燃料消費レートの算出だけに使う */
  const energyMJ = new Map<string, number>()
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
      energyMJ.set(cls.ClassName, energyMJPerUnit(items.get(cls.ClassName)!, cls.mEnergyValue))
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
        footprint: resolveFootprint(cls, warnings),
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
      const name = localized(cls.ClassName, enName)
      const variableFactor = num(cls.mVariablePowerConsumptionFactor)
      const variableConstant = num(cls.mVariablePowerConsumptionConstant)
      const building = buildings.get(producedIn)
      const isVariablePowerBuilding = !!building?.variablePower

      recipes.push({
        id: cls.ClassName,
        name: BASE_RECIPE_ID_OVERRIDES.has(cls.ClassName) ? baseRecipeName(name) : name,
        isAlternate:
          !BASE_RECIPE_ID_OVERRIDES.has(cls.ClassName) &&
          (cls.ClassName.startsWith('Recipe_Alternate_') || enName.startsWith('Alternate:')),
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

  // --- generators（発電機） -------------------------------------------------
  // 発電もレシピとして定義されていないので、建物クラスの mPowerProduction と
  // mFuel（燃料候補の配列）から「燃料(+水) → 電力MW」のレートを組み立てる。
  //   燃料の消費レート  = 発電量MW × 60 ÷ 燃料のエネルギー量MJ
  //   補助資源(水)      = 発電量MW × mSupplementalToPowerRatio × 60 ÷ 1000（m³/min）
  //   副産物(核廃棄物)  = 燃料の消費レート × mByproductAmount
  const generators: Generator[] = []
  for (const group of en) {
    if (!GENERATOR_NATIVE_CLASSES.has(shortNativeClass(group.NativeClass))) continue
    for (const cls of group.Classes) {
      const category = GENERATOR_CATEGORIES[cls.ClassName]
      if (!category) continue // バイオマスバーナー等は意図的に除外（GENERATOR_CATEGORIES 参照）
      if (!buildings.has(cls.ClassName)) {
        warnings.push(`generator ${cls.ClassName} has no matching building entry`)
        continue
      }
      const powerProductionMW = num(cls.mPowerProduction)
      if (!(powerProductionMW > 0)) {
        warnings.push(`generator ${cls.ClassName} skipped: mPowerProduction=${cls.mPowerProduction}`)
        continue
      }

      // 補助資源（水）は発電量に比例する。1台あたりの必要量は燃料の種類によらず一定
      const requiresSupplemental = cls.mRequiresSupplementalResource === 'True'
      const supplementalPerMW =
        (num(cls.mSupplementalToPowerRatio) * SECONDS_PER_MINUTE) / FLUID_INTERNAL_UNIT_SCALE

      const rawFuels: DocsFuelEntry[] = Array.isArray(cls.mFuel)
        ? (cls.mFuel as unknown as DocsFuelEntry[])
        : []
      if (rawFuels.length === 0) warnings.push(`generator ${cls.ClassName}: mFuel is empty`)

      const fuels: GeneratorFuel[] = []
      for (const entry of rawFuels) {
        const fuelId = lastClassToken(entry.mFuelClass)
        const fuel = items.get(fuelId)
        if (!fuel) {
          warnings.push(`generator ${cls.ClassName}: unknown fuel ${entry.mFuelClass ?? ''}`)
          continue
        }
        const energy = energyMJ.get(fuelId) ?? 0
        if (!(energy > 0)) {
          warnings.push(`generator ${cls.ClassName}: fuel ${fuelId} has no mEnergyValue`)
          continue
        }
        const ratePerMin = (powerProductionMW * SECONDS_PER_MINUTE) / energy

        const supplementalId = lastClassToken(entry.mSupplementalResourceClass)
        const supplemental = requiresSupplemental && supplementalId ? items.get(supplementalId) : undefined
        if (requiresSupplemental && supplementalId && !supplemental) {
          warnings.push(`generator ${cls.ClassName}: unknown supplemental ${supplementalId}`)
        }

        const byproductId = lastClassToken(entry.mByproduct)
        const byproductAmount = num(entry.mByproductAmount)
        const byproduct = items.get(byproductId)
        if (byproductId && !byproduct) {
          warnings.push(`generator ${cls.ClassName}: unknown byproduct ${byproductId}`)
        }

        fuels.push({
          item: fuelId,
          ratePerMin,
          ...(supplemental ? { supplementalItem: supplemental.id } : {}),
          supplementalRatePerMin: supplemental ? powerProductionMW * supplementalPerMW : 0,
          ...(byproduct && byproductAmount > 0
            ? {
                byproduct: {
                  item: byproduct.id,
                  amount: byproductAmount,
                  ratePerMin: ratePerMin * byproductAmount,
                },
              }
            : {}),
        })
      }

      generators.push({
        id: cls.ClassName,
        name: localized(cls.ClassName, cls.mDisplayName ?? cls.ClassName),
        category,
        powerProductionMW,
        fuels: fuels.sort((a, b) => a.item.localeCompare(b.item)),
      })
    }
  }
  generators.sort((a, b) => a.id.localeCompare(b.id))
  for (const id of Object.keys(GENERATOR_CATEGORIES)) {
    if (!generators.some((g) => g.id === id)) warnings.push(`generator ${id} was not found in Docs`)
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
  const namesEn = buildNamePack('en', [
    itemList,
    recipes,
    buildingList,
    extractors,
    generators,
    belts,
    pipes,
  ])

  // Tier 2（計画書 §3 の10言語）の names パック。en の pack を作ってから同じキーで引く。
  const tier2Reports: NamePackReport[] = []
  for (const locale of Object.keys(TIER2_DOCS_FILES) as Tier2Locale[]) {
    tier2Reports.push(await buildTier2NamePack(locale, namesEn))
  }

  // --- 出力 ---------------------------------------------------------------
  const meta: DataMeta = {
    schemaVersion: DATA_SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    sourceUrl: SOURCE_BASE_URL,
    generatedAt: new Date().toISOString(),
    counts: { items: itemList.length, recipes: recipes.length, buildings: buildingList.length },
    missingJaNames: [...new Set(missingJaNames)].sort(),
    untranslatedJaNames: [...new Set(untranslatedJaNames)].sort(),
    nameFallbacks: Object.fromEntries(
      tier2Reports.map((report) => [
        report.locale,
        { missing: report.missing.length, sameAsEnglish: report.sameAsEnglish.length },
      ]),
    ),
  }

  await mkdir(OUT_DIR, { recursive: true })
  const write = async (name: string, data: unknown) => {
    await writeFile(join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
  await write('items.json', itemList)
  await write('recipes.json', recipes)
  await write('buildings.json', buildingList)
  await write('extractors.json', extractors)
  await write('generators.json', generators)
  await write('logistics.json', logistics)
  await write('names.en.json', namesEn)
  for (const report of tier2Reports) await write(`names.${report.locale}.json`, report.names)
  await write('meta.json', meta)

  // --- ログ ---------------------------------------------------------------
  console.log(`[build-data] game version : ${GAME_VERSION}`)
  console.log(`[build-data] items        : ${itemList.length}`)
  console.log(`[build-data] recipes      : ${recipes.length} (alternate: ${recipes.filter((r) => r.isAlternate).length})`)
  console.log(`[build-data] buildings    : ${buildingList.length}`)
  console.log(`[build-data] names.en     : ${Object.keys(namesEn).length}`)
  console.log(`[build-data] raw resources: ${itemList.filter((i) => i.isRawResource).length}`)
  console.log(
    `[build-data] footprints   : ${buildingList.filter((b) => b.footprint.areaM2 > 0).length}/` +
      `${buildingList.length} resolved ` +
      `(fallback: ${buildingList.filter((b) => b.footprint.source === 'fallback').length})`,
  )
  console.log(
    `[build-data] extractors   : ${extractors.length} (${extractors
      .map((e) => `${e.name.en}=${e.baseRatePerMin}/min`)
      .join(', ')})`,
  )
  console.log(
    `[build-data] generators   : ${generators.length} (${generators
      .map((g) => `${g.name.en}=${g.powerProductionMW}MW/${g.fuels.length}fuels`)
      .join(', ')})`,
  )
  for (const generator of generators) {
    console.log(
      `[build-data]   ${generator.name.en} (${generator.category}): ${generator.fuels
        .map(
          (f) =>
            `${items.get(f.item)?.name.en ?? f.item} ${round4(f.ratePerMin)}/min` +
            (f.supplementalItem ? ` + ${round4(f.supplementalRatePerMin)} m³/min water` : '') +
            (f.byproduct
              ? ` → ${items.get(f.byproduct.item)?.name.en ?? f.byproduct.item} ${round4(f.byproduct.ratePerMin)}/min`
              : ''),
        )
        .join(' | ')}`,
    )
  }
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

  // 言語別の未訳（＝en フォールバック）状況。計画書 §6-6「フォールバック監査」。
  for (const report of tier2Reports) {
    const total = Object.keys(report.names).length
    const line =
      `[build-data] names.${report.locale.padEnd(7)}: ${total} entries / ` +
      `missing ${report.missing.length} / same as en ${report.sameAsEnglish.length}`
    if (report.missing.length > 0) {
      console.warn(
        `${line} -> fell back to en: ${report.missing.slice(0, 10).join(', ')}` +
          `${report.missing.length > 10 ? ' ...' : ''}`,
      )
    } else {
      console.log(line)
    }
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
      'generators.json / logistics.json / names.en.json / meta.json' +
      ` + ${tier2Reports.length} Tier 2 name packs (${tier2Reports
        .map((report) => `names.${report.locale}.json`)
        .join(', ')}) to src/data/`,
  )
}

/** ログ表示用の丸め（小数4位）。 */
const round4 = (n: number): number => Math.round(n * 10000) / 10000

await main()
