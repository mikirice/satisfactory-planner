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
  { id: 'special', title: 'ループテンプレート' },
] as const

export type TemplateCategoryId = (typeof TEMPLATE_CATEGORIES)[number]['id']

export type SampleGuide = {
  sections: {
    /** 構成が動く順番。初心者がフローチャートを追える短い文にする。 */
    mechanism: string[]
    /** 配管・起動・代替レシピ入手など、実際に建てるときの注意。 */
    tips: string[]
  }
  /** 代替レシピ比較が適さない副産物循環で表示する説明。 */
  circulationMeaning?: string
}

export type SamplePlan = {
  id: string
  /** ギャラリー内の分類 */
  category: TemplateCategoryId
  /** ボタンの見出し（＝読み込んだときのプラン名） */
  title: string
  /** ボタンに添える1行説明 */
  description: string
  /** ループテンプレートのフローチャートで注目する箇所 */
  highlight?: string
  /** ボタンに出すアイコンのアイテムID（画像が無ければ何も出ない） */
  icon: string
  /** フローチャートに循環が現れることをテストするテンプレート */
  hasCycle?: true
  /** ループモードで結果の上に表示する、このテンプレート固有の解説。 */
  guide?: SampleGuide
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
    category: 'basic',
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
    category: 'special',
    title: '石油ループ完全版',
    description:
      'プラスチックとゴムを各 300/min。燃料を相互に回す完全なリサイクル循環を学べる。',
    highlight: 'プラスチックとゴムが互いの材料に戻る往復の線に注目。',
    icon: 'Desc_Rubber_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          '原油を「廃重油」レシピで処理し、廃重油を多く取り出します。',
          '副産物のポリマー樹脂を「残留ゴム」でゴムにし、循環を起動します。',
          '廃重油に水を加え、「希釈燃料」で燃料へ増量します。',
          '燃料とゴムから「リサイクル・プラスチック」を作ります。',
          '燃料とプラスチックから「リサイクル・ゴム」を作ります。',
          'プラスチックとゴムの一部を互いの工程へ戻し、残りを製品として取り出します。',
        ],
        tips: [
          '廃重油と残留ゴムの工程を先に動かし、最初のゴムができてからリサイクル工程へ送ると、手動投入なしで起動できます。',
          '燃料の配管が満ちてから精製機を順に動かすと、停止原因を追いやすくなります。',
        ],
      },
    },
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
    category: 'special',
    title: '希釈燃料発電',
    description: '2,500 MW。原油から廃重油と希釈燃料を経て燃料式発電機へつなぐ流れを学べる。',
    highlight: '廃重油に水を加え、燃料として発電機へ送る線に注目。',
    icon: 'Desc_LiquidFuel_C',
    guide: {
      sections: {
        mechanism: [
          '原油を「廃重油」レシピで処理し、廃重油を多く取り出します。',
          '廃重油と水を混合機へ送り、「希釈燃料」で燃料へ増量します。',
          'できた燃料を燃料式発電機へ送り、連続して発電します。',
        ],
        tips: [
          '水と燃料は別配管にし、揚程が足りない場所にはポンプを置いてください。',
          '発電機は100%運転ならパワーシャード不要です。',
        ],
      },
    },
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
    category: 'special',
    title: 'ターボ燃料発電',
    description: '2,000 MW。圧縮石炭と燃料からターボ燃料を作る発電チェーンを学べる。',
    highlight: '燃料と圧縮石炭がターボ燃料へ合流する線に注目。',
    icon: 'Desc_LiquidTurboFuel_C',
    guide: {
      sections: {
        mechanism: [
          'SAMを「活性SAM」に変え、鉄鉱石と変換機へ入れて硫黄を用意します。',
          '石炭と硫黄から「圧縮石炭」を作ります。',
          '原油を精製して、ターボ燃料の材料になる燃料を用意します。',
          '燃料と圧縮石炭を精製機へ入れ、「ターボ燃料」を作ります。',
          'ターボ燃料を燃料式発電機へ送り、少ない燃料流量で発電します。',
        ],
        tips: [
          '石炭と硫黄は同量ずつ届くようにベルトを分けると、詰まりを見つけやすくなります。',
          '発電機は100%運転ならパワーシャード不要です。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: 'ターボ燃料発電',
      t: [],
      a: [],
      g: ['Build_GeneratorFuel_C'],
      u: { Build_GeneratorFuel_C: ['Desc_LiquidTurboFuel_C'] },
      w: 2000,
    },
  },
  {
    id: 'aluminum-water-loop',
    category: 'special',
    title: 'アルミ精錬（水循環）',
    description: 'アルミのインゴット 120/min。スクラップ工程の副産物の水を上流で再利用する。',
    highlight: 'アルミのスクラップから出た水がアルミナ溶液へ戻る線に注目。',
    icon: 'Desc_AluminumIngot_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          'ボーキサイトと水からアルミナ溶液を作ります。',
          'アルミナ溶液と石炭からアルミのスクラップを作ると、水が副産物として戻ります。',
          '戻った水をアルミナ溶液の工程へ合流させ、取水量を減らします。',
          'アルミのスクラップを精錬し、アルミのインゴットを取り出します。',
        ],
        tips: [
          '起動時は水抽出機から配管を満たし、循環が始まってから取水量を絞ってください。',
          '戻り水を優先して使えるよう、バルブや配管の合流位置で流量を調整します。',
          '副産物の水が詰まると全工程が止まるため、非常用の排出先を用意すると安全です。',
        ],
      },
      circulationMeaning:
        'スクラップ工程で戻る水を上流へ再利用します。下の数値は、外から汲まずに済む循環水量です。',
    },
    snapshot: {
      ...DEFAULTS,
      n: 'アルミ精錬（水循環）',
      t: [['Desc_AluminumIngot_C', 120]],
      a: [],
    },
  },
  {
    id: 'packaged-diluted-fuel-loop',
    category: 'special',
    title: 'パッケージ希釈燃料の容器ループ',
    description: '燃料 120/min。水を容器に詰め、希釈後に空容器を回収して再利用する。',
    highlight: '空の容器が水の包装工程へ戻る線に注目。',
    icon: 'Desc_Fuel_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          '原油から廃重油を取り出し、空の容器へ水を詰めます。',
          '廃重油と容器入りの水から「希釈された容器入り燃料」を作ります。',
          '容器から燃料を取り出すと、空の容器が戻ります。',
          '空の容器を水の包装工程へ戻し、同じ容器を繰り返し使います。',
        ],
        tips: [
          '起動前に、最初の1周ぶんの空の容器を手動投入してください。',
          '循環後は容器を作り続ける必要がないため、容器の供給ベルトを切り離せるようにします。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: 'パッケージ希釈燃料の容器ループ',
      t: [['Desc_LiquidFuel_C', 120]],
      a: ['Recipe_Alternate_HeavyOilResidue_C', 'Recipe_Alternate_DilutedPackagedFuel_C'],
    },
  },
  {
    id: 'battery-water-loop',
    category: 'special',
    title: 'バッテリー製造（水循環）',
    description: 'バッテリー 60/min。製造時に出る水をアルミナ溶液の工程へ戻して再利用する。',
    highlight: 'バッテリーから出た水がアルミナ溶液へ戻る線に注目。',
    icon: 'Desc_Battery_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          'ボーキサイトと水からアルミナ溶液を用意します。',
          '硫黄と水から硫酸を作り、アルミ筐体も別工程で用意します。',
          'アルミナ溶液・硫酸・アルミ筐体からバッテリーを作ると、水が副産物として戻ります。',
          '戻った水をアルミナ溶液の工程へ合流させ、再利用します。',
        ],
        tips: [
          '起動時は外部の水で配管を満たし、バッテリー生産後に戻り水へ切り替えてください。',
          '戻り水が詰まるとバッテリー製造が止まるため、配管に余裕を持たせます。',
          '循環水を優先し、足りない分だけ水抽出機から補う流れにすると安定します。',
        ],
      },
      circulationMeaning:
        'バッテリー工程と上流のアルミ精錬工程で副産物として生じる水をアルミナ溶液へ戻します。下の数値は、ライン全体で外から汲まずに済む循環水量です。',
    },
    snapshot: {
      ...DEFAULTS,
      n: 'バッテリー製造（水循環）',
      t: [['Desc_Battery_C', 60]],
      a: [],
    },
  },
  {
    id: 'nuclear-reprocessing',
    category: 'special',
    title: '原子力と再処理',
    description:
      '5,000 MWとFICSONIUM燃料棒 0.1/min。核廃棄物から続く再処理の全段をたどれる。',
    highlight: 'ウラン廃棄物からFICSONIUM燃料棒まで続く再処理の線に注目。',
    icon: 'Desc_NuclearFuelRod_C',
    guide: {
      sections: {
        mechanism: [
          'ウランを加工してウラン燃料棒を作り、原子力発電所へ送ります。',
          '発電後に出るウラン廃棄物を、非核分裂性ウランなどの再処理工程へ送ります。',
          '再処理した材料からプルトニウム・ペレット、被覆型プルトニウム・セル、燃料棒を順に作ります。',
          'プルトニウム廃棄物をFICSONIUMへ変換し、FICSONIUM燃料棒まで加工します。',
          '発電用に選ばれた核燃料棒を原子力発電所へ送り、FICSONIUM燃料棒は再処理チェーンの終点として取り出します。',
        ],
        tips: [
          '各廃棄物の前に十分なバッファを置き、後段の停止が発電所まで波及しないようにします。',
          '放射線区域は工場本体から離し、壁・距離・ヨウ素注入フィルターで作業者を守ります。',
          '起動前に酸・水・補助素材を先に流し、再処理ラインが受け入れ可能なことを確認してください。',
        ],
      },
    },
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
