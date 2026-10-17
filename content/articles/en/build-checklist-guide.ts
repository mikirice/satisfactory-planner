import type { HandwrittenArticle } from '../types.ts'

export const buildChecklistGuideArticleEn = {
  slug: 'build-checklist-guide',
  title: 'Using the Build List — Check Machines and Transport Rates',
  description:
    'Read the current read-only build list: its section order, machine counts, recipes, clocks, transport tiers and practical limits.',
  sections: [
    {
      heading: 'Read the result in build-list sections',
      paragraphs: [
        'Once the planner has a solution, open the Build list tab. Its sections are ordered as mining and water extraction, production lines, then power generation. Production steps are generally ordered by their dependencies, with upstream inputs first. A cycle such as water reuse has no strict starting order within that loop. This rearranges the display only; it does not change the solver result.',
      ],
    },
    {
      heading: 'Check the machine, conditions and flows for each step',
      paragraphs: [
        'Each item shows a building and how many to place. Manufacturing steps include a recipe, extraction steps show the resource and node assignments by purity, and power steps show their fuel. Clock speed, Power Shards or Somersloops, and generated power appear where relevant. Inputs and outputs are rates per minute, accompanied by the lowest transport tier that carries each flow on one line. Conveyor belts carry 60 items/min for Mk.1, 120 for Mk.2, 270 for Mk.3, 480 for Mk.4, 780 for Mk.5 and 1200 for Mk.6. Pipelines carry 300 m³/min for Mk.1 and 600 m³/min for Mk.2. If the top tier is still insufficient, the list shows a line count such as “Mk.6 ×2”.',
        'The tier in this list is not the belt or pipe you selected in the sidebar. It is the minimum tier calculated to carry the flow. After choosing what to build, check the logistics settings or the Excel Logistics sheet for line counts at your selected tier, then adapt them to your in-game splits, merges and layout. The planner does not generate routes or placement coordinates.',
      ],
    },
    {
      heading: 'Read the counts in the 60 Iron Plate/min sample',
      paragraphs: [
        'For 60 Iron Plate/min with no alternate recipes, the sample has one Miner Mk.3 for extraction, then three Smelters and three Constructors, for seven machines in total. The 90 Iron Ore/min and the 90 Iron Ingot/min each fit on one Conveyor Belt Mk.2 (120 items/min); 60 Iron Plate/min fits on one Mk.1 belt (60 items/min). Check that each row’s inputs connect to the preceding output, then compare the overall count with the section subtotals.',
        'This example reflects the sample target, alternate-recipe setting and miner setting. Other inputs can change both the machine counts and the flow rates, so use the values from your own plan.',
      ],
    },
    {
      heading: 'Use totals and subtotals to gauge the build',
      paragraphs: [
        'The total at the top counts machines across all sections; each section heading gives a subtotal for extraction, production or power. The count is the integer number of buildings to place after the configured clock is applied. For running-machine equivalents, power and other details, also check Production steps or Summary. The total is a scale check; it does not list material costs or calculate the actual area and placement of the factory.',
      ],
    },
    {
      heading: 'Use it as a read-only reference',
      paragraphs: [
        'The Build list has no checkboxes, progress counters or saved built status. It is a view of the plan. Right after loading a template, the “Build it from the build list” button takes you to this tab. If you edit the target or conditions, read the recalculated result again. Foundations, machine placement, power poles, splitters and pipe routing still need to be planned separately; verify the flows as you build in the game.',
      ],
    },
  ],
  references: {
    heading: 'Implementation and data references',
    links: [
      { label: 'Build list rendering', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/BuildListView.tsx' },
      { label: 'Section order, counts and transport tiers', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/plan/build-list.ts' },
      { label: 'Sample targets and defaults', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/plan/samples.ts' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  relatedArticleSlugs: ['production-planning-tutorial', 'excel-export-guide'],
  cta: {
    kind: 'sample',
    label: 'Open the first Iron Plate line and see its build list',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
