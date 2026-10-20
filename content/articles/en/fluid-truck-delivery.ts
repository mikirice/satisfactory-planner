import type { HandwrittenArticle } from '../types.ts'

export const fluidTruckDeliveryArticleEn = {
  slug: 'fluid-truck-delivery',
  publishedDate: '2026-10-17',
  title: 'Plan Fluid Truck Buffers and Refill Intervals',
  description:
    'Plan around Update 1.2 Fluid Trucks and Stations without confusing storage capacity with delivery rate. Estimate a receiving buffer from demand and compare it with a pipeline route.',
  versionNotice:
    'This guide covers the official Satisfactory Update 1.2 specifications. Capacity and unlock timing come from the developer announcement; it does not claim a measured cycle time or delivery rate. If a newer patch changes the interface or behavior, follow the current game.',
  sections: [
    {
      heading: 'Separate capacity, demand, and cycle time',
      paragraphs: [
        'Fluid Trucks are an Update 1.2 option for moving liquids over distance. The developer announcement lists 3,200 m³ of internal capacity for both Fluid Trucks and Fluid Stations, unlocked with Logistics Mk.4 at Tier 5. That is storage volume; it does not mean 3,200 m³ per minute or a guaranteed delivery interval.',
        'Start by writing down the receiving factory’s demand per minute. If a full 3,200 m³ load serves equipment using 60 m³/min, the simple inventory conversion is 3,200 ÷ 60 = about 53.3 minutes. That describes one full buffer. Do not add the truck and station capacities and assume a single delivery of 6,400 m³. Track the truck, source station, destination station, and receiving tank as separate inventories.',
      ],
      tables: [
        {
          caption: 'Inventory conversion for a receiver using 60 m³/min',
          headers: ['Planning value', 'Calculation', 'How to read it'],
          rows: [
            ['Fluid Truck internal capacity', 'Official capacity', '3,200 m³'],
            ['Time one full load could cover', '3,200 ÷ 60', 'About 53.3 minutes'],
            ['Demand during a 20-minute gap', '60 × 20', '1,200 m³'],
          ],
        },
      ],
    },
    {
      heading: 'Estimate a receiving buffer from demand',
      paragraphs: [
        'Choose how long production should continue without a delivery, then multiply that interval by demand per minute. At 60 m³/min, a 20-minute gap represents 1,200 m³ of demand. That is a simple minimum conversion, so add room for variation in arrivals and the receiving pipe setup.',
        'If you need a route’s effective delivery rate, use the actual amount transferred per cycle and the cycle interval in the save you are planning. Dividing a truck’s capacity by cycle time is only an upper estimate if you have confirmed that every cycle starts full and delivers the whole load. Waiting, driving, traffic, refueling, and partial loads can change the result. Do not present a capacity-only calculation as a measured rate.',
      ],
    },
    {
      heading: 'Check a route that uses Fluid Stations',
      paragraphs: [
        'Update 1.2 also reworked vehicle Paths, and the new vehicle-path changes apply to Fluid Trucks. Once you build a route, check the source and receiving Stations, watch the truck travel, and observe whether the receiving buffer changes as expected. The official announcement does not establish a per-minute transfer rate, so this guide does not invent one from the interface or capacity.',
        'When comparing trucks with a pipeline, consider distance, pumps, terrain, receiver storage, vehicle and Station placement, and route upkeep. Planner can calculate production recipes and machine demand, but it does not simulate truck cycle time, Station transfer speed, or traffic. Treat vehicle scheduling and production planning as separate checks.',
      ],
    },
    {
      heading: 'How this guide differs from the packaged-fuel sample',
      paragraphs: [
        'The existing Packaged Diluted Fuel sample explains packaged-fuel production and fluid recipe balances. This guide focuses on the Update 1.2 Fluid Truck’s inventory, refill interval, and the distinction between capacity and throughput; it does not promise an unmeasured route performance.',
      ],
    },
  ],
  references: {
    heading: 'Official specifications and related reading',
    links: [
      { label: 'Developer: Satisfactory 1.2 Update out now!', href: 'https://store.steampowered.com/news/app/526870/view/695387676933621085' },
      { label: 'Developer: 1.2.4.0 fixes (fluid and vehicle corrections)', href: 'https://store.steampowered.com/news/app/526870/view/716786751176181501' },
      { label: 'Developer announcements on Steam (for the latest patch)', href: 'https://steamcommunity.com/app/526870/announcements/?l=english' },
    ],
  },
  relatedItemIds: ['Desc_Water_C', 'Desc_LiquidFuel_C'],
  relatedArticleSlugs: ['packaged-nitrogen-empty-fluid-tank-circulation-planning', 'production-planning-tutorial'],
} as const satisfies HandwrittenArticle
