/**
 * アイテムページの「結論」と「関連ガイド」を、表と同じデータから計算する。
 *
 * このファイルは**文章を持たない**。状況の判定と数値の抽出だけを行い、
 * 文面は labels.ts の `itemSummary`（日英それぞれ書き下ろし）が受け取って組み立てる。
 * 数値は必ず `recipeMetrics` から取る（表と同じ値でなければ、結論が表と食い違う）。
 *
 * 方針:
 *  - **言えることが無いアイテムには何も出さない**。「レシピが2件あります」のような
 *    表の言い換えは価値がないので、判定は null を返す（198件中およそ半分が null）。
 *  - 判定は状況ごとに別の型にする。同じ骨組みに数値を差し替えるだけの文にしないため、
 *    文面側も状況ごとに別の関数になる。
 *  - 比較は**表示桁（小数2桁）で意味のある差**があるときだけ「勝ち」とみなす。
 *    表では同じ数字に見えるのに文章だけが優劣を語る、という食い違いを防ぐ。
 */
import { generators, itemsById } from '../../src/data/index.ts'
import type { Item, Recipe } from '../../src/data/types.ts'
import { getRecipesForItem, recipeMetrics } from '../../src/plan/recipe-index.ts'
import type { RecipeMetrics } from '../../src/plan/recipe-index.ts'

/** 容器詰め・開封を行う建物。生産ルートの比較からは開封レシピを外すのに使う。 */
const PACKAGER_ID = 'Build_Packager_C'

/** 表示は小数2桁なので、それ未満の差は「差がない」として扱う。 */
const EPSILON = 0.005

// ---------------------------------------------------------------------------
// ルートの分類
// ---------------------------------------------------------------------------

/** そのレシピが「このアイテムを作るためのレシピ」か（先頭の生成物が対象アイテム）。 */
function isPrimaryFor(recipe: Recipe, itemId: string): boolean {
  return recipe.products[0]?.item === itemId
}

/**
 * 開封レシピ（Packager で液体・気体を取り出すもの）か。
 *
 * 開封は「すでに持っている中身を出す」だけで生産手段ではないため、
 * 「機械1台あたり」「電力あたり」の比較に混ぜると順位が意味を失う
 * （例: アルミナ溶液は開封が電力効率1位になるが、精製する手段ではない）。
 * 逆に容器詰め（生成物が固体の包装品）は、その包装品を作る唯一の手段なので残す。
 */
function isUnpackaging(recipe: Recipe): boolean {
  if (recipe.producedIn !== PACKAGER_ID) return false
  const product = recipe.products[0]
  if (product === undefined) return false
  return itemsById.get(product.item)?.form !== 'solid'
}

export type RouteFact = {
  recipeId: string
  buildingId: string
  isAlternate: boolean
  /** 機械1台・クロック100%での産出（表の「機械1台あたり」と同じ値）。 */
  ratePerMin: number
  /** 産出 ÷ 消費電力（表の「電力あたり」と同じ値）。 */
  outputPerMW: number
  ingredientIds: readonly string[]
}

export type ByproductFact = {
  recipeId: string
  /** その副産物レシピが本来作っているもの。 */
  mainProductId: string
  ratePerMin: number
}

type Scored = { recipe: Recipe; metrics: RecipeMetrics }

function toRouteFact({ recipe, metrics }: Scored): RouteFact {
  return {
    recipeId: recipe.id,
    buildingId: recipe.producedIn,
    isAlternate: recipe.isAlternate,
    ratePerMin: metrics.outputRatePerMin,
    outputPerMW: metrics.outputPerMW,
    ingredientIds: metrics.ingredients.map((ingredient) => ingredient.item),
  }
}

// ---------------------------------------------------------------------------
// 状況（この9種以外は「言うことなし」）
// ---------------------------------------------------------------------------

export type ItemInsight =
  /** レシピでは作れず、発電機の副産物として出てくる（ウラン廃棄物・プルトニウム廃棄物）。 */
  | {
      kind: 'generatorByproduct'
      generatorId: string
      fuelItemId: string
      ratePerMin: number
      generatorPowerMW: number
      consumingCount: number
    }
  /** これ自体を目的にしたレシピが無く、他の製品の副産物としてしか出ない。 */
  | {
      kind: 'byproductOnly'
      sourceCount: number
      top: ByproductFact
      buildingId: string
    }
  /** マップから採る資源だが、副産物として戻ってくる（水）。 */
  | { kind: 'rawByproduct'; sourceCount: number; top: ByproductFact; second?: ByproductFact }
  /** 専用レシピは1件だけで、副産物として出るレシピの方が多い。 */
  | {
      kind: 'soleRouteWithByproducts'
      route: RouteFact
      byproductCount: number
      top: ByproductFact
      /** 副産物1件と専用レシピ1台の産出比。1未満なら専用レシピの方が多い。 */
      ratio: number
    }
  /** 収録されている作り方が代替レシピ1件しかない。 */
  | { kind: 'soleAlternate'; route: RouteFact }
  /** 複数あるが、どの指標でも差がない（材料の種類だけが違う）。 */
  | {
      kind: 'identicalRoutes'
      routeCount: number
      ratePerMin: number
      outputPerMW: number
      buildingId: string
      /** レシピごとに1つずつ異なる材料。 */
      distinctIngredientIds: readonly string[]
    }
  /** 産出量は同じで、電力か材料の届き方だけが違う。 */
  | {
      kind: 'sameOutputDifferentCost'
      ratePerMin: number
      efficient: RouteFact
      other: RouteFact
      /** 2つのレシピで入れ替わる材料（efficient 側 / other 側）。 */
      swappedIngredient?: { efficientId: string; otherId: string }
    }
  /** 産出量で2件が並び、その下にもルートがある。違いは材料と設備だけ。 */
  | {
      kind: 'tiedLeaders'
      ratePerMin: number
      /** 産出量で並んだ2件。 */
      leaders: readonly RouteFact[]
      /** leaders と同じ並びで、もう一方が使わない材料。 */
      distinguishingIngredientIds: readonly (readonly string[])[]
      /** 首位に届かなかったルートのうち最上位。 */
      runnerUp: RouteFact
    }
  /** 全ルートに共通の材料があり、台数で勝つレシピと材料効率で勝つレシピが違う。 */
  | {
      kind: 'splitWinners'
      throughput: RouteFact
      throughputRunnerUp: RouteFact
      efficiency: RouteFact
      sharedIngredientId: string
      efficiencyBest: number
      throughputPerIngredient: number
    }
  /**
   * 産出最大のルートが、このアイテム自身から作られる材料を食う（リサイクルの対）。
   * 「片方を作るともう片方が作れる」という、表からは読み取れない関係。
   */
  | {
      kind: 'recyclingPair'
      throughput: RouteFact
      baseline: RouteFact
      /** このアイテムから作られていて、かつ産出最大ルートが材料にするアイテム。 */
      loopIngredientId: string
      /** 同じルートが要求する、それ以外の追加材料。 */
      otherIngredientIds: readonly string[]
    }

/**
 * 対象アイテムを「ついでに」出すレシピ。産出の多い順。
 *
 * 開封レシピも含める。空の容器（缶・流体タンク）は開封のたびに戻ってくるので、
 * 「作る必要があるか」を判断するうえでは立派な供給源になる。
 */
function byproductFacts(item: Item, producing: readonly Recipe[]): ByproductFact[] {
  return producing
    .filter((recipe) => !isPrimaryFor(recipe, item.id))
    .map((recipe) => {
      const metrics = recipeMetrics(recipe, item.id)
      return {
        recipeId: recipe.id,
        mainProductId: recipe.products[0]?.item ?? item.id,
        ratePerMin: metrics.outputRatePerMin,
      }
    })
    .sort((left, right) => right.ratePerMin - left.ratePerMin)
}

/** 発電機の副産物（generators.json の byproduct）。 */
function generatorByproductOf(itemId: string):
  | { generatorId: string; fuelItemId: string; ratePerMin: number; generatorPowerMW: number }
  | undefined {
  for (const generator of generators) {
    for (const fuel of generator.fuels) {
      if (fuel.byproduct?.item !== itemId) continue
      return {
        generatorId: generator.id,
        fuelItemId: fuel.item,
        ratePerMin: fuel.byproduct.ratePerMin,
        generatorPowerMW: generator.powerProductionMW,
      }
    }
  }
  return undefined
}

/** 全ルートが使う材料のうち、レシピ間で産出効率に差があるもの（最大差のもの1つ）。 */
function sharedIngredientComparison(scored: readonly Scored[]):
  | { itemId: string; ranked: readonly { route: Scored; perIngredient: number }[] }
  | undefined {
  const counts = new Map<string, number>()
  for (const entry of scored) {
    for (const id of new Set(entry.metrics.ingredients.map((ingredient) => ingredient.item))) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  const shared = [...counts]
    .filter(([, count]) => count === scored.length)
    .map(([id]) => id)
  let best:
    | { itemId: string; ranked: { route: Scored; perIngredient: number }[]; spread: number }
    | undefined
  for (const itemId of shared) {
    const ranked = scored
      .map((route) => ({
        route,
        perIngredient:
          route.metrics.ingredients.find((ingredient) => ingredient.item === itemId)
            ?.outputPerIngredient ?? 0,
      }))
      .sort((left, right) => right.perIngredient - left.perIngredient)
    const spread = (ranked[0]?.perIngredient ?? 0) - (ranked[ranked.length - 1]?.perIngredient ?? 0)
    if (best === undefined || spread > best.spread) best = { itemId, ranked, spread }
  }
  // 差が表示桁に出ないなら「共通材料での比較はできない」と同じ扱いにする。
  if (best === undefined || best.spread <= EPSILON) return undefined
  return { itemId: best.itemId, ranked: best.ranked }
}

/**
 * アイテム1件ぶんの「結論」。言うことが無ければ null。
 *
 * 判定順は「そのアイテムについて最初に知るべきこと」の順。副産物でしか手に入らない、
 * 採掘資源である、といった前提は、レシピの優劣より先に伝わらないと誤読させる。
 */
export function itemInsight(item: Item): ItemInsight | null {
  const producing = getRecipesForItem(item.id).producing
  const consuming = getRecipesForItem(item.id).consuming

  if (producing.length === 0) {
    const fromGenerator = generatorByproductOf(item.id)
    if (fromGenerator === undefined) return null
    return { kind: 'generatorByproduct', ...fromGenerator, consumingCount: consuming.length }
  }

  const routes = producing.filter(
    (recipe) => isPrimaryFor(recipe, item.id) && !isUnpackaging(recipe),
  )
  const byproducts = byproductFacts(item, producing)

  if (routes.length === 0) {
    const top = byproducts[0]
    if (top === undefined) return null
    if (item.isRawResource) {
      return {
        kind: 'rawByproduct',
        sourceCount: byproducts.length,
        top,
        ...(byproducts[1] === undefined ? {} : { second: byproducts[1] }),
      }
    }
    const recipe = producing.find((entry) => entry.id === top.recipeId)
    return {
      kind: 'byproductOnly',
      sourceCount: byproducts.length,
      top,
      buildingId: recipe?.producedIn ?? '',
    }
  }

  const scored: Scored[] = routes.map((recipe) => ({
    recipe,
    metrics: recipeMetrics(recipe, item.id),
  }))
  const byThroughput = [...scored].sort(
    (left, right) => right.metrics.outputRatePerMin - left.metrics.outputRatePerMin,
  )
  const byPower = [...scored].sort(
    (left, right) => right.metrics.outputPerMW - left.metrics.outputPerMW,
  )

  /*
   * 採掘資源の変換レシピ（Converter で活性SAM から作るもの）は、10件ぶん出力して読み返すと
   * 9件が「活性SAM＋◯◯を変換機で 120.00 個/分」と、アイテム名以外まったく同じ文になった。
   * 表を読めば同じことが分かるので、この状況では何も出さない。
   */
  if (item.isRawResource) return null

  if (routes.length === 1) {
    const only = scored[0]
    if (only === undefined) return null
    const top = byproducts[0]
    if (top !== undefined) {
      return {
        kind: 'soleRouteWithByproducts',
        route: toRouteFact(only),
        byproductCount: byproducts.length,
        top,
        ratio: top.ratePerMin / only.metrics.outputRatePerMin,
      }
    }
    if (only.recipe.isAlternate && byproducts.length === 0) {
      return { kind: 'soleAlternate', route: toRouteFact(only) }
    }
    return null
  }

  // --- 複数ルート ---
  const fastest = byThroughput[0]
  const secondFastest = byThroughput[1]
  const mostEfficientPower = byPower[0]
  if (fastest === undefined || secondFastest === undefined || mostEfficientPower === undefined) {
    return null
  }
  /** 産出量で首位に並ぶルート（表示桁で同じ値になるもの）。 */
  const leaders = scored.filter(
    (entry) => fastest.metrics.outputRatePerMin - entry.metrics.outputRatePerMin <= EPSILON,
  )
  const shared = sharedIngredientComparison(scored)

  if (leaders.length > 1) {
    const allThroughputTied = leaders.length === scored.length
    const powerTied =
      (byPower[0]?.metrics.outputPerMW ?? 0) -
        (byPower[byPower.length - 1]?.metrics.outputPerMW ?? 0) <=
      EPSILON
    if (allThroughputTied && powerTied && shared === undefined) {
      const buildings = new Set(routes.map((recipe) => recipe.producedIn))
      if (buildings.size !== 1) return null
      // 各レシピが1つずつ持つ固有の材料（どれを飼っているかで選ぶ、という結論になる）
      const distinct = scored.flatMap((entry) => {
        const own = entry.metrics.ingredients
          .map((ingredient) => ingredient.item)
          .filter((id) =>
            scored.every(
              (other) =>
                other === entry ||
                !other.metrics.ingredients.some((ingredient) => ingredient.item === id),
            ),
          )
        return own.length === 1 ? own : []
      })
      if (distinct.length !== scored.length) return null
      return {
        kind: 'identicalRoutes',
        routeCount: routes.length,
        ratePerMin: fastest.metrics.outputRatePerMin,
        outputPerMW: fastest.metrics.outputPerMW,
        buildingId: [...buildings][0] ?? '',
        distinctIngredientIds: distinct,
      }
    }
    if (allThroughputTied && routes.length === 2) {
      const other = scored.find((entry) => entry !== mostEfficientPower)
      if (other === undefined) return null
      if (mostEfficientPower.metrics.outputPerMW - other.metrics.outputPerMW <= EPSILON) return null
      const efficientOnly = mostEfficientPower.metrics.ingredients
        .map((ingredient) => ingredient.item)
        .filter((id) => !other.metrics.ingredients.some((ingredient) => ingredient.item === id))
      const otherOnly = other.metrics.ingredients
        .map((ingredient) => ingredient.item)
        .filter(
          (id) =>
            !mostEfficientPower.metrics.ingredients.some((ingredient) => ingredient.item === id),
        )
      const swapped =
        efficientOnly.length === 1 && otherOnly.length === 1
          ? { efficientId: efficientOnly[0]!, otherId: otherOnly[0]! }
          : undefined
      return {
        kind: 'sameOutputDifferentCost',
        ratePerMin: fastest.metrics.outputRatePerMin,
        efficient: toRouteFact(mostEfficientPower),
        other: toRouteFact(other),
        ...(swapped === undefined ? {} : { swappedIngredient: swapped }),
      }
    }
    // 首位が並び、その下にもルートがある。並んだ2件の「何が違うか」が結論になる。
    if (allThroughputTied || leaders.length > 2) return null
    const runnerUp = byThroughput.find((entry) => !leaders.includes(entry))
    if (runnerUp === undefined) return null
    const distinguishing = leaders.map((leader) => {
      const otherLeader = leaders.find((entry) => entry !== leader)
      return leader.metrics.ingredients
        .map((ingredient) => ingredient.item)
        .filter(
          (id) =>
            otherLeader !== undefined &&
            !otherLeader.metrics.ingredients.some((ingredient) => ingredient.item === id),
        )
    })
    if (distinguishing.some((list) => list.length === 0)) return null
    return {
      kind: 'tiedLeaders',
      ratePerMin: fastest.metrics.outputRatePerMin,
      leaders: leaders.map(toRouteFact),
      distinguishingIngredientIds: distinguishing,
      runnerUp: toRouteFact(runnerUp),
    }
  }

  if (shared !== undefined) {
    const bestByIngredient = shared.ranked[0]
    const runnerUpByIngredient = shared.ranked[1]
    if (bestByIngredient === undefined || runnerUpByIngredient === undefined) return null
    const fastestPerIngredient =
      shared.ranked.find((entry) => entry.route === fastest)?.perIngredient ?? 0
    /*
     * 「台数で勝つレシピ」と「材料効率で勝つレシピ」が違うときだけ、表を読み比べないと
     * 分からないことを言える。ただし差が数%だと表示上は勝っていても選ぶ理由にならないので、
     * 材料効率で 10% 以上勝っている場合に限る（銅のインゴットの 2.50 対 2.44 などは落とす）。
     */
    const MATERIAL_MARGIN = 1.1
    if (
      bestByIngredient.route !== fastest &&
      bestByIngredient.perIngredient > fastestPerIngredient * MATERIAL_MARGIN
    ) {
      return {
        kind: 'splitWinners',
        throughput: toRouteFact(fastest),
        throughputRunnerUp: toRouteFact(secondFastest),
        efficiency: toRouteFact(bestByIngredient.route),
        sharedIngredientId: shared.itemId,
        efficiencyBest: bestByIngredient.perIngredient,
        throughputPerIngredient: fastestPerIngredient,
      }
    }
    /*
     * 同じレシピが台数でも材料効率でも勝つ場合は、表の2列を並べ替えただけの話になる
     * （22件ぶん出力したところ、全件が同じ書き出し・同じ構文だった）。何も出さない。
     */
    return null
  }

  /*
   * 共通の材料が無いルート同士。「材料が違うので比べられません」とだけ書いた版を
   * 28件ぶん出力して読み返したところ、どのページも同じ書き出しの同じ長さで、
   * しかも結論が「持っている材料による」＝表を読めば分かること以上を言えていなかった。
   * そこで、**建て方が実際に変わる2つの場合だけ**を残し、他は何も出さないことにした。
   */
  const standardRoutes = scored.filter((entry) => !entry.recipe.isAlternate)
  const baseline =
    standardRoutes.length === 1 && standardRoutes[0] !== fastest
      ? standardRoutes[0]!
      : secondFastest
  const exclusive = fastest.metrics.ingredients
    .map((ingredient) => ingredient.item)
    .filter((id) => !baseline.metrics.ingredients.some((ingredient) => ingredient.item === id))

  // 1) 産出最大のルートが、このアイテムから作られる中間品を材料にしている（リサイクルの対）。
  const loopIngredientId = exclusive.find(
    (id) =>
      itemsById.get(id)?.isRawResource !== true &&
      getRecipesForItem(id).producing.some((recipe) =>
        recipe.ingredients.some((ingredient) => ingredient.item === itemId(item)),
      ),
  )
  if (loopIngredientId !== undefined) {
    return {
      kind: 'recyclingPair',
      throughput: toRouteFact(fastest),
      baseline: toRouteFact(baseline),
      loopIngredientId,
      otherIngredientIds: exclusive.filter((id) => id !== loopIngredientId),
    }
  }

  /*
   * 「産出1位だけが液体を要求する」も書いてみたが、材料に液体が並んでいることは
   * 下のレシピカードを見れば分かる。導き出した結論ではないので出さない。
   */
  return null
}

/** itemInsight の内側で対象アイテムのIDを参照するための小さな補助。 */
function itemId(item: Item): string {
  return item.id
}


// ---------------------------------------------------------------------------
// 関連ガイド
// ---------------------------------------------------------------------------

/**
 * アイテムページから解説記事へのリンク。**そのアイテムを実際に扱っている記事だけ**を出す。
 *
 * 手で表を持たず、次の3系統から引く（上ほど具体的なので先に並べる）:
 *  1. 記事側が `relatedItemIds` でそのアイテムを名指ししている（記事の自己申告が唯一の正典）
 *  2. ループテンプレートの**目標アイテム**になっている（その記事はこのアイテムを作る話そのもの）
 *  3. データから引ける関係 — 発電機の燃料・副産物なら発電の記事、原油／廃重油を材料に持つなら
 *     石油の記事、ボーキサイト系の材料を持つならアルミの記事、代替レシピを含む複数ルートが
 *     あるならレシピ比較の記事
 *
 * どれにも当たらないアイテムはリンクを出さない（関係の薄い記事を並べても回遊にならない）。
 */
const RELATED_GUIDE_LIMIT = 3

/** 石油系と判定する材料。 */
const OIL_FEEDSTOCK_IDS = ['Desc_LiquidOil_C', 'Desc_HeavyOilResidue_C'] as const
/** アルミ系と判定する材料。 */
const ALUMINUM_CHAIN_IDS = [
  'Desc_OreBauxite_C',
  'Desc_AluminaSolution_C',
  'Desc_AluminumScrap_C',
] as const

/** 発電機が燃料・補助流体・副産物として扱うアイテム。 */
const POWER_ITEM_IDS: ReadonlySet<string> = new Set(
  generators.flatMap((generator) =>
    generator.fuels.flatMap((fuel) => [
      fuel.item,
      ...(fuel.supplementalItem === undefined ? [] : [fuel.supplementalItem]),
      ...(fuel.byproduct === undefined ? [] : [fuel.byproduct.item]),
    ]),
  ),
)

type RankedGuide = { slug: string; rank: number }

/** そのアイテムを材料に持つ産出レシピがあるか（1ホップだけ見る）。 */
function producedFromAny(itemId: string, feedstockIds: readonly string[]): boolean {
  if (feedstockIds.includes(itemId)) return true
  return getRecipesForItem(itemId).producing.some((recipe) =>
    recipe.ingredients.some((ingredient) => feedstockIds.includes(ingredient.item)),
  )
}

export type GuideSource = {
  /** 手書き記事。relatedItemIds をそのまま逆引きに使う。 */
  readonly articles: readonly { readonly slug: string; readonly relatedItemIds: readonly string[] }[]
  /** ループテンプレート記事。目標アイテムとアイコンを見る。 */
  readonly loops: readonly {
    readonly slug: string
    readonly targetItemIds: readonly string[]
    readonly iconItemId: string
  }[]
}

export function relatedGuideSlugs(item: Item, source: GuideSource): readonly string[] {
  const ranked: RankedGuide[] = []

  for (const loop of source.loops) {
    if (loop.iconItemId === item.id) ranked.push({ slug: loop.slug, rank: 10 })
    else if (loop.targetItemIds.includes(item.id)) ranked.push({ slug: loop.slug, rank: 20 })
  }

  for (const article of source.articles) {
    const position = article.relatedItemIds.indexOf(item.id)
    if (position < 0) continue
    // 先頭で名指しされているほど、そして挙がっている数が少ないほど、その記事の中心に近い。
    // 例示として末尾に添えられているだけの記事は、これで後ろへ落ちる。
    ranked.push({ slug: article.slug, rank: 30 + position * 8 + article.relatedItemIds.length })
  }

  const bySlug = new Map(source.articles.map((article) => [article.slug, article]))
  const derive = (slug: string, rank: number): void => {
    if (!bySlug.has(slug)) return
    ranked.push({ slug, rank })
  }
  if (POWER_ITEM_IDS.has(item.id)) derive('power-generation-planning', 60)
  if (producedFromAny(item.id, ALUMINUM_CHAIN_IDS)) derive('aluminum-production-guide', 61)
  if (producedFromAny(item.id, OIL_FEEDSTOCK_IDS)) derive('oil-products-basics', 62)

  const routes = getRecipesForItem(item.id).producing.filter(
    (recipe) => isPrimaryFor(recipe, item.id) && !isUnpackaging(recipe),
  )
  if (routes.length >= 2 && routes.some((recipe) => recipe.isAlternate)) {
    derive('alternate-recipe-metrics', 70)
  }

  const seen = new Set<string>()
  return ranked
    .sort((left, right) => left.rank - right.rank)
    .flatMap(({ slug }) => {
      if (seen.has(slug)) return []
      seen.add(slug)
      return [slug]
    })
    .slice(0, RELATED_GUIDE_LIMIT)
}
