import type { HandwrittenArticle } from './types.ts'

export const blueprintAutoConnectArticle = {
  slug: 'blueprint-auto-connect',
  publishedDate: '2026-10-17',
  title: '工場BlueprintのAuto Connect — 接続候補を確認する',
  description:
    'BlueprintのAuto Connectでベルト・パイプ・線路をモジュール間につなぐ方法を、Update 1.1公式告知とOfficial Satisfactory Wikiを基に説明します。',
  versionNotice:
    'この記事は現行のSatisfactory Update 1.2の案内として、Update 1.1で追加されたBlueprint Auto ConnectとOfficial Satisfactory Wikiの現行記載を説明します。「自動接続」はAuto Connectの説明用日本語で、現行日本語UIの正式名称を確認したものではありません。操作時は現在のゲーム内表示を優先してください。',
  sections: [
    {
      heading: 'モジュール端点の候補を探す',
      paragraphs: [
        '同じ設備モジュールを並べると、ベルト・配管・線路をつなぐ作業が繰り返しになります。Update 1.1で追加されたBlueprint Auto Connectは、設置ホログラムを動かしながらBlueprint内の搬送設備と既存の入出力端点との接続候補を探し、配置前に候補を表示する機能です。現行のOfficial Satisfactory Wikiは、コンベア、パイプ、鉄道、車両パスを対象として挙げています。',
        '候補を見やすくするには、まず一種類の端点だけを含むBlueprintで試します。公式案内ではPCでBlueprintホログラム表示中にRを押してBuild Modeを切り替えます。ほかの入力機器では、現行画面の操作ヒントと割り当て設定を確認してください。日本語UIの正式なモード名はここでは断定せず、英語名のAuto Connectを基準にしています。',
      ],
    },
    {
      heading: '候補表示を確認してから配置する',
      paragraphs: [
        'ホログラムを既存の端点近くへ動かし、意図した接続候補が表示される位置を探します。Press Kit画像にはBlueprintのAuto Connectモード、鎖形の候補アイコン、接続プレビューが写っていますが、古いコントローラー画面です。画面のボタン表示を現在の操作手順として読み替えないでください。候補が見えない、または別の端点を指している場合は、配置を確定せずホログラムの位置や向きを一つずつ調整します。',
        'Coffee StainのUpdate 1.1.0.2告知とOfficial Wikiに記された16 mは、接続候補を検知する距離です。Update 1.1.0.2で10 mから16 mへ拡大された記録があります。この値は候補を見つける範囲であり、完成後に延びるベルト・配管・線路の長さを示しません。地形や端点の形状が違うときも、距離だけから接続成立を保証できません。',
        '配置を確定した後は、実際の搬送設備が意図した端点とつながっているか確認します。公式のUpdate 1.1.0.6修正告知には、Auto Connectの表示と確定に関する修正があります。これは設置前後の表示を確認する理由になりますが、過去の不具合が現在も残っているという意味ではありません。',
      ],
    },
    {
      heading: '候補が出ないときの切り分け',
      paragraphs: [
        '接続されない場合は、(1)Build ModeがBlueprint Auto Connectか、(2)Blueprintにベルト・パイプ・線路の端点が含まれているか、(3)意図した候補がホログラム上に表示されているか、(4)周辺に別の接続候補がないかを順に見ます。位置、向き、近くの端点をまとめて変えず、一つずつ動かすと候補表示が変わる要因を絞れます。',
        '候補が一つでも表示されたら自動的に希望どおりの接続になる、あるいはどの地形・高低差でも使える、という保証はありません。ゲーム内の現在の操作ヒントに従って候補を選び、配置後に接続を確認してください。Auto Connectの公式対象一覧に送電線は含まれないため、電力は別に接続されているか確認します。',
      ],
    },
    {
      heading: 'この記事の対象範囲',
      paragraphs: [
        'この記事は生産モジュール間のベルト・パイプ・線路のAuto Connect候補表示と診断に絞っています。車両パスは対象種類としてWikiに記載されていますが、ルート設計や車両運行は別の車両パスガイドに分けています。Blueprint Designerの寸法・保存手順、Plannerの床面積見積もり、電源デイジーチェーンは扱いません。Press Kit画像は接続候補を示す参考場面であり、設置後の搬送や特定の生産レイアウトを実証する画像ではありません。',
      ],
    },
  ],
  references: {
    heading: '公式の機能説明と現在の接続範囲',
    links: [
      { label: 'Coffee Stain Studios: Satisfactory 1.1 — Auto Connect Blueprints', href: 'https://store.steampowered.com/news/app/526870/view/520841474254835359' },
      { label: 'Coffee Stain Studios: Update 1.1.0.2 (候補検知範囲)', href: 'https://steamcommunity.com/games/526870/announcements/detail/543354406737805516' },
      { label: 'Coffee Stain Studios: Update 1.1.0.6 fixes', href: 'https://store.steampowered.com/news/app/526870/view/520841474254834517' },
      { label: 'Official Satisfactory Wiki: Blueprint', href: 'https://satisfactory.wiki.gg/wiki/Blueprint' },
      { label: 'ユーザー質問例: Blueprint Auto Connectの使い方', href: 'https://www.reddit.com/r/SatisfactoryGame/comments/1nh0l6c/how_to_auto_connect_blueprints/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['factory-floor-area', 'vehicle-paths'],
  cta: {
    kind: 'sample',
    label: '接続する生産モジュールの必要設備数を確認する',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
