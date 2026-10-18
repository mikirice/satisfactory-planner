import type { HandwrittenArticle } from './types.ts'

export const blueprintDesignerWorkflowArticle = {
  slug: 'blueprint-designer-workflow',
  title: 'Blueprint Designer — 設備を保存して繰り返し配置する',
  description:
    'ブループリント設計機の寸法、反復モジュールの組み立て、保存と配置の流れを、Update 1.0資料と現行Official Wikiに基づいて説明します。',
  publishedDate: '2026-10-17',
  updatedDate: '2026-10-17',
  versionNotice:
    'Plannerのアイテムデータは1.1.xです。Update 1.2の変更有無は未照合です。Blueprint Designerの寸法と解放TierはUpdate 1.0告知に記録された値です。',
  sections: [
    {
      heading: '小さな反復単位から作る',
      paragraphs: [
        'Blueprint Designerは、複数の建築物をBlueprintとして保存し、別の場所へ配置し直すゲーム内機能です。Satisfactory Plannerの生産量計算や工場の床面積見積もりとは別の作業です。最初は工場全体ではなく、入力側・設備・出力側の向きを揃えた小さなモジュールを選びます。',
        '作り始める前に、入力と出力を置く側、モジュールの基準方向、後から接続するベルトや配管のための余白を決めます。これは再利用しやすくする設計上の提案で、ゲームが要求する必須レイアウトではありません。',
      ],
    },
    {
      heading: 'Designerの寸法と境界を確認する',
      paragraphs: [
        'Coffee Stain StudiosのUpdate 1.0告知は、Blueprint Designer Mk.1がTier 4・32 m、Mk.2がTier 6・40 m、Mk.3がTier 9・48 mであると記録しています。下表は立方体状の設計範囲を各辺の寸法で示します。これはDesigner建物の外寸ではありません。',
      ],
      tables: [
        {
          caption: 'Update 1.0告知に記載されたBlueprint Designerの設計範囲',
          headers: ['Designer', '解放段階', '設計範囲'],
          rows: [
            ['Mk.1', 'Tier 4 — FICSIT Blueprints', '32 × 32 × 32 m'],
            ['Mk.2', 'Tier 6 — FICSIT Blueprints Mk.2', '40 × 40 × 40 m'],
            ['Mk.3', 'Tier 9 — FICSIT Blueprints Mk.3', '48 × 48 × 48 m'],
          ],
        },
      ],
    },
    {
      heading: '保存してマップへ配置する流れ',
      paragraphs: [
        'Official Satisfactory Wikiの説明では、建物全体をDesignerの境界内に収め、Designerに備え付けられた端末からBlueprintとして保存します。保存情報には名前、説明、Build Menuでの分類、アイコンや背景色を含められます。',
        '保存したBlueprintはBuild Menuから選び、配置ホログラムの向きと周囲の空間を確かめて設置します。ここでは特定のボタン名や入力機器ごとの操作を指定せず、画面に表示される操作ヒントに沿う一般的な手順を説明しています。',
      ],
    },
    {
      heading: '既存Blueprintの編集とAuto Connectを分ける',
      paragraphs: [
        'Wikiは、Mk.1で作ったBlueprintをMk.2またはMk.3 Designer内で個別編集できないと説明しています。編集する場合は作成元と同じMarkから始め、元データを上書きするか別名で保存できるかを先に確かめてください。Wikiだけでは、すべての上書き・複製・移行条件までは確定できません。',
        'Auto Connectは配置時に搬送設備の接続候補を扱う別機能です。Designerで設計・保存する流れと混同しないでください。モジュール間の接続条件は[Blueprint Auto Connectガイド](https://satisfactory-planner.net/articles/blueprint-auto-connect/)で扱います。',
      ],
    },
  ],
  references: {
    heading: '寸法・機能・用語の参照資料',
    links: [
      { label: 'Coffee Stain Studios: Satisfactory 1.0 announcement', href: 'https://store.steampowered.com/news/posts/?enddate=1725981659&feed=steam_community_announcements' },
      { label: 'Official Satisfactory Wiki: Blueprint Designer', href: 'https://satisfactory.wiki.gg/wiki/Blueprint_Designer' },
      { label: 'Official Satisfactory Wiki: Blueprint', href: 'https://satisfactory.wiki.gg/wiki/Blueprint' },
      { label: 'Coffee Stain Studios: Update 1.2.4.0 fixes', href: 'https://steamcommunity.com/games/526870/announcements/detail/716786751176181501' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['blueprint-auto-connect', 'factory-floor-area', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Open a factory plan for a product in your reusable module',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
