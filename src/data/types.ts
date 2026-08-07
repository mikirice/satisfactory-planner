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
