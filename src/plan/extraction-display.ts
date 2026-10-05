import type { ResourceExtraction } from '../solver/extraction.ts'

export type ExtractionMachineRow = { extractorId: string; purity: 'impure' | 'normal' | 'pure'; clock: number; required: number; maximum: number }

/** Installed machines in configured order; demand is allocated without inflating downstream flows. */
export function extractionDisplay(resource?: ResourceExtraction) {
  const rows: ExtractionMachineRow[] = []
  for (const group of resource?.groups ?? []) {
    for (const assignment of group.assignments) {
      const count = group.maximumRatePerMin !== undefined ? assignment.availableNodes : Math.ceil(assignment.nodes - 1e-7)
      let remaining = assignment.ratePerMin
      for (let i = 0; i < count; i++) {
        const required = Math.min(remaining, assignment.ratePerNodePerMin)
        rows.push({ extractorId: group.extractorId, purity: assignment.purity, clock: group.clockSpeed,
          required, maximum: assignment.ratePerNodePerMin })
        remaining = Math.max(0, remaining - required)
      }
    }
  }
  return { rows, shortfall: resource?.shortfallPerMin ?? 0, idle: rows.filter(row => row.required < 1e-7).length,
    maximum: rows.reduce((sum, row) => sum + row.maximum, 0) }
}
