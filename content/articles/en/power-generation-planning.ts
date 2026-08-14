import type { HandwrittenArticle } from '../types.ts'

export const powerGenerationPlanningArticleEn = {
  slug: 'power-generation-planning',
  title: 'Planning Power — From Coal to Fuel to Nuclear, Fuel Chain Included',
  description:
    'Compare the output and fuel consumption of coal, fuel and nuclear generators, and plan power together with the mining, refining, water supply and waste each option brings.',
  sections: [
    {
      heading: 'Plan the fuel chain, not just the generators',
      paragraphs: [
        'A power plan is more than a number of generators: it has to include the production that keeps their fuel arriving every minute. In this tool you pick the generator types and the fuels they are allowed to burn, enter a target in MW, and the extraction, refining and processing of that fuel are solved inside the same item balance as the rest of the factory.',
      ],
    },
    {
      heading: 'Start with coal power',
      paragraphs: [
        'A Coal-Powered Generator produces 75 MW. Burning Coal, one generator at 100% consumes 15 Coal per minute and 45 m³ of Water per minute. Work out the belt throughput for the coal first, then the water split across the generator row, and leave headroom in both before the line of generators. Compacted Coal and Petroleum Coke are options too, but each one adds ingredients and production steps, so allowing only the fuel you actually intend to burn keeps the result easy to read.',
      ],
    },
    {
      heading: 'Move up to fuel generators',
      paragraphs: [
        'A Fuel-Powered Generator produces 250 MW. It consumes 20 m³ per minute of Fuel, or 7.5 m³ per minute of Turbofuel. Both need oil refining upstream. A Diluted Fuel layout takes Heavy Oil Residue out of Crude Oil and blends it with Water to stretch it into Fuel before the generators. A Turbofuel layout merges Fuel with Compacted Coal made from Coal and Sulfur. Size the pipes for the flow, but also count the Refineries and Blenders themselves as load on the plant they are feeding.',
      ],
    },
    {
      heading: 'Design nuclear power and reprocessing',
      paragraphs: [
        'A Nuclear Power Plant produces 2,500 MW. On Uranium Fuel Rod it consumes 0.2 rods per minute and 240 m³ of Water per minute, and emits 10 Uranium Waste per minute. The output is enormous, but it demands multi-stage rod production, a serious water supply, and either storage or reprocessing for the waste. Plutonium Fuel Rod and Ficsonium Fuel Rod can be selected as well, and the reprocessing line that reaches the latter is long. Because a stalled stage backs waste up immediately, put a buffer in front of each stage and confirm the reprocessing side can accept material before the reactors start.',
      ],
    },
    {
      heading: 'Know what the self-sufficiency setting covers',
      paragraphs: [
        'In the settings, switch on a generator type and then select at least one fuel for it. Enabling the option to cover the factory’s own consumption solves for power that also carries the extra production buildings the fuel chain adds. That constraint uses production power at a 100% clock equivalent, so it does not guarantee the real draw after overclocking, and extraction power is left out of it entirely. After solving, check the clock-adjusted power and the mining power in the summary and keep a margin above their sum. Generators themselves are never overclocked; when the machine count is rounded up, the remainder is shown as partial load.',
        'Open the diluted fuel power template first, see how fuel flow, building count and total output line up, and then change it to your own target in MW.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_Coal_C',
    'Desc_Water_C',
    'Desc_LiquidFuel_C',
    'Desc_LiquidTurboFuel_C',
    'Desc_NuclearFuelRod_C',
    'Desc_NuclearWaste_C',
  ],
  cta: {
    kind: 'sample',
    label: 'Open the 2,500 MW diluted fuel power plan',
    sampleId: 'diluted-fuel-power',
  },
} as const satisfies HandwrittenArticle
