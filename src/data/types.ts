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

/**
 * 建物の外形（m）。Docs.json の mClearanceData（建設クリアランス）から求めた概算。
 *
 * ゲーム内の「設置に必要な広さ」は当たり判定ではなくクリアランス箱で決まるので、
 * 床面積の概算にはこれを使う。CT_Soft（コンベア接続などの柔らかいクリアランス）と
 * ExcludeForSnapping（スナップ対象外の補助クリアランス）は除いた箱の和を取る。
 */
export type BuildingFootprint = {
  /** X 方向の幅(m) */
  widthM: number
  /** Y 方向の奥行(m) */
  depthM: number
  /** Z 方向の高さ(m) */
  heightM: number
  /** 設置面積(m²) = widthM × depthM */
  areaM2: number
  /** 'docs' = Docs.json 由来 / 'fallback' = Wiki 既知値で補完 */
  source: 'docs' | 'fallback'
}

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
  /** 外形と設置面積（床面積の概算に使う）。 */
  footprint: BuildingFootprint
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
// 発電（generators.json）
// ---------------------------------------------------------------------------

/**
 * 発電機が1種類の燃料を燃やすときの消費・産出（クロック100%・1台あたり）。
 *
 * ゲームは「燃料のエネルギー量(MJ) ÷ 発電量(MW)」で燃焼時間を決めるので、
 * 消費レートは `発電量MW × 60 ÷ 燃料のエネルギー量MJ` になる（build-data.ts で算出）。
 */
export type GeneratorFuel = {
  /** 燃料の Item.id（例: "Desc_Coal_C"） */
  item: string
  /** 燃料の消費レート（個/分 または m³/min） */
  ratePerMin: number
  /** 補助資源の Item.id（石炭発電機・原子力発電所の水）。不要な発電機では undefined */
  supplementalItem?: string
  /** 補助資源の消費レート（m³/min）。不要なら 0 */
  supplementalRatePerMin: number
  /** 副産物（核廃棄物）。出ない燃料では undefined */
  byproduct?: ItemAmount & { ratePerMin: number }
}

/** 発電機の分類（UI の許可チェックの単位）。 */
export type GeneratorCategory =
  /** 石炭発電機（固体燃料 + 水） */
  | 'coal'
  /** 燃料式発電機（液体・気体燃料） */
  | 'fuel'
  /** 原子力発電所（核燃料棒 + 水 → 核廃棄物） */
  | 'nuclear'

/**
 * 発電機の発電パラメータ。
 *
 * レシピには含まれないため Building とは別ファイル（generators.json）に出力する。
 * id は Building.id と同じなので buildingsById で建設コスト・外形（寸法）を引ける
 * （extractors.json と同じ方針。二重に持たせない）。
 *
 * 収録するのは自動供給できる発電機だけ:
 * - バイオマスバーナーは燃料を手動投入する前提なので**除外**
 * - 地熱発電機は出力が間欠変動する（mVariablePowerProductionFactor）ので初期スコープ外
 */
export type Generator = {
  /** Building.id。例: "Build_GeneratorCoal_C" */
  id: string
  name: LocalizedName
  category: GeneratorCategory
  /** クロック100%・1台あたりの発電量(MW) */
  powerProductionMW: number
  /** 使える燃料（Docs.json の mFuel 由来） */
  fuels: GeneratorFuel[]
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
  /**
   * 公式 ja ローカライズが未訳（英語のまま）で、フォールバックを当てた ID 一覧。
   * JA_NAME_OVERRIDES の手当てか「代替:」接頭辞の置換が入っている（scripts/build-data.ts）。
   */
  untranslatedJaNames: string[]
  /**
   * Tier 2 言語の names パックのフォールバック統計（計画書 §6-6）。
   * missing = その言語の Docs にエントリが無く en を使った件数、
   * sameAsEnglish = 訳はあるが英語と同一文字列だった件数（固有表記を含むため警告にはしない）。
   */
  nameFallbacks: Record<string, { missing: number; sameAsEnglish: number }>
}
