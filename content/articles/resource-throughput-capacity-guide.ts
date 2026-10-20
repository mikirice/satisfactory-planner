import type { HandwrittenArticle } from './types.ts'

export const resourceThroughputCapacityGuideArticle = {
  slug: 'resource-throughput-capacity-guide',
  title: '共有原料と搬送上限から工場の最大台数を決める',
  description: '複数レシピの共有原料、ベルト定格、配管需要を同じ収支式へ置き、機械を何台まで動かせるかを計算して不足箇所を診断します。',
  publishedDate: '2026-10-20',
  updatedDate: '2026-10-20',
  versionNotice: 'レシピと搬送設備の数値はPlanner同梱の1.1.xデータを使った計算例です。現行ゲームの実流量や詰まり方を測った結果ではありません。ゲームのバージョンと設備表示を記録し、実配置で再確認してください。',
  sections: [
    { heading: '設備を増やす前に制約を一つの式へ置く', paragraphs: [
      '同じ原料を複数ラインが使うなら、それぞれの投入量を合計して共有供給以下にします。基本形は Σ（1台あたり投入量 × 稼働台数） ≤ 実際に届く供給量です。供給量はノードや配管の公称値ではなく、採鉱機・上流製造・ベルト分岐などを通って消費点へ届く量として扱います。',
      '例としてクイックワイヤーをAIリミッターにA台、高速コネクターにH台使い、1.1.xレシピの必要量をそれぞれ20Aと56H、共有供給を仮に500個/minとします。20A + 56H ≤ 500です。A=4なら残り420個/minなので、Hは最大7台です。整数台に切り捨て、他の消費先があれば同じ式に加えます。500個/minは説明用の仮定で、ゲーム内測定値ではありません。',
    ], tables: [{ caption: '共有入力を数える表', headers: ['消費先', '1台あたり', '台数', '合計'], rows: [
      ['AIリミッター', '20 quickwire/min (1.1.x example)', 'A', '20A'],
      ['高速コネクター', '56 quickwire/min (1.1.x example)', 'H', '56H'],
      ['その他の用途', '実際の投入量', '台数', '量 × 台数'],
      ['供給上限', '実際に届く量', '—', '各行の合計以下'],
    ]}] },
    { heading: 'ベルト上限は上流レシピから逆算する', paragraphs: [
      'ネジを240個/min必要とする重量モジュラー・フレームの例では、1.1.xデータ上の必要量240個/minを搬送機の表示定格と照合します。Mk.3ベルトの公称270個/minを仮定すると名目余裕は30個/minです。分岐先や上流の混合搬送があればその消費も差し引きます。公称値を満たしていても、実際の搬送試験をしたことにはなりません。',
      '配管では「設備台数 × 1台あたりの液体投入量」を先に求めます。溶融モジュラー・フレームのPlanner例は窒素37.5 m³/min/台なので、N台なら37.5N m³/minです。共通幹線を流れる別消費を足し、パイプの表示上限と比較します。上限と実流量を同じ数字として扱わないでください。',
    ] },
    { heading: '計算を現地の失速原因へつなげる', paragraphs: [
      '同じ出力目標でPlannerの供給・設備台数を固定してから、現地では搬送路ごとに流量の出入りを記録します。上流の総量が足りないのか、共有後の配分が偏るのか、搬送路の定格に近づきすぎたのかを分けるためです。複数のベルトや配管を一度に付け替えると原因が分からなくなるため、変更は一つずつにします。',
    ], lists: [{ ordered: true, items: [
      '消費設備を一つずつ止め、上流供給が戻るかを見る。戻るなら供給量か共有配分が候補です。',
      '供給量は足りているのに末端だけ不足するなら、分岐より前後で搬送路の通過量と詰まりを比較します。',
      'ベルトや配管を大型化した時だけ改善するなら、公称定格に対する余裕と合流点を再計算します。',
      '同じ変更を元に戻して症状が再現するか試す。再現しない場合は、レシピ、クロック、入力在庫など別条件を記録します。',
    ]}] },
    { heading: '書き残すべき条件', paragraphs: [
      '再利用する計算には、ゲーム/Plannerデータの版、レシピ名、クロック、1台あたり投入量、稼働台数、他の共有消費、供給地点、搬送設備の種類を併記します。サンプル供給500個/minやベルト定格の計算は条件付きの例です。著者が現行ゲームで設備を設置・計測した結果ではありません。実測した場合は観測区間、空の時間、計器の表示単位も一緒に記録します。',
    ] },
  ],
  references: { heading: '数値の出どころ', links: [
    { label: 'Satisfactory Planner: bundled recipes and data scope', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    { label: 'Satisfactory Wiki: Conveyor Belts', href: 'https://satisfactory.wiki.gg/wiki/Conveyor_Belt' },
    { label: 'Satisfactory Wiki: Pipelines', href: 'https://satisfactory.wiki.gg/wiki/Pipeline' },
  ]},
  relatedItemIds: [],
  relatedArticleSlugs: ['shared-circuit-board-computer-feedstock-budget', 'aluminum-production-guide', 'packaged-nitrogen-empty-fluid-tank-circulation-planning'],
} as const satisfies HandwrittenArticle
