import type { HandwrittenArticle } from '../types.ts'

export const awesomeSinkPointsArticleEn = {
  slug: 'awesome-sink-points',
  title: 'AWESOME Sink Points — Deciding What to Sink From the Data',
  description:
    'See how sinkable eligibility and point values work in the bundled data, calculate points per minute for recipe inputs and outputs, and learn what the planner can show across a production chain.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Points are a fixed value per item',
      paragraphs: [
        'The bundled item data has a point value for each item, but a value alone does not make it eligible for the Sink. This planner counts an item only when it is solid and its point value is greater than zero. Water and Crude Oil are liquids, for example, so they are excluded here even if the data has a numeric value. Examples in the bundled 1.1.x data: Iron Ore 1, Limestone 2, Copper Ore 3, Coal 3, Bauxite 8, Sulfur 11, Raw Quartz 15, Iron Plate 6, Cable 24, Steel Beam 64, Aluminum Ingot 131, Aluminum Casing 393, Modular Frame 408 and Motor 1,520 points per item. The planner’s item pages show a value only for items passing this eligibility check.',
        'The bundled point value is fixed for an item, regardless of which recipe produced it. To compare recipes, multiply each eligible item’s per-minute rate by its points per item. This separates what can be sunk from how much eligible material the production chain used.',
      ],
    },
    {
      heading: 'One more step usually doubles it',
      paragraphs: [
        'Comparing only sinkable solid inputs and outputs per minute across the current recipe dataset shows a pattern. Of 290 recipes with ingredients, 82 have a sinkable-output to sinkable-input ratio of exactly 2.000. Iron Plate is a clean example: 30 Iron Ingot/min (60 points/min) becomes 20 Iron Plate/min (120 points/min). Cable, Steel Beam, Rotor, Modular Frame and Computer also sit at exactly 2.000.',
        'This does not mean you should always process surplus before sinking it. In the bundled data, Polymer Resin is 12 points per item; the standard Residual Rubber recipe converts one Resin into half a Rubber, worth 30 points. That is a theoretical point increase, which still has to be weighed against the extra building, power and operating conditions.',
      ],
    },
    {
      heading: 'Find the recipes that are not 2x',
      paragraphs: [
        'The remaining recipes differ from 2.000 in either direction, and that is where opportunities and trade-offs appear. The high ones are mostly alternates: Iron Wire (12.5 Iron Ingot/min into 22.5 Wire/min) is 5.4x, and Cast Screws (12.5 Iron Ingot/min into 50 Screws/min) is 4.0x. Even at an early base with nothing but Iron Ore, carrying the chain as far as Wire changes the point rate substantially.',
        'Battery has 7,860 sink points/min in eligible solid ingredients against 9,300 points/min in products, about 1.18x. The calculation excludes liquid Sulfuric Acid and Alumina Solution because neither can be fed into the Sink directly. Unpackaging Packaged Water is about 0.462x using eligible solid items, while packaging it is about 2.167x; the round trip is point-neutral when the returned solid container is included.',
      ],
    },
    {
      heading: 'What the multiplier is across a whole chain',
      paragraphs: [
        'Measured from raw ore rather than one recipe at a time, the spread gets much wider. Solved with standard recipes only, 60 Iron Plate/min comes from 90 Iron Ore/min (90 points/min) and pays 360 points/min, a 4x multiplier. 60 Steel Beam/min comes from 240 Iron Ore/min and 240 Coal/min (960 points/min together) and pays 3,840 points/min, also 4x. 60 Cable/min comes from nothing but 60 Copper Ore/min (180 points/min) and pays 1,440 points/min — 8x.',
        'Go deeper and it keeps climbing. 10 Modular Frame/min comes from 240 Iron Ore/min (240 points/min) and pays 4,080 points/min, 17x. 10 Motor/min comes from 315 Iron Ore/min, 90 Coal/min and 80 Copper Ore/min (825 points/min together) and pays 15,200 points/min, 18.4x. For the same Iron Ore input, stopping at Iron Plate versus carrying on to Modular Frame is a difference of more than four times the points.',
      ],
    },
    {
      heading: 'A realistic way to chase coupons',
      paragraphs: [
        'The planner does not calculate Sink machine count, feed capacity, coupons or coupon costs. This guide uses the recipe and raw-resource data to compare theoretical points when you carry a material through additional steps. Before building a dedicated line, compare the points from sinking surplus as-is with the extra materials, machines and power required to process it.',
        'Start with the eligible surplus your factory already makes and multiply its rate by its points per item. If Screws or Iron Rods pile up, compare that with routing their ingredients through a Wire or Screws alternate. If an oil line leaves byproducts, count the eligible solid output after Residual Rubber or Residual Plastic; do not include the liquid byproduct in the Sink-point total.',
      ],
    },
    {
      heading: 'Checking it in the planner',
      paragraphs: [
        '1. Open an item page and check that the candidate is solid and has a displayed point value above zero. 2. Choose a recipe and multiply each eligible input and output rate by its item points. Exclude ineligible materials from this direct point total. 3. For a factory-wide comparison, apply the same calculation to eligible raw items in the resource list and switch one recipe at a time while keeping the finished-product target fixed.',
        'If the route needs an ineligible liquid, adds buildings or pushes clock-adjusted power beyond your supply, do not decide from the direct-recipe multiplier alone. The planner’s summary shows points from eligible surplus byproducts in the result; that is not the total points from sinking every finished product or a coupon estimate. Check in-game feed limits and Sink capacity separately.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_IronPlate_C',
    'Desc_SteelPlate_C',
    'Desc_Cable_C',
    'Desc_ModularFrame_C',
    'Desc_Motor_C',
    'Desc_PolymerResin_C',
    'Desc_Rubber_C',
  ],
  relatedArticleSlugs: [
    'strong-alternate-recipes',
    'production-planning-tutorial',
    'oil-products-basics',
  ],
  references: {
    heading: 'References',
    links: [
      { label: 'Satisfactory Planner — bundled game-data source and version (1.1.x)', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Satisfactory Planner — item point values and forms', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/data/items.json' },
      { label: 'Satisfactory Planner — Sink eligibility and surplus-point calculation', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/src/data/index.ts' },
    ],
  },
  cta: {
    kind: 'item',
    label: 'Open a 60 Steel Beam/min plan (3,840 points/min)',
    itemId: 'Desc_SteelPlate_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
