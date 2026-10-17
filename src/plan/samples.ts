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
  { id: 'power', title: '発電テンプレート', titleEn: 'Power Templates' },
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
    category: 'power',
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
    category: 'power',
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
    description: 'アルミのインゴット 120個/分を、スクラップ工程から戻る水を使って生産。標準レシピの定常給水は120m³/分。',
    titleEn: '{{Desc_AluminumIngot_C}} Water Loop',
    descriptionEn:
      '120/min of {{Desc_AluminumIngot_C}} with 60 m³/min of returned {{Desc_Water_C}} and 120 m³/min of fresh Water at steady state.',
    highlight: 'アルミナ溶液には180m³/分の水が必要ですが、スクラップ工程から60m³/分が戻るため、外部給水は正味120m³/分で足ります。',
    icon: 'Desc_AluminumIngot_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          '標準レシピでアルミナ溶液を120m³/分作ります。精製機1台ぶんで、ボーキサイト120個/分と水180m³/分を使い、シリカ50個/分も出ます。',
          'アルミのスクラップを180個/分作ります。精製機を50%で動かすとアルミナ溶液120m³/分と石炭60個/分を消費し、水60m³/分が戻ります。',
          '戻り水をアルミナ溶液用の給水ヘッダーへ接続します。総需要180m³/分から戻り水60m³/分を差し引くと、外部給水は正味120m³/分です。',
          '鋳造炉2台でスクラップ180個/分とシリカ150個/分を使い、アルミのインゴット120個/分を作ります。アルミナ工程のシリカ50個/分を引くと、追加で100個/分が必要です。標準シリカレシピなら製作機2と2/3台、粗石英60個/分で補えます。',
        ],
        tips: [
          '起動は上流から行います。揚水ポンプとアルミナ溶液の精製機を先に動かし、溶液が届いてからスクラップ工程を始動。戻り水が流れたら、外部給水を定常値の120m³/分に合わせます。パイプを満たすため一時的に180m³/分を入れる場合は、戻り水が流れ始めたらすぐ120m³/分へ絞ってください。給水過多を続けると水が余り、スクラップ工程の出口が詰まります。',
          '戻り水に「優先順位」を期待せず、外部給水を120m³/分に制限して合流させます。これなら戻り水60m³/分と外部給水120m³/分を合わせて、必要量180m³/分になります。バルブを使う場合は外部給水側に置き、戻り水側を絞らないでください。',
          '止まった工程に合わせて確認します。アルミナ溶液が止まる場合は外部給水と戻り水の合計、ポンプの揚程、電力、ボーキサイトを確認。スクラップだけなら溶液と石炭の供給、副産物水の出口、同じ水系統への戻り、配管や貯水槽の満水による行き止まりを見ます。給水を一時停止して下流に水を消費させ、戻り配管や揚程を直してから給水を120m³/分に戻してください。貯水槽は収支を直しません。Plannerは定常レートを計算しますが、起動中の配管充填、現場の高さ・形状、バルブ位置や閉塞は再現しないため、ゲーム内の配管も確認します。',
          '出典: レシピ値はSatisfactory Community Resources Docsの1.1.xデータ。値は公式コミュニティWiki「Recipes」と照合しています: https://satisfactory.wiki.gg/wiki/Recipes 。配管の揚程・挙動は同Wiki「Pipelines」「Head lift」: https://satisfactory.wiki.gg/wiki/Pipeline ・ https://satisfactory.wiki.gg/wiki/Head_lift 。',
        ],
      },
      circulationMeaning:
        '標準レシピではスクラップ工程が60m³/分の水を返し、すべてをアルミナ溶液に再利用できます。下の数値はこの循環量です。120m³/分の正味給水と混同しないでください。',
    },
    snapshot: {
      ...DEFAULTS,
      n: 'アルミ精錬（水循環）',
      t: [['Desc_AluminumIngot_C', 120]],
      a: [],
      // この例はボーキサイト採掘から始める。Copper/SAM経由の標準レシピへ最適化されないよう制約する。
      l: { Desc_OreCopper_C: 0, Desc_SAM_C: 0 },
    },
  },
  {
    id: 'packaged-diluted-fuel-loop',
    category: 'special',
    title: '容器入り希釈燃料の循環',
    description:
      '燃料 120 m³/min。水 120 m³/min と廃重油 60 m³/min から作り、空キャニスターを 120個/min で循環させる。',
    titleEn: 'Packaged Diluted Fuel Canister Loop',
    descriptionEn:
      '120 m³/min of {{Desc_LiquidFuel_C}} from 120 m³/min {{Desc_Water_C}} and 60 m³/min {{Desc_HeavyOilResidue_C}}, with 120 canisters/min circulating.',
    highlight:
      '水の包装機へ戻る空キャニスターの線がポイントです。このページの容器入り希釈燃料は、混合機で作る液体の希釈燃料とは別レシピです。',
    icon: 'Desc_Fuel_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          '代替: 廃重油を使うと、原油 45 m³/min から廃重油 60 m³/min とポリマー樹脂 30個/min ができます。',
          '充填機2台で水 120 m³/min と空キャニスター 120個/min を包装済み水 120個/min にします。',
          '精製機2台の代替: 容器入り希釈燃料が、廃重油 60 m³/min と包装済み水 120個/min から包装済み燃料 120個/min を作ります。',
          '充填機2台で包装済み燃料を未包装化すると、液体燃料 120 m³/min と空キャニスター 120個/min が戻ります。空キャニスターを水の包装機へ返すと、定常運転の正味消費は 0個/min です。',
          '混合機の代替レシピ「希釈燃料」は廃重油 5 m³ と水 10 m³ から、6秒で液体燃料 10 m³ を作ります。120 m³/minなら必要な水・廃重油量はこの例と同じで、包装・未包装化の工程はありません。',
          '100%クロック、オーバークロックなしなら、容器ループは精製機2台（廃重油用1台を50%）、容器入り希釈燃料用2台、充填機4台の計8台です。液体の希釈燃料は上流を含め計4台（精製機2台、混合機2台）です。',
        ],
        tips: [
          '初回は2台の水包装機へ空キャニスターを2個ずつ入れると、1バッチ分（計4個）を開始できます。実機ではベルトや機械内の余裕を見て、予備も投入してください。',
          '水包装機の入力へ空キャニスターの返却ベルトをつなぎ、起動用の供給ベルトは循環が回った後に切り離せるようにします。',
          '生産が止まったら、未包装燃料の出力から空キャニスターが返っているか、包装済み水が希釈工程へ届いているかを順に確認します。ポリマー樹脂 30/min の搬出先も確保してください。',
          'この定常計算はPlannerに収録した1.1.xゲームデータによるものです。出典と版判定: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md 。起動在庫やベルト・配管の満たし具合はソルバーに含まれず、Update 1.2のレシピ値は未照合です。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '容器入り希釈燃料の循環',
      t: [['Desc_LiquidFuel_C', 120]],
      a: ['Recipe_Alternate_HeavyOilResidue_C', 'Recipe_Alternate_DilutedPackagedFuel_C'],
    },
  },
  {
    id: 'battery-water-loop',
    category: 'special',
    title: 'バッテリー製造（水循環）',
    description: 'バッテリー 60/min。バッテリーとアルミ精錬の副産物水をアルミナ溶液へ戻し、外部水を減らす。',
    titleEn: '{{Desc_Battery_C}} Water Loop',
    descriptionEn:
      '60/min of {{Desc_Battery_C}}. Return byproduct {{Desc_Water_C}} to the {{Desc_AluminaSolution_C}} step.',
    highlight: 'バッテリーとアルミのスクラップから戻る水が、アルミナ溶液の工程へ合流する線に注目。',
    icon: 'Desc_Battery_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          'ボーキサイトと水からアルミナ溶液を作ります。アルミ精錬とバッテリー製造の両方で使います。',
          'アルミナ溶液と石炭からアルミのスクラップを作ると、水が副産物として戻ります。スクラップをアルミのインゴットにし、バッテリー用のアルミ筐体を作ります。',
          '硫黄と水から硫酸を作り、アルミナ溶液・硫酸・アルミ筐体を混合機へ送ってバッテリーを作ります。',
          'バッテリー工程からも水が戻ります。バッテリーとスクラップの戻り水をアルミナ溶液の工程へ合流させ、取水を補います。',
        ],
        tips: [
          'まず外部の水で配管を満たし、アルミ精錬と硫酸の両方を起動します。戻り水が出る前に取水を止めないでください。',
          '戻り水はアルミナ溶液側へ優先して送り、硫酸用の水路は別に保ちます。戻り水が詰まったら、受け側が稼働中か、配管・タンクが満杯でないか、合流部で流れが偏っていないかを確認してください。受け側の消費が止まったまま生産を続けると副産物側が詰まり、後段も停止します。',
          'このサンプルは代替レシピなしです。「クラシック・バッテリー」は 8 秒ごとに硫黄 6・アルミ板 7・プラスチック 8・ワイヤー 12 からバッテリー 4 を作り、水を使わず副産物水も出しません。切り替えるとバッテリー工程由来の 90 m³/min はなくなります。アルミ板のためアルミ精錬は残るのでスクラップ由来の戻り水は続きますが、その量は必要なアルミ板の生産量に応じて変わります。',
          '記事の数値はゲーム同梱 CommunityResources/Docs のミラーから作られた Satisfactory 1.1.x のレシピデータを使った、ビルド時ソルバーの定常流量です。Update 1.2 以降のゲーム内データとは未照合なので、現行ゲームではレシピ表示を優先してください。レシピ流量の合計であり、ゲーム内の配管経路・揚程・液体の過渡挙動・合流部の優先制御までは再現しません。配管の満水化と流量調整はゲーム内で確認してください。出典と版の特定方法: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md （一次データのミラー: https://github.com/aringadre76/satisfactory-api/tree/master/Docs）。',
        ],
      },
      circulationMeaning:
        '下の値は、バッテリー工程と上流のアルミ精錬工程で出る水の合計を、サンプルの目標 60 バッテリー/min で計算したものです。基準レシピでは、バッテリー 60 × 1.5 = 90 m³/min、スクラップ 135 × 2/6 = 45 m³/min、合計 135 m³/min が戻ります。アルミナ溶液は合計 210/min（バッテリー向け 120 + スクラップ向け 90）で、水を 210 × 18/12 = 315 m³/min 消費し、硫酸も 150 m³/min の水を使います。したがって外部水は 315 + 150 − 135 = 330 m³/min 必要です。流量の要約: 戻り水 135（バッテリー 90 + スクラップ 45）→ アルミナ溶液; 外部水 180 → アルミナ溶液、外部水 150 → 硫酸。これは水の副産物量であって、工場全体の自給量ではありません。レシピ値は Satisfactory 1.1.x のゲーム同梱 Docs に基づきます。版判定と取得元は https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md を参照してください。',
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
    category: 'power',
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
    category: 'power',
    title: '原子力 ②: プルトニウムまで再処理',
    description:
      '5,000 MW以上を目標。全発電機が全出力で動くため、この例は3台・7,500 MWとなる。ウラン廃棄物を全量再処理し、残る核廃棄物はプルトニウム廃棄物だけ。',
    titleEn: 'Nuclear, stage 2: reprocess to plutonium',
    descriptionEn:
      '5,000 MW target. Full-output generators make this example a 3-unit, 7,500 MW plant. Every bit of {{Desc_NuclearWaste_C}} is reprocessed; only {{Desc_PlutoniumWaste_C}} remains.',
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
          'プルトニウム燃料棒を追加の原子力発電所で燃やします。この例は発電目標5,000MWに対して3台・7,500MWとなり、ウラン発電機2台はそのまま必要です。したがって、この設定ではウランの採掘量は基準例から減りません。',
          'プルトニウム燃料棒を燃やすと出るプルトニウム廃棄物は、この段階では使い道がないため保管庫に貯めます。',
        ],
        tips: [
          'ウラン廃棄物は全量を再処理に回す設定です。再処理ラインが止まると廃棄物が発電所に詰まって発電まで止まるため、混合機の手前にコンテナを置いてバッファにしてください。',
          'プルトニウム廃棄物もシンクポイントが0で処分できません。量はウラン廃棄物よりずっと少ないので、保管庫は少数で足ります。',
          '硫酸と硝酸の2種類の配管が要ります。混合機に入る液体の種類を間違えやすいので、配管の色分けや名前付けをしておくと組み替えが楽になります。',
          '① との違いは、燃料に「プルトニウム燃料棒」を足したことと、ウラン廃棄物の「残さない」にチェックを入れたことの2つだけです。③ へ進むときは燃料にFICSONIUM燃料棒を足し、プルトニウム廃棄物の「残さない」にもチェックを入れます。発電目標は最低必要量で、バイオマス以外は全出力運転のため目標を超える発電量と燃料消費が発生します。',
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
    category: 'power',
    title: '原子力 ③: FICSONIUMで完全循環',
    description:
      '5,000 MW以上を目標。この設定では整数台数の全出力運転により7台・17,500 MWとなる。ウラン・プルトニウム廃棄物を全量再処理する定常計画。',
    titleEn: 'Nuclear, stage 3: closed loop with {{Desc_Ficsonium_C}}',
    descriptionEn:
      '5,000 MW target. Whole full-output units make this steady-rate plan 7 generators and 17,500 MW. All Uranium and Plutonium Waste is reprocessed.',
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
          '目標は5,000MWですが、この設定では発電機が整数台数で全出力運転するため実際の発電容量は17,500MWです。',
        ],
        tips: [
          'ウラン廃棄物とプルトニウム廃棄物の両方を全量再処理する設定です。どこかの工程が止まると廃棄物が上流に詰まって発電所まで止まるため、各廃棄物の手前にコンテナを置いてバッファにしてください。',
          '放射性物質は3種類の燃料棒と2種類の廃棄物に増えます。再処理区画は工場本体から離し、防護服とヨウ素注入フィルターを使ってください。壁や床は放射線を遮りません。この図は定常状態の物質収支であり、起動時の在庫・配管内の流れ・実際の循環成立まではシミュレーションしません。',
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
    category: 'power',
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
