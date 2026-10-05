import { useEffect, useRef, useState } from 'react'
import { generatorsById, ratePerMin, recipesById } from '../data/index.ts'
import type { ItemAmount, Recipe } from '../data/types.ts'
import type { RecipeGraphNode } from '../plan/graph.ts'
import { recipesForItem } from '../plan/recipe-selection.ts'
import { recipePickerText } from '../i18n/recipe-picker.ts'
import { useLocale } from '../i18n/index.ts'
import { usePlanner } from '../store/planner.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { fmtRate, itemName, itemUnit } from './format.ts'

/** A modal subpage keeps the graph position and traps focus until returning to the plan. */
export function RecipePickerPage({ node, onClose }: { node: RecipeGraphNode; onClose: () => void }) {
  const { displayName, locale } = useLocale()
  const P = recipePickerText(locale)
  const dialog = useRef<HTMLDialogElement>(null)
  const current = recipesById.get(node.recipeId)
  const [item, setItem] = useState(current?.products[0]?.item ?? node.outputs[0]?.item ?? '')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const replaceRecipe = usePlanner((state) => state.replaceRecipe)
  const clearSelection = usePlanner((state) => state.clearRecipeSelection)
  const selections = usePlanner((state) => state.recipeSelections)
  const enabledAlternates = usePlanner((state) => state.enabledAlternates)
  const candidates = recipesForItem(item, Object.keys(enabledAlternates)).sort((a, b) => outputRate(b, item) - outputRate(a, item))

  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])

  const choose = async (recipe: Recipe) => {
    if (pending) return
    setPending(recipe.id)
    setError(null)
    const failure = await replaceRecipe(item, recipe.id)
    setPending(null)
    if (failure) setError(failure)
    else onClose()
  }

  return (
    <dialog ref={dialog} className="recipe-picker" aria-labelledby="recipe-picker-title"
      onCancel={(event) => { event.preventDefault(); if (!pending) onClose() }}>
      <header className="recipe-picker__header">
        <div><p className="recipe-picker__breadcrumb">{P.breadcrumb}</p>
          <h2 id="recipe-picker-title"><ItemIcon id={item || node.buildingId} name={itemName(item)} size={40} />
            {current ? itemName(item) : node.recipeName}</h2></div>
        <button type="button" className="button" disabled={!!pending} onClick={onClose}>{P.back}</button>
      </header>
      <div className="recipe-picker__body">
        <p className="recipe-picker__intro">{P.intro}</p>
        {current && current.products.length > 1 && <label className="recipe-picker__product">{P.product}
          <select value={item} disabled={!!pending} onChange={(event) => { setItem(event.target.value); setError(null) }}>
            {current.products.map((product) => <option key={product.item} value={product.item}>{itemName(product.item)}</option>)}
          </select></label>}
        {current && <p className="hint">{P.effect}</p>}
        {selections[item] && <p className="recipe-picker__pin">{P.pinned}{displayName(selections[item])}
          <button type="button" className="button" disabled={!!pending} onClick={() => { clearSelection(item); onClose() }}>{P.auto}</button></p>}
        <div role="status" aria-live="polite">{pending && <p className="recipe-picker__pending">{P.pending}</p>}</div>
        {error && <p role="alert" className="callout callout--warn">{error} {P.retained}</p>}
        {current ? <>
          <RecipeGroup title={P.available} recipes={candidates}
            selected={node.recipeId} item={item} pending={pending} onChoose={choose} />
        </> : <section className="recipe-picker__group"><h3>{P.generator}</h3>
          <p className="hint">{P.generatorHelp}</p>
          {generatorsById.get(node.buildingId)?.fuels.map((fuel) => <article className="recipe-choice" key={fuel.item}>
            <h4><ItemIcon id={fuel.item} name={itemName(fuel.item)} size={28} />{itemName(fuel.item)}</h4>
            <div className="recipe-choice__io"><div><h5>{P.inputs}</h5>
              <RateLine item={fuel.item} rate={fuel.ratePerMin} />
              {fuel.supplementalItem && <RateLine item={fuel.supplementalItem} rate={fuel.supplementalRatePerMin} />}</div>
              <div><h5>{P.outputs}</h5><p>{node.buildingName} · {generatorsById.get(node.buildingId)?.powerProductionMW} MW</p>
                {fuel.byproduct && <RateLine item={fuel.byproduct.item} rate={fuel.byproduct.ratePerMin} />}</div></div>
          </article>)}
        </section>}
      </div>
    </dialog>
  )
}

export function outputRate(recipe: Recipe, item: string): number {
  return recipe.products.filter((product) => product.item === item)
    .reduce((sum, product) => sum + ratePerMin(product.amount, recipe.durationSec), 0)
}

function RecipeGroup({ title, recipes, selected, item, pending, onChoose }: {
  title: string; recipes: Recipe[]; selected: string; item: string; pending: string | null;
  onChoose: (recipe: Recipe) => Promise<void>
}) {
  const { displayName, locale } = useLocale()
  const P = recipePickerText(locale)
  return <section className="recipe-picker__group"><h3>{title}<span>{recipes.length} {P.sorted}</span></h3>
    {!recipes.length && <p className="hint">{P.empty}</p>}
    <div className="recipe-picker__grid">{recipes.map((recipe) => <button type="button"
      key={recipe.id} className={`recipe-choice${recipe.id === selected ? ' recipe-choice--current' : ''}`}
      disabled={!!pending} aria-pressed={recipe.id === selected}
      aria-label={`${P.use}${displayName(recipe)}`} data-choice-recipe={recipe.id}
      onClick={() => void onChoose(recipe)}>
      <div className="recipe-choice__top"><ItemIcon id={item} name={itemName(item)} size={20} />
        <h4>{displayName(recipe)}</h4><span className="recipe-choice__type">{recipe.isAlternate ? P.alternate : P.standard}</span>{recipe.id === selected && <span className="recipe-choice__badge">{P.current}</span>}</div>
      <p className="recipe-choice__machine"><ItemIcon id={recipe.producedIn} name={displayName(recipe.producedIn)} size={20} />
        {displayName(recipe.producedIn)} · {recipe.durationSec} {P.cycle}</p>
      <div className="recipe-choice__io"><div><h5>{P.inputs}</h5><Amounts amounts={recipe.ingredients} duration={recipe.durationSec} /></div>
        <div><h5>{P.outputs}</h5><Amounts amounts={recipe.products} duration={recipe.durationSec} /></div></div>
      <p className="recipe-choice__action">{pending === recipe.id ? P.busy : recipe.id === selected ? P.useCurrent : P.choose}</p>
    </button>)}</div>
  </section>
}
function Amounts({ amounts, duration }: { amounts: ItemAmount[]; duration: number }) {
  return <ul>{amounts.map((amount) => <li key={amount.item}><RateLine item={amount.item} rate={ratePerMin(amount.amount, duration)} /></li>)}</ul>
}
function RateLine({ item, rate }: { item: string; rate: number }) {
  return <span className="recipe-choice__rate"><ItemIcon id={item} name={itemName(item)} size={20} />
    <span>{itemName(item)}</span><strong>{fmtRate(rate)} <small>{itemUnit(item)}</small></strong></span>
}
