import type { HandwrittenArticle } from '../types.ts'

/**
 * Capacity and per-minute rates below are from the repository's 1.1.x game-data
 * snapshot at 100% clock. Coal generators run at the configured clock regardless
 * of grid demand; the planner reports whole generators at rated capacity.
 */
export const coalPowerStartupArticleEn = {
  slug: 'coal-power-startup',
  title: 'Getting Coal Power Running — Size and Stabilize an Eight-Generator Block',
  description:
    'Plan fuel, water and logistics for eight Coal-Powered Generators, start them with temporary power, protect supply during a grid trip, and read planner output as rated capacity rather than actual game load.',
  publishedDate: '2026-08-26',
  sections: [
    {
      heading: 'Choose capacity and fuel',
      paragraphs: [
        'Start by choosing the number of generators and their clock setting. At 100% clock, a Coal-Powered Generator produces 75 MW regardless of grid demand. On Coal, each unit consumes 15 Coal/min and 45 m³/min of Water, so eight units produce 600 MW and use 120 Coal/min plus 360 m³/min of Water. Low demand does not automatically reduce generator output or fuel and water consumption. Output and inputs decrease in proportion only when you manually lower the clock.',
        'At rated output, each generator uses about 7.14 Compacted Coal/min or 25 Petroleum Coke/min. The rated Water input remains 45 m³/min for either fuel. Compacted Coal adds Sulfur and Assembler capacity; Petroleum Coke uses Heavy Oil Residue but increases belt throughput. Choose a fuel based on the resources and logistics you can provide, then size the line for that fuel’s rated input.',
      ],
    },
    {
      heading: 'Fit belts and pipes to their limits',
      paragraphs: [
        'A Mk.2 Conveyor Belt carries 120 Coal/min, exactly the rated requirement for eight generators. A Mk.1 belt cannot carry the full block on one line, so split the supply or use fewer generators. One Miner Mk.2 on a Normal node produces 120 Coal/min at 100% clock in the Planner data. Check the actual node purity and miner clock in your own build.',
        'Three Water Extractors (120 m³/min each) provide 360 m³/min. A single Mk.1 Pipeline is limited to 300 m³/min, so one Mk.1 line is not enough for the full block. Use one Mk.2 Pipeline (up to 600 m³/min), or split Mk.1 pipe runs and feed the generators at multiple points. Check head lift too; add powered pipeline pumps when the water must rise beyond the extractor’s available lift.',
      ],
    },
    {
      heading: 'Bring fuel and water online with temporary power',
      illustration: {
        src: '/article-images/coal-power-startup-generators-presskit-2020.webp',
        alt: 'A general in-game Satisfactory scene with coal generators and a conveyor. This is an official 2020 Press Kit image, not the article’s startup sequence or generator count.',
        caption: 'A coal-power scene from the official 2020 Press Kit. It does not show the temporary-power startup order, a specific number of generators or the calculations in this guide.',
        creditLinks: [
          { label: 'Official Satisfactory Press & Content Creators page', href: 'https://www.satisfactorygame.com/press/' },
          { label: 'Original image (official Press Kit)', href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view' },
        ],
      },
      paragraphs: [
        'Before the coal generators can supply the plant, power the Water Extractors and Miner from a temporary source such as Biomass Burners. Connect the coal belt and water pipes to the generators. Check that fuel reaches the generators and water is flowing before connecting their power output to the factory grid. A conveyor manifold can take time to fill all the way to its last machines, so check the far end after the plant has run for a while as well as during startup.',
        'Keeping the supply machines on a separate power circuit from the factory makes recovery easier: a factory breaker trip does not also stop the Miner and Water Extractors. In an eight-generator example supplied by one Miner Mk.2, three Water Extractors draw 60 MW and the Miner draws 15 MW, for 75 MW of rated support load. Include this support power, along with the generators’ own draw, when estimating usable power.',
      ],
    },
    {
      heading: 'Separate a grid trip from a supply problem',
      paragraphs: [
        'If the whole grid trips its breaker, first check whether connected demand exceeded the available generation capacity. If the generators remain online but output is unstable, inspect the coal belt and the water system separately: confirm Coal reaches the end of the belt, check pipe flow and elevation, and make sure no Mk.1 pipe segment is carrying more than its 300 m³/min limit.',
        'For easier diagnosis, stabilize the Miner, Extractors and generators before adding the factory load. After recovery, reconnect factory demand in stages. If adding a load trips the breaker, generation capacity is too low for that load; if the system stops without adding demand, investigate fuel or water delivery.',
      ],
    },
    {
      heading: 'Read planner output as rated capacity',
      paragraphs: [
        'In the Planner, enable Coal-Powered Generators, choose the allowed fuels and enter a target MW. Enabling other fuels also exposes the Sulfur or Petroleum Coke production steps in the material balance. Generator counts are rounded to whole units at 100% clock, so a 100 MW target selects two generators with 150 MW of capacity and lists 30 Coal/min plus 90 m³/min of Water. Those are the inputs for two generators at 100% clock. To set them to 100 MW total in game, manually underclock each to 66⅔%; together they then use 20 Coal/min and 60 m³/min of Water. Grid demand alone does not reduce generator output.',
        'The Planner’s “cover factory power draw” constraint includes manufacturing buildings but not Miners or Water Extractors. Add the extraction power shown in the results separately. Biomass Burners are the exception that scale output to power demand. Coal generators run at their configured clock, and if available capacity is too low for demand, the breaker trips.',
      ],
    },
  ],
  references: {
    heading: 'Data and references',
    links: [
      {
        label: 'Official Satisfactory Press & Content Creators / Press Kit',
        href: 'https://www.satisfactorygame.com/press/',
      },
      {
        label: 'Official press-kit screenshot: coal.jpg (2020)',
        href: 'https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view',
      },
      {
        label: 'Satisfactory Wiki: Coal-Powered Generator',
        href: 'https://satisfactory.wiki.gg/wiki/Coal_generator',
      },
      {
        label: 'Satisfactory Wiki: Power',
        href: 'https://satisfactory.wiki.gg/wiki/Electricity',
      },
      {
        label: 'Official Satisfactory Update 4 announcement (2021)',
        href: 'https://store.steampowered.com/news/posts/?appids=526870&enddate=1624027272&feed=steam_community_announcements',
      },
      {
        label: 'Planner game-data provenance and version notes',
        href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md',
      },
      {
        label: 'Coal Power Tutorial — Satisfactory Guru (startup and pipe-layout comparison)',
        href: 'https://satisfactory.guru/articles/read/index/id/6/name/Coal%2BPower%2BTutorial',
      },
    ],
  },
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_CompactedCoal_C',
    'Desc_Sulfur_C',
    'Desc_PetroleumCoke_C',
    'Desc_HeavyOilResidue_C',
  ],
  relatedArticleSlugs: ['power-generation-planning', 'oil-products-basics', 'turbofuel-power'],
  cta: {
    kind: 'item',
    label: 'Open a plan for 50 Compacted Coal/min (enough for seven generators)',
    itemId: 'Desc_CompactedCoal_C',
    ratePerMin: 50,
  },
} as const satisfies HandwrittenArticle
