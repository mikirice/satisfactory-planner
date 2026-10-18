import type { HandwrittenArticle } from './types.ts'

export const powerConnectorDaisyChainArticle = {
  slug: 'power-connector-daisy-chain',
  publishedDate: '2026-10-17',
  title: '電源コネクタのデイジーチェーン入門',
  description:
    'アップデート1.2で追加された電源コネクタのデイジーチェーンを解放し、建物を直接つなぐ基本を紹介します。接続数と発電計画の違いも整理します。',
  versionNotice:
    'この記事はSatisfactory アップデート1.2の電源コネクタのデイジーチェーン機能を対象にしています。解放条件と基本動作は開発元の告知に基づきます。接続距離や建物ごとの例外など、告知にない上限や挙動は断定しません。',
  sections: [
    {
      heading: 'Caterium研究で解放する',
      paragraphs: [
        '電源コネクタのデイジーチェーンは、アップデート1.2で加わったMAMのカテリウム研究です。開発元が公表した研究コストはコンピューター 15個、高速コネクター 50個、クイックワイヤー 500個です。研究が完了すると、建物に2つの電源接続を作り、建物同士を直接つないで電力網の一部として電力を流せます。',
        '通常の電柱から建物へ配線する方法を置き換える唯一の正解ではありません。機械列に電柱を置く回数を減らしたいとき、建物間を短く結びたいときに使える追加の配線方法です。Power計算、発電量、設備が消費する電力量そのものを変える機能とは説明されていません。',
      ],
      tables: [
        {
          caption: '開発元告知に記載されたCaterium研究コスト',
          headers: ['アイテム', '個数'],
          rows: [
            ['コンピューター', '15'],
            ['High-Speed Connector', '50'],
            ['クイックワイヤー', '500'],
          ],
        },
      ],
    },
    {
      heading: '短い建物列で給電経路を組む',
      paragraphs: [
        'まず電力網へつながる電柱と建物1台を置き、二つ目の接続点を使って次の建物へ電力線を伸ばします。接続時にはゲーム内のコネクタ表示を確認してください。二つ目の接続点を使い切った建物を連鎖の途中へ追加することはできないため、建物の数と分岐位置を先に決めると配線を整理しやすくなります。',
        '次に3台目を追加し、各建物が同じ電力網につながった状態か、発電・消費の表示が想定どおりかを確認します。分岐や長い配線を含むエリアでは、電柱からの独立した給電経路を残すと、配置変更や取り外し後に接続先を確認しやすくなります。これは故障動作の特別な保証ではなく、配線を読みやすく保つための整理方法です。',
      ],
    },
    {
      heading: '告知にない上限は決めつけない',
      paragraphs: [
        'アップデート1.2の告知は、二つの電源接続と建物間での電力網接続を説明していますが、最大接続距離、建物ごとの例外、長い連鎖の性能や特別な故障挙動を数値化していません。「どこまでもつながる」「接続が増えても損失や制限はない」といった説明は追加せず、必要な場所で実際の接続表示と電力網を確認してください。',
        'この機能は配線経路の選択肢です。Plannerの発電計画は発電設備とレシピの出力を扱いますが、電柱や建物を結ぶ電線、分岐の配置、デイジーチェーン自体はシミュレートしません。発電計画と建物の配線図は分けて考えます。',
      ],
    },
    {
      heading: '既存の電力計画ガイドとの違い',
      paragraphs: [
        '「発電計画」は発電方式ごとの出力と燃料を比較し、「石炭発電の始動」は発電所を立ち上げる供給手順を扱います。このページはアップデート1.2で追加された建物間の電源接続と研究コストに範囲を絞り、未公表の配線距離や容量上限は説明しません。',
      ],
    },
  ],
  references: {
    heading: '公式仕様と関連ガイド',
    links: [
      { label: '開発元: Satisfactory 1.2 Update out now! — Daisy chaining', href: 'https://store.steampowered.com/news/app/526870/view/695387676933621085' },
      { label: 'Plannerの発電計画ガイド', href: '/articles/power-generation-planning/' },
      { label: '開発元公式告知一覧（最新パッチ確認用）', href: 'https://steamcommunity.com/app/526870/announcements/?l=english' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['power-generation-planning', 'coal-power-startup', 'factory-floor-area'],
  cta: {
    kind: 'sample',
    label: '希釈燃料発電の生産・設備計画をPlannerで開く',
    sampleId: 'diluted-fuel-power',
  },
} as const satisfies HandwrittenArticle
