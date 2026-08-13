import { useState } from 'react'

import { buildingsById, items, itemsById, ratePerMin } from '../data/index.ts'
import type { Item, Recipe } from '../data/types.ts'
import { getRecipesForItem, recipeMetrics } from '../plan/recipe-index.ts'
import { fmtInt, fmtPower, fmtPowerRange, fmtRate, itemName, itemUnit } from './format.ts'
import { AlternateIcon, ItemIcon } from './ItemIcon.tsx'
import { ItemSearchBox, ROW_ICON } from './ItemSearchBox.tsx'
import { T } from './text.ts'

export type RecipePlanRequest = {
  itemId: string
  recipeId: string
  /** 選んだレシピをクロック100%・1台で動かしたときの対象アイテム産出量。 */
  ratePerMin: number
  /** 代替レシピを選んだ場合だけ、そのIDを有効化するよう呼び出し側へ渡す。 */
  alternateRecipeId?: string
}

type RecipeBrowserProps = {
  onCreatePlan: (request: RecipePlanRequest) => void
}

type ItemGroup = {
  id: string
  label: string
  items: readonly Item[]
}

const SUGGESTED_ITEM_IDS = [
  'Desc_IronPlate_C',
  'Desc_Plastic_C',
  'Desc_ModularFrameHeavy_C',
] as const

// ItemSearchBox は目標入力と共用だが、この画面は「追加」ではなく単一選択なので常に空。
const NO_ADDED_ITEMS: ReadonlySet<string> = new Set()

const sortedItems = [...items].sort((left, right) =>
  left.name.ja.localeCompare(right.name.ja, 'ja'),
)

/**
 * items.json にゲーム内カテゴリは無いため、重複しないデータ属性で全件を分類する。
 * モジュール初期化時に一度だけ作り、198件の分類をレンダーごとに繰り返さない。
 */
const ITEM_GROUPS: readonly ItemGroup[] = [
  {
    id: 'raw',
    label: T.recipeBrowser.groups.raw,
    items: sortedItems.filter((item) => item.isRawResource),
  },
  {
    id: 'solid',
    label: T.recipeBrowser.groups.solid,
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'solid'),
  },
  {
    id: 'liquid',
    label: T.recipeBrowser.groups.liquid,
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'liquid'),
  },
  {
    id: 'gas',
    label: T.recipeBrowser.groups.gas,
    items: sortedItems.filter((item) => !item.isRawResource && item.form === 'gas'),
  },
].filter((group) => group.items.length > 0)

const durationFormat = new Intl.NumberFormat('ja-JP', {
  maximumFractionDigits: 2,
})

/** アイテム中心で、ゲームデータ中の作り方と使い道を読む参照画面。 */
export function RecipeBrowser({ onCreatePlan }: RecipeBrowserProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectionHistory, setSelectionHistory] = useState<string[]>([])

  const selectedItem = selectedItemId === null ? undefined : itemsById.get(selectedItemId)

  const selectItem = (itemId: string): void => {
    if (!itemsById.has(itemId) || itemId === selectedItemId) return
    if (selectedItemId !== null) setSelectionHistory((history) => [...history, selectedItemId])
    setSelectedItemId(itemId)
  }

  const goBack = (): void => {
    const previousItemId = selectionHistory.at(-1)
    if (previousItemId === undefined) return
    setSelectionHistory((history) => history.slice(0, -1))
    setSelectedItemId(previousItemId)
  }

  return (
    <div className="recipe-browser">
      <aside className="recipe-browser__picker" aria-label={T.recipeBrowser.pickerLabel}>
        <div className="recipe-browser__search">
          <ItemSearchBox
            label={T.recipeBrowser.searchLabel}
            placeholder={T.recipeBrowser.searchPlaceholder}
            addedItems={NO_ADDED_ITEMS}
            onPick={selectItem}
          />
        </div>

        <nav className="recipe-browser__catalog" aria-label={T.recipeBrowser.catalogLabel}>
          {ITEM_GROUPS.map((group) => (
            <section className="recipe-browser__item-group" key={group.id}>
              <h2 className="recipe-browser__item-group-title">
                {group.label}
                <span className="recipe-browser__count">{fmtInt(group.items.length)}</span>
              </h2>
              <ul className="recipe-browser__item-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`recipe-browser__item-button${
                        item.id === selectedItemId ? ' recipe-browser__item-button--selected' : ''
                      }`}
                      aria-current={item.id === selectedItemId ? 'true' : undefined}
                      data-recipe-browser-item={item.id}
                      onClick={() => selectItem(item.id)}
                    >
                      <ItemIcon id={item.id} name={item.name.ja} size={ROW_ICON} />
                      <span>{item.name.ja}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </aside>

      <section
        className="recipe-browser__detail"
        aria-label={
          selectedItem
            ? T.recipeBrowser.detailFor(selectedItem.name.ja)
            : T.recipeBrowser.detailLabel
        }
        data-selected-item-id={selectedItem?.id}
      >
        {selectedItem === undefined ? (
          <RecipeBrowserEmpty onSelect={selectItem} />
        ) : (
          <ItemRecipeDetail
            item={selectedItem}
            canGoBack={selectionHistory.length > 0}
            onBack={goBack}
            onSelectItem={selectItem}
            onCreatePlan={onCreatePlan}
          />
        )}
      </section>
    </div>
  )
}

function RecipeBrowserEmpty({ onSelect }: { onSelect: (itemId: string) => void }) {
  return (
    <div className="recipe-browser__empty">
      <h2>{T.recipeBrowser.emptyHeading}</h2>
      <p className="hint">{T.recipeBrowser.emptyHint}</p>
      <div className="recipe-browser__suggestions" aria-label={T.recipeBrowser.suggestionsLabel}>
        <h3>{T.recipeBrowser.suggestions}</h3>
        <ul>
          {SUGGESTED_ITEM_IDS.map((itemId) => {
            const item = itemsById.get(itemId)
            if (item === undefined) return null
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="button recipe-browser__suggestion"
                  onClick={() => onSelect(item.id)}
                >
                  <ItemIcon id={item.id} name={item.name.ja} size={28} />
                  <span>{item.name.ja}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

type ItemRecipeDetailProps = {
  item: Item
  canGoBack: boolean
  onBack: () => void
  onSelectItem: (itemId: string) => void
  onCreatePlan: (request: RecipePlanRequest) => void
}

function ItemRecipeDetail({
  item,
  canGoBack,
  onBack,
  onSelectItem,
  onCreatePlan,
}: ItemRecipeDetailProps) {
  const indexedRecipes = getRecipesForItem(item.id)

  return (
    <div className="recipe-browser__detail-stack">
      <header className="recipe-browser__item-header">
        <button
          type="button"
          className="button button--quiet recipe-browser__back"
          disabled={!canGoBack}
          onClick={onBack}
        >
          {T.recipeBrowser.back}
        </button>
        <div className="recipe-browser__item-heading">
          <ItemIcon id={item.id} name={item.name.ja} size={48} />
          <div>
            <h2>{item.name.ja}</h2>
            <p className="recipe-browser__item-meta">
              <span className={`tag ${item.isRawResource ? 'is-accent' : 'is-balanced'}`}>
                {item.isRawResource ? T.recipeBrowser.raw : T.recipeBrowser.processed}
              </span>
              {item.sinkPoints > 0 && (
                <span className="num">
                  {T.recipeBrowser.sinkPoints} {fmtInt(item.sinkPoints)} / {amountUnit(item.id)}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <section className="recipe-browser__section" aria-labelledby="recipe-browser-producing">
        <h2 id="recipe-browser-producing" className="recipe-browser__section-title">
          {T.recipeBrowser.producing}
          <span className="recipe-browser__count">{fmtInt(indexedRecipes.producing.length)}</span>
        </h2>
        {indexedRecipes.producing.length === 0 ? (
          <p className="hint">{T.recipeBrowser.producingEmpty}</p>
        ) : (
          <div className="recipe-browser__producing-grid">
            {indexedRecipes.producing.map((recipe) => (
              <ProducingRecipeCard
                key={recipe.id}
                recipe={recipe}
                outputItem={item}
                onCreatePlan={onCreatePlan}
              />
            ))}
          </div>
        )}
      </section>

      <section className="recipe-browser__section" aria-labelledby="recipe-browser-consuming">
        <h2 id="recipe-browser-consuming" className="recipe-browser__section-title">
          {T.recipeBrowser.consuming}
          <span className="recipe-browser__count">{fmtInt(indexedRecipes.consuming.length)}</span>
        </h2>
        {indexedRecipes.consuming.length === 0 ? (
          <p className="hint">{T.recipeBrowser.consumingEmpty}</p>
        ) : (
          <ul className="recipe-browser__uses">
            {indexedRecipes.consuming.map((recipe) => (
              <ConsumingRecipeRow
                key={recipe.id}
                recipe={recipe}
                consumedItem={item}
                onSelectItem={onSelectItem}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type ProducingRecipeCardProps = {
  recipe: Recipe
  outputItem: Item
  onCreatePlan: (request: RecipePlanRequest) => void
}

function ProducingRecipeCard({ recipe, outputItem, onCreatePlan }: ProducingRecipeCardProps) {
  const metrics = recipeMetrics(recipe, outputItem.id)
  const building = buildingsById.get(recipe.producedIn)

  return (
    <article
      className={`card recipe-browser__recipe-card${
        recipe.isAlternate ? ' recipe-browser__recipe-card--alternate' : ''
      }`}
      data-recipe-id={recipe.id}
    >
      <header className="recipe-browser__recipe-header">
        <h3 className="card__title">
          {recipe.isAlternate && <AlternateIcon size={18} />}
          <span>{recipe.name.ja}</span>
        </h3>
        <span className={`tag ${recipe.isAlternate ? 'is-accent' : 'is-balanced'}`}>
          {recipe.isAlternate ? T.recipeBrowser.alternate : T.recipeBrowser.standard}
        </span>
      </header>

      <dl className="recipe-browser__recipe-facts">
        <div>
          <dt>{T.recipeBrowser.building}</dt>
          <dd className="cell-name">
            <ItemIcon
              id={recipe.producedIn}
              name={building?.name.ja ?? recipe.producedIn}
              size={18}
            />
            <span>{building?.name.ja ?? recipe.producedIn}</span>
          </dd>
        </div>
        <div>
          <dt>{T.recipeBrowser.power}</dt>
          <dd className="num">
            {metrics.powerRangeMW
              ? `${fmtPowerRange(metrics.powerRangeMW.minMW, metrics.powerRangeMW.maxMW)} MW（${T.recipeBrowser.averagePower} ${fmtPower(metrics.powerConsumptionMW)} MW）`
              : `${fmtPower(metrics.powerConsumptionMW)} MW`}
          </dd>
        </div>
        <div>
          <dt>{T.recipeBrowser.cycle}</dt>
          <dd className="num">{durationFormat.format(recipe.durationSec)} 秒</dd>
        </div>
      </dl>

      <div className="recipe-browser__flows">
        <RecipeRateList heading={T.recipeBrowser.ingredients} rates={metrics.ingredients} />
        <RecipeRateList heading={T.recipeBrowser.products} rates={metrics.products} />
      </div>

      <section className="recipe-browser__comparison" aria-label={T.recipeBrowser.comparison}>
        <h4>{T.recipeBrowser.comparison}</h4>
        <dl>
          <div>
            <dt>{T.recipeBrowser.outputPerMachine}</dt>
            <dd className="num">
              {fmtRate(metrics.outputRatePerMin)} {itemUnit(outputItem.id)}
            </dd>
          </div>
          <div>
            <dt>
              {T.recipeBrowser.outputPerPower}
              {metrics.powerRangeMW && (
                <span className="hint">{T.recipeBrowser.averagePowerNote}</span>
              )}
            </dt>
            <dd className="num">
              {fmtRate(metrics.outputPerMW)} {itemUnit(outputItem.id)} / MW
            </dd>
          </div>
        </dl>
        <h4>{T.recipeBrowser.outputPerIngredient}</h4>
        <ul className="recipe-browser__ingredient-metrics">
          {metrics.ingredients.map((ingredient) => (
            <li key={ingredient.item}>
              <span className="flow__name">
                <ItemIcon
                  id={ingredient.item}
                  name={itemName(ingredient.item)}
                  size={16}
                />
                {T.recipeBrowser.perIngredient(
                  itemName(ingredient.item),
                  amountUnit(ingredient.item),
                )}
              </span>
              <span className="num">
                {fmtRate(ingredient.outputPerIngredient)} {amountUnit(outputItem.id)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="button button--primary recipe-browser__create-plan"
        onClick={() =>
          onCreatePlan({
            itemId: outputItem.id,
            recipeId: recipe.id,
            ratePerMin: metrics.outputRatePerMin,
            ...(recipe.isAlternate ? { alternateRecipeId: recipe.id } : {}),
          })
        }
      >
        {T.recipeBrowser.createPlan}
      </button>
    </article>
  )
}

type RecipeRate = {
  item: string
  ratePerMin: number
}

function RecipeRateList({ heading, rates }: { heading: string; rates: readonly RecipeRate[] }) {
  return (
    <section>
      <h4>{heading}</h4>
      <ul className="flow-list">
        {rates.map((entry) => (
          <li key={entry.item}>
            <span className="flow__name">
              <ItemIcon id={entry.item} name={itemName(entry.item)} size={16} />
              <span className="recipe-browser__flow-item-name">{itemName(entry.item)}</span>
            </span>
            <span className="flow__rate num">
              {fmtRate(entry.ratePerMin)} {itemUnit(entry.item)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

type ConsumingRecipeRowProps = {
  recipe: Recipe
  consumedItem: Item
  onSelectItem: (itemId: string) => void
}

function ConsumingRecipeRow({ recipe, consumedItem, onSelectItem }: ConsumingRecipeRowProps) {
  // 水などを材料と副産物の両方に含むレシピでは、同じ画面に留まらず主産物へ進む。
  const destination =
    recipe.products.find((product) => product.item !== consumedItem.id) ?? recipe.products[0]
  const consumedRate = recipe.ingredients.reduce(
    (total, ingredient) =>
      ingredient.item === consumedItem.id
        ? total + ratePerMin(ingredient.amount, recipe.durationSec)
        : total,
    0,
  )
  const building = buildingsById.get(recipe.producedIn)

  return (
    <li>
      <button
        type="button"
        className="recipe-browser__use-button"
        disabled={destination === undefined}
        aria-label={
          destination === undefined
            ? recipe.name.ja
            : T.recipeBrowser.openProduct(recipe.name.ja, itemName(destination.item))
        }
        data-consuming-recipe-id={recipe.id}
        onClick={() => {
          if (destination !== undefined) onSelectItem(destination.item)
        }}
      >
        <span className="recipe-browser__use-recipe">
          <span className="cell-name">
            {recipe.isAlternate && <AlternateIcon size={16} />}
            <span>{recipe.name.ja}</span>
          </span>
          <span className="recipe-browser__use-building">
            {building?.name.ja ?? recipe.producedIn}
          </span>
        </span>
        <span className="recipe-browser__use-rate num">
          {fmtRate(consumedRate)} {itemUnit(consumedItem.id)} {T.recipeBrowser.consumed}
        </span>
        <span className="recipe-browser__use-products">
          {recipe.products.map((product) => (
            <span className="recipe-browser__use-product" key={product.item}>
              <ItemIcon id={product.item} name={itemName(product.item)} size={18} />
              <span>{itemName(product.item)}</span>
              <span className="num">
                {fmtRate(ratePerMin(product.amount, recipe.durationSec))} {itemUnit(product.item)}
              </span>
            </span>
          ))}
        </span>
      </button>
    </li>
  )
}

function amountUnit(itemId: string): string {
  return itemsById.get(itemId)?.form === 'solid' ? '個' : 'm³'
}
