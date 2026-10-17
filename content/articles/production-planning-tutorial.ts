import type { HandwrittenArticle } from './types.ts'

export const productionPlanningTutorialArticle = {
  slug: 'production-planning-tutorial',
  updatedDate: '2026-10-17',
  title: '生産計画の始め方 — 入力から6つの結果タブまで',
  description:
    '目標の追加、計画条件の調整、6つの結果タブの確認、保存・共有・Excel出力まで、現行Plannerの画面に沿って案内します。',
  sections: [
    {
      heading: 'まずはサンプルを開くか、目標を一つ追加する',
      paragraphs: [
        '画面に慣れるなら、サンプル一覧から「はじめての鉄板ライン」を開いてください。自分の条件で始める場合は、目標産出の検索欄でアイテムを選び、追加された行に毎分レートを入力します。たとえば鉄板を60個/分にします。検索候補にないアイテムは選べません。同じ目標アイテムを重ねて追加するのではなく、既存の行のレートを編集します。入力条件を変えるとPlannerが解き直します。',
        '通常は作りたい量を指定します。必要量が分からないときは、その行の「最大化」を選ぶと設定した原料上限の範囲で最大産出を求めます。最大化は同時に1アイテムだけ指定できます。結果が出ない、または実行不能と表示されたら、要求量、原料上限、許可レシピを見直します。',
      ],
    },
    {
      heading: '必要な条件だけ調整する',
      illustration: {
        src: '/article-images/production-planning-throughput-display-update-1-1.png',
        alt: 'Satisfactoryのゲーム内ベルトに表示されたスループットカウンター。14個/分、24個/分、195個/分、200個/分の例が見える。Plannerの画面ではありません。',
        caption: '公式Press KitのUpdate 1.1素材にある実ゲームの搬送量表示です。定常レシピ収支を計算するPlannerとの違いを示す参考で、この記事の鉄板サンプルや計算結果ではありません。',
        creditLinks: [
          { label: '公式Satisfactory Press & Content Creatorsページ', href: 'https://www.satisfactorygame.com/press/' },
          { label: '元画像（公式Press Kit）', href: 'https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view' },
        ],
      },
      paragraphs: [
        '最初の比較では目的関数を既定のままにし、目標と結果を先に確認すると原因を追いやすくなります。別の目的関数に切り替えると、同じ目標でも採用するレシピや設備構成が変わることがあります。使える代替レシピだけを有効にし、別工場から届く材料や在庫は「既にあるアイテム」に毎分供給量として入力します。未使用分が残ることもあるため、実際に使われた量は結果のサマリーで確認してください。',
        '原料上限、製造クロック上限、採鉱機と採掘クロック、ベルトとパイプの設定はサイドバーで調整できます。採鉱機とノード配分、採掘電力を見たい場合は「原料」タブも開きます。ベルト・パイプ設定は必要な搬送量の表示に関わります。計画は定常的なレシピ収支の計算で、ゲーム内の在庫、ベルトや配管の配置、配管の揚程、起動時の一時的な詰まりまでは再現しません。',
      ],
    },
    {
      heading: '六つの結果タブを順に確かめる',
      paragraphs: [
        '「サマリー」で目標に対する産出、クロック適用後の電力範囲、設備台数、概算床面積、副産物やSinkポイントをつかみます。「生産ステップ」では機械種別ごとにレシピ、稼働換算台数、建てる台数、クロック、入出力レートを追えます。発電を含む計画では、表示だけ発電工程を隠す切り替えもあります。',
        '「原料」は必要量、マップ上限に対する割合、採鉱機と純度別ノード割当を確認する場所です。「アイテム収支」では各アイテムの産出・消費・外部供給と差分を照合します。「フローチャート」は工程間の接続を見る図です。最後の「建設リスト」は採掘・給水、製造、発電の順に設備と搬送レートを読む画面です。サマリーで規模を見てから収支や工程を調べ、現地作業には建設リストへ進むと整理しやすくなります。',
      ],
    },
    {
      heading: '鉄板60個/分で一度通してみる',
      paragraphs: [
        'サンプル「はじめての鉄板ライン」は、代替レシピなしで鉄板60個/分を目標にした例です。サマリーで要求と産出を比べ、生産ステップで鉄鉱石からインゴット、鉄板へ進むレシピと台数を追います。原料と収支で鉄鉱石や中間品の量がつながるか確認し、フローチャートで経路を見てから建設リストを開いてください。目標レートや代替レシピを変えれば必要設備も変わるため、サンプルの数値を別の工場にそのまま当てはめず、自分の条件で再計算します。',
      ],
    },
    {
      heading: '入力を保存・共有し、結果を持ち出す',
      paragraphs: [
        '「プラン」パネルでは名前を付けてブラウザー内に保存し、保存済みプランを読み込めます。共有ボタンは現在の入力条件を含むURLを作り、コピーを試みます。受け取った人は自分の環境で条件を再計算するため、共有URLは計算済みの出力表そのものではありません。Excel出力パネルではプラン名を入れてダウンロードします。最適解があり計算中でないときに利用でき、失敗時は画面にエラーが出ます。',
        'レシピ値はPlannerに同梱されたデータ版に基づきます。ゲーム側の更新差を判断するときは、結果に表示されるデータ版と出典記録を確認し、未照合のゲームバージョンを同一とみなさないでください。',
      ],
    },
  ],
  references: {
    heading: '実装・データの参照先',
    links: [
      { label: '結果タブと表示の実装', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/ResultView.tsx' },
      { label: '計画入力と標準設定の実装', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/TargetsPanel.tsx' },
      { label: 'データ版と取得元の記録', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  relatedArticleSlugs: ['build-checklist-guide', 'excel-export-guide'],
  cta: {
    kind: 'sample',
    label: '鉄板60個/分のサンプル計画を開く',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
