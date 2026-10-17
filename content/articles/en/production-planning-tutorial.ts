import type { HandwrittenArticle } from '../types.ts'

export const productionPlanningTutorialArticleEn = {
  slug: 'production-planning-tutorial',
  title: 'Your First Production Plan — A Guided Tour of the Planner',
  description:
    'Follow the current planner from adding a target and adjusting conditions through the six result tabs, then save, share or export the plan.',
  sections: [
    {
      heading: 'Open a sample or add one target',
      paragraphs: [
        'To get familiar with the screen, open “Your First Iron Plate Line” from the sample list. To start with your own factory, search for an item under output targets, select it, then enter a rate per minute in the row that appears. For example, request 60 Iron Plate/min. You cannot select an item that is absent from the suggestions. If that item is already a target, edit its existing row instead of adding a duplicate. Changing an input makes the planner solve again.',
        'Usually you specify the amount you want to make. If you do not know the amount yet, select Maximize for that row to calculate the largest output allowed by the resource limits you set. Only one item can be maximized at a time. If no result appears or the plan is infeasible, review the requested rate, resource limits and enabled recipes.',
      ],
    },
    {
      heading: 'Adjust only the conditions you need',
      paragraphs: [
        'For a first comparison, leave the objective at its default and inspect the result before changing several settings at once. Switching objectives can change the chosen recipes and machine layout for the same target. Enable only alternate recipes you can use, and enter materials supplied by another factory or your stock in the “Items already available” list as a rate per minute. The plan may use only part of an available supply, so check the amount actually used in the summary.',
        'The sidebar lets you adjust resource limits, the manufacturing clock cap, miner and extraction clock, and belt and pipe choices. Open Resources as well to inspect miner assignments, node purity and extraction power. Belt and pipe choices affect the displayed transport requirements. This is a steady recipe-flow calculation; it does not simulate inventory, physical belt or pipe routing, head lift, or temporary startup conditions in the game.',
      ],
    },
    {
      heading: 'Read the six result tabs',
      paragraphs: [
        'Start with Summary for output against target, the clock-adjusted power range, building counts, approximate footprint, byproducts and Sink points. Production steps groups recipes by machine type and shows running-machine equivalents, machines to build, clock speeds, and input and output rates. A plan with power generation also has a display-only option to hide generator steps.',
        'Resources is where you check the required rate, share of the map limit, extractor and node allocation by purity. Item balance compares production, consumption, outside supply and the difference for each item. Flowchart draws the links between steps. The final tab, Build list, presents extraction and water, production, then power in that section order. Use Summary to size the plan, balance and steps to diagnose it, and Build list when you are ready to place machines.',
      ],
    },
    {
      heading: 'Walk through the 60 Iron Plate/min sample',
      paragraphs: [
        'The “Your First Iron Plate Line” sample targets 60 Iron Plate/min with no alternate recipes. Compare requested and produced output in Summary, then follow the recipes and counts from Iron Ore to Iron Ingots to Iron Plates in Production steps. Check that the ore and intermediate rates line up in Resources and Item balance, trace the route in Flowchart, and then open Build list. Changing the target rate or alternate recipes changes the required machines, so recalculate for your own conditions instead of copying the sample counts blindly.',
      ],
    },
    {
      heading: 'Save or share the inputs and take the result with you',
      paragraphs: [
        'In the Plans panel, name a plan and save it in the browser, then load it from the saved list. Share creates a URL containing the current input conditions and tries to copy it. The recipient recalculates those conditions in their own environment, so a share URL is not a copy of the calculated output tables. In the Excel export panel, enter a plan name and download the workbook. Export is available when there is an optimal solution and no calculation is running; an error appears in the panel if workbook creation fails.',
        'Recipe values come from the data version bundled with the planner. When checking for a difference from the game, consult the version and source record shown with the result; do not assume an unverified game version has matching values.',
      ],
    },
  ],
  references: {
    heading: 'Implementation and data references',
    links: [
      { label: 'Result tabs and their rendering', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/ResultView.tsx' },
      { label: 'Target input and defaults', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/TargetsPanel.tsx' },
      { label: 'Data version and source record', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  relatedArticleSlugs: ['build-checklist-guide', 'excel-export-guide'],
  cta: {
    kind: 'sample',
    label: 'Open the sample plan for 60 Iron Plate/min',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
