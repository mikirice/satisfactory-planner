import type { HandwrittenArticle } from '../types.ts'

export const powerGenerationPlanningArticleEn = {
  slug: 'power-generation-planning',
  title: 'Planning Power — Rated Output vs. Power Left for the Factory',
  description:
    'Compare rated coal, fuel and nuclear output, subtract the power used to supply them, learn why Biomass Burners follow demand, and read the planner’s whole-generator estimates.',
  publishedDate: '2026-10-17',
  sections: [
    {
      heading: 'Rated output and usable factory power are different numbers',
      paragraphs: [
        'The MW on a generator is its output at the configured clock. To plan a power plant, first total its rated output (gross), then subtract the power used by miners, extractors and fuel-processing machines to estimate what remains for the factory (net). All other connected consumers also draw from the grid. A blocked belt or pipe, a stopped machine or a disconnected power line can keep the plant below its calculated output.',
        'The table gives per-generator reference rates at 100% clock from the planner’s Satisfactory 1.1.x data. Compare fuel and supplemental-resource needs along with the output.',
      ],
      tables: [
        {
          caption: 'Reference rates per generator at 100% clock (Planner data: Satisfactory 1.1.x)',
          headers: ['Type and fuel', 'Rated output', 'Fuel consumed', 'Supplement / byproduct'],
          rows: [
            ['Coal-Powered Generator: Coal', '75 MW', '15 Coal/min', '45 m³ Water/min'],
            ['Fuel-Powered Generator: Fuel', '250 MW', '20 m³ Fuel/min', '—'],
            ['Fuel-Powered Generator: Turbofuel', '250 MW', '7.5 m³ Turbofuel/min', '—'],
            ['Nuclear Power Plant: Uranium Fuel Rod', '2,500 MW', '0.2 rods/min', '240 m³ Water/min; 10 Uranium Waste/min'],
          ],
        },
      ],
    },
    {
      heading: 'Subtract the supply load in an eight-generator coal example',
      paragraphs: [
        'Eight Coal-Powered Generators at 100% produce 8 × 75 = 600 MW gross and need 120 Coal/min plus 360 m³ Water/min. If one Miner Mk.2 on a Normal Coal node supplies the Coal (15 MW) and three Water Extractors supply the water (60 MW combined), the supply equipment draws about 75 MW. That leaves 600 − 75 = 525 MW for the factory before pipeline pumps, extra fuel processing or factory machines are counted.',
        'The supply equipment needs power before the coal plant can start. Use a temporary source such as Biomass Burners to run the Miner and Water Extractors, then verify Coal and Water reach the generators before connecting factory loads. Keeping the supply equipment on a separate circuit makes recovery easier: a factory breaker trip does not also stop the miners and extractors.',
        'When something fails, separate a generator shutdown from a breaker trip caused by demand exceeding capacity. If generators stop, check the far end of the fuel belt, water flow and elevation. If the breaker trips, reconnect loads in stages and find what takes total demand above available capacity. A Mk.1 Pipeline is limited to 300 m³/min, so one line cannot carry the 360 m³/min this example needs.',
      ],
    },
    {
      heading: 'Include the fuel chain and waste handling',
      paragraphs: [
        'A Fuel-Powered Generator produces 250 MW, but the fuel must keep flowing from Crude Oil extraction and refining. Diluted Fuel uses Heavy Oil Residue and Water; Turbofuel adds a Sulfur and Coal processing chain. Subtract the Refineries, Blenders and other processors from gross output when estimating net power. Nuclear power also needs several fuel-rod steps and a reliable Water supply. Uranium Waste must have a storage or processing destination; a blocked downstream stage can stop the plant.',
        'Generator clocking is linear in game: output and fuel use change by the same proportion. For example, two Coal-Powered Generators set to 66⅔% produce 100 MW combined and use 20 Coal/min plus 60 m³ Water/min. Coal, Fuel and Nuclear generators do not automatically lower their clock because grid demand is low.',
      ],
    },
    {
      heading: 'Biomass Burners follow demand',
      paragraphs: [
        'Biomass Burners are the exception: they generate only the power the grid needs, and their fuel use falls when demand falls. That makes them useful in the early game, when fuel is added by hand, but they cannot automatically replenish fuel and cannot cover loads beyond their available capacity. Do not estimate them as if they continuously consumed fuel at rated output.',
        'Geothermal Generators are also present in the game, but their output varies. They are not among the generator types available in this planner, which models Coal-Powered Generators, Fuel-Powered Generators and Nuclear Power Plants.',
      ],
    },
    {
      heading: 'Build a target in the planner',
      paragraphs: [
        'To use power planning, enable a generator type in Settings, select the fuel you intend to burn, then enter a target in MW. If several fuels are allowed, the solver may choose among them; restricting the selection to your planned fuel keeps the steps easier to interpret. The “cover factory power draw” option includes manufacturing buildings that produce the fuel, but it excludes extraction equipment such as Miners and Water Extractors. Its constraint uses manufacturing power at a 100% clock equivalent, so it does not guarantee the real draw after overclocking.',
        'The planner estimates whole generators at 100% clock. With Coal selected and a 100 MW target, it returns two generators, 150 MW rated output, 30 Coal/min and 90 m³ Water/min. Those are the inputs for two units running at 100%. To make 100 MW in game, manually set both to 66⅔%; their combined fuel and water rates then fall to 20 Coal/min and 60 m³/min. Subtract extraction power and fuel-processing power shown elsewhere in the results before deciding how much capacity is available to the factory.',
        'Start with the Diluted Fuel Power sample and compare its fuel rates, building count and total output in the results. Then change the generator, allowed fuel and target. The shared plan solves recipe and material balances; it does not simulate wiring, startup order, pipe pressure or buffer fill times.',
      ],
    },
  ],
  references: {
    heading: 'Sources',
    links: [
      { label: 'Satisfactory Wiki — Coal-Powered Generator', href: 'https://satisfactory.wiki.gg/wiki/Coal-Powered_Generator' },
      { label: 'Satisfactory Wiki — Fuel-Powered Generator', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
      { label: 'Satisfactory Wiki — Nuclear Power Plant', href: 'https://satisfactory.wiki.gg/wiki/Nuclear_Power_Plant' },
      { label: 'Satisfactory Wiki — Biomass Burner', href: 'https://satisfactory.wiki.gg/wiki/Biomass_Burner' },
      { label: 'Satisfactory Wiki — Clock speed', href: 'https://satisfactory.wiki.gg/wiki/Clock_speed' },
      { label: 'Planner game-data source and version notes', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
    ],
  },
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_LiquidFuel_C',
    'Desc_LiquidTurboFuel_C',
    'Desc_NuclearFuelRod_C',
    'Desc_NuclearWaste_C',
  ],
  relatedArticleSlugs: ['coal-power-startup', 'diluted-fuel-power', 'turbofuel-power', 'clock-and-efficiency'],
  cta: {
    kind: 'sample',
    label: 'Open the 2,500 MW Diluted Fuel Power plan and inspect its fuel, buildings and output',
    sampleId: 'diluted-fuel-power',
  },
} as const satisfies HandwrittenArticle
