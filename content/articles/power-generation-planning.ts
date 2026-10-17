import type { HandwrittenArticle } from './types.ts'

export const powerGenerationPlanningArticle = {
  slug: 'power-generation-planning',
  title: '発電計画の立て方 — 定格出力と工場の実効電力を分けて考える',
  description:
    '石炭・燃料・原子力の定格出力と燃料レートを比べ、採掘・給水などの自家消費を差し引く手順、バイオマス発電の需要追従、Plannerの整数台計算を解説します。',
  publishedDate: '2026-10-17',
  sections: [
    {
      heading: '発電機の定格出力と、工場に残る電力は別',
      paragraphs: [
        '発電機に書かれたMWは設定クロック時の発電量です。発電所を計画するときは、まず合計の定格出力（gross）を出し、そこから燃料・水を作る採鉱機や抽出機、精製設備などの消費電力を引いて、工場へ回せる目安（net）を見積もります。実際のグリッドには他の全消費設備も加わります。ベルトや配管が詰まる、設備が止まる、電力が届かない場合は、計算上の定格出力まで発電できません。',
        '次の表は発電機1台を100%クロックで連続運転したときの1.1.xデータです。燃料の種類と補助資源の需要を一緒に比べてください。',
      ],
      tables: [
        {
          caption: '発電機1台・100%クロックの基準値（Planner収録データ：Satisfactory 1.1.x）',
          headers: ['方式・燃料', '定格出力', '燃料消費', '補助資源・副産物'],
          rows: [
            ['石炭発電機：石炭', '75 MW', '石炭15個/分', '水45 m³/分'],
            ['燃料式発電機：燃料', '250 MW', '燃料20 m³/分', '—'],
            ['燃料式発電機：ターボ燃料', '250 MW', 'ターボ燃料7.5 m³/分', '—'],
            ['原子力発電所：ウラン燃料棒', '2,500 MW', '燃料棒0.2個/分', '水240 m³/分、ウラン廃棄物10個/分'],
          ],
        },
      ],
    },
    {
      heading: '石炭8台の例でgrossからnetを引く',
      paragraphs: [
        '石炭発電機8台を100%で回すと、定格出力は8 × 75 = 600 MWです。石炭120個/分と水360 m³/分を切らさず供給します。通常ノードの石炭を採鉱機Mk.2（100%、15 MW）1台で採り、揚水ポンプ3台（合計60 MW）で水を用意する構成なら、供給側だけで約75 MWを使うため、工場向けに残るのは600 − 75 = 525 MWです。これはポンプや燃料の追加加工、工場設備の電力を差し引く前の見積もりです。',
        '供給側設備も発電所が立ち上がる前に電力を必要とします。最初はバイオマスバーナーなどの仮設電源で採鉱機と揚水ポンプを動かし、燃料と水が発電機まで届いたことを確認してから工場の負荷を接続します。発電機列と工場を別回路にしておくと、工場側のブレーカーが落ちたときに供給設備まで止めずに済みます。',
        'トラブル時は、発電機が停止しているのか、発電はしていても需要が容量を超えてブレーカーが落ちたのかを分けます。前者なら燃料ベルトの末端、貯水と水の流れ、配管の高低差を確認します。後者なら需要を段階的に戻し、供給容量を超える負荷がないかを調べます。Mk.1パイプ1本は最大300 m³/分なので、水360 m³/分を1本だけで運ぶ設計にはできません。',
      ],
    },
    {
      heading: '燃料式・原子力はチェーンと廃棄物まで見積もる',
      paragraphs: [
        '燃料式発電は1台250 MWでも、原油の抽出・精製から燃料を送り続ける必要があります。希釈燃料を使えば重油残渣と水を燃料へ加工でき、ターボ燃料なら硫黄・石炭を使う工程も加わります。精製機や混合機の電力もnetから差し引いてください。原子力は燃料棒の複数工程に加え、水供給とウラン廃棄物の保管または処理が必要です。後段の受け入れが詰まると発電を続けられないため、廃棄物の行き先を発電開始前に決めます。',
        '発電機の出力を増やすための手動クロックはゲーム内で線形に効き、発電量と燃料消費が同じ比率で増減します。たとえば石炭発電機2台を各66⅔%にすると、合計100 MW、石炭20個/分、水60 m³/分です。需要が小さいからといって、通常の石炭・燃料・原子力発電機が自動的にクロックを下げるわけではありません。',
      ],
    },
    {
      heading: '需要に合わせて出力が変わるバイオマス発電',
      paragraphs: [
        'バイオマスバーナーは例外で、グリッドの需要に応じて必要な出力だけを発電し、需要が下がると燃料消費も下がります。燃料を手で補給する序盤では便利ですが、燃料の搬送を自動化できず、給電が必要な設備の総負荷を超えることはできません。自動供給する石炭以降の発電機と同じ「常時定格で燃料を消費する」ものとして計算しないでください。',
        'ゲーム内では地熱発電もありますが、出力が一定でないため、このPlannerの選択可能な方式には含まれません。Plannerの発電リストにあるのは石炭、燃料、原子力です。',
      ],
    },
    {
      heading: 'Plannerで目標電力を計画する',
      paragraphs: [
        'Plannerで発電計画を使うには、設定の発電欄で方式を有効にし、その方式で使う燃料を選んでから、目標MWを入力します。燃料を複数許可するとソルバーが選び分けるため、建設予定の燃料だけに絞ると工程を読みやすくできます。「工場の消費電力を賄う」を有効にすると燃料を作る製造建物の電力も制約に含めますが、採鉱機・揚水ポンプなどの採取設備は含みません。さらに自給制約は建物を100%クロック換算で扱うので、オーバークロック後の実電力を保証しません。',
        'Plannerは発電機を100%クロックの整数台で見積もります。目標100 MWで石炭だけを許可すると、2台・定格150 MW・石炭30個/分・水90 m³/分という結果になります。これは2台を各100%で動かす入力です。ゲーム内で合計100 MWにしたいなら2台を各66⅔%に手動調整し、燃料・水レートも20個/分・60 m³/分に下げます。結果の定格発電量から、別に示される採取電力と燃料加工設備の電力を差し引いて運用余裕を判断してください。',
        'まず希釈燃料発電のサンプルを開き、燃料レート、設備数、総発電量を結果画面で照合します。次に設定した発電方式・燃料・目標MWを変更し、発電機のステップと資源一覧を確認してください。共有プランはレシピとレートの収支を解くもので、実際の配線、始動順、配管圧力、バッファの満ち方をシミュレートしません。',
      ],
    },
  ],
  references: {
    heading: '参考資料',
    links: [
      { label: 'Satisfactory Wiki — Coal-Powered Generator', href: 'https://satisfactory.wiki.gg/wiki/Coal-Powered_Generator' },
      { label: 'Satisfactory Wiki — Fuel-Powered Generator', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
      { label: 'Satisfactory Wiki — Nuclear Power Plant', href: 'https://satisfactory.wiki.gg/wiki/Nuclear_Power_Plant' },
      { label: 'Satisfactory Wiki — Biomass Burner', href: 'https://satisfactory.wiki.gg/wiki/Biomass_Burner' },
      { label: 'Satisfactory Wiki — Clock speed', href: 'https://satisfactory.wiki.gg/wiki/Clock_speed' },
      { label: 'Planner 1.1.xゲームデータの取得元と対象版', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_LiquidFuel_C',
    'Desc_LiquidTurboFuel_C',
    'Desc_NuclearFuelRod_C',
    'Desc_NuclearWaste_C',
  ],
  relatedArticleSlugs: ['coal-power-startup', 'diluted-fuel-power', 'turbofuel-power', 'clock-and-efficiency'],
  cta: {
    kind: 'sample',
    label: '希釈燃料発電2,500MWの計画を開き、燃料・建物・出力を見る',
    sampleId: 'diluted-fuel-power',
  },
} as const satisfies HandwrittenArticle
