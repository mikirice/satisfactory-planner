import type { HandwrittenArticle } from '../types.ts'

export const hardDriveMamWorkflowArticleEn = {
  slug: 'hard-drive-mam-workflow',
  title: 'Hard Drive Search — From Recovery to MAM Research',
  description:
    'Separate crash-site recovery, Hard Drive analysis in the MAM, and research-tree projects while keeping alternate-recipe rankings out of this workflow guide.',
  publishedDate: '2026-10-17',
  versionNotice:
    'Planner item data is based on 1.1.x; changes in Update 1.2 have not been checked. The 1.0 announcement and the 2026-updated Official Wiki index are cited separately.',
  sections: [
    {
      heading: 'Separate exploration, recovery, and MAM actions',
      paragraphs: [
        'Recovering a Hard Drive from a crash site, analyzing it in the MAM to obtain recipe options, and advancing a research-tree project are related but distinct tasks. This guide follows the path from exploration to holding or unlocking an option; it does not rank recipes.',
        'At a crash site, inspect the crashed container and read any access condition shown in the current game. If you cannot meet it yet, record the location and return later. This article does not guess at a complete coordinate list, required-item list, or current Object Scanner unlock and guidance sequence.',
      ],
    },
    {
      heading: 'Drive results can be selected later',
      paragraphs: [
        'Coffee Stain’s Satisfactory 1.0 announcement records a change from three options to two, one re-roll for each Drive, and the ability to scan a Drive and defer choosing from its results in a separate Hard Drive Library tab. The Official Satisfactory Wiki index updated in 2026 also says scanned results are stored in the Library and each Drive’s options can be re-rolled once.',
        'Do not treat a visible candidate as if its recipe were already unlocked and available in the factory. The 1.0 announcement and the 2026-updated Official Wiki describe deferred results as available later in the Hard Drive Library. This guide does not name a particular button.',
      ],
    },
    {
      heading: 'Keep MAM research separate from Drive analysis',
      paragraphs: [
        'The MAM has a Hard Drive analysis workflow and separate research projects. Hard Drive, MAM, alternate recipe, and re-roll are used here to distinguish those functions; they are not claims about localized tab or button labels.',
        'If a Drive cannot be scanned, check that it is in the inventory and read the condition or warning displayed by the current game. Record the wording. Do not copy old video or map requirements as current universal conditions without checking them.',
      ],
    },
    {
      heading: 'Use only unlocked recipes in the Planner',
      paragraphs: [
        'When planning in Satisfactory Planner, select only alternate recipes available in your save. The Planner’s bundled game data targets 1.1.x; values should be checked separately against later game updates. For comparison criteria, see [How to Compare Alternate Recipes](https://satisfactory-planner.net/en/articles/alternate-recipe-metrics/). For material, building, and power trade-offs, see [Strong Alternate Recipes](https://satisfactory-planner.net/en/articles/strong-alternate-recipes/).',
        'This guide covers exploration, recovery, and the MAM workflow. It does not rank recipes, list every crash-site coordinate, or state a current analysis duration or selection effect.',
      ],
    },
  ],
  references: {
    heading: 'Sources for Drives and MAM',
    links: [
      { label: 'Coffee Stain Studios: Satisfactory 1.0 announcement', href: 'https://store.steampowered.com/news/posts/?appids=526870&enddate=1726766891&feed=steam_community_announcements' },
      { label: 'Official Satisfactory Wiki: Hard Drive', href: 'https://satisfactory.wiki.gg/wiki/Hard_Drive' },
      { label: 'Official Satisfactory Wiki: Crash Site', href: 'https://satisfactory.wiki.gg/wiki/Crash_Site' },
      { label: 'Official Satisfactory Wiki: MAM', href: 'https://satisfactory.wiki.gg/wiki/MAM' },
      { label: 'Satisfactory Press & Content Creators', href: 'https://www.satisfactorygame.com/press/' },
    ],
  },
  relatedItemIds: ['Desc_HardDrive_C'],
  relatedArticleSlugs: ['alternate-recipe-metrics', 'strong-alternate-recipes', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Plan production using an unlocked recipe',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
