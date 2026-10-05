import { afterEach, describe, expect, it } from 'vitest'
import { recipes, rawResourceItems } from '../src/data/index.ts'
import { convertibleRawResources, selectedRecipeIds } from '../src/plan/recipe-selection.ts'
import { defaultPlanInput, parsePlanSnapshot, toPlanSnapshot } from '../src/plan/serialize.ts'
import { cancelPendingSolve, toSolveInput, usePlanner } from '../src/store/planner.ts'

const sulfur = 'Desc_Sulfur_C'
afterEach(() => { cancelPendingSolve() })
describe('raw resource sourcing', () => {
  it('offers only extractable resources that have a production recipe', () => {
    expect(convertibleRawResources.some(item => item.id === sulfur)).toBe(true)
    expect(convertibleRawResources.every(item => item.isRawResource && recipes.some(recipe => recipe.products[0]?.item === item.id))).toBe(true)
    for (const item of rawResourceItems.filter(item => !recipes.some(recipe => recipe.products[0]?.item === item.id))) {
      expect(convertibleRawResources).not.toContain(item)
    }
  })
  it('keeps production and recycled byproducts when raw-only water is selected, including saved pins', () => {
    const water = 'Desc_Water_C'
    const scrap = recipes.find(recipe => recipe.name.en === 'Aluminum Scrap')!
    const unpackWater = recipes.find(recipe => recipe.name.en === 'Unpackage Water')!
    const enabled = recipes.map(recipe => recipe.id)
    const restricted = selectedRecipeIds(enabled, {}, [water])
    expect(restricted).toContain(scrap.id)
    expect(restricted).not.toContain(unpackWater.id)
    usePlanner.getState().applyPlan({ ...defaultPlanInput(), recipeSelections: { [scrap.products[0]!.item]: scrap.id } })
    usePlanner.getState().setRawOnlyResource(water, true)
    cancelPendingSolve()
    expect(usePlanner.getState().recipeSelections[scrap.products[0]!.item]).toBe(scrap.id)
    const parsed = parsePlanSnapshot(toPlanSnapshot(usePlanner.getState()))
    if (!parsed.ok) throw Error(parsed.error)
    expect(parsed.input.recipeSelections?.[scrap.products[0]!.item]).toBe(scrap.id)
    expect(parsed.input.rawOnlyResources?.[water]).toBe(true)
  })
  it('excludes every producer including pinned recipes, without disabling unrelated resources', () => {
    const producer = recipes.find(recipe => recipe.products.some(p => p.item === sulfur))!
    const enabled = recipes.map(recipe => recipe.id)
    const restricted = selectedRecipeIds(enabled, { [sulfur]: producer.id }, [sulfur])
    expect(restricted).not.toContain(producer.id)
    expect(restricted).toEqual(enabled.filter(id => !recipes.find(recipe => recipe.id === id)!.products.some(p => p.item === sulfur)))
  })
  it('recalculates to mined sulfur, restores saved settings, and clears conflicting pins', async () => {
    const producer = recipes.find(recipe => recipe.products.some(p => p.item === sulfur))!
    usePlanner.getState().applyPlan({ ...defaultPlanInput(), targets: [{ item: sulfur, ratePerMin: 100 }], recipeSelections: { [sulfur]: producer.id } })
    usePlanner.getState().setRawOnlyResource(sulfur, true)
    cancelPendingSolve()
    expect(usePlanner.getState().recipeSelections[sulfur]).toBeUndefined()
    await usePlanner.getState().recompute()
    const result = usePlanner.getState().result
    expect(result?.status).toBe('optimal')
    if (result?.status !== 'optimal') throw Error('no solution')
    expect(result.rawResources.find(resource => resource.item === sulfur)?.ratePerMin).toBeCloseTo(100)
    expect(result.steps.some(step => step.outputs.some(output => output.item === sulfur))).toBe(false)
    expect(await usePlanner.getState().replaceRecipe(sulfur, producer.id)).toBeTypeOf('string')
    const parsed = parsePlanSnapshot(toPlanSnapshot(usePlanner.getState()))
    if (!parsed.ok) throw Error(parsed.error)
    expect(parsed.input.rawOnlyResources).toEqual({ [sulfur]: true })
    usePlanner.getState().applyPlan(parsed.input)
    cancelPendingSolve()
    expect(toSolveInput(usePlanner.getState()).enabledRecipes).not.toContain(producer.id)
    usePlanner.getState().setRawOnlyResource(sulfur, false)
    cancelPendingSolve()
    expect(toSolveInput(usePlanner.getState()).enabledRecipes).toContain(producer.id)
  })
})
