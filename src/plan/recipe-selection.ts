import { rawResourceItems, recipes, recipesById } from '../data/index.ts'
import type { Recipe } from '../data/types.ts'

export const convertibleRawResources = rawResourceItems.filter(item => recipes.some(recipe => recipe.products[0]?.item === item.id))
export const convertibleRawResourceIds = new Set(convertibleRawResources.map(item => item.id))

/** Choices apply to an item's production across the plan, including amplified variants. */
export function recipesForItem(item: string, enabledAlternates?: readonly string[]): Recipe[] {
  const enabled = enabledAlternates === undefined ? null : new Set(enabledAlternates)
  return recipes.filter((r) => r.products.some((p) => p.item === item) &&
    (!r.isAlternate || enabled === null || enabled.has(r.id)))
}

/** The first product is the recipe's main product; recycling byproducts remain usable. */
export function conflictsWithRawOnly(recipe: Recipe, rawOnly: readonly string[]): boolean {
  return rawOnly.includes(recipe.products[0]?.item ?? '')
}

export function selectedRecipeIds(enabled: readonly string[], selections: Record<string, string> = {}, rawOnly: readonly string[] = []): string[] {
  const raw = new Set(rawOnly.filter(item => convertibleRawResourceIds.has(item)))
  const valid = Object.entries(selections).filter(([item, id]) =>
    recipesById.get(id)?.products.some((p) => p.item === item),
  )
  const ids = new Set([...enabled, ...valid.map(([, id]) => id)])
  return [...ids].filter((id) => {
    const recipe = recipesById.get(id)
    return recipe && !conflictsWithRawOnly(recipe, [...raw]) && valid.every(([item, choice]) =>
      id === choice || !recipe.products.some((p) => p.item === item),
    )
  })
}
