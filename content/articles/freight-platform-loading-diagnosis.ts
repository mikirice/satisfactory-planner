import type { HandwrittenArticle } from './types.ts'

export const freight_platform_loading_diagnosisArticle = {
  slug: 'freight-platform-loading-diagnosis',
  title: '貨物駅の積み下ろしを切り分ける',
  description: '停車中の貨物車とプラットフォームの対応、駅の向き、ベルト接続、混載の経路を一つずつ確かめます。',
  sections: [
    {
      heading: '貨物車とプラットフォームの位置を合わせる',
      paragraphs: [
        '想定した品目が積み下ろされないときは、列車の貨物車と駅の貨物プラットフォームの順番を照合します。Community Wikiの「Setting up freight stations」では、駅の向き、機関車前方の▶表示と駅前面を基準にする方法、空のプラットフォームを車両位置の調整に使う方法が説明されています。コミュニティ資料に基づく手順であり、現行クライアントでの動作は未確認です。',
      ],
      lists: [{ ordered: true, items: [
        '列車が停車する駅を開き、その駅が時刻表に含まれていることを確認します。',
        '機関車から貨物車を数え、順番を控えます。プラットフォームがない位置に車両が停車していないかも見ます。',
        '停車中に、各貨物車の前に来るプラットフォームを記録します。予想と違う場合は、駅の向きと空プラットフォームの間隔を一つずつ見直します。向きを反対にすれば対応も単純に逆になると決めつけず、停車中の配置を基準にします。',
        '貨物車ごとの品目を決め、積み込み駅と受け取り駅の同じ位置にあるプラットフォームを確認します。',
      ]}],
    },
    {
      heading: '停車中に貨物が動かないとき',
      paragraphs: [
        '対象の貨物車がプラットフォームの前にいることを確認したら、積み込み側と受け取り側を分けて見ます。積み込み側では供給元のベルトがプラットフォームに届いているか、受け取り側では出力ベルトが、品物を受け取れる空きのある倉庫や機械までつながっているかを確認します。Wikiの「Loading and unloading」には、自動転送中はプラットフォームのベルトが停止すること、受け取り先に空きスロットがある場合に一部だけ転送され得ることが記載されています。途中で止まったように見える場合は、受け取り先のスロットとプラットフォームのモードを確認します。これはコミュニティWikiの記述で、現行クライアントでの実機確認ではありません。',
        '現在の日本語設定名やステータス表示はゲーム内で確認していないため、特定のメニュー名や操作ラベルは指定しません。画面に表示される積み込み／積み下ろし状態を読み、目的の方向と一致しているかを確認してください。液体貨物プラットフォームは配管を使うため、固体品目向けのベルト確認はそのまま適用できません。',
      ],
    },
    {
      heading: '受け取り側に違う品目が届くとき',
      paragraphs: [
        '該当する貨物車の表示内容を調べ、各停車駅の対応するプラットフォームとベルトを照合します。同じ車両位置を使う途中駅があれば、そこも確認対象に含めます。貨物車の内容と到着先ベルトの品目を記録すると、どの区間で混載が入ったかを調べやすくなります。',
        '診断案として、空にした貨物車に使い捨ての試験品を一種類だけ積み、往復運転で各駅の車両とプラットフォームの対応を観察する方法があります。この手順は本稿ではゲーム内で実施していません。',
      ],
    },
    {
      heading: '関連記事との違い',
      paragraphs: [
        '準備済みの列車信号ガイドはBlock Signal、Path Signal、共有線路、デッドロックを扱います。本稿は貨物車とプラットフォームの位置、積み下ろし、受け取り側へ混載が届く理由に絞ります。公開済みの車両パス記事は地上車両、流体トラック記事は液体のトラック輸送が主題で、貨物列車の積み下ろし診断とは異なります。',
      ],
    },
  ],
  references: {
    heading: '参照資料と根拠',
    links: [
      { label: 'Satisfactory Wiki — Freight Platform: Setting up freight stations', href: 'https://satisfactory.wiki.gg/wiki/Freight_Platform#Setting_up_freight_stations' },
      { label: 'Satisfactory Wiki — Freight Platform: Loading and unloading', href: 'https://satisfactory.wiki.gg/wiki/Freight_Platform#Loading_and_unloading' },
      { label: 'Satisfactory Wiki — Freight Car', href: 'https://satisfactory.wiki.gg/wiki/Freight_Car#Freight_Car' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['vehicle-paths', 'fluid-truck-delivery'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Plannerの収録データは1.1.xです。貨物駅の手順はコミュニティWikiの説明に基づきます。Update 1.2以降の現行ゲーム内での貨物車とプラットフォームの対応、日本語UI名、受け取り側の動作は実機で未確認です。',
} as const satisfies HandwrittenArticle
