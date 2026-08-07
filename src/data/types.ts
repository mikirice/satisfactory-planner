/**
 * 正規化データのスキーマ定義（仕様書ドラフト-v0 §3.2 準拠）。
 * scripts/build-data.ts が生成する JSON はこの型に一致する。
 */

export type Lang = 'ja' | 'en'

export type LocalizedName = Record<Lang, string>

export type ItemForm = 'solid' | 'liquid' | 'gas'

export type Item = {
  /** Docs.json の ClassName。例: "Desc_IronPlate_C" */
  id: string
  name: LocalizedName
  form: ItemForm
  /** AWESOME Sink のポイント。0 = シンク不可。 */
  sinkPoints: number
  /**
   * 原料（マップから直接採取するアイテム）か。
   * Docs.json の NativeClass=FGResourceDescriptor に一致するもの（1.1.x では13種）。
   * LP では「レシピでは作れない外部入力」として扱う。
   */
  isRawResource: boolean
  /** アイコンのアセット名（拡張子なし）。画像自体は同梱しない（Phase 5で判断）。 */
  icon: string
}

export type ItemAmount = {
  /** Item.id */
  item: string
  /** 1サイクルあたりの個数。液体・気体は m³ に正規化済み。 */
  amount: number
}

/** 可変電力レシピ（粒子加速器など）の消費電力レンジ。 */
export type VariablePower = {
  /** 最小消費電力(MW) = mVariablePowerConsumptionConstant */
  minMW: number
  /** 最大消費電力(MW) = constant + factor */
  maxMW: number
}

export type Recipe = {
  /** Docs.json の ClassName。例: "Recipe_IronPlate_C" */
  id: string
  name: LocalizedName
  /** 代替レシピか（Recipe_Alternate_* / "Alternate: " 接頭辞） */
  isAlternate: boolean
  /** Building.id。例: "Build_ConstructorMk1_C" */
  producedIn: string
  /** 1サイクルの所要秒数（クロック100%時） */
  durationSec: number
  ingredients: ItemAmount[]
  products: ItemAmount[]
  /** 可変電力の建物で生産される場合のみ。レート(個/分) = amount * 60 / durationSec */
  variablePower?: VariablePower
}

export type BuildingCategory =
  | 'manufacturer'
  | 'extractor'
  | 'generator'

export type Building = {
  /** Docs.json の ClassName。例: "Build_ConstructorMk1_C" */
  id: string
  name: LocalizedName
  category: BuildingCategory
  /** 100%クロック時の消費電力(MW)。可変電力の建物は 0 近辺になるので variablePower を見る。 */
  powerConsumptionMW: number
  /** オーバークロック時の電力指数（通常 1.321929） */
  powerExponent: number
  /** Somersloop スロット数。0 = 非対応。 */
  maxSomersloops: number
  /** Somersloop 使用時の電力指数（通常 2） */
  somersloopPowerExponent: number
  /** 建設コスト（建設レシピの材料）。解決できなかった場合は空配列。 */
  buildCost: ItemAmount[]
  /** 発電施設のみ: 発電量(MW) */
  powerProductionMW?: number
  /** 可変電力の建物のみ: 推定消費電力レンジ(MW) */
  variablePower?: VariablePower
}

// ---------------------------------------------------------------------------
// 採掘・抽出（extractors.json）
// ---------------------------------------------------------------------------

export type ExtractorCategory =
  /** 採掘機 Mk.1〜3（固体ノード） */
  | 'miner'
  /** 石油採掘機 */
  | 'oilExtractor'
  /** 水の汲み上げ機（純度の概念なし） */
  | 'waterExtractor'
  /** 資源井戸エクストラクター（サテライトノードに設置） */
  | 'wellExtractor'
  /** 資源井戸加圧機（自身は抽出しない。電力と圧力を供給する） */
  | 'wellPressurizer'

/**
 * 採掘・抽出設備の抽出パラメータ。
 * レシピには含まれないため Building とは別ファイル（extractors.json）に出力する。
 * id は Building.id と同じなので buildingsById で建設コスト等を引ける。
 */
export type Extractor = {
  /** Building.id。例: "Build_MinerMk1_C" */
  id: string
  name: LocalizedName
  category: ExtractorCategory
  /** 1サイクルの抽出量。液体・気体は m³ に正規化済み。加圧機は 0。 */
  itemsPerCycle: number
  /** 1サイクルの所要秒数（クロック100%時）。加圧機は 0。 */
  extractCycleTimeSec: number
  /**
   * 純度 Normal・クロック100% での抽出レート（個/分 または m³/min）。
   * = itemsPerCycle * 60 / extractCycleTimeSec
   */
  baseRatePerMin: number
  powerConsumptionMW: number
  powerExponent: number
  /** 抽出できるアイテムID。null = 種別の制限なし（採掘機はすべての固体ノード） */
  allowedResources: string[] | null
  /** 抽出できるアイテムの形態 */
  allowedForms: ItemForm[]
  /** 純度倍率の影響を受けるか（水の汲み上げ機は受けない） */
  purityAffected: boolean
}

// ---------------------------------------------------------------------------
// 物流（logistics.json）
// ---------------------------------------------------------------------------

/** コンベアベルト（Mk.1〜6）。 */
export type Belt = {
  id: string
  name: LocalizedName
  /** 搬送上限（個/分） */
  itemsPerMin: number
}

/** パイプライン（Mk.1〜2）。 */
export type Pipe = {
  id: string
  name: LocalizedName
  /** 流量上限（m³/min） */
  m3PerMin: number
}

export type Logistics = {
  belts: Belt[]
  pipes: Pipe[]
}

/** 生成メタ情報（データ再生成の追跡用） */
export type DataMeta = {
  schemaVersion: number
  /** 元データのゲームバージョン（DATA_SOURCES.md 参照） */
  gameVersion: string
  sourceUrl: string
  generatedAt: string
  counts: {
    items: number
    recipes: number
    buildings: number
  }
  /** ja 名が取得できず en でフォールバックした ID 一覧 */
  missingJaNames: string[]
}
