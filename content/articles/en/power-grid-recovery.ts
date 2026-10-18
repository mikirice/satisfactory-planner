import type { HandwrittenArticle } from '../types.ts'

export const powerGridRecoveryArticleEn = {
  slug: 'power-grid-recovery',
  title: 'Recovering a Tripped Power Grid — Restore Loads in Stages',
  description:
    'Separate generation, support inputs, and factory loads after a grid trip. Review how priority switches and storage fit into a recovery check.',
  publishedDate: '2026-10-17',
  versionNotice:
    'Planner item data is based on 1.1.x; changes in Update 1.2 have not been checked. Priority switch and storage details include the current Official Wiki index.',
  sections: [
    {
      heading: 'Record the outage and the last change',
      paragraphs: [
        'When a power fuse trips, record the grid display, affected sections, and equipment added or reconnected just before the outage. Check generation, consumption, maximum consumption, and each generator’s fuel, water, or raw-material inputs separately. Maximum consumption alone does not identify the cause.',
        'A generation shortfall and a missing fuel or water supply are different possibilities. Preserve any warning text shown in game so you can compare it with the recovered state.',
      ],
    },
    {
      heading: 'Read the Priority Power Switch shedding order',
      paragraphs: [
        'Coffee Stain’s Update 8 announcement describes Priority Power Switches shedding circuit sections in their configured order when a power failure is imminent, until the remaining grid’s demand fits supply. The current Official Satisfactory Wiki index says undefined sections are shed first, followed by Groups 8 down to 1. It also recommends putting generation and fuel production in Group 1.',
        'A switch does not create additional generation. Check which side of the circuit powers generation, mining, fuel production, and water supply. Assigning priority groups alone does not guarantee that support equipment will stay powered.',
      ],
    },
    {
      heading: 'Check generation inputs before restoring loads',
      paragraphs: [
        'Inspect generator fuel, raw materials, and water; check for blocked outputs; and trace the electrical connections for generation and support equipment. If mining, pumps, or fuel production stopped because they lost power, the correct recovery order depends on the generation type and the wiring. Restarting the generator alone may not be enough.',
        'After the grid is restored, keep deferrable sections disconnected while checking generation and essential support equipment. Then reconnect one section at a time and record the last section added if the grid trips again. Which support equipment to restore first depends on the generation setup and wiring.',
      ],
    },
    {
      heading: 'Treat Power Storage as a finite buffer',
      paragraphs: [
        'The current Official Satisfactory Wiki index lists 100 MWh capacity, a 100 MW maximum charge rate, and unlimited maximum discharge for each Power Storage. Storage can cover a temporary shortfall, but its stored energy is finite. If demand continues to exceed generation, the stored charge falls and cannot resolve the persistent shortage.',
        'Check its charge before the outage, its connection to the affected sections, and how the display changes after generation returns. Capacity alone does not establish a fixed recovery window or explain how a fuse can be reset.',
      ],
    },
  ],
  references: {
    heading: 'Sources for outages and power management',
    links: [
      { label: 'Coffee Stain Studios: Update 8 Power Switch notes', href: 'https://store.steampowered.com/news/app/526870/view/3690183765419759383' },
      { label: 'Official Satisfactory Wiki: Priority Power Switch', href: 'https://satisfactory.wiki.gg/wiki/Priority_Power_Switch' },
      { label: 'Official Satisfactory Wiki: Power Storage', href: 'https://satisfactory.wiki.gg/wiki/Power_Storage' },
      { label: 'Coffee Stain Studios developer Q&A about resetting a tripped fuse', href: 'https://www.youtube.com/watch?v=Nq7EvudDLLw' },
      { label: 'Update 8 developer stream: Power Towers and Priority Switches', href: 'https://www.youtube.com/watch?v=PR5Tc9g7YDE&t=893s' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['power-generation-planning', 'coal-power-startup', 'power-connector-daisy-chain'],
  cta: {
    kind: 'item',
    label: 'Plan a Coal supply line if fuel input is the cause',
    itemId: 'Desc_Coal_C',
  },
} as const satisfies HandwrittenArticle
