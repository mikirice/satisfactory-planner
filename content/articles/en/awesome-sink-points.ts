import type { HandwrittenArticle } from '../types.ts'

export const awesomeSinkPointsArticleEn = {
  slug: 'awesome-sink-points',
  title: 'AWESOME Sink Points — Deciding What to Sink From the Data',
  description:
    'How sink points are assigned, what an aggregate of every recipe says about how much one more production step is worth, and what the multiplier looks like across a whole chain from raw ore.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Points are a fixed value per item',
      paragraphs: [
        'What the AWESOME Sink pays is a fixed number attached to each item. Raw resources are low: Iron Ore 1, Limestone 2, Copper Ore 3, Coal 3, Water 5, Bauxite 8, Sulfur 11, Raw Quartz 15, Crude Oil 30. Manufactured parts climb quickly: Iron Plate 6, Cable 24, Steel Beam 64, Aluminum Ingot 131, Aluminum Casing 393, Modular Frame 408, Motor 1,520. Every item page on this site lists its sink points, so you can look any of them up directly.',
        'The important part is that points depend only on what the item is, not on how much effort went into it. The same item pays the same amount no matter which recipe produced it. That means the whole efficiency question reduces to two things: what you sink, and how much raw material you spent getting there.',
      ],
    },
    {
      heading: 'One more step usually doubles it',
      paragraphs: [
        'Comparing the total sink points of a recipe\'s products against the total of its ingredients, per minute, shows a clear pattern. Of the 280 recipes that take ingredients, 101 land on exactly 2.000. Iron Plate is a clean example: 30 Iron Ingot/min (60 points/min) becomes 20 Iron Plate/min (120 points/min). Cable, Steel Beam, Rotor, Modular Frame and Computer all sit at exactly 2.000 as well.',
        'The practical rule that falls out of this is simple: rather than sinking surplus as-is, put it through one more step first. Polymer Resin is worth 12 points each, but running it through the standard Residual Rubber recipe turns each unit into half a Rubber, worth 30 points. All you have to weigh is whether the extra building and its power draw are worth it.',
      ],
    },
    {
      heading: 'Find the recipes that are not 2x',
      paragraphs: [
        'The other 179 recipes miss 2.000 in one direction or the other, and that is where both the opportunities and the traps are. The high ones are mostly alternates: Iron Wire (12.5 Iron Ingot/min into 22.5 Wire/min) is 5.4x, and Cast Screws (12.5 Iron Ingot/min into 50 Screws/min) is 4.0x. Even at an early base with nothing but Iron Ore, carrying the chain as far as Wire changes the point rate substantially.',
        'Some go the other way. Battery has 9,460 points/min of ingredients against 9,450 points/min of products, essentially 1.00x. Sinking Batteries is worse than finding another use for the Sulfuric Acid and Alumina Solution that went into them. Unpackaging recipes come in at 0.5x, but since packaging is 2.0x a package-and-unpackage round trip is point-neutral.',
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
        'Points buy coupons, and the number of points a coupon costs rises each time you claim one. This planner does not model coupons, so what it can tell you is only how much points-per-minute a given set of buildings produces. Given the numbers above, the answer is clear enough: if you are building a line purely to sink, adding one or two steps to an existing main line beats opening new resource nodes for a wider variety of cheap items.',
        'In practice the least effort comes from sinking the surplus your main factory already makes. If Screws and Iron Rods pile up, branch the ingots feeding them into the Wire or Screws alternates instead. If your oil line leaves byproducts, convert them with Residual Rubber or Residual Plastic before sinking. Both raise points per minute without claiming a single new node.',
      ],
    },
    {
      heading: 'Checking it in the planner',
      paragraphs: [
        'Set the item you want to sink as the target, read off the raw resource rates, and compare their point total against the product\'s point total. Cross-referencing the sink points on the item pages with the raw resource list in the results reproduces exactly the multipliers above for your own setup. Enabling alternates one at a time to find combinations that use less raw material is, directly, a point efficiency improvement.',
        'When comparing candidates, look at the building count and the clocked power alongside the resource totals. A high multiplier that needs far more machines is a poor trade once floor space becomes the limit.',
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
    'alternate-recipe-metrics',
    'production-planning-tutorial',
    'oil-products-basics',
  ],
  cta: {
    kind: 'item',
    label: 'Open a 60 Steel Beam/min plan (3,840 points/min)',
    itemId: 'Desc_SteelPlate_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
