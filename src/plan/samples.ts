/**
 * 初見向けのサンプルプラン。
 *
 * 「何を入れればいいか分からない」で止まる人向けに、ワンクリックで結果まで届く例を置く。
 * 形式は保存/共有と同じ {@link PlanSnapshot} にしてある。理由は2つ:
 *  - 読み込み経路が `parsePlanSnapshot` → `applyPlan` の1本で済む（サンプル専用の投入口を作らない）
 *  - ゲームデータ更新でアイテム/レシピIDが消えても、既存の「無視して警告」に乗って壊れない
 *
 * ID が消えたことに気付けるよう `tests/samples.test.ts` が
 * 「警告ゼロで復元でき、実際に解が出る」ところまで固定している。
 *
 * 代替レシピは**その解で実際に使われるものだけ**を有効にする（テストで担保）。
 * 「全部ON」にすると初見の人が「なぜこのレシピが選ばれたのか」を追えなくなるため。
 */
import { belts, pipes } from '../data/index.ts'
import { DEFAULT_MINER_ID } from '../solver/index.ts'
import { PLAN_SCHEMA_VERSION } from './serialize.ts'
import type { PlanSnapshot } from './serialize.ts'

export const TEMPLATE_CATEGORIES = [
  { id: 'basic', title: '基本ライン' },
  { id: 'loop', title: '循環生産' },
  { id: 'power', title: '発電' },
] as const

export type TemplateCategoryId = (typeof TEMPLATE_CATEGORIES)[number]['id']

export type SamplePlan = {
  id: string
  /** ギャラリー内の分類 */
  category: TemplateCategoryId
  /** ボタンの見出し（＝読み込んだときのプラン名） */
  title: string
  /** ボタンに添える1行説明 */
  description: string
  /** ボタンに出すアイコンのアイテムID（画像が無ければ何も出ない） */
  icon: string
  /** フローチャートに循環が現れることをテストするテンプレート */
  hasCycle?: true
  /** 投入する入力一式 */
  snapshot: PlanSnapshot
}

/** サンプル共通の既定値（採掘機・搬送手段・目的関数）。 */
const DEFAULTS = {
  v: PLAN_SCHEMA_VERSION,
  l: {},
  o: 'resources',
  m: DEFAULT_MINER_ID,
  b: belts.at(-1)!.id,
  p: pipes.at(-1)!.id,
} as const

export const SAMPLE_PLANS: readonly SamplePlan[] = [
  {
    id: 'iron-plate',
    category: 'basic',
    title: 'はじめての鉄板ライン',
    description: '鉄板 60/min。代替レシピなしの最小構成で、鉱石→インゴット→鉄板の流れを見る。',
    icon: 'Desc_IronPlate_C',
    snapshot: {
      ...DEFAULTS,
      n: 'はじめての鉄板ライン',
      t: [['Desc_IronPlate_C', 60]],
      a: [],
    },
  },
  {
    id: 'recycled-plastic',
    category: 'loop',
    title: 'リサイクルでプラスチック増産',
    description:
      'プラスチック 300/min。循環レシピを使うと原油 450/min が 100/min まで下がる。',
    icon: 'Desc_Plastic_C',
    hasCycle: true,
    snapshot: {
      ...DEFAULTS,
      n: 'リサイクルでプラスチック増産',
      t: [['Desc_Plastic_C', 300]],
      // 廃重油 → 希釈燃料 → リサイクル・ゴム / リサイクル・プラスチックの循環。
      // この4つは全部この解で使われる（tests/samples.test.ts で検証）
      a: [
        'Recipe_Alternate_HeavyOilResidue_C',
        'Recipe_Alternate_DilutedFuel_C',
        'Recipe_Alternate_RecycledRubber_C',
        'Recipe_Alternate_Plastic_1_C',
      ],
    },
  },
  {
    id: 'heavy-modular-frame',
    category: 'basic',
    title: 'ヘビー・モジュラー・フレーム工場',
    description:
      'ヘビー・モジュラー・フレーム 10/min。代替レシピなし。中規模工場の建物数と電力が分かる。',
    icon: 'Desc_ModularFrameHeavy_C',
    snapshot: {
      ...DEFAULTS,
      n: 'ヘビー・モジュラー・フレーム工場',
      t: [['Desc_ModularFrameHeavy_C', 10]],
      a: [],
    },
  },
  {
    id: 'oil-loop-complete',
    category: 'loop',
    title: '石油ループ完全版',
    description:
      'プラスチックとゴムを各 300/min。燃料を相互に回す完全なリサイクル循環を学べる。',
    icon: 'Desc_Rubber_C',
    hasCycle: true,
    snapshot: {
      ...DEFAULTS,
      n: '石油ループ完全版',
      t: [
        ['Desc_Plastic_C', 300],
        ['Desc_Rubber_C', 300],
      ],
      a: [
        'Recipe_Alternate_HeavyOilResidue_C',
        'Recipe_Alternate_DilutedFuel_C',
        'Recipe_Alternate_RecycledRubber_C',
        'Recipe_Alternate_Plastic_1_C',
      ],
    },
  },
  {
    id: 'diluted-fuel-power',
    category: 'power',
    title: '希釈燃料発電',
    description: '2,500 MW。原油から廃重油と希釈燃料を経て燃料式発電機へつなぐ流れを学べる。',
    icon: 'Desc_LiquidFuel_C',
    snapshot: {
      ...DEFAULTS,
      n: '希釈燃料発電',
      t: [],
      a: ['Recipe_Alternate_HeavyOilResidue_C', 'Recipe_Alternate_DilutedFuel_C'],
      g: ['Build_GeneratorFuel_C'],
      // v6 は有効な方式ごとに選択燃料を必ず明示する。
      u: { Build_GeneratorFuel_C: ['Desc_LiquidFuel_C'] },
      w: 2500,
    },
  },
  {
    id: 'turbofuel-power',
    category: 'power',
    title: 'ターボ燃料発電',
    description: '2,000 MW。圧縮石炭と燃料からターボ燃料を作る発電チェーンを学べる。',
    icon: 'Desc_LiquidTurboFuel_C',
    snapshot: {
      ...DEFAULTS,
      n: 'ターボ燃料発電',
      t: [],
      a: ['Recipe_Alternate_EnrichedCoal_C', 'Recipe_Alternate_Turbofuel_C'],
      g: ['Build_GeneratorFuel_C'],
      u: { Build_GeneratorFuel_C: ['Desc_LiquidTurboFuel_C'] },
      w: 2000,
    },
  },
  {
    id: 'aluminum-water-loop',
    category: 'loop',
    title: 'アルミ精錬（水循環）',
    description: 'アルミのインゴット 120/min。スクラップ工程の副産物の水を上流で再利用する。',
    icon: 'Desc_AluminumIngot_C',
    hasCycle: true,
    snapshot: {
      ...DEFAULTS,
      n: 'アルミ精錬（水循環）',
      t: [['Desc_AluminumIngot_C', 120]],
      a: [],
    },
  },
  {
    id: 'nuclear-reprocessing',
    category: 'power',
    title: '原子力と再処理',
    description:
      '5,000 MWとFICSONIUM燃料棒 0.1/min。核廃棄物から続く再処理の全段をたどれる。',
    icon: 'Desc_NuclearFuelRod_C',
    snapshot: {
      ...DEFAULTS,
      n: '原子力と再処理',
      // 発電目標だけでは資源最適解が FICSONIUM まで進まないため、少量の併産を指定する。
      t: [['Desc_FicsoniumFuelRod_C', 0.1]],
      a: [],
      g: ['Build_GeneratorNuclear_C'],
      u: {
        Build_GeneratorNuclear_C: [
          'Desc_NuclearFuelRod_C',
          'Desc_PlutoniumFuelRod_C',
          'Desc_FicsoniumFuelRod_C',
        ],
      },
      w: 5000,
    },
  },
]
