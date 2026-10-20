import type { HandwrittenArticle } from '../types.ts'

export const excelExportGuideArticleEn = {
  slug: 'excel-export-guide',
  title: 'Using the Excel Export — Review and Share a Plan in Six Sheets',
  description:
    'A guide to the current Excel export: what each of its six sheets contains, how to check construction costs and logistics, and how to work alongside your own spreadsheet.',
  sections: [
    {
      heading: 'Create a workbook after an optimal solution',
      paragraphs: [
        'When calculation is complete and there is an optimal solution, open Excel export in the sidebar. Enter a plan name and select Download Excel to create an `.xlsx` file whose name includes the plan name and date. The button is unavailable while calculating or when there is no solution. If workbook creation fails, the panel displays an error. Sheet names and labels follow the language selected in the planner.',
        'The workbook contains six sheets in order: Summary, Building List, Item Balance, Resources, Build Cost and Logistics. Summary is a fixed-header overview; the other tabular sheets freeze their header rows and have autofilters.',
      ],
    },
    {
      heading: 'Share the conditions and overall plan through Summary',
      paragraphs: [
        'Start with plan name, generation time, bundled game-data version, objective, targets and produced output. Summary also includes manufacturing and extraction power, clock settings, Shards and Somersloops, any power plan with its fuel rates and generation, building counts, an approximate footprint, required resources, available stock and the amount actually used, Sink points, byproducts and enabled alternate recipes. Material types and quantities are in Build Cost, not Summary.',
        'Before sharing, check that requested and produced amounts match your intent, whether power includes extraction, and whether outside supplies are used as expected. A maximized target shows “Maximize” in the requested column, so do not read it as a fixed numeric target.',
      ],
    },
    {
      heading: 'Investigate buildings and item balance',
      paragraphs: [
        'Building List covers manufacturing and power steps: machine type, recipe, 100%-equivalent running count, machines to build, clock, Shards and Somersloops, power range, generated power, building dimensions and area, plus step inputs and outputs. Extractor details are in Resources. Filter by machine type or recipe, then use the total row to check the overall building count.',
        'Item Balance shows production, consumption, external supply, net difference and a status for each item. Shortages and surpluses use both colour and a text label. If a difference is unexpected, find the item here, then return to the production steps or flowchart to follow its suppliers and consumers.',
      ],
    },
    {
      heading: 'Reconcile resources, build cost and logistics',
      paragraphs: [
        'Resources lists the required rate, map limit and usage, extractors, running and built counts, node counts by purity, extraction rate, pressurizers or Shards, extraction power and any node shortfall. Build Cost separates construction materials for manufacturing buildings and extractors, with a total row. Use it to identify materials to gather before construction.',
        'For each flow, Logistics shows its kind, step, item, solid/liquid/gas form, rate, the belt or pipe selected in the planner, capacity, required lines and utilization. Changing the transport choice and exporting again changes line counts and utilization, but not the production solution. This organizes required capacity; it does not draw the physical belt or pipe routes, splits or merges.',
      ],
    },
    {
      heading: 'Move values into your own tracking sheet',
      paragraphs: [
        'Independent values such as rates, power, construction materials and machine counts are numeric cells. Rates, power and material amounts display two decimal places; running-machine equivalents display four; built machines and line counts display as integers. Building inputs and outputs are readable strings that combine multiple items, not separate item columns. When filtering or copying rows into your own tracker, keep the units with each value.',
        'Keep stock, coordinates, owner, built status and progress in a separate tracking sheet that references the export. Planner does not import Excel workbooks. Treat a saved plan in the browser or its share URL as the source for input conditions, and the workbook as a record of that calculation, so a new export does not overwrite your tracking fields.',
      ],
    },
    {
      heading: 'Migrate from an older calculation sheet',
      paragraphs: [
        'Enter the same target rates, available alternate recipes, objective, extraction, power and logistics conditions in the planner. Compare output, power, machine counts and raw resources in Summary. If a value differs, find the item in Item Balance and follow the process through Building List and Flowchart. Then move layout notes and progress columns that exist only in your old sheet into a separate tracker.',
        'The calculation uses the game-data version shown in the workbook. Keep that version and its source record with the plan. Values that have not been checked against in-game Update 1.2 data should not be described as verified for the current game.',
      ],
    },
  ],
  references: {
    heading: 'Implementation and data references',
    links: [
      { label: 'Excel export panel and availability', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/ui/ExportPanel.tsx' },
      { label: 'Six sheet definitions and number formats', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/export/excel.ts' },
      { label: 'Logistics flows and transport choices', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/src/plan/flows.ts' },
      { label: 'Game-data version and source record', href: 'https://github.com/mikirice/satisfactory-planner/blob/48e5e7192ef51978eac6e3cb96b122aa37db32df/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: ['Desc_ModularFrameHeavy_C', 'Desc_IronPlate_C'],
  relatedArticleSlugs: ['production-planning-tutorial', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Try the Excel export on the Heavy Modular Frame factory',
    sampleId: 'heavy-modular-frame',
  },
} as const satisfies HandwrittenArticle
