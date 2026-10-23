import type { HandwrittenArticle } from './types.ts'
import { strongAlternateRecipesArticle } from './strong-alternate-recipes.ts'
import { productionPlanningTutorialArticle } from './production-planning-tutorial.ts'
import { blueprintDesignerWorkflowArticle } from './blueprint-designer-workflow.ts'
import { space_elevator_project_assembly_batch_planning_guideArticle } from './space-elevator-project-assembly-batch-planning-guide.ts'
import { aluminumProductionGuideArticle } from './aluminum-production-guide.ts'
import { packagedNitrogenEmptyFluidTankCirculationPlanningArticle } from './packaged-nitrogen-empty-fluid-tank-circulation-planning.ts'

const addSections = (base: HandwrittenArticle, additions: HandwrittenArticle['sections'], relatedArticleSlugs: readonly string[]): HandwrittenArticle => ({
  ...base,
  updatedDate: '2026-10-20',
  sections: [...base.sections, ...additions],
  relatedArticleSlugs,
})

export const strongAlternateRecipesArticleMerged = addSections(strongAlternateRecipesArticle, [
  {
    heading: 'モーター15個/分なら中間品の在庫で選ぶ',
    paragraphs: [
      '代替レシピを比べる時は最終品を同じ15個/分にそろえ、直接投入と上流材料を分けます。Plannerの1.1.xレシピ例では、標準は組立機3台でローター30個/minと固定子30個/min、電動モーターは組立機2台でローター15個/minと電磁制御棒7.5個/min、精密モーターは製造機2台でローター7.5個/min・固定子7.5個/min・水晶発振器2.5個/minです。',
      'ローターと固定子がすでに余っていれば標準レシピが単純です。固定子を使わず電磁制御棒を供給できるなら電動モーター、両方の部品が厳しく水晶発振器に余裕があるなら精密モーターが候補になります。最後のレシピだけの入力比較なので、未生産の制御棒や発振器を新設する時は上流の鉱石・電力・機械まで含めてPlannerで解き直します。',
    ],
    tables: [{ caption: 'モーター15個/minの直接投入比較（1.1.x収録データ）', headers: ['レシピ', '組立設備', 'ローター/min', '固定子/min', '追加入力/min'], rows: [
      ['標準', '組立機3台', '30', '30', 'なし'],
      ['電動モーター', '組立機2台', '15', '0', '電磁制御棒7.5'],
      ['精密モーター', '製造機2台', '7.5', '7.5', '水晶発振器2.5'],
    ]}],
  },
], ['somersloop-and-power-shards','production-planning-tutorial'])

export const productionPlanningTutorialArticleMerged = addSections(productionPlanningTutorialArticle, [
  {
    heading: '搬送本数と設置台数を同じ例で照合する',
    paragraphs: [
      '標準レシピで鉄板60個/minを作るサンプルでは、採鉱機 Mk.3 を1台、製錬炉3台、製作機3台を設置します。必要量は鉄鉱石90個/minから鉄のインゴット90個/min、鉄板60個/minへ進みます。Planner同梱1.1.xのベルト定格は Mk.1 が60、Mk.2 が120、Mk.3 が270、Mk.4 が480、Mk.5 が780、Mk.6 が1,200個/min、パイプは Mk.1 が300、Mk.2 が600m³/minです。Mk.2なら鉱石・インゴット各90個/minは1本で運べ、出力60個/minは Mk.1 の定格と一致します。これは理論上の定格比較で、ゲーム内の分岐・混雑を測った値ではありません。',
      '判断手順は、まず建設リストで建てる設備数を数え、次に各工程の入力/出力レートをベルト定格で割って必要本数を切り上げ、最後に共有区間の合計需要を確認することです。たとえば同じ120個/minの区間へ鉄板60個/minの別ラインを合流させると名目上ちょうど定格になります。余裕がないので、別消費や流量の変動があるなら分離するか上位ベルトを選び、現地で端点ごとの到着量を確認します。',
    ],
    tables: [{ caption: '鉄板60個/minの搬送チェック（1.1.xデータ例）', headers: ['区間', '流量', '比較する定格', '判断'], rows: [
      ['鉄鉱石 → 製錬炉', '90個/min', 'Mk.2 120個/min', '1本の名目容量内'],
      ['鉄インゴット → 製作機', '90個/min', 'Mk.2 120個/min', '別消費を加えて確認'],
      ['鉄板 → 保管', '60個/min', 'Mk.1 60個/min', '余力0。分岐させず出力先を確認'],
    ]}],
  },
  {
    heading: '結果を現地の建設順へ移す',
    paragraphs: [
      '生産ステップを設備種別・レシピごとに読み、建てる台数、クロック、入力ベルト、出力ベルトを一行ずつ作業リストに写します。全設備を一度に建てるのではなく、原料の採取、最初の加工、中間品、最終品の順で区画を作り、各段階で入力と出力が一致するかを確認します。レートと稼働換算台数だけでなく、ゲームで置く整数台数も残してください。',
      'Plannerの概算床面積は、指定したレシピと設備数から建設規模を把握するための指標です。通路、柱、段差、ベルトの曲がり、配管や保守用スペースを含む完成配置図ではありません。建設リストの台数から実際の配置を設計し、必要なら小さな区画を先に建てて寸法を測ります。床面積の数字をそのまま土台の一辺へ置き換えないでください。',
    ],
    lists: [{ ordered: true, items: [
      '最初に入力資源と稼働中の上流設備を確保する。',
      '設備ごとに建設数と稼働換算台数の両方を書き、クロックが100%でない行を印す。',
      '同じ品目の搬送路を追い、合計需要とベルト/パイプ上限を照合する。',
      'レイアウトを変えたら各区画の実際の寸法を測り、床面積推定と混同しない。',
    ]}],
  },
], ['excel-export-guide','strong-alternate-recipes'])

export const blueprintDesignerWorkflowArticleMerged = addSections(blueprintDesignerWorkflowArticle, [
  {
    heading: '配置時の自動接続は短い接続で先に試す',
    paragraphs: [
      'Blueprint Auto Connectは、保存済みモジュールを配置する時に接続候補を扱う手順です。設計機の中で保存する工程とは分けて確認します。接続したいベルトや配管の端点をモジュール境界の同じ側へ出し、まず二つの小型ブループリントだけを置いて、配置前に画面が示す候補を確認します。',
      '候補が出ない場合は、互いの端点が境界で合っているか、対象の搬送種が同じか、端点が障害物に埋まっていないかを一つずつ見ます。自動接続が表示されることだけで、配置後の流量や接続先の全条件が満たされたとは判断しません。手動接続へ戻せるよう、配置前の向きとモジュールを保存しておきます。現行ゲームの全入力操作・対象範囲は著者が実機で確認していません。',
    ],
  },
], ['production-planning-tutorial','somersloop-and-power-shards'])

export const spaceElevatorBatchArticleMerged = addSections(space_elevator_project_assembly_batch_planning_guideArticle, [
  {
    heading: '有限在庫の加工は整数バッチで数える',
    paragraphs: [
      '軌道エレベーターの期限計画では毎分レートから全体の時間を比べますが、倉庫にある有限材料を一つのレシピで加工する場合は、完了できる整数バッチを先に計算します。Planner同梱1.1.xの固体バイオ燃料レシピはバイオマス8個を4秒で処理し、燃料4個を作ります。3,008バイオマスなら floor(3,008÷8)=376回、完成燃料1,504個です。バイオマス3,009個でも376回で、1個余ります。',
      '製作機を100%で連続稼働するという理想計算なら、1台は376×4=1,504秒（25分04秒）、2台へ188回ずつ分ければ752秒（12分32秒）、3台なら126・125・125回で最大担当の504秒（8分24秒）です。台数は時間を変えますが、有限在庫から作れる総量は変えません。ゲーム停止、搬送、手作業、実際の起動時刻を含まない算術例です。',
      'この計算は軌道エレベーターの要求数や期限を表す式ではありません。ゲームのバージョン、レシピの入力・出力、サイクル時間を確認し、倉庫在庫の残量と毎分目標を別々に記録してください。Plannerは毎分入力の連続計画を解き、有限在庫をレシピ単位で消費した完了時刻を予測しません。',
    ],
  },
], ['production-planning-tutorial','resource-throughput-capacity-guide'])

export const aluminumProductionGuideArticleMerged = {
  ...addSections(aluminumProductionGuideArticle, [
  {
    heading: 'バッテリー60個/minでは戻り水と外部水を分ける',
    paragraphs: [
      'アルミだけの60インゴット/min例とバッテリー60/minの例は、水の収支が異なります。Planner同梱1.1.xのバッテリー例では、バッテリー工程が90 m³/min、スクラップ工程が45 m³/minの戻り水を作り、合計135 m³/minをアルミナ溶液へ返します。アルミナ溶液は合計210 m³/minを作るため315 m³/minの水を使い、硫酸工程は別に150 m³/minを使います。よって外部水は315+150−135=330 m³/minです。',
      '戻り水135 m³/minはこの一つの消費経路へ再利用する水であり、工場全体が水だけで自給するという意味ではありません。起動時には戻り水がまだ発生しないため、初期の外部水を供給してから返り始める流れを確認します。水の異なる出先を分け、硫酸用150 m³/minをアルミナ溶液へ二重に数えないでください。',
    ],
    tables: [{ caption: 'バッテリー60/minサンプルの水収支（1.1.x計算）', headers: ['経路', '水量 m³/min', '扱い'], rows: [
      ['バッテリー工程の戻り', '90', 'アルミナ溶液へ戻す'],
      ['スクラップ工程の戻り', '45', 'アルミナ溶液へ戻す'],
      ['アルミナ溶液の水需要', '315', '戻り水135と外部水180で賄う'],
      ['硫酸工程の水需要', '150', '別口で外部供給'],
      ['外部水の合計', '330', '180 + 150'],
    ]}],
  },
], ['oil-products-basics','pipeline-flow-head-lift-troubleshooting']),
} as const

export const packagedCirculationArticleMerged = addSections(packagedNitrogenEmptyFluidTankCirculationPlanningArticle, [
  {
    heading: '希釈燃料の包装ループを例に容器在庫を分ける',
    paragraphs: [
      '空容器の必要数を考える時は、工程に固定で必要な初期投入と、運転中に循環する容器数を分けます。包装希釈燃料のPlannerサンプルでは、燃料を毎分120 m³作る定常例に初期キャニスター4個を用意し、使用後の空キャニスターを包装工程へ戻します。返却ベルトの一部が詰まると、燃料生成が止まる前に包装側で空容器の在庫が減ります。',
      'サンプルの初期4個はその設定に対する値で、任意のルートや実際の到着間隔に対する一般式ではありません。別の構成では実測した周回時間と消費率から ceil(率×周回時間) を計算し、輸送中に失われる容器や初期の予備を別に加えます。容器が戻っているか、樹脂などの副産物の出口が空いているかを独立して確認してください。',
    ],
    tables: [{ caption: '初期投入と循環在庫を混同しない', headers: ['種類', '役割', '確認'], rows: [
      ['初期容器', 'ループを開始するために外から入れる個数', '起動前に包装機の入力へ届いたか'],
      ['循環容器', '包装→輸送→開封→返却を回る個数', '返却経路の詰まり、往復時間、紛失'],
      ['予備', '停止時の変動に備える追加在庫', '根拠となる最長遅延を記録'],
    ]}],
  },
], ['fluid-truck-delivery','oil-loop-complete','packaged-diluted-fuel-loop'])
