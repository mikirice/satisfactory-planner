/** Permanent legacy article URLs retained for search engines and existing bookmarks. */
export const RETIRED_ARTICLE_REDIRECTS = {
  'alternate-recipe-metrics': 'strong-alternate-recipes',
  'power-generation-planning': 'power-system-capacity-and-recovery',
  'coal-power-startup': 'power-system-capacity-and-recovery',
  'power-connector-daisy-chain': 'power-system-capacity-and-recovery',
  'power-grid-recovery': 'power-system-capacity-and-recovery',
  'variable-power-peak-load-planning': 'power-system-capacity-and-recovery',
  'power-storage-outage-duration-sizing': 'power-system-capacity-and-recovery',
  'clock-and-efficiency': 'somersloop-and-power-shards',
  'build-checklist-guide': 'production-planning-tutorial',
  'factory-floor-area': 'production-planning-tutorial',
  'motor-production-recipes': 'strong-alternate-recipes',
  'blueprint-auto-connect': 'blueprint-designer-workflow',
  'finite-biomass-solid-biofuel-yield-guide': 'space-elevator-project-assembly-batch-planning-guide',
  'fused-modular-frame-nitrogen-pipeline-capacity': 'resource-throughput-capacity-guide',
  'heavy-modular-frame-screw-belt-capacity-guide': 'resource-throughput-capacity-guide',
  'shared-quickwire-allocation-ai-limiters-high-speed-connectors': 'resource-throughput-capacity-guide',
  'aluminum-water-loop': 'aluminum-production-guide',
  'packaged-diluted-fuel-loop': 'packaged-nitrogen-empty-fluid-tank-circulation-planning',
  'battery-water-loop': 'aluminum-production-guide',
  'nuclear-plutonium': 'nuclear-uranium',
  'nuclear-reprocessing': 'nuclear-uranium',
  'nuclear-simplified': 'nuclear-uranium',
} as const satisfies Readonly<Record<string, string>>

export function renderCloudflareArticleRedirects(): string {
  return Object.entries(RETIRED_ARTICLE_REDIRECTS)
    .flatMap(([from, to]) => [
      `/articles/${from} /articles/${to} 301`,
      `/articles/${from}/ /articles/${to}/ 301`,
      `/en/articles/${from} /en/articles/${to} 301`,
      `/en/articles/${from}/ /en/articles/${to}/ 301`,
    ])
    .join('\n') + '\n'
}
