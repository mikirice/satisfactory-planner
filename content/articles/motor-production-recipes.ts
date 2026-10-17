import type { HandwrittenArticle } from './types.ts'

/** Recipe rates and inputs are calculated from the repository's verified Satisfactory 1.1.x data. */
export const motorProductionRecipesArticle = {
  slug: 'motor-production-recipes',
  title: 'モーターの代替レシピ比較 — ローター・固定子・電磁制御棒のどれを使う？',
  description:
    'Satisfactory 1.1.x の標準モーター・電動モーター・精密モーターを、15個/分にそろえて直接材料と設備を比較。手持ちのローター、固定子、電磁制御棒、水晶発振器から選ぶ基準をまとめます。',
  publishedDate: '2026-10-17',
  updatedDate: '2026-10-17',
  sections: [
    {
      heading: '先に結論：不足している部品で選ぶ',
      paragraphs: [
        'モーターのレシピは、標準・電動モーター・精密モーターの3つです。レシピの優劣は、モーターの出力だけでは決まりません。ローターと固定子を両方作る標準、電磁制御棒に置き換える電動モーター、水晶発振器を加えてローターと固定子の使用量を抑える精密モーターから、工場で余っている部品に合うものを選びます。',
        '比較の基準をモーター15個/分にそろえると、標準はローター30個/分と固定子30個/分、電動モーターはローター15個/分と電磁制御棒7.5個/分、精密モーターはローター7.5個/分・固定子7.5個/分・水晶発振器2.5個/分です。これはレシピの入出力を比例計算した名目値で、搬送の詰まりや停止時間を含みません。',
      ],
      illustrations: [
        {
          src: '/article-images/satisfactory-factory-general.webp',
          alt: 'Satisfactoryの工場とレールの一般的なゲーム内風景。モーター専用ラインやレシピ画面ではありません。',
          caption: '公式Satisfactoryメディアの一般的な工場風景です。Motor専用ラインやこの記事の計算結果を示すものではありません。',
          creditLinks: [
            { label: 'Satisfactory screenshot © Coffee Stain Studios / 出典：公式Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
            { label: '掲載画像', href: 'https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg' },
          ],
        },
        {
          src: '/article-images/motor-recipe-inputs-ja.svg',
          alt: 'モーター15個/分を作る3レシピの直接入力と設備数を並べた図。標準は組立機3台、ローターと固定子各30個/分。電動は組立機2台、ローター15個/分と電磁制御棒7.5個/分。精密は製造機2台、ローターと固定子各7.5個/分、水晶発振器2.5個/分。',
          caption: '自作のレシピ比較図。1.1.xのレシピ直接入力を15個/分に比例計算した値で、上流工程や電力は含みません。ゲーム画面ではありません。',
        },
      ],
      tables: [
        {
          caption: 'モーター15個/分を作るときのレシピ直接入力（1.1.xデータ）',
          headers: ['レシピ', '必要設備', 'ローター', '固定子', '追加材料'],
          rows: [
            ['モーター', '組立機 3台', '30個/分', '30個/分', 'なし'],
            ['電動モーター', '組立機 2台', '15個/分', 'なし', '電磁制御棒 7.5個/分'],
            ['精密モーター', '製造機 2台', '7.5個/分', '7.5個/分', '水晶発振器 2.5個/分'],
          ],
        },
      ],
    },
    {
      heading: '標準レシピ：ローターと固定子を同じ量そろえる',
      paragraphs: [
        '標準レシピは組立機で12秒ごとにモーター1個を作り、1台あたり毎分5個です。ローター2個と固定子2個を使うため、モーター15個/分には組立機3台分、ローター30個/分、固定子30個/分が必要です。両方の部品ラインをすでに持っているなら、追加の中間製品を用意せずに組める基準レシピです。',
        'ローターか固定子のどちらかが不足している場合、標準レシピを増やす前に不足側の上流ラインを確認してください。ここで示す数値はモーター製造機の入力だけで、ローターや固定子の材料・電力は含んでいません。',
      ],
    },
    {
      heading: '電動モーター：固定子を電磁制御棒に置き換える',
      paragraphs: [
        '電動モーターは組立機で16秒ごとに2個を出力し、1台あたり毎分7.5個です。1サイクルの入力はローター2個と電磁制御棒1個なので、15個/分なら組立機2台分、ローター15個/分、電磁制御棒7.5個/分になります。標準レシピの半分のローター量で、固定子を電磁制御棒に置き換える構成です。',
        '電磁制御棒を別の工程ですでに作っている工場では候補になります。モーター向けに制御棒のラインを新設するなら、その追加工程まで含めて必要な鉱石・電力・建物を比較してください。レシピ単体の入力が少ないことは、工場全体の負担が小さいことを意味しません。',
      ],
    },
    {
      heading: '精密モーター：水晶発振器と引き換えにローター・固定子を減らす',
      paragraphs: [
        '精密モーターは製造機で48秒ごとに6個を作り、1台あたり毎分7.5個です。ローター3個・固定子3個・水晶発振器1個を入力します。15個/分まで比例計算すると、ローターと固定子は各7.5個/分に下がり、水晶発振器2.5個/分が加わります。',
        '表の直接入力だけを見るとローターと固定子を各75%減らせますが、これは追加材料を含めた資源効率の比較ではありません。水晶発振器までの工程を新しく組む場合は、標準や電動モーターより工場全体が軽くなるとは限りません。上流を含む計画で総材料と電力を確かめてから選びます。',
      ],
    },
    {
      heading: '計画ツールで同じ出力にそろえて比べる',
      paragraphs: [
        'この記事末尾の計画はモーター15個/分です。レシピ設定で解禁済みの代替レシピだけを有効にし、資源効率・電力・建物数など、優先したい条件に合わせて結果を見比べます。代替をすべて有効にすると未解禁レシピも候補に含まれるため、手持ちのレシピに合わせて切り替えてください。',
        '表示されるのは生産レシピの収支計算です。ベルトの詰まり、稼働率、設置場所、電力停止を再現するシミュレーションではありません。実際の工場では、部品の搬送容量と設備への電力供給も別に確認してください。',
      ],
    },
  ],
  references: {
    heading: '参考資料',
    links: [
      { label: 'Official Satisfactory Wiki — Motor（英語）', href: 'https://satisfactory.wiki.gg/wiki/Motor' },
      { label: 'Satisfactory公式Press & Content Creators（ゲーム画像の出典）', href: 'https://www.satisfactorygame.com/press/' },
      { label: 'Satisfactory Planner — 対象ゲームデータと版の根拠', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: '強い代替レシピと使いどころ（日本語）', href: 'https://satisfactory-planner.net/articles/strong-alternate-recipes/' },
    ],
  },
  relatedItemIds: ['Desc_Motor_C', 'Desc_Rotor_C', 'Desc_Stator_C', 'Desc_ElectromagneticControlRod_C', 'Desc_CrystalOscillator_C'],
  relatedArticleSlugs: ['strong-alternate-recipes', 'alternate-recipe-metrics', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: 'モーター15個/分の計画を開いてレシピを比較する',
    itemId: 'Desc_Motor_C',
    ratePerMin: 15,
    alternateRecipeIds: ['Recipe_Alternate_ElectricMotor_C', 'Recipe_Alternate_Motor_1_C'],
  },
} as const satisfies HandwrittenArticle
