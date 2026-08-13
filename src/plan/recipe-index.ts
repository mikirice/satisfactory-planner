import { buildingsById, items, ratePerMin, recipes } from '../data/index.ts'
import type { ItemAmount, Recipe, VariablePower } from '../data/types.ts'

/** 1アイテムを産出・消費するレシピ。モジュール初期化時に一度だけ構築する。 */
export type ItemRecipeIndex = {
  /** 通常レシピを先頭にし、代替レシピは対象アイテムの産出レートが高い順。 */
  producing: readonly Recipe[]
  /** 元データと同じ順序の、対象アイテムを材料にするレシピ。 */
  consuming: readonly Recipe[]
}

export type RecipeItemRate = ItemAmount & {
  /** クロック100%・機械1台あたりの毎分レート。 */
  ratePerMin: number
}

export type RecipeIngredientMetric = RecipeItemRate & {
  /** この材料1個（液体・気体は1m³）あたりに産出する対象アイテムの量。 */
  outputPerIngredient: number
}

export type RecipeMetrics = {
  outputItem: string
  /** 対象アイテムの産出レート（クロック100%・機械1台あたり）。 */
  outputRatePerMin: number
  /** 消費電力。可変電力レシピは既存ソルバーと同じく範囲の中央値。 */
  powerConsumptionMW: number
  /** 粒子加速器など、消費電力が変動する場合の範囲。 */
  powerRangeMW?: VariablePower
  /** 対象アイテムの毎分産出量 ÷ 消費電力(MW)。 */
  outputPerMW: number
  ingredients: readonly RecipeIngredientMetric[]
  products: readonly RecipeItemRate[]
}

type MutableItemRecipeIndex = {
  producing: Recipe[]
  consuming: Recipe[]
}

const EMPTY_ITEM_RECIPE_INDEX: ItemRecipeIndex = Object.freeze({
  producing: Object.freeze([] as Recipe[]),
  consuming: Object.freeze([] as Recipe[]),
})

/** レシピ中に同じアイテムが複数行あっても、レシピ自体は一度だけ登録する。 */
function distinctItemIds(entries: readonly ItemAmount[]): Set<string> {
  return new Set(entries.map((entry) => entry.item))
}

function outputRateFor(recipe: Recipe, itemId: string): number {
  return recipe.products.reduce(
    (total, product) =>
      product.item === itemId
        ? total + ratePerMin(product.amount, recipe.durationSec)
        : total,
    0,
  )
}

function buildRecipeIndex(): ReadonlyMap<string, ItemRecipeIndex> {
  const mutable = new Map<string, MutableItemRecipeIndex>(
    items.map((item) => [item.id, { producing: [], consuming: [] }]),
  )

  for (const recipe of recipes) {
    for (const itemId of distinctItemIds(recipe.products)) {
      mutable.get(itemId)?.producing.push(recipe)
    }
    for (const itemId of distinctItemIds(recipe.ingredients)) {
      mutable.get(itemId)?.consuming.push(recipe)
    }
  }

  const built = new Map<string, ItemRecipeIndex>()
  for (const [itemId, entry] of mutable) {
    entry.producing.sort((left, right) => {
      if (left.isAlternate !== right.isAlternate) return left.isAlternate ? 1 : -1
      if (!left.isAlternate) return 0
      return outputRateFor(right, itemId) - outputRateFor(left, itemId)
    })
    built.set(
      itemId,
      Object.freeze({
        producing: Object.freeze(entry.producing),
        consuming: Object.freeze(entry.consuming),
      }),
    )
  }
  return built
}

/** 全291レシピを走査するのは、このモジュールが初めて読み込まれたときの一度だけ。 */
const RECIPE_INDEX = buildRecipeIndex()

/**
 * アイテムを産出・消費するレシピを返す。
 * 不明なIDには空の結果を返すため、検索UIの一時的な未選択状態でも利用できる。
 */
export function getRecipesForItem(itemId: string): ItemRecipeIndex {
  return RECIPE_INDEX.get(itemId) ?? EMPTY_ITEM_RECIPE_INDEX
}

/**
 * 作り方カードで比較する、クロック100%・機械1台あたりの指標を計算する。
 * `outputItem` は当該レシピの products に含まれていなければならない。
 */
export function recipeMetrics(recipe: Recipe, outputItem: string): RecipeMetrics {
  const outputRatePerMin = outputRateFor(recipe, outputItem)
  if (outputRatePerMin <= 0) {
    throw new Error(`recipe ${recipe.id} does not produce item ${outputItem}`)
  }

  const building = buildingsById.get(recipe.producedIn)
  if (!building) throw new Error(`unknown building id: ${recipe.producedIn}`)

  const powerRangeMW = recipe.variablePower ?? building.variablePower
  const powerConsumptionMW = powerRangeMW
    ? (powerRangeMW.minMW + powerRangeMW.maxMW) / 2
    : building.powerConsumptionMW
  const products = recipe.products.map((product) => ({
    ...product,
    ratePerMin: ratePerMin(product.amount, recipe.durationSec),
  }))
  const ingredients = recipe.ingredients.map((ingredient) => {
    const ingredientRatePerMin = ratePerMin(ingredient.amount, recipe.durationSec)
    return {
      ...ingredient,
      ratePerMin: ingredientRatePerMin,
      outputPerIngredient: outputRatePerMin / ingredientRatePerMin,
    }
  })

  return {
    outputItem,
    outputRatePerMin,
    powerConsumptionMW,
    ...(powerRangeMW ? { powerRangeMW } : {}),
    outputPerMW: outputRatePerMin / powerConsumptionMW,
    ingredients,
    products,
  }
}
