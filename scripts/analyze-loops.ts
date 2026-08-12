/**
 * ゲームデータ中の循環工程を、レシピ/発電工程とアイテムの二部グラフから列挙する。
 *
 * 実行: npx tsx scripts/analyze-loops.ts
 */
import { generators, itemsById, recipes } from '../src/data/index.ts'
import type { GeneratorFuel, Recipe } from '../src/data/index.ts'
import type { LocalizedName } from '../src/data/types.ts'

type GraphNode = {
  id: string
  kind: 'item' | 'recipe'
  name: LocalizedName
  isAlternate: boolean
}

const nodes = new Map<string, GraphNode>()
const edges = new Map<string, Set<string>>()

const itemNodeId = (id: string): string => `item:${id}`
const recipeNodeId = (id: string): string => `recipe:${id}`

function addNode(node: GraphNode): void {
  nodes.set(node.id, node)
  if (!edges.has(node.id)) edges.set(node.id, new Set())
}

function addEdge(from: string, to: string): void {
  edges.get(from)?.add(to)
}

for (const item of itemsById.values()) {
  addNode({ id: itemNodeId(item.id), kind: 'item', name: item.name, isAlternate: false })
}

function addRecipeNode(recipe: Recipe): void {
  const id = recipeNodeId(recipe.id)
  addNode({ id, kind: 'recipe', name: recipe.name, isAlternate: recipe.isAlternate })
  for (const ingredient of recipe.ingredients) addEdge(itemNodeId(ingredient.item), id)
  for (const product of recipe.products) addEdge(id, itemNodeId(product.item))
}

for (const recipe of recipes) addRecipeNode(recipe)

function addGeneratorNode(
  generatorId: string,
  generatorName: LocalizedName,
  fuel: GeneratorFuel,
): void {
  if (!fuel.byproduct) return
  const fuelName = itemsById.get(fuel.item)?.name ?? { ja: fuel.item, en: fuel.item }
  const id = recipeNodeId(`generator:${generatorId}:${fuel.item}`)
  addNode({
    id,
    kind: 'recipe',
    name: {
      ja: `${generatorName.ja}（${fuelName.ja}）`,
      en: `${generatorName.en} (${fuelName.en})`,
    },
    isAlternate: false,
  })
  addEdge(itemNodeId(fuel.item), id)
  if (fuel.supplementalItem) addEdge(itemNodeId(fuel.supplementalItem), id)
  addEdge(id, itemNodeId(fuel.byproduct.item))
}

for (const generator of generators) {
  for (const fuel of generator.fuels) addGeneratorNode(generator.id, generator.name, fuel)
}

function stronglyConnectedComponents(): string[][] {
  let nextIndex = 0
  const indices = new Map<string, number>()
  const lowLinks = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const components: string[][] = []

  function visit(id: string): void {
    indices.set(id, nextIndex)
    lowLinks.set(id, nextIndex)
    nextIndex += 1
    stack.push(id)
    onStack.add(id)

    for (const target of edges.get(id) ?? []) {
      if (!indices.has(target)) {
        visit(target)
        lowLinks.set(id, Math.min(lowLinks.get(id)!, lowLinks.get(target)!))
      } else if (onStack.has(target)) {
        lowLinks.set(id, Math.min(lowLinks.get(id)!, indices.get(target)!))
      }
    }

    if (lowLinks.get(id) !== indices.get(id)) return
    const component: string[] = []
    while (stack.length > 0) {
      const member = stack.pop()!
      onStack.delete(member)
      component.push(member)
      if (member === id) break
    }
    components.push(component)
  }

  for (const id of nodes.keys()) if (!indices.has(id)) visit(id)
  return components
}

function labelFor(itemNames: readonly string[]): string {
  if (itemNames.length > 20) return '製造・包装・副産物の複合循環'
  const has = (...names: string[]): boolean => names.every((name) => itemNames.includes(name))
  if (has('空の容器', '容器入り燃料')) return '容器入り燃料・空容器ループ'
  if (has('プラスチック', 'ゴム', '燃料')) return '石油リサイクルループ'
  if (has('アルミナ溶液', '水')) return 'アルミ精錬・水循環'
  if (has('バッテリー', '水')) return 'バッテリー製造・水循環'
  return `${itemNames.slice(0, 3).join('・')}の循環`
}

function hasCycleWithoutAlternates(component: readonly string[]): boolean {
  const allowed = new Set(component.filter((id) => !nodes.get(id)?.isAlternate))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const target of edges.get(id) ?? []) {
      if (allowed.has(target) && visit(target)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return [...allowed].some(visit)
}

const cycles = stronglyConnectedComponents()
  .filter((component) => component.length > 1)
  .map((component) => {
    const members = component.map((id) => nodes.get(id)!)
    const itemNames = members
      .filter((node) => node.kind === 'item')
      .map((node) => node.name.ja)
      .sort((a, b) => a.localeCompare(b, 'ja'))
    const recipeNodes = members
      .filter((node) => node.kind === 'recipe')
      .sort((a, b) => a.name.ja.localeCompare(b.name.ja, 'ja'))
    return {
      itemNames,
      recipeNodes,
      label: labelFor(itemNames),
      requiresAlternates: !hasCycleWithoutAlternates(component),
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'ja'))

console.log(`循環 SCC: ${cycles.length} 件`)
for (const [index, cycle] of cycles.entries()) {
  console.log(`\n${index + 1}. ${cycle.label}`)
  console.log(`   循環成立に代替レシピ: ${cycle.requiresAlternates ? '必要' : '不要'}`)
  console.log(`   代替レシピを含む: ${cycle.recipeNodes.some((node) => node.isAlternate) ? 'はい' : 'いいえ'}`)
  console.log(`   アイテム (${cycle.itemNames.length}): ${cycle.itemNames.join('、')}`)
  console.log(`   レシピ (${cycle.recipeNodes.length}):`)
  for (const recipe of cycle.recipeNodes) {
    console.log(`   - ${recipe.name.ja}${recipe.isAlternate ? ' [代替]' : ''}`)
  }
}
