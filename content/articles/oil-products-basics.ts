import type { HandwrittenArticle } from './types.ts'

/** Per-minute figures are scaled directly from src/data/recipes.json and buildings.json. */
export const oilProductsBasicsArticle = {
  slug: 'oil-products-basics',
  title: '石油製品の基礎 — 原油からプラスチック・ゴム・燃料を作る',
  description:
    '原油を使う標準レシピの比率、廃重油とポリマー樹脂の処理先、発電まで含めた小さな設計例を、収支と停止時の確認順つきで紹介します。',
  publishedDate: '2026-08-26',
  updatedDate: '2026-10-17',
  sections: [
    {
      heading: 'まず標準レシピの入出力を見る',
      paragraphs: [
        'このページの数値例は、サイト収録データの標準レシピを毎分に直したものです。プラスチックは原油30m³/minからプラスチック20個/分と廃重油10m³/min、ゴムは原油30m³/minからゴム20個/分と廃重油20m³/minを作ります。燃料は原油60m³/minから燃料40m³/minとポリマー樹脂30個/分です。いずれも精製機1台あたり30MWです。',
        'まず欲しい製品を決め、それと同時に副産物の出口を決めます。プラスチックとゴムは原油を同量使いますが、廃重油の量はゴムの方が多くなります。燃料レシピではポリマー樹脂が出ます。どちらも受け先が満杯になると、その工程の生産が止まります。',
      ],
      tables: [
        {
          caption: '標準レシピの毎分収支（精製機100%）',
          headers: ['製品', '入力', '出力', '設備電力'],
          rows: [
            ['プラスチック', '原油30m³', 'プラスチック20 + 廃重油10m³', '30MW'],
            ['ゴム', '原油30m³', 'ゴム20 + 廃重油20m³', '30MW'],
            ['燃料', '原油60m³', '燃料40m³ + ポリマー樹脂30', '30MW'],
          ],
        },
      ],
    },
    {
      heading: '最初の石油ラインを60m³/minで組む',
      paragraphs: [
        'プラスチックとゴムを各20個/分ほしいなら、それぞれの精製機を1台ずつ置きます。原油は合計60m³/min、廃重油は合計30m³/minです。残留燃料レシピは廃重油60m³/minから燃料40m³/minを作るので、これを半速で動かすと燃料20m³/minになります。燃料式発電機1台の消費量と一致し、発電量は250MWです。',
        'このブロックは精製機2.5台相当で合計75MWを使うため、発電機の出力から設備分だけ差し引くと175MWが残ります。これはポンプ、原油抽出機、送電設備などを含めない比較値です。起動時は先に原油を流し、廃重油の精製機と発電機まで配管を満たしてから発電機をつなぐと、電力不足でライン全体が止まるのを避けやすくなります。',
        '通常純度ノードの原油抽出機は100%クロックで120m³/minを採るため、60m³/minはその半分です。原油の配管が詰まる場合は抽出量ではなく、精製機の消費設定と配管の定格も確認してください。',
      ],
    },
    {
      heading: '廃重油の出口を発電量と水で選ぶ',
      illustration: {
        src: '/article-images/official-straight-pipes-1.1.jpg',
        alt: 'Satisfactory公式プレスキットのアップデート1.1当時の配管画面。HUDは旧UIで、記事の原油60m³/分ラインを示す配置ではありません。',
        caption: '公式プレスキットのアップデート1.1当時の配管画面です。HUDと操作表示は当時の旧UIで、現行操作手順ではありません。配管経路の一般参考であり、記事の60m³/分レシピ列や廃重油処理結果そのものではありません。',
        creditLinks: [
          { label: 'Satisfactory公式クリエイター向け案内（Press & Content Creators）', href: 'https://www.satisfactorygame.com/press/' },
          { label: '元画像（公式プレスキット／Press Kit）', href: 'https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view' },
        ],
      },
      paragraphs: [
        'プラスチック20個/分とゴム20個/分から出る廃重油30m³/minについて、3つの代表的な使い道を比べます。下表の発電量はその副産物だけを発電に使った場合の総出力です。',
        '希釈燃料は廃重油50m³/minと水100m³/minから燃料100m³/minを作る代替レシピです。30m³/minの廃重油に比例させると水60m³/minを使い、燃料60m³/minになります。混合機は75MWなので0.6台相当で45MWです。代替レシピをまだ解放していない場合は、残留燃料や石油コークスから始めてください。',
        '石油コークスの発電では石炭発電機1台あたりコークス25個/分と水45m³/minを使います。3.6台相当ならコークス90個/分を使い切る一方、水は合計162m³/min必要です。水を確保できない場所では、発電量だけを見てコークス経路を選ぶと設備が止まります。水抽出やポンプの電力は表の発電量に含めていません。',
      ],
      tables: [
        {
          caption: '廃重油30m³/minの処理先（他の上流生産設備の電力は別）',
          headers: ['処理先', '得られるもの', '発電の目安', '追加で必要なもの'],
          rows: [
            ['残留燃料', '燃料20m³/min', '燃料式発電機1台・250MW', 'なし'],
            ['石油コークス', '石油コークス90個/分', '石炭発電機3.6台相当・270MW', '水162m³/min'],
            ['希釈燃料（代替）', '燃料60m³/min', '燃料式発電機3台・750MW', '水60m³/min・混合機0.6台'],
          ],
        },
      ],
    },
    {
      heading: '燃料レシピのポリマー樹脂も使い切る',
      paragraphs: [
        '燃料40m³/minを作る標準工程ではポリマー樹脂30個/分が出ます。残留プラスチックはポリマー樹脂60個/分と水20m³/minからプラスチック20個/分、残留ゴムは樹脂40個/分と水40m³/minからゴム20個/分を作ります。余った樹脂を放置せず、どちらの製品に回すか決めてから燃料ラインを増やすと、精製機の停止を防げます。',
        'リサイクル・プラスチックとリサイクル・ゴムは、燃料に加えて互いの製品を材料にする代替レシピです。単独では循環が始まらないため、原油からの導入量と取り出す製品量を一組として設計します。循環量、起動順、燃料配管の立ち上げは[石油リサイクル循環ガイド](/articles/oil-loop-complete/)を参照してください。希釈燃料の発電を一つの完成プランで見たい場合は[希釈燃料発電](/articles/diluted-fuel-power/)も使えます。',
      ],
    },
    {
      heading: 'Plannerで確かめ、止まったら副産物から追う',
      paragraphs: [
        'Plannerで「プラスチック」または「ゴム」を目標に設定し、まず標準レシピの必要原油量を見ます。生産工程と収支で廃重油・ポリマー樹脂が余っていないかを確認し、解放済みの代替レシピを一つずつ有効にして機械数と水量を比較します。電力も設計する場合は燃料式発電機を有効にし、燃料を選んで目標MWを入力してください。',
        '実機で止まったら、(1) 廃重油または樹脂のタンク・配管が満杯でないか、(2) 副産物の受け先が必要量を消費できているか、(3) 燃料式発電機へ燃料が届いているか、(4) 発電機を動かす電力が先に確保されているか、の順に見ます。Plannerはレシピと定常時の収支を計算しますが、配管の高さ・揚程、起動中の流量、バッファ容量までは配置どおりに再現しません。',
      ],
    },
  ],
  references: {
    heading: 'データの出典とレシピ参照',
    links: [
      {
        label: 'Planner収録レシピの出典と対象バージョン（1.1.x）',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      { label: 'Oil Refinery recipes — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Oil_Refinery' },
      { label: 'Heavy Oil Residue — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Heavy_Oil_Residue' },
      { label: 'Fuel — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Fuel' },
      { label: 'Petroleum Coke — Satisfactory Wiki (English)', href: 'https://satisfactory.wiki.gg/wiki/Petroleum_Coke' },
    ],
  },
  relatedItemIds: [
    'Desc_LiquidOil_C',
    'Desc_Plastic_C',
    'Desc_Rubber_C',
    'Desc_HeavyOilResidue_C',
    'Desc_PolymerResin_C',
    'Desc_LiquidFuel_C',
    'Desc_PetroleumCoke_C',
  ],
  relatedArticleSlugs: [
    'oil-loop-complete',
    'packaged-diluted-fuel-loop',
    'diluted-fuel-power',
    'coal-power-startup',
    'power-generation-planning',
    'strong-alternate-recipes',
  ],
  cta: {
    kind: 'item',
    label: 'プラスチック60個/分の計画を開き、副産物の収支を確認する',
    itemId: 'Desc_Plastic_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
