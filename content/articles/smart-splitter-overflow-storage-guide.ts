import type { HandwrittenArticle } from './types.ts'

export const smart_splitter_overflow_storage_guideArticle = {
  slug: 'smart-splitter-overflow-storage-guide',
  title: '保管庫のあふれをAWESOMEシンクへ逃がす',
  description: 'スマート・スプリッターで単一品目を保管し、使える出力がないときのオーバーフロー経路と安全な確認手順を説明します。',
  sections: [
    {
      heading: '基本の接続',
      paragraphs: [
        '単一品目を保管し、他に使える出力がない場合だけシンクへ逃がす構成です。スマート・スプリッターのWikiの「Filters」は、オーバーフローを他の出力が満杯、または適切なルールがなく使えない場合のフォールバックとして説明しています。複数のオーバーフロー出力がある場合は品物が分配されるとの記載もあるため、基本例では一つにします。',
      ],
      lists: [{ ordered: true, items: [
        '初回試験では一種類の品目だけを入力します。',
        'その品目を明示的なルールで保管庫側の一出力へ割り当てます。',
        '別の出力をオーバーフローにし、AWESOMEシンクへ接続します。他のルールは最小限にし、対象品目に未確認の経路が残らないようにします。',
        '保管庫に空きがある時と満杯の時を分けて観察します。',
      ]}],
    },
    {
      heading: '想定どおりに流れないとき',
      paragraphs: [
        '保管庫に空きがあるのにシンクへ出る場合は、対象品目が保管庫出力に割り当てられているか、別の出力にもその品目を受け入れる規則がないか、ベルトが意図したポートにつながっているか確認します。オーバーフローは常に優先する余剰レーンではなく、他に使える出力がない場合のフォールバックです。',
        '保管庫が満杯でもシンクへ出ない場合は、オーバーフロー設定と下流ベルトを確認し、対象品目を受け入れる別のルールが残っていないか調べます。物理的に詰まったベルトがどの条件でオーバーフロー判定されるかはWiki本文から細部を確定できないため、あらゆる詰まりがオーバーフローを起動すると断定しません。',
        '混合品目は、品目ごとに意図した出力ルールを表にして点検します。単品で確認してから混合入力を試してください。',
      ],
    },
    {
      heading: '安全に試す',
      paragraphs: [
        '試験品目を一つずつ流し、保管庫に空きがある時と満杯の時を分けて行き先を観察します。シンクへ送る品目が受け入れ可能かも確認してください。AWESOMEシンク Wikiの「Items not allowed to sink」は、投入できず入力を詰まらせる品目群を掲載しています。拒否される品目が同じシンク入力ベルトに混ざると詰まる可能性があるため、送る対象を事前に調べます。',
        'この確認手順は提案で、今回ゲーム内では実行していません。Wikiの品目一覧も現行クライアントで再確認していません。',
      ],
    },
    {
      heading: '関連記事との違い',
      paragraphs: [
        '公開済みのAWESOMEシンク記事は品目ごとのポイント値が主題です。本稿はスマート・スプリッターを使い、保管庫に空きがある間は品物を保管し、あふれた分を搬送する構成を説明します。優先マージャー記事は複数入力の優先供給、コンベア・スループット・モニター記事はベルト上の流量表示が主題で、目的が異なります。',
      ],
    },
  ],
  references: {
    heading: '参照資料と根拠',
    links: [
      { label: 'Satisfactory Wiki — Smart Splitter: Filters', href: 'https://satisfactory.wiki.gg/wiki/Smart_Splitter#Filters' },
      { label: 'Satisfactory Wiki — AWESOME Sink: Items not allowed to sink', href: 'https://satisfactory.wiki.gg/wiki/AWESOME_Sink#Items_not_allowed_to_sink' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['awesome-sink-points', 'priority-merger-use-cases-guide'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Plannerの収録データは1.1.xです。分岐器とシンクの仕様はコミュニティWikiの記述に基づきます。アップデート1.2の日本語UI名、シンク対象の条件、ベルトを物理的に塞いだ場合の挙動はゲーム内で確認していません。',
} as const satisfies HandwrittenArticle
