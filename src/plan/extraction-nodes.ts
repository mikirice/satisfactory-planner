import { planExtraction, normalizeExtractionOverrides } from '../solver/extraction.ts'
import type { CustomExtractionNode, ExtractionInput, ExtractionOptions, ExtractionOverrides, ResourceExtraction } from '../solver/extraction.ts'

/** Represent existing installed counts as one editable row per machine. */
export function singleMachineNodes(nodes: readonly CustomExtractionNode[]): CustomExtractionNode[] {
  return nodes.flatMap(node => Array.from({ length: node.count }, () => ({ ...node, count: 1 })))
}

export function nodesFromExtraction(resource: ResourceExtraction): CustomExtractionNode[] {
  return resource.groups.flatMap(group => group.assignments.flatMap(assignment =>
    Array.from({ length: Math.ceil(assignment.nodes - 1e-7) }, () => ({
      extractorId: group.extractorId, purity: assignment.purity, clock: group.clockSpeed, count: 1,
    }))))
}

/** Freeze initial/default or legacy automatic settings into explicit machines. */
export function materializeExtractionNodes(input: ExtractionInput, options: ExtractionOptions): ExtractionOverrides {
  const overrides = normalizeExtractionOverrides(options.overrides)
  const plan = planExtraction(input, options)
  for (const resource of plan.resources) {
    const current = overrides[resource.item]
    overrides[resource.item] = { nodes: current?.nodes !== undefined
      ? singleMachineNodes(current.nodes)
      : nodesFromExtraction(resource) }
  }
  return overrides
}
