import type { HandwrittenArticle } from '../types.ts'

export const vehiclePathsArticleEn = {
  slug: 'vehicle-paths',
  publishedDate: '2026-10-17',
  title: 'Build a New Vehicle Route with Vehicle Paths',
  description:
    'Learn the basic Update 1.2 Vehicle Path workflow and how it differs from legacy automated routes, based on developer instructions and the relevant 1.2.4.0 fixes.',
  versionNotice:
    'This guide covers the Satisfactory Update 1.2 Vehicle Path feature. The basic workflow comes from the developer announcement, and path-related corrections come from the official 1.2.4.0 notes. The October 12, 2026 v1.2.4.1 announcement does not list a change to this feature; follow the current game if its interface or behavior differs.',
  sections: [
    {
      heading: 'Keep new Vehicle Paths distinct from legacy routes',
      paragraphs: [
        'Update 1.2 rebuilt vehicle automation around a new Vehicle Path system. The developer says existing automated routes are expected to keep working. Do not mix the old route-recording process with the new path-placement workflow; first check which system a route uses before adding a section.',
        'For the new system, choose Vehicle Path from the Transport tab in the Build Menu, place it with the Build Gun, and place a vehicle on the path. Straight build mode is available for long straight sections, and each vehicle type has its own path option. Enter a vehicle and open the Vehicle Menu to inspect available Vehicle Stations and Routes.',
      ],
    },
    {
      heading: 'Build and check a short section first',
      paragraphs: [
        '1. From Transport, select the path for the vehicle type you plan to use, then place a short section from the start toward the destination. Confirm the connections before extending the system across a long route.',
        '2. Use Straight build mode for long straight sections. For turns and joins, do not infer that the path is traversable from its appearance alone; place a vehicle and watch it drive. The official Update 1.2.4.0 notes record fixes for paths through Gates, Blueprint path auto-connect indicators, and the Autopilot display for vehicles waiting in traffic.',
        '3. Enter the vehicle and use its Vehicle Menu to check the available Stations and Routes. Path colors can be changed under Options > User Interface to help distinguish routes. Use color as a visual aid; confirm stops with the Route display and by watching the vehicle run.',
      ],
    },
    {
      heading: 'Check before migrating a legacy route',
      paragraphs: [
        'The developer says pre-1.2 automated routes are expected to keep working. You do not need to remove a working legacy route all at once. Build a separate new path only where it is needed, verify arrival and return movement, and then expand the migration. The official announcement does not specify detailed restrictions for mixing old routes and new Paths, so this guide does not invent them.',
        'In the official announcement feed, v1.2.4.1 was posted on October 12, 2026 with audio, mod-compatibility, and crash fixes. The latest specific Vehicle Path fixes listed before that are in v1.2.4.0: Gates, Blueprint path alignment indicators, and waiting-vehicle Autopilot display. When diagnosing a route, check path joins and vehicle type, then any Gate or Blueprint section, and finally the Route display.',
      ],
    },
    {
      heading: 'Limits of this guide',
      paragraphs: [
        'This page covers the official basic placement workflow and changes named in the patch notes. It does not add undocumented maximum slopes, vehicle spacing, collision guarantees, or a junction shape that works for every vehicle. The Press Kit image is an early Update 1.2 path-placement scene; it is not a screenshot of the current interface or a step-by-step demonstration for the current build.',
      ],
    },
  ],
  references: {
    heading: 'Official workflow and patch history',
    links: [
      { label: 'Developer: Satisfactory 1.2 Update out now!', href: 'https://store.steampowered.com/news/app/526870/view/695387676933621085' },
      { label: 'Developer: 1.2 Update Fixes v1.2.4.0', href: 'https://store.steampowered.com/news/app/526870/view/716786751176181501' },
      { label: 'Official developer announcements (including v1.2.4.1)', href: 'https://steamcommunity.com/app/526870/announcements/?l=english' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['build-checklist-guide', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Check the machine count for the line you plan to transport',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
