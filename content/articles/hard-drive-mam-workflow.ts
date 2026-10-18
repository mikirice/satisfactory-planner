import type { HandwrittenArticle } from './types.ts'

export const hardDriveMamWorkflowArticle = {
  slug: 'hard-drive-mam-workflow',
  title: 'ハードドライブ探索 — 回収からMAM研究まで',
  description:
    '墜落現場での回収、MAMでのハードドライブ解析、研究ツリーへの登録を区別し、レシピ選択で混乱しやすい手順を整理します。',
  publishedDate: '2026-10-17',
  updatedDate: '2026-10-17',
  versionNotice:
    'Plannerのアイテムデータは1.1.xです。アップデート1.2での変更有無は未照合で、1.0告知の選択・再抽選変更と2026年更新の公式Wiki索引記述を区別しています。',
  sections: [
    {
      heading: '探索・回収とMAMの操作を分ける',
      paragraphs: [
        'ハードドライブを墜落現場から回収すること、MAMでドライブを解析してレシピ候補を選ぶこと、MAMの研究ツリーを進めることは、関連していますが別の作業です。このガイドは探索から候補の保留・解放までを扱い、どのレシピが最善かの順位付けはしません。',
        '現地に着いたら、墜落したコンテナの周囲とゲーム画面に出るアクセス条件を確認します。条件を満たせない場合は場所を記録して後で戻ってください。本記事では固定座標、必要アイテム一覧、スキャナーの現行解放・案内手順を、照合せずに断定しません。',
      ],
    },
    {
      heading: 'ドライブの解析結果は後で選べる',
      paragraphs: [
        'Coffee StainのSatisfactory 1.0告知は、ドライブの解析結果を3候補から2候補に変更し、1回の再抽選を追加したと記録しています。また、解析して候補を保留し、後でハードドライブ保管庫から選ぶ変更も説明しています。公式Wikiの2026年更新索引も、解析結果を保管庫へ保管し、各ドライブの候補を一度再抽選できるとしています。',
        '候補が表示された状態と、レシピが解放されて工場で利用できる状態を同じものとして扱わないでください。選択を保留した候補はハードドライブ保管庫から後で選べます。これは1.0告知と2026年更新の公式Wikiに記載された流れで、ここでは特定のボタン名を示しません。',
      ],
    },
    {
      heading: 'MAMの研究ツリーとは別に確認する',
      paragraphs: [
        'MAMではハードドライブの解析候補を扱う流れと、研究プロジェクトを進める流れがあります。ハードドライブ、MAM、代替レシピ、再抽選は記事内で機能を区別するための用語で、現行日本語UIのタブ名やボタン名を示すものではありません。',
        'スキャンできない場合は、対象ドライブがインベントリにあるか、画面上の条件や警告が何を求めているかを確認し、文言を記録します。古い動画や地図の必要アイテムを現在の必須条件として再掲しないでください。',
      ],
    },
    {
      heading: '解放後のレシピをPlannerで使う',
      paragraphs: [
        'Satisfactory Plannerで計画するときは、自分のセーブで利用できる代替レシピだけを選びます。Plannerのゲームデータは1.1.xを対象としており、アップデート1.2以降の数値が同じかは別途確認が必要です。代替レシピの比較軸は[比較指標ガイド](https://satisfactory-planner.net/articles/alternate-recipe-metrics/)、材料・設備・電力の選び方は[代替レシピガイド](https://satisfactory-planner.net/articles/strong-alternate-recipes/)を参照してください。',
        'このガイドは探索・回収とMAMのワークフローを対象にし、レシピのおすすめ順位、全墜落現場の座標一覧、解析時間や選択にかかる現在の効果は扱いません。',
      ],
    },
  ],
  references: {
    heading: 'DriveとMAMの参照資料',
    links: [
      { label: 'Coffee Stain Studios: Satisfactory 1.0 announcement', href: 'https://store.steampowered.com/news/posts/?appids=526870&enddate=1726766891&feed=steam_community_announcements' },
      { label: 'Official Satisfactory Wiki: Hard Drive', href: 'https://satisfactory.wiki.gg/wiki/Hard_Drive' },
      { label: 'Official Satisfactory Wiki: Crash Site', href: 'https://satisfactory.wiki.gg/wiki/Crash_Site' },
      { label: 'Official Satisfactory Wiki: MAM', href: 'https://satisfactory.wiki.gg/wiki/MAM' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: ['Desc_HardDrive_C'],
  relatedArticleSlugs: ['alternate-recipe-metrics', 'strong-alternate-recipes', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: '解放済みレシピで生産計画を作る',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
