import type { HandwrittenArticle } from './types.ts'

/**
 * Capacity and per-minute rates below are from the repository's 1.1.x game-data
 * snapshot, at 100% clock. Coal generators run at the configured clock regardless
 * of grid demand; the planner reports whole generators at rated capacity.
 */
export const coalPowerStartupArticle = {
  slug: 'coal-power-startup',
  title: '石炭発電の立ち上げ — 8台600MWを安定させる手順',
  description:
    '8台の石炭発電機を例に、燃料・水・搬送量の見積もり、仮設電源を使った始動、停電時に供給を守る配線、プランナーの定格出力とゲーム内の実負荷の違いを解説します。',
  publishedDate: '2026-08-26',
  updatedDate: '2026-10-17',
  sections: [
    {
      heading: '必要な発電容量と燃料を決める',
      paragraphs: [
        'まず発電機の台数とクロック設定を決めます。石炭発電機はクロック100%なら、電力網の需要に関係なく75 MWを出し続けます。石炭を使うと1台あたり石炭15個/分と水45 m³/分を消費するため、8台なら発電量600 MW、石炭120個/分、水360 m³/分です。負荷が小さくても発電機は自動で出力や燃料・水の消費を絞りません。クロックを手動で下げた場合にだけ、設定値に応じて出力と消費量が比例して下がります。',
        '圧縮石炭は1台あたり約7.14個/分、石油コークスは25個/分を定格で使います。水の定格入力はどちらも45 m³/分です。圧縮石炭なら硫黄と組立機が増え、石油コークスなら廃重油を使えますがベルト量が増えます。まず確保できる資源と搬送手段で燃料を選び、その燃料の定格量を基準に設備を数えてください。',
      ],
    },
    {
      heading: 'ベルトと配管の上限に合わせて分ける',
      paragraphs: [
        '石炭120個/分はMk.2ベルト1本の上限と一致します。Mk.1ベルトなら8台分を1本で運べないので、複数の供給線に分けるか台数を減らします。純度通常のノードにMk.2採鉱機を100%で置いた場合も120個/分です。実際の採掘量はノード純度と採鉱機のクロックに合わせて確認してください。',
        '水360 m³/分には揚水ポンプ3台（各120 m³/分）が必要です。Mk.1パイプ1本の上限は300 m³/分なので、8台分を1本だけで運ぶ設計には足りません。Mk.2パイプ1本（最大600 m³/分）を使うか、Mk.1配管を分割して複数箇所から給水します。揚程も確認し、抽出機の水面より高い場所へ送るときは必要なポンプを追加してください。',
      ],
    },
    {
      heading: '仮設電源で燃料と水を先に流す',
      illustration: {
        src: '/article-images/coal-power-startup-generators-presskit-2020.webp',
        alt: 'Satisfactoryの石炭発電機とコンベアの一般的なゲーム内風景。2020年の公式プレスキット画像で、記事の起動手順や発電機数は示していません。',
        caption: '2020年の公式プレスキットに含まれる石炭発電のゲーム内風景です。記事の仮設電源による起動順、特定の台数、電力計算を示すものではありません。',
        creditLinks: [
          { label: '公式Satisfactory Press & Content Creatorsページ', href: 'https://www.satisfactorygame.com/press/' },
          { label: '元画像（公式Press Kit）', href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view' },
        ],
      },
      paragraphs: [
        '揚水ポンプと採鉱機を動かす電力を、石炭発電機を立ち上げる前に用意します。最初はバイオマス発電機などの仮設電源から供給し、石炭ベルトと水配管を発電機へ接続します。各発電機に燃料が届き、水が流れていることを見てから、発電機を工場の電力網へつなぎます。搬送マニフォールドは末端まで満たされるのに時間がかかるため、立ち上げ直後だけでなく、少し運転して末端側の供給も確かめてください。',
        '供給設備を工場本体と別の電力網に置くと、工場側のブレーカーが落ちても採鉱機と揚水ポンプを動かし続けられ、復旧が楽になります。8台構成で採鉱機Mk.2を1台使う例なら、揚水ポンプ3台が60 MW、採鉱機が15 MWで、供給設備の定格消費は合計75 MWです。発電設備自体の使用電力も含め、使える電力は発電量から差し引いて見積もります。',
      ],
    },
    {
      heading: '停止したときは電力と供給を分けて調べる',
      paragraphs: [
        '電力網全体がブレーカーで止まったなら、まず最大発電容量を超える負荷をつないでいないか確認します。発電機が動いているのに出力が安定しない場合は、燃料ベルトの末端まで石炭が届くか、水配管の流量と高低差が足りているかを別々に見ます。配管が複数の揚水ポンプにつながる構成では、1本の区間に流量が集中してMk.1の上限を超えていないかも確認します。',
        '原因を切り分けるため、採鉱機・揚水ポンプ・発電機・工場負荷を一度に同じ回路へ足さず、供給側を先に安定させます。復旧後は工場の負荷を段階的につなぎ、負荷を追加した時点で再停止するなら発電容量不足、負荷が増えていないのに止まるなら燃料か水の供給不足を調べます。',
      ],
    },
    {
      heading: 'プランナーの結果を容量として読む',
      paragraphs: [
        'プランナーでは石炭発電機を有効にし、燃料と目標MWを設定します。結果の発電機台数は100%クロックの整数台で見積もるため、100 MWを入力すると2台・合計150 MWの能力と、石炭30個/分・水90 m³/分が表示されます。これは2台を100%クロックで動かすときの値です。ゲーム内で合計100 MWに設定するには2台をそれぞれ66⅔%に手動アンダークロックし、石炭20個/分・水60 m³/分にします。電力需要だけでは発電機の出力は下がりません。',
        'プランナーの「工場消費電力を賄う」条件は製造設備を含みますが、採鉱機や揚水ポンプの電力は含みません。結果の採掘電力を見て供給側の消費を別に足してください。需要に合わせて出力を絞る例外はバイオマス発電機です。石炭発電機では設定クロックに応じて出力を決め、発電容量が需要に足りなければブレーカーが落ちます。',
      ],
    },
  ],
  references: {
    heading: 'データと参考資料',
    links: [
      {
        label: 'Satisfactory公式 Press & Content Creators / Press Kit',
        href: 'https://www.satisfactorygame.com/press/',
      },
      {
        label: '公式Press Kit掲載画像: coal.jpg（2020年）',
        href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view',
      },
      {
        label: 'Satisfactory Wiki: 石炭発電機（英語）',
        href: 'https://satisfactory.wiki.gg/wiki/Coal_generator',
      },
      {
        label: 'Satisfactory Wiki: 電力（英語）',
        href: 'https://satisfactory.wiki.gg/wiki/Electricity',
      },
      {
        label: '公式Satisfactory Update 4の告知（2021年・英語）',
        href: 'https://store.steampowered.com/news/posts/?appids=526870&enddate=1624027272&feed=steam_community_announcements',
      },
      {
        label: 'プランナーのゲームデータ出典・版情報（英語）',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      {
        label: 'Coal Power Tutorial — Satisfactory Guru（始動手順・配管比較、英語）',
        href: 'https://satisfactory.guru/articles/read/index/id/6/name/Coal%2BPower%2BTutorial',
      },
    ],
  },
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_CompactedCoal_C',
    'Desc_Sulfur_C',
    'Desc_PetroleumCoke_C',
    'Desc_HeavyOilResidue_C',
  ],
  relatedArticleSlugs: ['power-generation-planning', 'oil-products-basics', 'turbofuel-power'],
  cta: {
    kind: 'item',
    label: '圧縮石炭50個/分（石炭発電機7台ぶん）の計画を開く',
    itemId: 'Desc_CompactedCoal_C',
    ratePerMin: 50,
  },
} as const satisfies HandwrittenArticle
