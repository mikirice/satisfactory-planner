import type { HandwrittenArticle } from './types.ts'

export const pipeline_flow_head_lift_troubleshootingArticle = {
  slug: 'pipeline-flow-head-lift-troubleshooting',
  title: 'パイプラインの流量と揚程を切り分ける',
  description: '供給量、上り区間、共有配管、消費先を順に確認し、流量不足の原因を仮説ごとに切り分けます。',
  sections: [
    {
      heading: 'まず供給元と消費先を確認する',
      paragraphs: [
        '最初に全配管を作り直さず、供給需要の帳尻、配管表示、上り区間、分岐を順に観察します。以下は診断を説明するための仮定で、レシピ値やゲーム内保証ではありません。',
        '供給元が毎分100単位を出し、稼働中の消費先Aが40、Bが50を要求すると仮定すれば、単純計算の余裕は10単位/分です。合計需要が供給量を超えるなら、まず供給不足を調べます。この帳尻は一定の供給量と需要量を比べる計画値で、ゲーム内の実流量や末端への到達を示すものではありません。余裕があっても全区間で流せる証拠にはならないため、配管表示と分岐を次に切り分けます。',
      ],
    },
    {
      heading: '揚程不足と流量不足を区別する',
      paragraphs: [
        'Wikiの「Flow Indicators」は、パイプ上の表示を流れの向き、充填状態、流量の手掛かりとして説明しています。視覚表示はどこで流れや充填が変わるかを見る材料で、正確な数値メーターとしては扱いません。現行版の表示方法は未確認です。',
        'Wikiの「Head lift」は揚程を液体の上昇高さに関わる仕組みとして説明します。問題が上り区間の直後に始まるかを観察し、そこに局在する場合は揚程仮説を優先します。高さの問題を配管等級だけで解決できるとは決めつけず、複数分岐に広がる不足は供給量と共有区間も調べます。',
      ],
    },
    {
      heading: '合流・分岐後に流れが不安定なとき',
      paragraphs: [
        '計算上の余裕があるのに末端が止まる場合は、基準状態を記録し、試験中だけ一つの分岐の消費先を止めます。配管表示と残りの設備を比べ、停止で変化したか記録します。変化があっても、供給量と共有区間のどちらが限界かは断定できません。',
        '次にその枝を戻し、もう一方だけを試します。上り区間の先だけで問題が出るなら揚程仮説を残し、分岐の前後で表示や稼働状況が変わるなら共有区間を調べます。Wikiの「現在確認されている問題」（Current issues）は、既設パイプへジャンクション、ポンプ、またはバルブを直接取り付けると一時的な流量低下が起こる場合があると記載しています。その方法で最近変更した区間があれば確認します。これはWikiが挙げる一つの手掛かりで、すべての流量低下に当てはまる不具合や確定した修正策ではありません。提案した切り分けはゲーム内で未実施です。',
      ],
    },
    {
      heading: '既存記事との違い',
      paragraphs: [
        '公開済みの石油、アルミニウム、希釈燃料、バッテリー水循環の記事は、特定の生産・発電工程と液体循環を扱います。石炭発電の起動記事と流体トラック配送記事も、それぞれ発電所の構築と輸送方法が主題です。本稿は特定のレシピや工場を組み立てず、どの配管でも使える故障切り分け順を説明します。',
      ],
    },
  ],
  references: {
    heading: '参照資料と根拠',
    links: [
      { label: 'Satisfactory Wiki — Pipelines: Head lift', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Head_lift' },
      { label: 'Satisfactory Wiki — Pipelines: Flow Indicators', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Flow_Indicators' },
      { label: 'Satisfactory Wiki — Pipelines: Current issues', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Current_issues' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['oil-products-basics', 'aluminum-water-loop'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Plannerの収録データは1.1.xです。配管の仕組みの説明はコミュニティWikiに基づきます。現行アップデート1.2の表示、揚程、診断手順は実機で確認していません。記事内の100・40・50単位/分は説明用の仮定で、ゲームデータではありません。',
} as const satisfies HandwrittenArticle
