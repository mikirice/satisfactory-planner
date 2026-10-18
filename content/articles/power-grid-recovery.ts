import type { HandwrittenArticle } from './types.ts'

export const powerGridRecoveryArticle = {
  slug: 'power-grid-recovery',
  title: '電力ヒューズ復旧 — 原因を分けて負荷を戻す',
  description:
    '停止した電力網で発電設備・支援入力・需要区画を分けて確認し、優先スイッチと蓄電を使う際に見落としやすい条件を整理します。',
  publishedDate: '2026-10-17',
  updatedDate: '2026-10-17',
  versionNotice:
    'Plannerのアイテムデータは1.1.xです。Update 1.2での変更有無は未照合で、優先電源スイッチと蓄電の仕様は更新済みOfficial Wikiの索引記述を含みます。',
  sections: [
    {
      heading: '停電時の表示と直前の変更を記録する',
      paragraphs: [
        '電力ヒューズが切れたら、負荷を一度に戻す前に、電力網の表示、停止した区画、直前に増設・再接続した設備を記録します。発電量、消費電力、最大消費電力と、各発電機の燃料・水・原料入力は別々に確認してください。最大消費電力だけでは原因は特定できません。',
        '発電量不足と、燃料・水の供給停止は別の原因です。ゲーム内に警告が出た場合は文言も控え、後で同じ状態を比較できるようにします。',
      ],
    },
    {
      heading: 'Priority Power Switchが示す遮断順を読む',
      paragraphs: [
        'Coffee StainのUpdate 8告知では、Priority Power Switchは停電が迫ったとき、設定した優先順位に従って回路区画を切り離し、残った需要が供給に収まるまで負荷を落とす機能として説明されています。Official Satisfactory Wikiの現行索引記述では、未設定の区画が先に切られ、その後はGroup 8からGroup 1へ進みます。発電や燃料生産をGroup 1に置くことも推奨されています。',
        'スイッチは発電量を増やしません。発電、採掘、燃料、水の供給設備がどの回路側につながっているかを配線ごとに確認します。区画を保護する優先順位を設定しただけで、その支援設備が停電中も動くとは限りません。',
      ],
    },
    {
      heading: '発電側の入力を確認してから負荷を戻す',
      paragraphs: [
        '発電機の燃料・原料・水、排出先の詰まり、発電機と支援設備の電力接続をそれぞれ確認します。燃料製造、採掘設備、ポンプが停電で止まって供給不足になった場合は、どの設備を先に戻すかが発電方式と配線によって変わります。発電機だけを先に再始動すればよいとは限りません。',
        '電力網を復旧したら、重要度の低い区画を切り離したまま発電と必要な支援設備を確認します。その後、負荷を一つずつ戻し、再トリップした区画とその時点の発電機入力を記録します。どの支援設備を先に戻すかは発電方式と配線によって異なります。',
      ],
    },
    {
      heading: 'Power Storageは有限のバッファとして扱う',
      paragraphs: [
        'Official Satisfactory Wikiの現行索引には、Power Storage 1基あたり100 MWhの容量、最大100 MWの充電、最大放電量Unlimitedが記載されています。蓄電は一時的な発電不足を補う設備ですが、蓄電量は有限です。需要が発電を上回り続ければ、蓄電量は減り、継続する不足は解消できません。',
        '停電時に使う場合は、停電前の充電状態、対象区画との接続、発電が戻った後の表示変化を確かめます。蓄電容量だけから何分の復旧猶予があるか、Fuseをどう戻せるかは断定できません。',
      ],
    },
  ],
  references: {
    heading: '停電と電源管理の参照資料',
    links: [
      { label: 'Coffee Stain Studios: Update 8 Power Switch notes', href: 'https://store.steampowered.com/news/app/526870/view/3690183765419759383' },
      { label: 'Official Satisfactory Wiki: Priority Power Switch', href: 'https://satisfactory.wiki.gg/wiki/Priority_Power_Switch' },
      { label: 'Official Satisfactory Wiki: Power Storage', href: 'https://satisfactory.wiki.gg/wiki/Power_Storage' },
      { label: 'Coffee Stain Studios developer Q&A about resetting a tripped fuse', href: 'https://www.youtube.com/watch?v=Nq7EvudDLLw' },
      { label: 'Update 8 developer stream: Power Towers and Priority Switches', href: 'https://www.youtube.com/watch?v=PR5Tc9g7YDE&t=893s' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['power-generation-planning', 'coal-power-startup', 'power-connector-daisy-chain'],
  cta: {
    kind: 'item',
    label: '燃料供給が原因ならCoalの搬送を計画する',
    itemId: 'Desc_Coal_C',
  },
} as const satisfies HandwrittenArticle
