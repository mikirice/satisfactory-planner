import type { HandwrittenArticle } from '../types.ts'

export const pipeline_flow_head_lift_troubleshooting_enArticle = {
  slug: 'pipeline-flow-head-lift-troubleshooting',
  title: 'Diagnose Pipeline Flow and Head Lift',
  description: 'Check supply, elevation, shared pipe sections, and consumers in order, keeping each possible cause as a hypothesis.',
  sections: [
    {
      heading: 'Check the source and consumers first',
      paragraphs: [
        'Do not rebuild the whole pipeline first. Compare a supply-demand budget, then observe pipe indicators, elevation, and shared branches. The numbers below are hypothetical arithmetic, not recipe data or an in-game guarantee.',
        'Suppose a source supplies 100 units/min and active consumers A and B request 40 and 50. The arithmetic leaves a 10 units/min margin. If summed demand exceeds supply, investigate source shortage first. This budget compares steady supply and demand assumptions; it does not measure live pipe flow or prove delivery to an end machine. A positive margin does not prove that every pipe section can carry the fluid, so continue with the observations below.',
      ],
    },
    {
      heading: 'Separate head-lift problems from flow problems',
      paragraphs: [
        'The wiki’s “Flow Indicators” section describes visual cues for flow direction, fill level, and rate. Use them to observe where flow or fill changes, not as an exact current numeric meter. Its “Head lift” section describes the separate constraint of vertical rise. If a shortage begins just after an uphill segment, test that segment first; do not assume a higher pipe tier alone fixes height. If a shortage spans several branches, also inspect supply and shared sections.',
      ],
    },
    {
      heading: 'When flow becomes unreliable after a junction',
      paragraphs: [
        'If the budget leaves a margin but an end machine still stops, record the baseline and temporarily stop one branch consumer. Compare the pipe cues and remaining machines. A change suggests that demand or the shared route matters but does not prove which section is limiting.',
        'Restore it and test the other branch alone. If only the branch beyond a rise fails, keep head lift as a hypothesis. If the observed change clusters around a section recently changed by directly attaching a junction, pump, or valve onto an existing pipe, inspect that connection. The wiki’s “Current issues” section describes a transient flow reduction in that specific setup. Treat it as one documented clue, not a universal cause or guaranteed fix. No live test was performed.',
      ],
    },
    {
      heading: 'How this differs from existing guides',
      paragraphs: [
        'The published oil, aluminum, diluted-fuel, and battery-water articles explain particular production or power loops. The coal-power startup and fluid-truck delivery guides focus on building a power plant and transporting fluid by truck. This article does not prescribe a recipe or factory layout; it provides a general fault-isolation order for pipelines.',
      ],
    },
  ],
  references: {
    heading: 'Sources and evidence',
    links: [
      { label: 'Satisfactory Wiki — Pipelines: Head lift', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Head_lift' },
      { label: 'Satisfactory Wiki — Pipelines: Flow Indicators', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Flow_Indicators' },
      { label: 'Satisfactory Wiki — Pipelines: Current issues', href: 'https://satisfactory.wiki.gg/wiki/Pipelines#Current_issues' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['oil-products-basics', 'aluminum-water-loop'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Planner data is 1.1.x. Pipeline mechanics are summarized from community-wiki documentation. Current Update 1.2 indicators, head lift, and the proposed diagnostics were not tested in game. Example values of 100, 40, and 50 units/min are hypothetical, not game data.',
} as const satisfies HandwrittenArticle
