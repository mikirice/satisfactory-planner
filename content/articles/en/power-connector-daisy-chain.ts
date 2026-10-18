import type { HandwrittenArticle } from '../types.ts'

export const powerConnectorDaisyChainArticleEn = {
  slug: 'power-connector-daisy-chain',
  publishedDate: '2026-10-17',
  title: 'Power Connector Daisy Chaining: An Introduction',
  description:
    'Unlock Update 1.2’s Power Connector Daisy Chaining and learn the basics of connecting buildings directly. See how wiring differs from generation planning.',
  versionNotice:
    'This guide covers the Satisfactory Update 1.2 Power Connector Daisy Chaining feature. Unlock requirements and the basic behavior come from the developer announcement. It does not claim an undocumented range, building exception, or connection limit.',
  sections: [
    {
      heading: 'Unlock it with Caterium research',
      paragraphs: [
        'Power Connector Daisy Chaining is a Caterium MAM research added in Update 1.2. The developer lists 15 Computers, 50 High-Speed Connectors, and 500 Quickwire as its research costs. After unlocking it, a building can have two power connections, allowing buildings to connect directly and pass power as part of the grid.',
        'This is an additional wiring option, not the only correct replacement for poles. It can help when you want fewer poles around a row of machines or want to connect nearby buildings directly. The developer announcement does not describe it as changing power calculations, generation, or a machine’s power draw.',
      ],
      tables: [
        {
          caption: 'Caterium research costs listed in the developer announcement',
          headers: ['Item', 'Quantity'],
          rows: [
            ['Computer', '15'],
            ['High-Speed Connector', '50'],
            ['Quickwire', '500'],
          ],
        },
      ],
    },
    {
      heading: 'Build a short chain of buildings first',
      paragraphs: [
        'Start with a Power Pole connected to the grid and one building. Use the building’s second connection point to continue the wire to another building, checking the in-game connector indicators as you connect it. A building whose two connection points are already in use cannot serve as another link in the chain, so plan the number of buildings and branches before extending the wiring.',
        'Add a third building and check that the buildings remain connected to the same grid and that the generation and consumption display matches your plan. In a branch-heavy or long line, keeping a separate pole feed can make the network easier to understand after a layout change or disconnection. This is a way to keep wiring legible; it is not a special failure guarantee.',
      ],
    },
    {
      heading: 'Do not infer limits the announcement does not give',
      paragraphs: [
        'The Update 1.2 announcement describes two power connections and direct building-to-building connections as part of the grid. It does not give a maximum connection distance, building-specific exceptions, a performance value for long chains, or special failure behavior. Do not claim that a chain can run indefinitely or without any limit; inspect the connection indicators and grid in the locations you need.',
        'Daisy chaining is a wiring option. Planner’s generation guides calculate generator output and recipe inputs, but they do not simulate wires, pole placement, branch layout, or this connection feature. Treat the generation plan and the building wiring diagram as separate tasks.',
      ],
    },
    {
      heading: 'How this differs from the existing power guides',
      paragraphs: [
        'The Power Generation Planning guide compares generator output and fuels; the Coal Power Startup guide covers supply steps for starting generators. This page focuses on Update 1.2 building-to-building power connections and their research costs, without adding unpublished wiring-distance or capacity limits.',
      ],
    },
  ],
  references: {
    heading: 'Official specifications and related guide',
    links: [
      { label: 'Developer: Satisfactory 1.2 Update out now! — Daisy chaining', href: 'https://store.steampowered.com/news/app/526870/view/695387676933621085' },
      { label: 'Planner Power Generation Planning guide', href: '/en/articles/power-generation-planning/' },
      { label: 'Official developer announcements (for the latest patch)', href: 'https://steamcommunity.com/app/526870/announcements/?l=english' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['power-generation-planning', 'coal-power-startup', 'factory-floor-area'],
  cta: {
    kind: 'sample',
    label: 'Open the Diluted Fuel Power plan',
    sampleId: 'diluted-fuel-power',
  },
} as const satisfies HandwrittenArticle
