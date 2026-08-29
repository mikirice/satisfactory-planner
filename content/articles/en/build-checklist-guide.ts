import type { HandwrittenArticle } from '../types.ts'

export const buildChecklistGuideArticleEn = {
  slug: 'build-checklist-guide',
  title: 'Using the Build List — From a Solved Plan to a Finished Factory',
  description:
    'How to read the build list, tick machines off with the counters, keep progress between sessions, and use it on a phone next to the game.',
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
      heading: 'Tick machines off and pick up where you stopped',
      paragraphs: [
        'Every row has a "built / required" counter with plus and minus buttons, so you can count machines as you place them. Reaching the full count ticks the checkbox automatically, and tapping the checkbox directly marks the whole step done in one go. Progress bars per section and for the whole plan keep the remaining count visible without scrolling. Progress is stored in this browser on this device, so opening the same plan the next day continues where you left off, and a share link never carries it — nobody else sees how far along you are. Changing an input that affects the calculation, such as a target rate or an alternate recipe, counts as a different plan and starts from zero, while renaming the plan or switching the belt tier you display leaves your progress alone. When you want to count again from scratch, use the reset button.',
      ],
    },
    {
      heading: 'A phone next to the game',
      paragraphs: [
        'The screen is built for a phone propped up beside the game, so the counters and checkboxes have large tap targets. Where the browser supports it, a "keep the screen awake" toggle appears, which matters when you only touch the phone every few minutes while building. Right after you load a template, a button offers to open it straight in the build list, so an example can go from calculation to construction in one tap. Start with the Iron Plate template and tick off all seven machines.',
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
