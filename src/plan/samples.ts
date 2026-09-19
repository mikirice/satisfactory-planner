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
  { id: 'basic', title: '基本ライン', titleEn: 'Basic Lines' },
  { id: 'special', title: 'ループテンプレート', titleEn: 'Loop Templates' },
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
  /** Stage 1 の英語表示。ゲーム用語は公式名トークンから解決する。 */
  titleEn: string
  descriptionEn: string
  /** ループテンプレートのフローチャートで注目する箇所 */
  highlight?: string
  /** ボタンに出すアイコンのアイテムID（画像が無ければ何も出ない） */
  icon: string
  /** フローチャートに循環が現れることをテストするテンプレート */
  hasCycle?: true
  /** ループモードで結果の上に表示する、このテンプレート固有の解説。 */
  guide?: SampleGuide
  /**
   * 比較の基準にする別テンプレートの id。
   * 指定があれば「代替レシピなしの同じ目標」ではなく、そのテンプレートを解いた結果と比べる
   * （原子力の段階テンプレートは 3 つとも「① ウラン発電」を基準にする）。
   * 基準側は自身の代替レシピ・余りを許さない副産物の設定をそのまま使う。
   */
  baselineId?: string
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
    titleEn: 'Your First {{Desc_IronPlate_C}} Line',
    descriptionEn:
      '60/min with no alternate recipes. Follow {{Desc_OreIron_C}} → {{Desc_IronIngot_C}} → {{Desc_IronPlate_C}}.',
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
    titleEn: 'Boost {{Desc_Plastic_C}} with Recycling',
    descriptionEn:
      '300/min of {{Desc_Plastic_C}}. Recycling cuts {{Desc_LiquidOil_C}} use from 450/min to 100/min.',
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
    titleEn: '{{Desc_ModularFrameHeavy_C}} Factory',
    descriptionEn:
      '10/min with no alternate recipes. See the building count and power for a mid-sized factory.',
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
    titleEn: 'Complete Oil Recycling Loop',
    descriptionEn:
      '300/min each of {{Desc_Plastic_C}} and {{Desc_Rubber_C}}. Learn the complete {{Desc_LiquidFuel_C}} recycling loop.',
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
    titleEn: 'Efficient {{Desc_LiquidFuel_C}} Power',
    descriptionEn:
      '2,500 MW. Follow {{Desc_LiquidOil_C}} through {{Desc_HeavyOilResidue_C}} and {{Recipe_Alternate_DilutedFuel_C}} to generators.',
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
    titleEn: '{{Desc_LiquidTurboFuel_C}} Power',
    descriptionEn:
      '2,000 MW. Learn the power chain from {{Desc_CompactedCoal_C}} and {{Desc_LiquidFuel_C}} to {{Desc_LiquidTurboFuel_C}}.',
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
    titleEn: '{{Desc_AluminumIngot_C}} Water Loop',
    descriptionEn:
      '120/min of {{Desc_AluminumIngot_C}}. Reuse byproduct {{Desc_Water_C}} from the {{Desc_AluminumScrap_C}} step upstream.',
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
    titleEn: 'Packaged {{Desc_LiquidFuel_C}} Canister Loop',
    descriptionEn:
      '120/min of {{Desc_LiquidFuel_C}}. Package {{Desc_Water_C}}, then recover and reuse the empty canisters after dilution.',
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
    titleEn: '{{Desc_Battery_C}} Water Loop',
    descriptionEn:
      '60/min of {{Desc_Battery_C}}. Return byproduct {{Desc_Water_C}} to the {{Desc_AluminaSolution_C}} step.',
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
    id: 'nuclear-uranium',
    category: 'special',
    title: '原子力 ①: ウラン発電',
    description:
      '5,000 MW。ウラン燃料棒だけを燃やす最小の原子力構成。ウラン廃棄物は保管するしかない。',
    titleEn: 'Nuclear, stage 1: uranium power',
    descriptionEn:
      '5,000 MW from {{Desc_NuclearFuelRod_C}} alone, the smallest nuclear setup. The {{Desc_NuclearWaste_C}} has to be stored.',
    highlight: '原子力発電所から出たウラン廃棄物が、どの工程にも戻らず行き止まりになる線に注目。',
    icon: 'Desc_NuclearFuelRod_C',
    guide: {
      sections: {
        mechanism: [
          'ウランを採掘し、硫酸・コンクリートと一緒に混合機へ入れて被覆型ウラン・セルを作ります。硫酸は硫黄と水から精製機で作ります。',
          '硫黄とカテリウム鉱石は、この計算ではSAMを活性SAMにして鉄鉱石・銅鉱石と一緒に変換機へ入れて作ります。採掘できる場所なら採掘機に置き換えられます。',
          '鋼梁とコンクリートからコンクリート被覆型鋼梁を、固定子とAIリミッターから電磁制御棒を組み立てます。',
          '被覆型ウラン・セル・コンクリート被覆型鋼梁・電磁制御棒を製造機へ入れ、ウラン燃料棒にします。',
          'ウラン燃料棒を原子力発電所へ送り、冷却水を配管して発電します。',
          '発電所から出るウラン廃棄物はどの工程にも使い道がないため、ベルトで運び出して保管庫に貯めます。',
        ],
        tips: [
          'ウラン廃棄物はシンクポイントが0で、AWESOMEシンクに流せません。発電を続けるかぎり貯まり続けるので、保管庫を並べる場所を先に決めてください。',
          'ウラン・被覆型ウラン・セル・ウラン燃料棒・ウラン廃棄物は放射線を出します。ベルトと保管庫は通路から離し、ヨウ素注入フィルターを着けて作業してください。',
          '発電計画の燃料を「ウラン燃料棒」だけにし、「残さない」のチェックを全部外した状態がこの段階です。廃棄物の再処理まで進めるときは、燃料にプルトニウム燃料棒を足し、ウラン廃棄物の「残さない」にチェックを入れて ② へ進みます。',
          '原料上限でウランを無制限にしています。原料コストの評価ではウランが最も希少になり、そのままだとSAMとボーキサイトを変換機に入れてウランを作る経路が選ばれるためです。3段とも同じ設定です。硫黄とカテリウム鉱石も採掘で賄いたいときは、SAMの上限を0にしてください。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '原子力 ①: ウラン発電',
      t: [],
      a: [],
      // ウランの上限を外す（希少度コストで変換機経由のウラン生成が選ばれるのを避け、採掘したウランを使う）。
      // 3 段とも同じ設定にして、段の違いを「燃料」と「残さない」だけにする。
      l: { Desc_OreUranium_C: null },
      g: ['Build_GeneratorNuclear_C'],
      u: { Build_GeneratorNuclear_C: ['Desc_NuclearFuelRod_C'] },
      w: 5000,
    },
  },
  {
    id: 'nuclear-plutonium',
    category: 'special',
    title: '原子力 ②: プルトニウムまで再処理',
    description:
      '5,000 MW。ウラン廃棄物を全量プルトニウム燃料棒にして燃やす。残るのはプルトニウム廃棄物だけ。',
    titleEn: 'Nuclear, stage 2: reprocess to plutonium',
    descriptionEn:
      '5,000 MW. Every bit of {{Desc_NuclearWaste_C}} becomes {{Desc_PlutoniumFuelRod_C}} and is burned; only {{Desc_PlutoniumWaste_C}} remains.',
    highlight: 'ウラン廃棄物が非核分裂性ウランへ入り、プルトニウム燃料棒として発電所へ戻る線に注目。',
    icon: 'Desc_PlutoniumFuelRod_C',
    baselineId: 'nuclear-uranium',
    guide: {
      sections: {
        mechanism: [
          '① と同じ工程でウラン燃料棒を作り、原子力発電所で燃やします。',
          '発電所から出るウラン廃棄物を、シリカ・硝酸・硫酸と一緒に混合機へ入れて非核分裂性ウランにします。硝酸は窒素ガス・水・鉄板から混合機で作ります。',
          '非核分裂性ウランとウラン廃棄物を粒子加速器へ入れ、プルトニウム・ペレットを作ります。',
          'プルトニウム・ペレットとコンクリートから被覆型プルトニウム・セルを組み立て、鋼梁・電磁制御棒・ヒートシンクと一緒に製造機でプルトニウム燃料棒にします。',
          'プルトニウム燃料棒を別の原子力発電所で燃やします。その分だけウラン燃料棒で賄う発電量が減り、ウランの採掘量も減ります。',
          'プルトニウム燃料棒を燃やすと出るプルトニウム廃棄物は、この段階では使い道がないため保管庫に貯めます。',
        ],
        tips: [
          'ウラン廃棄物は全量を再処理に回す設定です。再処理ラインが止まると廃棄物が発電所に詰まって発電まで止まるため、混合機の手前にコンテナを置いてバッファにしてください。',
          'プルトニウム廃棄物もシンクポイントが0で処分できません。量はウラン廃棄物よりずっと少ないので、保管庫は少数で足ります。',
          '硫酸と硝酸の2種類の配管が要ります。混合機に入る液体の種類を間違えやすいので、配管の色分けや名前付けをしておくと組み替えが楽になります。',
          '① との違いは、燃料に「プルトニウム燃料棒」を足したことと、ウラン廃棄物の「残さない」にチェックを入れたことの2つだけです。③ へ進むときは燃料にFICSONIUM燃料棒を足し、プルトニウム廃棄物の「残さない」にもチェックを入れます。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '原子力 ②: プルトニウムまで再処理',
      t: [],
      a: [],
      l: { Desc_OreUranium_C: null },
      g: ['Build_GeneratorNuclear_C'],
      u: { Build_GeneratorNuclear_C: ['Desc_NuclearFuelRod_C', 'Desc_PlutoniumFuelRod_C'] },
      w: 5000,
      z: ['Desc_NuclearWaste_C'],
    },
  },
  {
    id: 'nuclear-reprocessing',
    category: 'special',
    title: '原子力 ③: FICSONIUMで完全循環',
    description:
      '5,000 MW。プルトニウム廃棄物までFICSONIUM燃料棒にして燃やし、核廃棄物を1つも残さない。',
    titleEn: 'Nuclear, stage 3: closed loop with {{Desc_Ficsonium_C}}',
    descriptionEn:
      '5,000 MW. {{Desc_PlutoniumWaste_C}} becomes {{Desc_FicsoniumFuelRod_C}} and is burned too, so no nuclear waste is left at all.',
    highlight: 'プルトニウム廃棄物がFICSONIUMを経て燃料棒になり、3種類の燃料棒がすべて発電所へ入る線に注目。',
    icon: 'Desc_FicsoniumFuelRod_C',
    baselineId: 'nuclear-uranium',
    guide: {
      sections: {
        mechanism: [
          '① と同じ工程でウラン燃料棒を、② と同じ工程でプルトニウム燃料棒を作り、それぞれ原子力発電所で燃やします。',
          'プルトニウム燃料棒から出るプルトニウム廃棄物を、シンギュラリティセル・ダークマターの残留物と一緒に粒子加速器へ入れてFICSONIUMにします。',
          'ダークマターの残留物は活性SAMから変換機で作ります。シンギュラリティセルは核パスタ・ダークマターの結晶・鉄板・コンクリートから製造機で組み立てます。',
          'FICSONIUM・電磁制御棒・FICSITEの三角板・励起フォトニック物質を量子エンコーダーへ入れ、FICSONIUM燃料棒にします。副産物のダークマターの残留物はFICSONIUMの工程へ戻します。',
          'FICSONIUM燃料棒を原子力発電所で燃やします。この燃料棒は廃棄物を出さないので、敷地から出ていく核廃棄物がなくなります。',
        ],
        tips: [
          'ウラン廃棄物とプルトニウム廃棄物の両方を全量再処理する設定です。どこかの工程が止まると廃棄物が上流に詰まって発電所まで止まるため、各廃棄物の手前にコンテナを置いてバッファにしてください。',
          '放射性物質は3種類の燃料棒と2種類の廃棄物に増えます。再処理区画は工場本体から離し、壁・距離・ヨウ素注入フィルターで作業者を守ってください。',
          '硫酸・硝酸に加えて、励起フォトニック物質とダークマターの残留物の配管が要ります。起動前に液体・気体を先に流し、粒子加速器と量子エンコーダーが受け入れ可能なことを確認してください。',
          '② との違いは、燃料に「FICSONIUM燃料棒」を足したことと、プルトニウム廃棄物の「残さない」にチェックを入れたことの2つだけです。プルトニウムで止めるときはこの2つを戻します。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '原子力 ③: FICSONIUMで完全循環',
      t: [],
      a: [],
      l: { Desc_OreUranium_C: null },
      g: ['Build_GeneratorNuclear_C'],
      u: {
        Build_GeneratorNuclear_C: [
          'Desc_NuclearFuelRod_C',
          'Desc_PlutoniumFuelRod_C',
          'Desc_FicsoniumFuelRod_C',
        ],
      },
      w: 5000,
      z: ['Desc_NuclearWaste_C', 'Desc_PlutoniumWaste_C'],
    },
  },
  {
    id: 'nuclear-simplified',
    category: 'special',
    title: '原子力発電（代替レシピで簡略化）',
    description:
      '2,500 MW。注入型ウラン・セルで硫酸をなくし、ウラン燃料棒までをベルトだけでつなぐ。',
    titleEn: 'Simplified {{Desc_OreUranium_C}} Power',
    descriptionEn:
      '2,500 MW. {{Recipe_Alternate_UraniumCell_1_C}} keeps {{Desc_SulfuricAcid_C}} out of the chain, so everything up to {{Desc_NuclearFuelRod_C}} runs on belts.',
    highlight: '硫酸の配管がなく、ウランからウラン燃料棒まで一直線に進む線に注目。',
    icon: 'Desc_UraniumCell_C',
    guide: {
      sections: {
        mechanism: [
          'ウランを採掘し、シリカ・硫黄・クイックワイヤーと一緒に製造機へ送ります。硫酸の代わりに、未加工石英とカテリウム鉱石の供給が要ります。',
          '「注入型ウラン・セル」で被覆型ウラン・セルを作ります。硫酸を使わないため、混合機も精製機もラインから消えます。',
          '鋼管とコンクリートから「コンクリート被覆型鋼管」でコンクリート被覆型鋼梁を作り、鋼梁の工程を省きます。',
          '被覆型ウラン・セル・コンクリート被覆型鋼梁・電磁制御棒を製造機へ入れ、ウラン燃料棒にします。',
          'ウラン燃料棒を原子力発電所へ送り、2,500 MWを発電します。配管は発電所の冷却水だけです。',
          '発電で出るウラン廃棄物はベルトで運び、保管庫に貯めます。',
        ],
        tips: [
          'ウラン廃棄物はシンクポイントが0で、AWESOMEシンクでは処分できません。保管庫に貯めるか再処理ラインへ回す前提で、置き場所を先に決めてください。',
          'ウラン・被覆型ウラン・セル・ウラン燃料棒・ウラン廃棄物は放射線を出します。ベルトと保管庫は通路から離し、ヨウ素注入フィルターを着けて作業してください。',
          '代替レシピ「注入型ウラン・セル」「コンクリート被覆型鋼管」はハードドライブの解析で入手します。両方そろってから建て始めると、作り直さずに済みます。',
          'SAMの上限を0にして、変換機でウランを作る経路を使わない構成にしています。ウランを直接採掘できる場所に建ててください。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '原子力発電（代替レシピで簡略化）',
      t: [],
      // 硫酸をなくす（注入型ウラン・セル）／鋼梁の工程を省く（コンクリート被覆型鋼管）の2つだけ。
      // どちらもこの解で実際に使われる（tests/samples.test.ts で検証）
      a: ['Recipe_Alternate_UraniumCell_1_C', 'Recipe_Alternate_EncasedIndustrialBeam_C'],
      // SAM の上限を 0 にして、変換機でウランを作る経路を封じる。
      // ウランを実際に採掘する構成にしないと、簡略化の比較が別チェーンの話になってしまう。
      l: { Desc_SAM_C: 0 },
      g: ['Build_GeneratorNuclear_C'],
      u: { Build_GeneratorNuclear_C: ['Desc_NuclearFuelRod_C'] },
      w: 2500,
    },
  },
]
