import type { HandwrittenArticle } from '../types.ts'

/** Per-minute figures are scaled directly from src/data/recipes.json and buildings.json. */
export const oilProductsBasicsArticleEn = {
  slug: 'oil-products-basics',
  title: 'Oil Production Basics — Plastic, Rubber and Fuel from Crude Oil',
  description:
    'Compare the standard Crude Oil recipes, choose an outlet for Heavy Oil Residue and Polymer Resin, and plan a small production block with power figures and troubleshooting steps.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Start with the standard recipe rates',
      paragraphs: [
        'The figures here convert the standard recipes in the planner data to per-minute rates. Plastic uses 30 m³/min of Crude Oil to make 20 Plastic/min plus 10 m³/min of Heavy Oil Residue. Rubber uses the same 30 m³/min to make 20 Rubber/min plus 20 m³/min of Heavy Oil Residue. Fuel uses 60 m³/min of Crude Oil and returns 40 m³/min of Fuel plus 30 Polymer Resin/min. Each recipe runs in a Refinery drawing 30 MW at 100% clock.',
        'Choose an outlet for every byproduct as you decide what to make. Plastic and Rubber take the same amount of Crude Oil, but their Heavy Oil Residue output differs. The Fuel recipe makes Polymer Resin instead. If a byproduct has nowhere to go and its pipe fills, the upstream production stops.',
      ],
      tables: [
        {
          caption: 'Standard recipe rates per minute (Refinery at 100%)',
          headers: ['Product', 'Input', 'Output', 'Machine power'],
          rows: [
            ['Plastic', '30 m³ Crude Oil', '20 Plastic + 10 m³ Heavy Oil Residue', '30 MW'],
            ['Rubber', '30 m³ Crude Oil', '20 Rubber + 20 m³ Heavy Oil Residue', '30 MW'],
            ['Fuel', '60 m³ Crude Oil', '40 m³ Fuel + 30 Polymer Resin', '30 MW'],
          ],
        },
      ],
    },
    {
      heading: 'Build a first oil line around 60 m³/min',
      paragraphs: [
        'If you want 20 Plastic/min and 20 Rubber/min, use one Refinery for each product. Together they need 60 m³/min of Crude Oil and produce 30 m³/min of Heavy Oil Residue. Residual Fuel converts 60 m³/min of residue into 40 m³/min of Fuel, so running it at half clock gives 20 m³/min of Fuel. That is exactly what one Fuel-Powered Generator consumes; it produces 250 MW.',
        'The block uses 2.5 Refineries in total, or 75 MW, leaving 175 MW after subtracting those machines from the generator output. This comparison excludes the Oil Extractor, pumps and other support equipment. At start-up, bring Crude Oil through the refineries and fill the residue and Fuel lines before connecting the generator load; that helps avoid an early power shortfall stopping the whole line.',
        'An Oil Extractor on a Normal node produces 120 m³/min at 100% clock, so 60 m³/min is half of that rate. If the Crude Oil line backs up, check the extractor clock, refinery demand and pipe capacity as well as the supply rate.',
      ],
    },
    {
      heading: 'Choose a residue outlet by power and Water supply',
      illustration: {
        src: '/article-images/official-straight-pipes-1.1.jpg',
        alt: 'A pipe scene from the official Update 1.1 Satisfactory Press Kit. Its HUD is from the older UI and is not a current walkthrough or the 60 m³/min crude-oil layout in this guide.',
        caption: 'A pipe-network screenshot from the official Update 1.1 Press Kit. The HUD and control prompts show the older UI and are not current instructions. It provides general fluid-routing context, not the 60 m³/min recipe chain or Heavy Oil Residue result in this article.',
        creditLinks: [
          { label: 'Official Satisfactory Press & Content Creators page', href: 'https://www.satisfactorygame.com/press/' },
          { label: 'Original image (official Press Kit)', href: 'https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view' },
        ],
      },
      paragraphs: [
        'Compare three common destinations for the 30 m³/min of Heavy Oil Residue from the 20 Plastic/min and 20 Rubber/min block. The power figures below are gross output from burning only that byproduct; upstream production power is separate.',
        'Diluted Fuel is an alternate recipe: a Blender turns 50 m³/min of Heavy Oil Residue and 100 m³/min of Water into 100 m³/min of Fuel. Scaling it to 30 m³/min of residue takes 60 m³/min of Water and returns 60 m³/min of Fuel. That is 0.6 of a 75 MW Blender, or 45 MW. If you have not unlocked the alternate, start with Residual Fuel or Petroleum Coke.',
        'Each Coal-Powered Generator consumes 25 Petroleum Coke/min and 45 m³/min of Water. The 90 Coke/min from this route supports 3.6 generators and requires 162 m³/min of Water. Without that Water supply, the higher gross power figure does not translate into a running plant. Water extraction and pumps are not included in the table.',
      ],
      tables: [
        {
          caption: 'What 30 m³/min of Heavy Oil Residue can support (upstream machine power excluded)',
          headers: ['Route', 'Output', 'Power benchmark', 'Extra input'],
          rows: [
            ['Residual Fuel', '20 m³/min Fuel', '1 Fuel-Powered Generator · 250 MW', 'None'],
            ['Petroleum Coke', '90 Petroleum Coke/min', '3.6 Coal-Powered Generators · 270 MW', '162 m³/min Water'],
            ['Diluted Fuel (alternate)', '60 m³/min Fuel', '3 Fuel-Powered Generators · 750 MW', '60 m³/min Water · 0.6 Blender'],
          ],
        },
      ],
    },
    {
      heading: 'Use the Polymer Resin from the Fuel recipe',
      paragraphs: [
        'The standard Fuel recipe that makes 40 m³/min of Fuel also produces 30 Polymer Resin/min. Residual Plastic turns 60 Polymer Resin/min plus 20 m³/min of Water into 20 Plastic/min. Residual Rubber turns 40 Polymer Resin/min plus 40 m³/min of Water into 20 Rubber/min. Decide which product will take the resin before scaling up Fuel, so the refineries do not stop when the byproduct backs up.',
        'Recycled Plastic and Recycled Rubber are alternate recipes that use Fuel and each other’s output. Neither creates a useful loop by itself; plan the Crude Oil feed, initial product and final takeoff together. For solved loop rates, start-up order and Fuel pipe setup, see the [Complete Oil Recycling Loop guide](/en/articles/oil-loop-complete/). The [Diluted Fuel Power guide](/en/articles/diluted-fuel-power/) shows that route as a complete power plan.',
      ],
    },
    {
      heading: 'Check the plan and trace byproducts when production stops',
      paragraphs: [
        'Set Plastic or Rubber as a target in the Planner and check how much Crude Oil the standard recipe requires. In production steps and balances, look for leftover Heavy Oil Residue or Polymer Resin. Then enable unlocked alternate recipes one at a time and compare the machine count and Water demand. To include power, enable Fuel-Powered Generators, choose Fuel as the input and set a target in MW.',
        'If the factory stalls, check in this order: (1) whether the Heavy Oil Residue or Resin tank and pipe are full, (2) whether the byproduct outlet consumes the rate being made, (3) whether Fuel reaches the generators, and (4) whether the generators have power to start. The Planner calculates recipes and steady-state balances; it does not reproduce your pipe elevations, head lift, start-up flow or buffer sizes.',
      ],
    },
  ],
  references: {
    heading: 'Data and recipe sources',
    links: [
      {
        label: 'Planner game-data source and version record (1.1.x)',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      { label: 'Oil Refinery recipes — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Oil_Refinery' },
      { label: 'Heavy Oil Residue — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Heavy_Oil_Residue' },
      { label: 'Fuel — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Fuel' },
      { label: 'Petroleum Coke — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Petroleum_Coke' },
    ],
  },
  relatedItemIds: [
    'Desc_LiquidOil_C',
    'Desc_Plastic_C',
    'Desc_Rubber_C',
    'Desc_HeavyOilResidue_C',
    'Desc_PolymerResin_C',
    'Desc_LiquidFuel_C',
    'Desc_PetroleumCoke_C',
  ],
  relatedArticleSlugs: [
    'oil-loop-complete',
    'packaged-nitrogen-empty-fluid-tank-circulation-planning',
    'diluted-fuel-power',
    'power-system-capacity-and-recovery',
    'power-system-capacity-and-recovery',
    'strong-alternate-recipes',
  ],
  cta: {
    kind: 'item',
    label: 'Open a 60 Plastic/min plan and check the byproduct balance',
    itemId: 'Desc_Plastic_C',
    ratePerMin: 60,
  },
} as const satisfies HandwrittenArticle
