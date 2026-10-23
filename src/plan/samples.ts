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
  /** Last article update date for JSON-LD; omit unless the guide was materially revised. */
  updatedDate?: string
  sections: {
    /** 構成が動く順番。初心者がフローチャートを追える短い文にする。 */
    mechanism: string[]
    /** 配管・起動・代替レシピ入手など、実際に建てるときの注意。 */
    tips: string[]
  }
  /** レシピやゲーム内挙動の根拠として静的ガイドに表示するリンク。 */
  sources?: { label: string; href: string }[]
  /** Localized gameplay context image rendered inside the bilingual loop article. */
  illustration?: {
    src: string
    width: number
    height: number
    alt: string
    caption: string
    creditLinks: { label: string; href: string }[]
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

/** サンプル共通の既定値（採鉱機・搬送手段・目的関数）。 */
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
    title: '完全石油リサイクル',
    description:
      '廃重油・希釈燃料・残留ゴム・2つのリサイクル代替レシピで、プラスチックとゴムを各 300/min 作る定常収支を解説。',
    titleEn: 'Complete Oil Recycling Loop',
    descriptionEn:
      '300/min each of {{Desc_Plastic_C}} and {{Desc_Rubber_C}}. Learn the complete {{Desc_LiquidFuel_C}} recycling loop.',
    highlight: '燃料は両方のリサイクル工程に全量戻り、製品として出るのはプラスチックとゴム各 300/min。',
    icon: 'Desc_Rubber_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          'この例は「廃重油」「希釈燃料」「リサイクル・プラスチック」「リサイクル・ゴム」の4つの代替レシピを有効にした定常計算です。「残留ゴム」は通常レシピです。',
          '原油 200 m³/min から廃重油 266.67 m³/min とポリマー樹脂 133.33/min を作ります。廃重油は混合機の「希釈燃料」へ全量送り、水 533.33 m³/min と合わせて燃料 533.33 m³/min にします。',
          'ポリマー樹脂 133.33/min と水 133.33 m³/min を「残留ゴム」に入れ、ゴム 66.67/min を作ります。水の合計は 666.67 m³/min です。',
          '「リサイクル・プラスチック」はゴム 277.78/min と燃料 277.78/min を使い、プラスチック 555.56/min を出します。うち 255.56/min を「リサイクル・ゴム」に戻し、300/min を製品にします。',
          '「リサイクル・ゴム」はプラスチック 255.56/min と燃料 255.56/min を使い、ゴム 511.11/min を出します。残留ゴム分を足したゴム 577.78/min のうち 277.78/min を戻し、300/min を製品にします。',
          '燃料 533.33 m³/min は2つのリサイクル工程に全量消費されます。計画上の製造建物は精製機30棟と混合機6棟の計36棟で、原油抽出機・揚水ポンプは含みません。',
        ],
        tips: [
          '定常計算に初期在庫は含まれません。標準設定で再生プラスチック側10棟・再生ゴム側9棟を一斉に最初の1バッチ動かすなら、ゴム60個・プラスチック54個と燃料114個が必要です。まず樹脂からゴムと燃料の在庫を作り、片側を先に動かして必要在庫をためてからもう片側を起動します。',
          '樹脂は残留ゴムへ優先し、余剰だけを一時保管または廃棄先へ送ります。起動前に樹脂をすべて逃がすと、ゴムの種が作れません。',
          '循環へ戻すベルト・配管を製品取り出しより優先します。製品側が詰まったら各戻り量、燃料の分配、樹脂の行き先を確認してください。戻り先が止まると中間品が詰まり、原油処理まで止まることがあります。',
          'これはレシピ比率を使った連続定常計算です。在庫、レシピ周期のずれ、ベルトや配管の充填・流量、揚程、実際の停止挙動はシミュレーションしません。ゲーム内では小さく段階起動し、流れを確認してください。代替レシピが揃わない場合は同じ建物数・収支にならないため、レシピを選び直して再計算します。レシピ数値はSatisfactory 1.1.xのゲーム同梱CommunityResources/Docsを使用しています。版判定と取得元: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md 。ゲーム同梱Docsのミラー: https://github.com/aringadre76/satisfactory-api/tree/master/Docs 。',
        ],
      },
    },
    snapshot: {
      ...DEFAULTS,
      n: '完全石油リサイクル',
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
    description: '2,500 MW。原油75 m³/minから燃料200 m³/minを作る希釈燃料発電の収支、設備数、起動手順を確認できる。',
    titleEn: 'Efficient {{Desc_LiquidFuel_C}} Power',
    descriptionEn:
      '2,500 MW. Follow {{Desc_LiquidOil_C}} through {{Desc_HeavyOilResidue_C}} and {{Recipe_Alternate_DilutedFuel_C}} to generators.',
    highlight: '原油75 m³/minから廃重油100 m³/minを作り、水200 m³/minと混ぜて燃料200 m³/minにする収支に注目。',
    icon: 'Desc_LiquidFuel_C',
    guide: {
      sections: {
        mechanism: [
          'この計画はSatisfactory Plannerに収録した1.1.xのレシピデータを使い、燃料式発電機の総出力を2,500 MWに設定した例です。10台の発電機が定格運転すると、燃料を合計200 m³/min消費します。',
          '代替レシピ「廃重油」は原油3 m³/minから廃重油4 m³/minとポリマー樹脂2個/minを作ります。原油75 m³/minを精製機2.5台相当で処理すると、廃重油100 m³/minとポリマー樹脂50個/minが出ます。実機では精製機3台を建て、2台を100%、1台を83⅓%に設定できます。',
          '代替レシピ「希釈燃料」は廃重油5 m³/minと水10 m³/minから燃料10 m³/minを作ります。混合機2台で廃重油100 m³/minと水200 m³/minを処理し、燃料200 m³/minを発電機へ送ります。',
          '燃料式発電機1台は燃料20 m³/minを使って250 MWを出します。10台なら燃料200 m³/minで合計2,500 MWです。これは発電機の定格出力の合計で、製造工程の電力を差し引いた電力ではありません。',
          '設備の基準消費電力は精製機2.5台相当で75 MW、混合機2台で150 MW、合計225 MWです。発電からこの製造電力だけを引くと2,275 MWが残ります。原油・水の採取設備、配管ポンプ、発電所外の工場消費は含まないため、実際に使える余力はさらに小さくなります。',
        ],
        tips: [
          '必要なレシピを先に解放してください。「廃重油」と「希釈燃料」はハードドライブの代替レシピ候補です。どちらかが未解放ならこの収支では組めないため、所持レシピに合わせて再計算します。計算値は同梱データソース記録にある1.1.xのゲーム同梱Community Resources Docsに基づき、1.2以降のレシピ値は未照合です。データ版とレシピの出典は下記のリンクを参照してください。',
          '起動時は既存の電力網かバイオマス発電機で水・原油の採取機、精製機、混合機へ先に給電します。燃料を作り、燃料配管と発電機入力まで満たして流量が安定してから発電機を主電力網へ接続します。水200 m³/minと燃料200 m³/minは別系統にし、Mk.1パイプの公称上限300 m³/min以内に収めます。ただし高低差、ポンプの揚程、分岐の偏りで実流量は落ちるため、発電機列へ均等に分配し、パイプが満ちるまでは負荷を段階的に増やしてください。製造設備が無電力のままでは燃料発電だけで自力起動できません。',
          '精製機から出るポリマー樹脂50個/minは保管、シンク、樹脂を使う製造工程へ送り、出口を塞がないようにします。停止したら発電機入力の燃料から確認し、供給不足なら混合機の水・廃重油、次に精製機の原油と樹脂出口を見ます。機械が動いているのに発電が不足する場合は、採取機・ポンプの給電、配管の揚程、電力網の総需要を切り分けます。',
          '停止時は発電機を切り離すか負荷を減らしてから、燃料製造設備を止めます。再起動用の燃料を残すならバッファへ確保してください。Plannerは毎分の定常収支とレシピ台数を解きますが、配管充填、機械在庫、始動用燃料、揚程、詰まり、瞬間的な需要は再現しません。精製機は2.5台相当でも実機3台（うち1台83⅓%）、混合機2台が必要です。発電機は整数台を100%クロックで数えるため手動アンダークロックも未対応です。発電機仕様と配管の出典は下記リンクを参照してください。',
        ],
      },
      sources: [
        { label: 'ゲームデータの出典と対象バージョン（Satisfactory Planner）', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
        { label: '燃料式発電機（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
        { label: '廃重油のレシピ（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Heavy_Oil_Residue' },
        { label: '希釈燃料のレシピ（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Diluted_Fuel' },
        { label: 'パイプの流量と揚程（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Pipeline' },
      ],
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
    description: '2,000 MW。原油108・石炭48・硫黄48/minからターボ燃料60 m³/minを作る手順と、変換機を含む電力収支を確認できる。',
    titleEn: '{{Desc_LiquidTurboFuel_C}} Power',
    descriptionEn:
      '2,000 MW gross. Turn 108 m³/min of {{Desc_LiquidOil_C}}, 48 {{Desc_Coal_C}}/min and 48 {{Desc_Sulfur_C}}/min into 60 m³/min of {{Desc_LiquidTurboFuel_C}}, including the Converter power range.',
    highlight: '燃料72 m³/minと圧縮石炭48個/minが精製機へ入り、ターボ燃料60 m³/minへ合流する収支に注目。',
    icon: 'Desc_LiquidTurboFuel_C',
    guide: {
      sections: {
        mechanism: [
          'この計画はSatisfactory Plannerに収録した1.1.xのレシピデータを使い、燃料式発電機の総出力を2,000 MWに設定した例です。8台の発電機がターボ燃料を合計60 m³/min消費します。',
          '精製機のターボ燃料レシピは、燃料6 m³/minと圧縮石炭4個/minからターボ燃料5 m³/minを作ります。60 m³/minを作るには燃料72 m³/minと圧縮石炭48個/minが必要です。精製機3.2台相当を使い、ゲーム内では4台のうち3台を100%、1台を80%にします。',
          '標準の燃料レシピは原油6 m³/minから燃料4 m³/minとポリマー樹脂3個/minを作ります。燃料72 m³/minには原油108 m³/minが必要で、精製機1.8台相当（2台を100%と80%ではなく、90%ずつなら合計1.8台分）が目安です。樹脂54個/minも出るため搬出先を用意します。',
          '組立機の圧縮石炭レシピは石炭5個/minと硫黄5個/minから圧縮石炭5個/minを作ります。48個/minには石炭と硫黄が各48個/min必要で、組立機1.92台相当です。',
          '硫黄（鉄）レシピは変換機で活性SAM 1個/minと鉄鉱石30個/minから硫黄12個/minを作ります。必要な硫黄48個/minを作るには、活性SAM 4個/min、鉄鉱石120個/minを投入します。活性SAMは生SAM16個/minから製作機で4個/min作ります。',
          '発電機8台の定格出力は2,000 MWです。レシピを100%クロック相当でそろえた製造設備の消費電力は標準値279.3 MW（変換機の変動を含む範囲219.3〜339.3 MW）で、差し引きの計算上は1,720.7 MW（範囲1,660.7〜1,780.7 MW）が残ります。採鉱機や揚水機、配管ポンプ、ほかの工場負荷は含まれません。',
        ],
        tips: [
          '「圧縮石炭」と「ターボ燃料」はMAMの硫黄研究で解放します。この構成の硫黄製造には変換機（ティア9の物質変換）と活性SAMが必要です。活性SAMはMAMの異星技術研究、またはティア9で入手条件を確認してください。計算レートは収録済みの1.1.xデータに基づき、アップデート1.2以降のレシピ値は未照合です。レシピが揃う前は通常燃料発電を先に建て、セーブで解放済みの燃料だけをPlannerで選び直します。',
          '立ち上げは旧電力網かバイオマス発電機で始めます。生SAMを製作機へ、活性SAMと鉄鉱石を変換機へ、石炭と硫黄を組立機へ流し、原油の精製から燃料・ターボ燃料までを順に稼働させます。燃料とターボ燃料の配管を満たして発電機入口まで届いたら発電機列を接続し、安定後に仮設電源を外します。',
          '石炭48/minと硫黄48/minは別ベルトで組立機へ送り、詰まりと欠品を見分けやすくします。燃料72 m³/min、ターボ燃料60 m³/minは別配管に分け、各発電機に偏りなく分配します。出力が落ちたら発電機入口のターボ燃料、精製機の燃料・圧縮石炭、組立機の石炭・硫黄、変換機の活性SAM・鉄鉱石の順で確認します。燃料製造中に樹脂出口が詰まっていないかも確認してください。',
          'Plannerの「機械数」はレシピを100%で動かした場合の相当台数です。建設時の目安は発電機8台、ターボ燃料精製機4台（1台80%）、燃料精製機2台（合計1.8台分）、圧縮石炭の組立機2台（合計1.92台分）、変換機1台（40%）、活性SAMの製作機1台（約13⅓%）で計18台です。機械の通常消費電力を使った発電差し引きは1,720.7 MWですが、個別クロック適用後はPlanner表示で約1,755.3 MW相当（変換機の幅を含め約1,710.6〜1,800.0 MW）。実際の採掘設備や配管ポンプの電力はここからさらに引いてください。Plannerは定常レートを解き、配管充填、在庫、揚程、起動時の流量や詰まりを再現しません。停止時はまず発電機負荷を切り離し、再起動用にターボ燃料を残してから製造設備を止めます。',
        ],
      },
      sources: [
        { label: 'ゲームデータの出典と対象バージョン（Satisfactory Planner）', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
        { label: 'ターボ燃料と解放（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Turbofuel' },
        { label: '圧縮石炭とMAM研究（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Compacted_Coal' },
        { label: '活性SAMと変換機レシピ（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/RSAM' },
        { label: '燃料式発電機（英語・Satisfactory Wiki）', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
      ],
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
      updatedDate: '2026-10-17',
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
      illustration: {
        src: '/article-images/official-straight-pipes-1.1.jpg',
        width: 1920,
        height: 1080,
        alt: '複数の流体配管が工場内を通る様子を示す公式ゲーム画面。',
        caption: '公式Press Kitの配管配置の一般例です。画像はアルミ精錬や本記事の水循環を示していません。',
        creditLinks: [
          { label: 'Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
          { label: '元画像: straight-pipes.jpg', href: 'https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view' },
        ],
      },
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
      '収録データ1.1.xの定常例。原油45 m³/min、水120 m³/minから液体燃料120 m³/minを作り、空の容器120個/minを戻します。',
    titleEn: 'Packaged Diluted Fuel Canister Loop',
    descriptionEn:
      'Fixed 1.1.x-data example: 120 m³/min of liquid Fuel from 45 m³/min of Crude Oil and 120 m³/min of Water, returning 120 Empty Canisters/min.',
    highlight:
      '包装済み水・容器入り希釈燃料・燃料の各工程と、空の容器の戻り先を追います。混合機で作る代替: 希釈燃料とは別のレシピです。',
    icon: 'Desc_Fuel_C',
    hasCycle: true,
    guide: {
      sections: {
        mechanism: [
          '代替「廃重油」は精製機で原油 3 m³から6秒ごとに廃重油 4 m³と合成樹脂 2個を作ります。原油 45 m³/minを入れると15サイクル/minとなり、廃重油 60 m³/minと合成樹脂 30個/minが出ます。稼働率換算で精製機 1.5台分です。',
          '水の「包装済み水」レシピは、充填機で水2 m³と空の容器2個を2秒ごとに包装済み水2個へ変えます。2台なら包装済み水120個/minを作り、水120 m³/minと空の容器120個/minを消費します。',
          '代替「容器入り希釈燃料」は精製機で廃重油1 m³と包装済み水2個を2秒ごとに処理し、ゲームデータ上の品目名「包装済み燃料」（Desc_Fuel_C）を1サイクルで2個作ります。2台で毎分60サイクルとなり、包装済み燃料120個/min、廃重油60 m³/min、包装済み水120個/minです。',
          '「未包装燃料」は充填機で包装済み燃料2個を液体燃料2 m³と空の容器2個へ戻します。2台で液体燃料120 m³/minと空の容器120個/minを出し、空の容器を水の包装機へ返すと、収支上の定常ネット消費は0個/minです。',
          'この例を100%クロック相当で組むと、廃重油用の精製機は1台を100%、もう1台を50%、容器入り希釈燃料用の精製機は2台、充填機は包装水2台と未包装燃料2台の計4台です。建物数は合計8台。合成樹脂の搬出先として毎分30個を確保してください。',
          'Plannerで例を開き、2つの代替レシピを有効にして液体燃料120 m³/minを指定します。収支を確認したら、原油から廃重油・合成樹脂を作る精製機と合成樹脂の搬出先、水を包装する充填機、包装済み水と廃重油を処理する精製機、包装済み燃料を未包装化する充填機の順に用意します。各工程へ入力をつなぎ、未包装機の出力から水包装機へ空の容器を戻します。レシピを解放していない場合は使えるレシピに切り替えて再計算し、ここにある台数と流量をそのまま使わないでください。',
        ],
        tips: [
          '起動時は、2台の水包装機へ空の容器を2個ずつ入れると、各機械の最初の1バッチ（合計4個）を始められます。これはレシピ1回分の計算で、ベルト内・機械内の在庫や起動待ち時間を含む実機の十分量ではありません。ループが戻るまでに途切れるなら、必要な予備を別途追加します。',
          '起動用の容器供給は一時ベルトにし、未包装燃料の充填機から戻る空の容器を水包装機の入力へ接続します。返却ベルトを外すと初期在庫を使い切った時点で包装が止まるため、外す前に戻りを確認してください。',
          '水包装機が止まる場合は、水と空の容器の両方が届くか、返却ベルトが途切れていないかを確認します。容器入り希釈燃料の精製機は廃重油配管と包装済み水のベルト、液体燃料が出ないときは包装済み燃料の搬送と未包装燃料の充填機を確認します。原油を処理する精製機が止まったら、原油入力と合成樹脂の出口を確認します。出力先を空けても戻らない場合は、電源・選択レシピ・入力在庫を一つずつ調べ、全工程を同時に変更しないでください。',
          'Plannerは毎分の定常収支を解きますが、最初の容器在庫、搬送ベルトや配管の充填、実際の機械起動順・詰まりは再現しません。数値はSatisfactory 1.1.xの同梱Docsから生成された固定データに基づきます。Coffee Stainの公式Update 1.2告知と1.2.4.1告知はアップデート概要・修正内容を示しますが、この記事の個別レシピ値を検証する資料ではありません。1.2以降のゲーム内レシピは別途照合が必要です。データの取得元・版判定: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md 。Update 1.2公式告知: https://coffeestain.com/news/satisfactory-1-2-update-out-now/ 。1.2.4.1公式パッチ告知: https://steamcommunity.com/games/526870/announcements/detail/1846018067941164 。',
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
          '記事の数値はゲームに同梱されたCommunityResources/Docsのミラーから作られたSatisfactory 1.1.xのレシピデータを使った、ビルド時ソルバーの定常流量です。アップデート1.2以降のゲーム内データとは未照合なので、現行ゲームではレシピ表示を優先してください。レシピ流量の合計であり、ゲーム内の配管経路・揚程・液体の過渡挙動・合流部の優先制御までは再現しません。配管の満水化と流量調整はゲーム内で確認してください。出典と版の特定方法: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md （一次データのミラー: https://github.com/aringadre76/satisfactory-api/tree/master/Docs）。',
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
      'ウラン燃料棒だけで最低5,000 MW。原子力発電所2台が全出力で動き、ウラン廃棄物20個/分は保管します。',
    titleEn: 'Nuclear, stage 1: uranium power',
    descriptionEn:
      'Two full-output plants deliver the 5,000 MW minimum from Uranium Fuel Rod alone and leave 20 Uranium Waste/min to store.',
    highlight: '原子力発電所から出たウラン廃棄物が、どの工程にも戻らず行き止まりになる線に注目。',
    icon: 'Desc_NuclearFuelRod_C',
    guide: {
      sections: {
        mechanism: [
          'これはPlanner同梱のSatisfactory 1.1.xレシピで解いた定常計画です。目標5,000 MWを満たす原子力発電所は2台、各2,500 MW。燃料はウラン燃料棒0.4本/分、発電所の冷却水は合計480 m³/分です。',
          'この条件ではウラン鉱石40個/分を採掘してウラン燃料棒にし、各発電所からウラン廃棄物が10個/分、合計20個/分出ます。硫黄・カテリウム鉱石はサンプル設定によりSAMと鉱石を変換機へ入れて作るため、SAMを16個/分使います。',
          '実際の順序は、外部電源で採掘・硫酸・セル・燃料棒のラインを動かし、冷却水を配管してから、燃料棒を入れた2台の発電所を起動します。水の精製工程にも水が要るため、結果タブの水資源は冷却水だけでなく正味504 m³/分です。',
          'ウラン廃棄物の出口はありません。2台を動かし続けるなら20個/分を運び出して保管します。この段階のプランは再処理を有効にしていません。',
          'どの段階を選ぶかは「発電所の定格」だけでは決まりません。1.1.xサンプルでは、ウランのみは5,000 MW・ウラン廃棄物20個/分を保管、プルトニウム段階は7,500 MW・プルトニウム廃棄物1個/分を保管、FICSONIUMまでの完全循環は17,500 MWで核廃棄物2種を燃料に戻します。簡略化サンプルは2,500 MWで、注入型ウラン・セル等の代替レシピによって硫酸工程を省きます。目標出力、再処理材料、廃棄物を保管できる場所、解放済みレシピの4条件から選んでください。これらは同じサンプルデータの定常計算で、現行ゲームの実測ではありません。',
        ],
        tips: [
          '初回は原子炉を起動できる系統電源を用意し、燃料棒を外からラインに入れてください。プランナーは起動時在庫や機械のレシピ周期を計算しないため、予備燃料棒の正確な本数はこの定常計画からは出ません。再処理機をつなぐ前に発電所から廃棄物が流れることを確認します。',
          'ウラン廃棄物はこのデータでシンクポイント0です。AWESOMEシンクへ流せず、20個/分の保管先が満杯になると発電所の出口が詰まります。出力が落ちたら燃料棒、冷却水、廃棄物ベルトと保管先の順に確認してください。放射性物質は通路から離し、危険物防護服とヨウ素注入フィルターを用意します。',
          '保管方式からプルトニウム再処理へ進むときは、まず20個/分のウラン廃棄物出口に詰まりがない状態を保ち、その後に非核分裂性ウラン・プルトニウム燃料棒の各入力と、最後に1個/分のプルトニウム廃棄物の保管先を確認します。FICSONIUMを選ぶなら、プルトニウム廃棄物と追加材料の供給が整うまで下流を接続せず、バッファの増加を監視します。いずれも同梱1.1.xレシピに基づく案です。',
          '「原子力 ②」へ進むときは発電機の燃料にプルトニウム燃料棒を追加し、ウラン廃棄物の「残さない」を有効にします。ウラン上限は無制限、他の鉱石はサンプル既定値です。硫黄とカテリウムを採掘で調達したい場合はSAM上限を0にしてください。',
          '数値は1.1.xのゲームに同梱されたDocsに基づく計画上の連続レートです。アップデート1.2のレシピ値は未照合です。実際の配管充填・揚程、ベルト詰まり、起動時の在庫や停電はシミュレートしません。',
        ],
      },
      sources: [
          { label: 'Plannerのゲームデータ出典・1.1.x版判定', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
          { label: 'テンプレート設定とソルバー回帰テスト', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/plan/samples.ts' },
          { label: '台数・流量を固定するサンプル検証', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/tests/samples.test.ts' },
          { label: 'ゲーム同梱Docsのミラー（元データの所在は上記出典記録を参照）', href: 'https://github.com/aringadre76/satisfactory-api/tree/master/Docs' },
          { label: 'ウラン廃棄物 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Uranium_Waste' },
          { label: '放射線 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Radioactivity' },
      ],
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
      '最低5,000 MWの目標に対し全出力の発電所3台で7,500 MW。ウラン廃棄物20個/分を全量再処理し、プルトニウム廃棄物1個/分を保管します。',
    titleEn: 'Nuclear, stage 2: reprocess to plutonium',
    descriptionEn:
      'Three full-output plants make 7,500 MW against a 5,000 MW minimum. All 20 Uranium Waste/min is reprocessed; store the 1 Plutonium Waste/min.',
    highlight: 'ウラン廃棄物が非核分裂性ウランへ入り、プルトニウム燃料棒として発電所へ戻る線に注目。',
    icon: 'Desc_PlutoniumFuelRod_C',
    baselineId: 'nuclear-uranium',
    guide: {
      sections: {
        mechanism: [
          'これは1.1.xデータの最低5,000 MW計画です。発電所はウラン燃料棒用2台とプルトニウム燃料棒用1台が全出力で動き、合計7,500 MW。燃料はウラン0.4本/分とプルトニウム0.1本/分、冷却水は合計720 m³/分です。',
          '①と同じウラン系統を維持し、ウラン鉱石40個/分から出るウラン廃棄物20個/分を再処理します。混合機で非核分裂性ウランを作り、粒子加速器でペレットにし、セル・燃料棒へ進めてプルトニウム発電所へ戻します。',
          '燃料棒を作る硝酸・硫酸・窒素ガスの配管が増えます。工場の水資源は冷却水だけではなく、正味755 m³/分（うち冷却水720 m³/分）です。工程内の水の戻り8.5 m³/分を差し引いた値です。SAMの原料上限も外していないため、変換機系統でSAM22.07個/分を使います。',
          'プルトニウム発電所からはプルトニウム廃棄物1個/分が出ます。このサンプルには後段のFICSONIUM処理がないため、ベルトで運び保管します。',
        ],
        tips: [
          '起動は段階的に行います。外部電源でウラン燃料棒ラインとウラン発電所2台を先に動かし、廃棄物が再処理ラインへ届くまで貯めます。初回のウラン燃料棒は外部から用意し、再処理機の入力と出力先を作ってからプルトニウム燃料棒と3台目の発電所を起動してください。バッファ容量は停止中に廃棄物を受け止める余裕として用意します。',
          'ウラン廃棄物は全量を使う設定です。詰まったら、廃棄物入力、混合機のシリカ/硝酸/硫酸、粒子加速器の入力、プルトニウム燃料棒の出力先を上流から順に確認します。混合機の2種の酸配管を色分けすると誤接続を見つけやすくなります。',
          'ウラン廃棄物とプルトニウム廃棄物はこのデータでシンクポイント0、AWESOMEシンクでは処分できません。プルトニウム燃料棒はシンク可能ですが、この計画では燃やして発電するため、発生するプルトニウム廃棄物の保管が必要です。放射性物質は通路から離し、防護服とヨウ素注入フィルターを用意します。',
          '①と比べて変えるのは燃料にプルトニウム燃料棒を追加し、ウラン廃棄物の「残さない」を有効にすることです。発電目標は最低値であり、原子力発電所は整数台を全出力で数えるため7,500 MWになります。手動クロック調整はこのプランに含みません。1.1.xゲーム同梱Docsに基づく定常計算で、1.2の値は未照合です。配管の充填・揚程、初期在庫、停止は予測しません。',
        ],
      },
      sources: [
          { label: 'Plannerのゲームデータ出典・1.1.x版判定', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
          { label: 'テンプレート設定とソルバー回帰テスト', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/plan/samples.ts' },
          { label: '台数・流量を固定するサンプル検証', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/tests/samples.test.ts' },
          { label: 'ゲーム同梱Docsのミラー（元データの所在は上記出典記録を参照）', href: 'https://github.com/aringadre76/satisfactory-api/tree/master/Docs' },
          { label: 'ウラン廃棄物 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Uranium_Waste' },
          { label: 'プルトニウム廃棄物 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Plutonium_Waste' },
          { label: '放射線 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Radioactivity' },
      ],
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
      '5,000 MW以上を目標にした1.1.xデータの定常計画。7台を全出力で動かし、ウラン廃棄物40個/分・プルトニウム廃棄物2個/分を再処理して残りをゼロにする。',
    titleEn: 'Nuclear, stage 3: closed loop with {{Desc_Ficsonium_C}}',
    descriptionEn:
      '5,000 MW target. Whole full-output units make this steady-rate plan 7 generators and 17,500 MW. All Uranium and Plutonium Waste is reprocessed.',
    highlight: '1.1.xの計算では、ウラン廃棄物40個/分とプルトニウム廃棄物2個/分を燃料棒へ戻し、核廃棄物の余りをゼロにします。',
    icon: 'Desc_FicsoniumFuelRod_C',
    baselineId: 'nuclear-uranium',
    guide: {
      sections: {
        mechanism: [
          'プランナーの共有ボタンから「原子力 ③: FICSONIUMで完全循環」を開きます。目標は5,000 MWですが、発電機は整数台を全出力で数えるため、この設定ではウラン4台・プルトニウム2台・FICSONIUM1台、合計7台で17,500 MWです。',
          '1.1.xレシピで必要な燃料棒はウラン0.8本/分、プルトニウム0.2本/分、FICSONIUM1本/分。発電所はそれぞれ4台・2台・1台で、出力は10,000 MW・5,000 MW・2,500 MW。冷却水は960・480・240 m³/分です。',
          'ウラン廃棄物40個/分のうち30個/分を非核分裂性ウランへ、10個/分をプルトニウムペレットへ回し、後者の工程でプルトニウム燃料棒を作ります。ウラン廃棄物を直接捨てる工程はありません。',
          'プルトニウム発電所から出るプルトニウム廃棄物2個/分は、シンギュラリティセル2個/分とダークマターの残留物40個/分とともに粒子加速器へ送り、FICSONIUM2個/分にします。',
          'FICSONIUM2個/分を電磁制御棒・FICSITEの三角板・励起フォトニック物質と量子エンコーダーへ入れると、燃料棒1本/分とダークマターの残留物20個/分が出ます。残留物20個/分は粒子加速器へ戻し、不足する20個/分は外から供給します。',
          'FICSONIUM燃料棒を燃やすと核廃棄物は出ません。全量を燃やす設定ではウラン廃棄物とプルトニウム廃棄物の収支がともにゼロになります。',
        ],
        tips: [
          '起動前に原子炉以外の電源を用意します。この例の製造工程だけで約3,026 MWを使い、採鉱機の電力はこの数に含みません。初回分のウラン燃料棒も外から作ります。ウラン廃棄物処理と、硫酸・硝酸・シンギュラリティセル・ダークマターの残留物の供給を先に整え、ウラン発電所、プルトニウム燃料棒と発電所、FICSONIUM系統の順に起動します。ウラン廃棄物の2経路は30個/分と10個/分なので、両方の搬送先を先に用意します。',
          '各廃棄物のベルトに余裕のある一時保管庫を挟みます。これは詰まりに気づく時間を稼ぐバッファで、処分先にはなりません。保管庫が増え続けたら、該当する発電所への燃料供給を止め、下流のベルト・設備の電力・入力・出力詰まりを直してから再開します。',
          'FICSONIUM系が止まったら、粒子加速器にプルトニウム廃棄物・シンギュラリティセル・ダークマターの残留物が揃っているかを確認し、次に量子エンコーダーの励起フォトニック物質・出力先・戻り配管を見ます。原子炉が止まる場合は燃料棒、冷却水、廃棄物出口の順です。',
          'ウラン廃棄物とプルトニウム廃棄物はAWESOMEシンクへ直接投入できません（1.1.xデータでシンクポイント0）。プルトニウム燃料棒はシンク可能ですが、燃やすとシンク不能のプルトニウム廃棄物が出ます。プルトニウムで止めるなら棒を燃やさずにシンクへ送り、FICSONIUM燃料棒はシンクせず発電所で燃やします（同データでシンクポイント0、燃焼時に核廃棄物なし）。',
          '放射性物質を運ぶ区画は通路と生活拠点から離し、危険物防護服とヨウ素注入フィルターを用意します。壁や床に遮蔽を期待せず、放射線の警告がある場所で運搬物を長時間持たないでください。',
          '「完全循環」は核廃棄物2種類についてです。この1.1.x計画には別の副産物として廃重油6.4 m³/分が残ります。定常レート計算のため初期在庫、機械の実際の設置台数とクロック、配管の充填・揚程、ベルトや設備の停止、起動時の循環成功は予測しません。1.2のレシピ値は未照合です。',
        ],
      },
      sources: [
        { label: 'ゲームデータの出典と対象バージョン（Satisfactory Planner）', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
        { label: 'ウラン廃棄物・英語 Wiki', href: 'https://satisfactory.wiki.gg/wiki/Uranium_Waste' },
        { label: 'プルトニウム廃棄物・英語 Wiki', href: 'https://satisfactory.wiki.gg/wiki/Plutonium_Waste' },
        { label: 'FICSONIUM燃料棒・英語 Wiki', href: 'https://satisfactory.wiki.gg/wiki/Ficsonium_Fuel_Rod' },
        { label: '放射線・英語 Wiki', href: 'https://satisfactory.wiki.gg/wiki/Radioactivity' },
      ],
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
      '1.1.xデータで2,500 MWを発電所1台が全出力で発電。注入型ウラン・セルで硫酸工程を省きます。',
    titleEn: 'Simplified {{Desc_OreUranium_C}} Power',
    descriptionEn:
      'One plant makes 2,500 MW. {{Recipe_Alternate_UraniumCell_1_C}} removes {{Desc_SulfuricAcid_C}} from the fuel chain; store 10/min of {{Desc_NuclearWaste_C}}.',
    highlight: '硫酸の配管がなく、ウランからウラン燃料棒まで一直線に進む線に注目。',
    icon: 'Desc_UraniumCell_C',
    guide: {
      sections: {
        mechanism: [
          'この例はPlannerの1.1.xレシピデータを使い、最低2,500 MWを設定します。原子力発電所1台がウラン燃料棒0.2本/分を燃やし、2,500 MWを出力、冷却水240 m³/分を消費します。',
          '代替レシピ「注入型ウラン・セル」はウラン鉱石12.5、シリカ7.5、硫黄12.5、クイックワイヤー37.5個/分を使います。硫酸を使わないため、混合機も精製機もラインから消えます。「コンクリート被覆型鋼管」は鋼管とコンクリートから燃料棒部品を作り、鋼梁工程を省きます。',
          '燃料棒の製造ラインを外部電源で動かし、まず燃料を用意してから、冷却水配管と原子炉を起動します。工場の鉱石設定はSAM上限0なので、変換機で硫黄やカテリウム鉱石を作る経路は選びません。',
          '発電所はウラン廃棄物10個/分を出します。下流の再処理はこの例には含まれないため、ベルトで保管場所へ運びます。',
        ],
        tips: [
          '2つの代替レシピをハードドライブ解析で解放してから建設します。どちらか未解放ならサンプルをそのまま再現できません。',
          '初回の燃料棒と工場用の外部電源を用意し、冷却水240 m³/分を配管に満たしてから原子炉を接続します。プランナーは起動在庫・配管充填・揚程・起動成功をモデル化しないため、予備燃料本数は定常計算からは決められません。',
          'ウラン廃棄物10個/分はこのデータでシンクポイント0です。保管庫が満杯になる前に再処理へ接続するか、保管場所を確保してください。出力不足時は燃料、冷却水、廃棄物ベルトと保管先の順で調べます。放射性物質は通路から離し、防護服とヨウ素注入フィルターを用意します。',
          '例のSAM上限は0です。ウラン鉱石12.5個/分を採掘する配置が必要です。数値は1.1.xのゲーム同梱Docsを使った定常レートで、1.2のレシピ値は未照合です。',
        ],
      },
      sources: [
          { label: 'Plannerのゲームデータ出典・1.1.x版判定', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
          { label: 'テンプレート設定とソルバー回帰テスト', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/plan/samples.ts' },
          { label: '台数・流量を固定するサンプル検証', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/tests/samples.test.ts' },
          { label: 'ゲーム同梱Docsのミラー（元データの所在は上記出典記録を参照）', href: 'https://github.com/aringadre76/satisfactory-api/tree/master/Docs' },
          { label: 'ウラン廃棄物 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Uranium_Waste' },
          { label: '放射線 — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Radioactivity' },
      ],
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
