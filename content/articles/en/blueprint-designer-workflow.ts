import type { HandwrittenArticle } from '../types.ts'

export const blueprintDesignerWorkflowArticleEn = {
  slug: 'blueprint-designer-workflow',
  title: 'Blueprint Designer — Save and Reuse Factory Modules',
  description:
    'Check Designer dimensions, build a repeatable module, and understand the save-and-place workflow using version-scoped developer notes and the current Official Satisfactory Wiki.',
  publishedDate: '2026-10-17',
  versionNotice:
    'Planner item data is based on 1.1.x; changes in Update 1.2 have not been checked. Designer sizes and unlock tiers are values recorded in the Update 1.0 announcement.',
  sections: [
    {
      heading: 'Start with a repeatable unit',
      paragraphs: [
        'The Blueprint Designer saves a group of buildables as a Blueprint you can place elsewhere. This is separate from Satisfactory Planner production calculations and floor-area estimates. Start with a compact module whose input side, equipment, and output side can be oriented consistently.',
        'Choose the input and output sides, the direction used to align copies, and room for belts or pipes you will connect later. This is a layout recommendation for easier reuse, not a game requirement.',
      ],
    },
    {
      heading: 'Check the Designer Mark and boundary',
      paragraphs: [
        'Coffee Stain Studios’ Update 1.0 announcement records the Mk.1 Designer at Tier 4 with a 32 m boundary, Mk.2 at Tier 6 with a 40 m boundary, and Mk.3 at Tier 9 with a 48 m boundary. The table shows the cubic build boundary on each axis. It is not the exterior footprint of the Designer building.',
      ],
      tables: [
        {
          caption: 'Blueprint Designer boundaries listed in the Update 1.0 announcement',
          headers: ['Designer', 'Unlock', 'Build boundary'],
          rows: [
            ['Mk.1', 'Tier 4 — FICSIT Blueprints', '32 × 32 × 32 m'],
            ['Mk.2', 'Tier 6 — FICSIT Blueprints Mk.2', '40 × 40 × 40 m'],
            ['Mk.3', 'Tier 9 — FICSIT Blueprints Mk.3', '48 × 48 × 48 m'],
          ],
        },
      ],
    },
    {
      heading: 'Save a Blueprint and place it in the world',
      paragraphs: [
        'The Official Satisfactory Wiki says buildables must fit inside the Designer boundary before you save a Blueprint from the attached terminal. Listed save details include a name, description, Build Menu category and subcategory, icon, and background color.',
        'After saving, select the Blueprint from the Build Menu and inspect the placement hologram orientation and surrounding space before placing it. This guide describes the general workflow without naming a particular button or input-device control.',
      ],
    },
    {
      heading: 'Keep editing separate from Auto Connect',
      paragraphs: [
        'The Wiki says a Blueprint made in a Mk.1 Designer cannot be individually edited in a Mk.2 or Mk.3 Designer. Begin edits in the same Mark that created the design, and verify whether saving overwrites the original or allows a separate name. The Wiki does not establish every overwrite, copy, or migration condition.',
        'Auto Connect is a separate placement feature for candidate links between transport endpoints. For that workflow, see the [Blueprint Auto Connect guide](https://satisfactory-planner.net/en/articles/blueprint-auto-connect/).',
      ],
    },
  ],
  references: {
    heading: 'Sources for dimensions, features, and terminology',
    links: [
      { label: 'Coffee Stain Studios: Satisfactory 1.0 announcement', href: 'https://store.steampowered.com/news/posts/?enddate=1725981659&feed=steam_community_announcements' },
      { label: 'Official Satisfactory Wiki: Blueprint Designer', href: 'https://satisfactory.wiki.gg/wiki/Blueprint_Designer' },
      { label: 'Official Satisfactory Wiki: Blueprint', href: 'https://satisfactory.wiki.gg/wiki/Blueprint' },
      { label: 'Coffee Stain Studios: Update 1.2.4.0 fixes', href: 'https://steamcommunity.com/games/526870/announcements/detail/716786751176181501' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['blueprint-auto-connect', 'factory-floor-area', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Plan a product for your reusable factory module',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
