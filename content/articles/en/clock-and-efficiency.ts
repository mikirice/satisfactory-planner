import type { HandwrittenArticle } from '../types.ts'

export const clockAndEfficiencyArticleEn = {
  slug: 'clock-and-efficiency',
  title: 'Clock Speed and 100% Efficiency — Why Power Scales as the 1.32 Power',
  description:
    'What over- and underclocking actually do to power draw, the three ways the planner turns a fractional machine count into real buildings, and when a Power Shard is worth its power cost.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Power scales as clock to the 1.32',
      paragraphs: [
        'A manufacturing building draws base power multiplied by clock speed raised to 1.321929. That exponent comes straight from the game data; the theoretical value is log2(2.5) = 1.3219281. Output scales linearly with clock while power scales with an exponent, so the cost per item gets worse the higher you push.',
        'In concrete multipliers: 150% clock draws 1.71 times the power, 200% draws 2.50 times, 250% draws 3.36 times. Divided by output, the power per item is 1.14x at 150%, 1.25x at 200% and 1.34x at 250%. Underclocking runs the other way — 0.80x per item at 50% clock and 0.64x at 25%. You need more buildings for the same throughput, but on power alone, lower is always better.',
      ],
    },
    {
      heading: 'Turning a fractional machine count into buildings',
      paragraphs: [
        'The solver works in continuous machine counts. Ask for 10 Modular Frame/min with standard recipes only and some steps land neatly — 8 Smelters for Iron Ingot, 7 Constructors for Iron Rod, 5 Assemblers for Modular Frame — while Iron Plate and Screws both come out at 4.5. You cannot build half a Constructor, so that has to become an integer count plus a clock setting.',
        'The planner offers three ways to do it: run every machine at the same clock (5 machines at 90%), run whole machines at 100% and put the remainder on one machine (4 at 100% plus 1 at 50%), or overclock to the ceiling to cut the machine count (2 at 225%). For 4.5 Constructors at 4 MW each those come to 17.40 MW, 17.60 MW and 23.37 MW. The options are listed from lowest power upward, so when power is tight you can just take the first.',
        'They differ in character, not just in numbers. Even clocking is the cheapest but means setting every machine. Whole machines plus one partial costs slightly more power but is easier to configure and easier to split into separate lines. The overclocked option costs clearly more power and, in this example, six Power Shards.',
      ],
    },
    {
      heading: 'When a Power Shard earns its keep',
      paragraphs: [
        'Each Power Shard raises the clock ceiling by 50%, up to three per machine for a maximum of 250%. Since the efficiency loss is guaranteed, you generally do not overclock in a factory that is short on power. Overclocking pays where something other than power is the constraint.',
        'Extraction is the obvious case. The number of resource nodes on the map is fixed, so clock speed is the only lever for getting more out of one node. The planner offers extraction clocks of 100%, 150%, 200% and 250%, which correspond exactly to zero through three Power Shards. The same logic applies when floor space is short, when you want fewer expensive buildings such as Manufacturers or Blenders, or when you want to reduce the number of belt and pipe runs.',
        'On the manufacturing side, raising the ceiling does not change the 100%-equivalent machine requirement or the item balance at all. The only thing it changes is how that workload is distributed across buildings. Treat the clock ceiling as a setting that affects the final assignment, not one that re-solves the material calculation.',
      ],
    },
    {
      heading: 'Choosing targets that avoid remainders',
      paragraphs: [
        'Remainders appear because the target rate does not divide evenly by a recipe\'s output per machine. Iron Plate produces 20 items/min per machine, so 60/min is exactly three machines and 100/min is exactly five. Picking targets that are multiples of the per-machine output keeps things clean upstream too.',
        'In a multi-stage chain you cannot eliminate them entirely, because the intermediate ratios do not line up. Even in the Modular Frame example, the 4.5 machines on Iron Plate and Screws survive any choice of target. Do not force those to an integer; take them at a lower clock instead. Running exactly what you need at a reduced clock uses less power and less raw material than overproducing into storage.',
      ],
    },
    {
      heading: 'How this differs from Somersloops, and what to do in the planner',
      paragraphs: [
        'A Somersloop is a different mechanism. It leaves the input rate untouched and multiplies the output, and its power cost uses an exponent of 2 — a fully loaded building produces double at four times the power, measured at 100% clock. Where clock speed means "run the same recipe faster", a Somersloop means "get more from the same material". So Somersloops are for when raw material is the constraint and Power Shards are for when machines or space are.',
        'In the planner, change the "manufacturing clock ceiling" in the settings and compare the assignment and the clocked power in the results. Dropping the ceiling to 100% leaves only underclocked options; raising it to 250% adds the overclocked one. The lowest ceiling selectable in the interface is 10% — the game itself allows 1%, but a plan that puts one machine\'s worth of work across a hundred buildings has no practical use.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_CrystalShard_C',
    'Desc_WAT1_C',
    'Desc_ModularFrame_C',
    'Desc_IronPlate_C',
    'Desc_IronScrew_C',
  ],
  relatedArticleSlugs: [
    'somersloop-and-power-shards',
    'production-planning-tutorial',
    'power-generation-planning',
  ],
  cta: {
    kind: 'item',
    label: 'Open a 10 Modular Frame/min plan and look at the remainders',
    itemId: 'Desc_ModularFrame_C',
    ratePerMin: 10,
  },
} as const satisfies HandwrittenArticle
