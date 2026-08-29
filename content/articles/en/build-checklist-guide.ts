import type { HandwrittenArticle } from '../types.ts'

export const buildChecklistGuideArticleEn = {
  slug: 'build-checklist-guide',
  title: 'Reading the Build List — What to Build and How Many',
  description:
    'How to read the build list: machine counts per step, recipes and clock speeds, belt and pipe tiers, and the per-section and overall totals.',
  sections: [
    {
      heading: 'The same plan, sorted by what you build first',
      paragraphs: [
        'The build list tab on the result screen takes the production line you just calculated and reorders it into something you can build from top to bottom. The sections are fixed: mining and water extraction, then production lines, then power generation. Inside the production section the steps follow the dependency order from raw resources towards your target, so by the time a machine starts running, whatever feeds it is already there. Nothing about the calculation changes — it is the same solution as the table and the flow chart, arranged from the point of view of the person holding the build gun.',
      ],
    },
    {
      heading: 'Everything one step needs, in one row',
      paragraphs: [
        'Each row is a single step: the building and how many of them to place, the recipe, the clock speed, any Power Shards or Somersloops, and the input and output rates for the whole step. Next to every rate is the transport tier that carries it. Conveyor belts run at 60 items/min for Mk.1, 120 for Mk.2, 270 for Mk.3, 480 for Mk.4, 780 for Mk.5 and 1200 for Mk.6, and the row shows the lowest tier that still carries the full rate on a single line. Fluids and gases use pipelines: 300 m³/min for Mk.1 and 600 m³/min for Mk.2. Only when even the top tier cannot carry the rate on its own does the row switch to a line count such as "Mk.6 ×2", which tells you where a split belongs before you start building.',
      ],
    },
    {
      heading: 'A worked example: 60 Iron Plate per minute',
      paragraphs: [
        'Open a plan for 60 Iron Plate/min with no alternate recipes and the build list comes to seven machines: one Miner Mk.3 for extraction, then three Smelters and three Constructors on the production side. The 90 Iron Ore/min and the 90 Iron Ingot/min both fit on a single Conveyor Belt Mk.2 (120 items/min), and the final 60 Iron Plate/min fits exactly on one Mk.1 (60 items/min). The useful conclusion is that a single Mk.2 belt carries both upstream sections without a split, so you can lay the right belt the first time instead of tearing it out later.',
      ],
    },
    {
      heading: 'Subtotals and a total tell you the scale',
      paragraphs: [
        'Each row ends with the number of machines to place, written as "×3". Every section heading carries its own subtotal, and the overall total stays pinned at the top of the tab, so the size of the plan is visible however far you scroll. Checking the total before you start tells you whether this is an evening of building or something that needs a site cleared first, and the subtotals break that down into extraction, production and power. These counts are the machines you actually place after clocking, so they feed straight into a build cost or power estimate.',
      ],
    },
    {
      heading: 'A screen for reading, not for ticking',
      paragraphs: [
        'There is nothing to operate here. Instead of checkboxes and counters, the tab gives you the information in build order and nothing else — ticking a box in a browser does not place a foundation, so leave the progress to the game and open this screen when you want to know what comes next and how many of it to build. It reads well on a phone propped up beside the game. Right after you load a template, a button offers to open it straight in the build list, so an example goes from calculation to a build order in one tap. Start with the Iron Plate template and look at how its seven machines break down.',
      ],
    },
  ],
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  relatedArticleSlugs: ['production-planning-tutorial', 'excel-export-guide'],
  publishedDate: '2026-08-28',
  cta: {
    kind: 'sample',
    label: 'Open the first Iron Plate line and see its build list',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
