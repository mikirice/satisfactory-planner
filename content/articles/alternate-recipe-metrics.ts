import type { HandwrittenArticle } from './types.ts'

export const alternateRecipeMetricsArticle = {
  slug: 'alternate-recipe-metrics',
  title: '代替レシピの比較指標 — 産出量・電力・材料を同じ条件で見る',
  description:
    '機械1台あたり、MWあたり、材料ごとの産出を区別し、鉄板の3レシピを100%クロックで比較。最後に同じ生産目標を工場全体で解き直す手順を紹介します。',
  sections: [
    {
      heading: '最初に比較条件をそろえる',
      paragraphs: [
        '「強い代替レシピ」に万能の順位はありません。まず出力単位とクロックをそろえ、何を比べるかを決めます。レシピ一覧の毎分レートは各機械を100%で動かした場合の直接工程の値です。採掘、材料の上流生産、搬送、建設費は含みません。',
        '同じ製品を比べるときは、機械の種類・1サイクルの時間・投入物・産物を一緒に見ます。レシピ1台分同士の比較と、同じ目標個数を作る工場全体の比較は別です。工場では使える代替レシピと確保済みの中間品も条件にそろえてください。',
      ],
    },
    {
      heading: '三つの指標が答える問い',
      paragraphs: [
        '機械1台あたりの産出は、100%クロックで1分に何個作るかです。式は「1サイクルの産物量 × 60 ÷ サイクル秒数」。台数や床面積を比べる目安ですが、消費電力や材料の希少さは表しません。',
        'MWあたり産出は、直接工程の毎分産出を、その建物1台の基本消費電力で割った値です。建物のクロック電力は機械・クロックで変わり、採鉱機や前工程の電力も別に必要です。したがってこれは工程単体の比較指標で、工場全体の電力効率ではありません。',
        '材料あたり産出は、産出レートを各材料の消費レートでそれぞれ割った値です。材料ごとの比率を並べて読むもので、異なる材料を合算した「総合点」ではありません。液体・気体はm³で割るため、固体の個数あたりと直接比べません。',
      ],
    },
    {
      heading: '鉄板の三レシピを同じ条件で比べる',
      paragraphs: [
        '100%クロックでの1台あたりを並べると、通常の鉄板は製作機で20枚/分、4 MW、鉄のインゴット30個/分です。MWあたり5枚、鉄のインゴット1個あたり約0.67枚になります。被覆鉄板は組立機で75枚/分、15 MW、鉄のインゴット37.5個/分とプラスチック7.5個/分。MWあたりは同じ5枚ですが、鉄のインゴット1個あたり2枚です。鋳造鋼板は鋳造炉で45枚/分、16 MW、鉄と鋼鉄のインゴットを各15個/分使い、MWあたり約2.81枚、各インゴットあたり3枚です。',
        'この表だけなら被覆鉄板は高出力で、鉄のインゴットあたりの枚数も多く見えます。ただし、プラスチックを作る原油・設備・電力や、鋳造鋼板の鋼鉄の上流工程を含めると結論は変わり得ます。指標は候補を絞るために使い、最終判断は同じ鉄板目標の工場全体で行います。',
      ],
    },
    {
      heading: 'Plannerで全体の差を確かめる',
      paragraphs: [
        '1. 鉄板のアイテムページを開き、レシピ欄で通常・代替の直接レート、建物、入力、電力を確認します。解禁していない代替は候補から外してください。',
        '2. 記事末尾の60枚/分プランを開き、目標を同じ値に保ったまま、使える代替レシピを一つずつ有効にします。「資源効率」「電力最小」「建物最小」を別々に解き、原料表・総電力・建物数のどれが動いたか記録します。',
        '3. 比較中に設定を変えた場合は、基準プランへ戻してから次の候補を試します。原油や水を持ち込み材料に指定した結果と、全量をゲーム内で生産する結果も混ぜないでください。採用前に搬送量と、実際に確保した採掘ノード・電力を照合します。',
        '鉱石使用量が減っても電力が足りない、または別の材料が増えて止まる場合は、その材料の上流工程まで結果をたどります。複数目的を一度に満たす単一の順位表として読まず、自分の制約に合う結果を選んでください。',
      ],
    },
  ],
  references: {
    heading: '参照資料',
    links: [
      { label: 'Satisfactory Planner — 収録ゲームデータの取得元と対象版（1.1.x）', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Planner — 収録レシピデータ', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/data/recipes.json' },
      { label: 'Satisfactory Planner — レシピ一覧と指標の実装', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/scripts/static-pages/item-insights.ts' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C', 'Desc_Plastic_C', 'Desc_SteelIngot_C'],
  relatedArticleSlugs: ['strong-alternate-recipes', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: '鉄板の代替レシピを同じ生産目標で比較する',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 60,
    alternateRecipeIds: [
      'Recipe_Alternate_CoatedIronPlate_C',
      'Recipe_Alternate_SteelCastedPlate_C',
    ],
  },
} as const satisfies HandwrittenArticle
