import type { HandwrittenArticle } from '../types.ts'

export const productionPlanningTutorialArticleEn = {
  slug: 'production-planning-tutorial',
  title: 'Your First Production Plan — A Guided Tour of the Planner',
  description:
    'Enter a target rate in the Satisfactory production planner, read the resources, buildings, power and flow it returns, then save, share and export the plan to Excel.',
  sections: [
    {
      heading: 'Enter your first target',
      paragraphs: [
        'The planner works backwards from one question: what do you want to produce, and how much of it per minute? From that it derives the recipes, buildings, raw resources, power and logistics you need. You do not have to understand every setting on the first run — add a single target in Planner mode and read what comes back.',
        'Type an item name into the output targets and pick it from the suggestions, then set a rate per minute. Ask for 60 Iron Plate per minute, for example, and the smelting and constructing steps that cover exactly that rate are recalculated for you. If you cannot settle on a number, switch the target to maximize and the planner returns the largest amount your resource limits allow. Only one item can be maximized at a time.',
      ],
    },
    {
      heading: 'Read the six result tabs',
      paragraphs: [
        'Results are split across six tabs: Summary, Production steps, Resources, Item balance, Flowchart and Build list. Summary gives you output against target, power, building count, construction cost and an approximate footprint. Production steps shows each recipe, running-machine equivalents, the number of machines to place, clock speed and flows. Resources lists the extraction requirement and miner allocation; Item balance shows production, consumption and surplus; Flowchart draws the links between steps. Build list is the field checklist: it orders buildings by dependency and shows the recipe, machine count and transport requirement. Use Summary to size the factory, Production steps to inspect the process and Build list while you place it.',
      ],
    },
    {
      heading: 'Adjust the planning conditions',
      paragraphs: [
        'Use the objective to steer the layout. Minimizing resources weights scarce raw materials more heavily and keeps extraction down, minimizing power favours a lower factory draw, and minimizing buildings favours fewer machines running. Enable only the alternate recipes you have actually unlocked and the planner solves again with those candidates included. Intermediates shipped in from another factory belong in the list of items you already have, where they are consumed before anything is mined. Setting a resource limit to zero lets you look for a layout that avoids that resource entirely.',
      ],
    },
    {
      heading: 'Move on to power, logistics and saving',
      paragraphs: [
        'To design power as well, pick the generator types and fuels, then set a target in MW or ask the plan to cover the factory’s own consumption. The belt and pipe you select under logistics never change the solution itself; they only decide how many lines each flow needs. Finished inputs can be saved in your browser, and a share URL lets someone else recalculate the same conditions on their own machine. Once a plan is solved, you can export it to Excel.',
        'Start by opening the plan for 60 Iron Plate per minute and changing the target rate to match your own factory.',
      ],
    },
  ],
  relatedItemIds: ['Desc_IronPlate_C', 'Desc_IronIngot_C'],
  cta: {
    kind: 'sample',
    label: 'Open the sample plan for 60 Iron Plate/min',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
