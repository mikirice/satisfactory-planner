import type { HandwrittenArticle } from '../types.ts'

export const somersloopAndPowerShardsArticleEn = {
  slug: 'somersloop-and-power-shards',
  title: 'When to Use Somersloops and Power Shards — Double Output and What It Costs',
  description:
    'Compare Somersloops and Power Shards by output multiplier, ingredient consumption, building count, units required and clock-adjusted power draw.',
  sections: [
    {
      heading: 'Two boosters, two different jobs',
      paragraphs: [
        'Somersloops and Power Shards both let fewer buildings produce more, but they do completely different things in the maths. A Power Shard raises the speed at which a recipe is processed. A Somersloop leaves ingredient consumption untouched and multiplies what comes out.',
      ],
    },
    {
      heading: 'Use Power Shards to cut machine count',
      paragraphs: [
        'Each Power Shard raises the clock ceiling by 50 percentage points, up to three per machine and a maximum of 250%. Raising the production clock limit does not change the 100%-equivalent machine requirement or ingredient balance. It changes the building allocation; with a 250% ceiling, three machines’ worth of work can run on two machines at 150% each, using one shard apiece. Making 60 Iron Plate/min takes three Constructors and 12 MW for the Constructors at 100%, or two at 150% and about 13.67 MW for the Constructors (smelting and extraction draw extra power). Each 150% Constructor needs one shard.',
        'In this model, production power is base draw × clock raised to 1.321929. Higher clocks therefore use more power for the same number of items. Evenly underclocking several machines saves power instead. Shards can reduce the count where floor space or construction materials are scarce, or where a costly manufacturer is hard to duplicate. They can also increase extraction at a node, but check the resulting clock, count and power. If power is tight, review the actual clock and draw after solving instead of treating a higher ceiling as a free gain.',
      ],
    },
    {
      heading: 'Use Somersloops to save ingredients',
      paragraphs: [
        'Filling every slot of a supported building doubles all output while ingredient consumption stays the same. A Constructor has one slot, an Assembler two and a Manufacturer four. At 100% clock, power becomes four times normal. In the planner’s 60 Iron Plate/min plan, three standard Constructors use 90 Iron Ore/min and the whole factory draws 24 MW. One fully looped Constructor plus one standard Constructor makes the same 60/min using 60 Iron Ore/min and one Somersloop; the whole factory draws 28 MW. In the bundled data and solver, that saves 30 Iron Ore/min at a cost of 4 MW across the plan.',
        'The planner does not model partial loading; each building variant is either normal or filled in every slot. Enter the number of Somersloops you have as an upper limit, and the solver combines normal and fully looped steps to fit its objective. Doubling a step close to the finished product reduces the upstream chain too. Applying it at several stages can compound savings, along with the power draw and number of Somersloops used.',
      ],
    },
    {
      heading: 'Check the results and the warnings',
      paragraphs: [
        'Read the summary for Somersloops used, raw resources and clock-adjusted power, then read the production steps to see which recipe received how many. Somersloop slots are constrained by the integer number of buildings you can actually place, including the building’s full slot count. A plan cannot use a fractional building’s worth of slots; if your budget cannot cover an additional building, that full-slot variant is unavailable.',
        '1. Choose a production-clock ceiling in settings, then read the building count, actual clock and shard count in Production steps. 2. Solve the same target with zero Somersloops and with the number you own; compare raw resources and clock-adjusted power in Summary. 3. In Production steps, check which recipes were fully loaded and whether the displayed slots match whole buildings.',
        'If power rises but the machine count does not fall, check the actual clocks and slots selected. The solver may use fewer than the number you entered. It models production rates and material balances; it does not simulate in-game power trips, belt jams or placement.',
      ],
    },
  ],
  relatedItemIds: ['Desc_WAT1_C', 'Desc_CrystalShard_C', 'Desc_IronPlate_C'],
  references: {
    heading: 'References',
    links: [
      { label: 'Satisfactory Planner — bundled game-data source and version (1.1.x)', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Planner — clock and Power Shard calculations', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/solver/overclock.ts' },
      { label: 'Satisfactory Planner — Somersloop output, power and building constraints', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/solver/model.ts' },
    ],
  },
  cta: {
    kind: 'item',
    label: 'Try Somersloops on 60 Iron Plate/min',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 60,
    somersloops: 20,
  },
} as const satisfies HandwrittenArticle
