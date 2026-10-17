import type { HandwrittenArticle } from '../types.ts'

/** Values checked against src/data/buildings.json, constants.ts and solver/overclock.ts. */
export const clockAndEfficiencyArticleEn = {
  slug: 'clock-and-efficiency',
  title: 'Clock Speed and Efficiency — Manufacturing Power, Fractional Machines and Generators',
  description:
    'Compare the clock formulas for production machines, miners and generators. Turn fractional planner machine counts into real buildings and check the resulting power and material rates.',
  publishedDate: '2026-10-17',
  sections: [
    {
      heading: 'Production rate and power draw use different formulas',
      paragraphs: [
        'Constructors, Smelters, Miners and other production buildings scale their rate linearly with clock. Their power follows “base power × (clock / 100%)^1.321929.” At twice the clock, production doubles but power rises to about 2.5 times the base draw. These values use the planner’s Satisfactory 1.1.x data and implementation; Update 1.2 game data has not been checked.',
        'For a fixed output, one high-clock machine uses fewer buildings but more total power. Spreading the same work across more machines at lower clocks can reduce power. Choose with building count, floor space, material supply and grid capacity in mind.',
      ],
      tables: [
        {
          caption: 'Production and extraction buildings relative to their base power',
          headers: ['Clock', 'Production rate', 'Total power', 'Power per same output'],
          rows: [
            ['50%', '0.5×', '0.40×', '0.80×'],
            ['100%', '1×', '1×', '1×'],
            ['150%', '1.5×', 'about 1.71×', 'about 1.14×'],
            ['200%', '2×', 'about 2.50×', 'about 1.25×'],
            ['250%', '2.5×', 'about 3.36×', 'about 1.34×'],
          ],
        },
      ],
    },
    {
      heading: 'Assign 4.5 machine-equivalents to real buildings',
      paragraphs: [
        'The planner solver first calculates machine-equivalent counts for the requested production rate. With standard recipes, a 10 Modular Frame/min example requires 4.5 Constructor-equivalents on each upstream line: Iron Plates and Screws (not 4.5 for both lines combined). The game cannot place half a building, so convert each line’s workload to whole buildings and clock settings. A Constructor uses 4 MW at base clock; the three assignments below compare ways to handle 4.5 units of work on one line.',
      ],
      tables: [
        {
          caption: 'Ways to assign 4.5 Constructor-equivalents on one line',
          headers: ['Assignment', 'Buildings and settings', 'Power'],
          rows: [
            ['Even clock', '5 × 90%', '17.40 MW'],
            ['Put the remainder on one machine', '4 × 100% + 1 × 50%', '17.60 MW'],
            ['Use fewer buildings', '2 × 225% (6 Power Shards)', 'about 23.37 MW'],
          ],
        },
      ],
    },
    {
      heading: 'Choose an assignment and check the in-game flow',
      paragraphs: [
        'The even assignment uses the least power in this example, but requires setting all five machines. Four machines at 100% plus one at 50% is easy to configure and split across lines. The overclocked option saves space but uses Power Shards and more power. The planner lists the options from lower to higher clock-adjusted power; a different recipe or target can change which option fits best.',
        'After placing machines, select the intended recipe and enter each clock value. If a displayed rate is rounded, check the actual input and output flow. When a line falls short, separate a wrong clock from a blocked belt, missing ingredients or insufficient power.',
      ],
    },
    {
      heading: 'Generator clocks scale linearly, unlike production machines',
      paragraphs: [
        'For ordinary power generators, changing clock scales rated output and fuel consumption by the same proportion. Two Coal-Powered Generators produce 150 MW and use 30 Coal/min plus 90 m³ Water/min at 100%. Set both to 66⅔% and they produce 100 MW combined, consuming 20 Coal/min and 60 m³ Water/min. Coal, Fuel and Nuclear generators do not lower their clock automatically when grid demand is low. Biomass Burners are the exception: their output and fuel use follow demand.',
        'For production, the planner converts machine-equivalent counts into whole buildings and clock assignment options, then calculates each production building’s power. Its generator model currently uses whole generators at 100% clock; it does not model manual generator clock settings or automatic reduction of unused rated capacity. A plan can therefore show more generator output than the requested target. Adjust individual generators in game when needed.',
      ],
    },
    {
      heading: 'Use Power Shards and Somersloops for different constraints',
      paragraphs: [
        'Each Power Shard raises a production building’s clock ceiling by 50 percentage points, up to three shards and 250%. Overclocking can help when resource nodes, floor space, building materials or transport routes are the constraint. If power is tight, spreading output across more machines and underclocking them may be a better fit. The planner’s extraction clock setting offers 100%, 150%, 200% and 250% and applies the choice to resource allocation and mining power.',
        'Somersloops are a separate production boost. On supported buildings they increase output from the same input, while power rises with the square of the boost factor. The planner calculates a full-Somersloop option separately; do not treat it as another clock ceiling setting.',
        'A practical order is: solve for the target rate, inspect the machine-equivalent count and assignment options, then pick the option that fits the space, shards and available power. The planner solves material balances; it does not simulate wiring, transport jams, physical layout or in-game breaker trips.',
      ],
    },
  ],
  references: {
    heading: 'Sources',
    links: [
      { label: 'Satisfactory Wiki — Clock speed', href: 'https://satisfactory.wiki.gg/wiki/Clock_speed' },
      { label: 'Satisfactory Wiki — Advanced clock speed', href: 'https://satisfactory.wiki.gg/wiki/Tutorial:Advanced_clock_speed' },
      { label: 'Planner game-data source and version notes', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: [
    'Desc_CrystalShard_C',
    'Desc_WAT1_C',
    'Desc_ModularFrame_C',
    'Desc_IronPlate_C',
    'Desc_IronScrew_C',
  ],
  relatedArticleSlugs: ['somersloop-and-power-shards', 'production-planning-tutorial', 'power-generation-planning'],
  cta: {
    kind: 'item',
    label: 'Open the 10 Modular Frame/min plan and inspect the 4.5-machine remainder',
    itemId: 'Desc_ModularFrame_C',
    ratePerMin: 10,
  },
} as const satisfies HandwrittenArticle
