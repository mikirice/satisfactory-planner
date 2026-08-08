/**
 * ゲーム由来の係数を一元管理するファイル。
 *
 * 方針: Docs.json から取得できる値は build-data.ts が個別に読み取って
 * 各エンティティに格納する（例: 建物ごとの powerExponent）。
 * ここに置くのは「Docs.json に現れない」または「フォールバックが必要」な値だけ。
 * ゲームアップデートで係数が変わった場合はこのファイルだけを直す。
 */

/** 1分 = 60秒。レート換算 (amount * SECONDS_PER_MINUTE / durationSec) に使う。 */
export const SECONDS_PER_MINUTE = 60

/**
 * 液体・気体は Docs.json 内で 1000倍の内部単位(mL相当)で格納されている。
 * 正規化時に 1/1000 して m³ に揃える。
 */
export const FLUID_INTERNAL_UNIT_SCALE = 1000

/**
 * オーバークロック時の消費電力指数のフォールバック値。
 * 理論値は log2(2.5) = 1.3219280948873623。
 * Docs.json の mPowerConsumptionExponent は 1.321929 と丸められているため、
 * 実データが取れる場合は必ず建物ごとの powerExponent を使うこと。
 */
export const DEFAULT_POWER_EXPONENT = 1.321929

/**
 * Somersloop（生産ブースト）使用時の消費電力指数のフォールバック値。
 * 消費電力 = 基本電力 * (1 + 使用sloop数 / 最大sloop数) ^ SOMERSLOOP_POWER_EXPONENT
 * Docs.json では mProductionBoostPowerConsumptionExponent。
 */
export const DEFAULT_SOMERSLOOP_POWER_EXPONENT = 2

/** クロック速度の下限（1%）。Docs.json の mMinPotential 相当。 */
export const CLOCK_MIN = 0.01

/**
 * クロック速度の上限（250%）。
 * Docs.json の mMaxPotential は「パワーシャード未装着時の上限 = 1.0」なので、
 * ゲーム内の実上限はここで定義する。
 */
export const CLOCK_MAX = 2.5

/**
 * 資源ノードの純度による抽出レート倍率。
 * Docs.json には現れない（ワールドデータ側の値）ため定数化する。
 * 出典: https://satisfactory.wiki.gg/wiki/Resource_node
 */
export const PURITY_MULTIPLIER = {
  impure: 0.5,
  normal: 1,
  pure: 2,
} as const

/**
 * コンベアベルトの mSpeed → 搬送量(個/分) の換算係数。
 * Docs.json の mSpeed はゲーム内部の「1分あたりの移動量」で、実効スループットはその 1/2。
 * 実測: Mk.1 mSpeed=120 → 60 個/分、Mk.6 mSpeed=2400 → 1200 個/分。
 */
export const BELT_SPEED_TO_ITEMS_PER_MIN = 0.5

/**
 * パイプラインの mFlowLimit → 流量(m³/min) の換算係数。
 * mFlowLimit は m³/秒。実測: Mk.1 mFlowLimit=5 → 300 m³/min。
 */
export const PIPE_FLOW_LIMIT_TO_M3_PER_MIN = SECONDS_PER_MINUTE

/** パワーシャード1個あたりのクロック上昇幅（+50%）。 */
export const CLOCK_STEP_PER_POWER_SHARD = 0.5

/** 1台に装着できるパワーシャードの最大数（3個 = 250%）。 */
export const MAX_POWER_SHARDS_PER_MACHINE = Math.round(
  (CLOCK_MAX - 1) / CLOCK_STEP_PER_POWER_SHARD,
)

/**
 * 画面で選べる製造クロック上限の下限（10%）。
 * ゲーム内は 1% まで下げられる（CLOCK_MIN）が、上限を 1% にすると
 * 「1台の稼働分に100台建てる」ような使い道のない計画になるため UI では 10% で止める。
 */
export const MANUFACTURING_CLOCK_MIN = 0.1

/**
 * 採掘クロックの選択肢。パワーシャード0〜3個ちょうどに対応する刻み。
 * （100% / 150% / 200% / 250%）
 */
export const EXTRACTION_CLOCK_CHOICES: readonly number[] = [1, 1.5, 2, 2.5]

/**
 * Somersloop をフル装着したときの産出倍率（= 1 + 最大数/最大数）。
 * ソルバーの「フル装着バリアント」はこの倍率だけを使う（部分装着は扱わない）。
 */
export const SOMERSLOOP_FULL_OUTPUT_MULTIPLIER = 2

/**
 * ファウンデーション1枚の一辺(m)。8m×8m（Foundation 8m x 4m は高さで、平面は 8×8）。
 * 出典: https://satisfactory.wiki.gg/wiki/Foundation （2026-08-08 参照）
 */
export const FOUNDATION_SIZE_M = 8

/** ファウンデーション1枚の面積(m²)。 */
export const FOUNDATION_AREA_M2 = FOUNDATION_SIZE_M * FOUNDATION_SIZE_M

/**
 * 建物の設置面積合計に掛ける通路・搬送スペースの係数（1.5倍）。
 *
 * 根拠: 建物同士を隙間なく敷き詰めることはできず、ベルト/パイプの取り回しと
 * 歩ける通路が要る。公式Wiki の工場設計ガイドやコミュニティのレイアウト例では
 * 「建物列の間に 2〜4m の通路」を取るのが一般的で、代表的な建物
 * （製作機 8×10m・組立機 9×16m）に 3m の通路を1方向ぶん足すと面積比は 1.3〜1.4 倍、
 * 両方向で 1.6〜1.8 倍になる。その中間として 1.5 を採る。
 * あくまで概算の係数であり、実際のレイアウト次第で上下する。
 */
export const AISLE_AREA_FACTOR = 1.5

/** 正規化データのスキーマバージョン。破壊的変更時に上げる。 */
export const DATA_SCHEMA_VERSION = 3
