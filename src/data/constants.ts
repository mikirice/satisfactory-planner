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

/** 正規化データのスキーマバージョン。破壊的変更時に上げる。 */
export const DATA_SCHEMA_VERSION = 1
