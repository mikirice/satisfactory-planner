import type { HandwrittenArticle } from '../types.ts'

export const excelExportGuideArticleEn = {
  slug: 'excel-export-guide',
  title: 'Working with the Excel Export — Six Sheets and How to Migrate Your Own Spreadsheet',
  description:
    'Use the six sheets of the Excel export for construction, item balance, extraction and logistics, and migrate safely from a spreadsheet you built yourself.',
  sections: [
    {
      heading: 'Export the six sheets',
      paragraphs: [
        'Once the result looks right, use the Excel export in the sidebar, give the plan a name and download it. Nothing is exported while a calculation is running or when there is no solution. The file is named satisfactory-plan_<plan name>_<date>.xlsx and the workbook always contains the same six sheets in the same order.',
      ],
    },
    {
      heading: 'Share the design conditions through the summary',
      paragraphs: [
        'The summary sheet is the one to read first. It carries the targets and actual output, the game data version, the objective, production and extraction power, clock speeds and Power Shards, Somersloops, the power plan, building count, approximate footprint, required raw resources, the amount consumed from stock, sink points, byproducts and the alternate recipes that were enabled. When you hand the design to someone else, use this sheet as the cover page.',
      ],
    },
    {
      heading: 'Read the building list and the item balance',
      paragraphs: [
        'The building list is the sheet you build from. For each machine type and recipe it lines up the 100%-equivalent machine count, the machines you actually build, clock speed, shards, Somersloops, power, building dimensions, inputs and outputs. The item balance sheet shows production, consumption, external supply and the difference for every item, marking shortage, surplus and balance in both text and colour. Check that every difference is intentional here before you copy splits and merges into a sheet of your own.',
      ],
    },
    {
      heading: 'Read resources, construction cost and logistics',
      paragraphs: [
        'The resources sheet collects the required rate, the map limit and how much of it you use, the extractor, the node allocation by purity, shards, extraction power and any node shortfall. The construction cost sheet separates production buildings from extractors and totals them at the end. The logistics sheet splits each flow into solid, fluid and gas, then shows the capacity of the belt or pipe you selected, the number of lines needed and the utilisation. Logistics settings never change the production solution — only this conversion into line counts.',
      ],
    },
    {
      heading: 'Treat it as a source document you can regenerate',
      paragraphs: [
        'Independent numeric columns such as rates, power and machine counts are written as real numbers: rates with two decimal places, machine equivalents with four. Inputs and outputs in the building list are readable strings that combine several items. The tabular sheets come with frozen headers and autofilters, so you can narrow them down by machine or by item. If you want to add your own formulas, keep the six generated sheets as the source document and pull them into a separate sheet for the columns you run the factory with — stock, coordinates, owner, how much is already built. Then, when you recalculate and export a fresh file, only your own sheet has to move.',
      ],
    },
    {
      heading: 'Migrate from your own spreadsheet',
      paragraphs: [
        'To migrate, first enter the same target rates and unlocked alternate recipes into the planner. Then compare raw resources, power and building count in the summary against your old sheet, and where they differ, use the item balance to narrow the search to a specific step. Finally, move the layout notes and progress columns that only exist in your old sheet into a separate sheet. There is no import from Excel back into the tool, so treat the saved plan or the share URL as the master copy of your inputs and the workbook as a record of the result.',
      ],
    },
  ],
  relatedItemIds: ['Desc_ModularFrameHeavy_C', 'Desc_IronPlate_C'],
  cta: {
    kind: 'sample',
    label: 'Try the Excel export on the Heavy Modular Frame factory',
    sampleId: 'heavy-modular-frame',
  },
} as const satisfies HandwrittenArticle
