import type { HandwrittenArticle } from '../types.ts'

export const trainSignalsGuideArticleEn = {
  slug: 'train-signals-guide',
  publishedDate: '2026-10-17',
  title: 'Use Signals on Shared Factory Railways',
  description:
    'Learn what Block and Path Signals do, how direction and block previews help, and how to diagnose common placement errors, using the developer announcement and Official Satisfactory Wiki.',
  versionNotice:
    'This Update 1.2 guide distinguishes the signal basics in Coffee Stain’s Update 5 announcement from the current Train Signals entry on the Official Satisfactory Wiki. The Japanese page uses explanatory translations for Block Signal and Path Signal, not verified Japanese UI names.',
  sections: [
    {
      heading: 'Signals divide track shared by trains',
      paragraphs: [
        'Signals matter for a different reason once multiple trains share track. Coffee Stain’s Update 5 announcement describes a Block Signal as dividing the railway into sections that only one train can occupy at a time. The same announcement warns that trains on shared track can collide and derail if signals are not used.',
        'A block is the track section between signals. According to the Official Satisfactory Wiki, a block counts as occupied when any part of a train is inside it. The placement preview colors the blocks, so you can check which branches and rails the game treats as one section before you finish the layout. If the colors do not match your expectation, inspect the rail connections and crossings before adding more signals.',
      ],
    },
    {
      heading: 'Start with Block Signals for simple waiting sections',
      paragraphs: [
        'On a simple shared route, begin by using Block Signals to divide the approach and the next section. An occupied block ahead makes signals entering that block red; an empty block lets a train proceed. Block Signals are also useful for separating stations and straight waiting sections. Signals are directional: when a railway runs both ways, place the signals needed for each direction and check their arrows.',
        'Plan blocks around junctions and places where trains need to wait instead of repeating a fixed distance. The Official Satisfactory Wiki does not give one ideal block length for every railway. Train length is one factor to consider, but a particular spacing does not guarantee that a route will avoid collisions or congestion. Test a short section with the trains you intend to run and observe how much track each train occupies.',
      ],
    },
    {
      heading: 'Consider Path Signals at route conflicts',
      paragraphs: [
        'A Path Signal uses route reservation through a block. The Update 5 announcement describes reserving a path through one or more blocks to support safe multidirectional intersections. The Official Satisfactory Wiki explains that trains can enter the same junction block at the same time when their reserved paths do not intersect, while a train cannot enter when it cannot reserve a path all the way through.',
        'This does not mean every junction needs a Path Signal. A simple route where trains do not conflict may work with Block Signals alone. When route reservation helps at a busy or complex junction, keep the entry signals for that block the same type. The Wiki calls the basic arrangement “path in, block out”: Path Signals at the entrances and Block Signals at the exits. A Train Station cannot be inside a Path Signal block, so check the station position in the block preview as well.',
      ],
    },
    {
      heading: 'Diagnose red and error states',
      paragraphs: [
        'If an automated train stops, check signal direction, occupancy of the next block, and whether the route continues to another signal. For an error state, verify that the signal is connected to track, that the block has an exit signal, and that its entry signals do not mix Block and Path types. A station inside a Path Signal block also causes an error.',
        'A “Signal loops into itself” message does not always mean there is an obvious loop in the track. The Official Satisfactory Wiki lists nearby unconnected rails being treated as part of the same block as one possible cause. Use the colored block preview to find what the signal actually divides, then inspect close rails and crossings. Understanding the block boundary is more useful than continuing to add signals blindly.',
        'This guide explains signal roles and troubleshooting checks; it does not prescribe a station layout, promise a collision-free design, or provide one junction diagram for every network. The Press Kit cover shows a train, railway, and signal, but it is not a captured layout from this guide. Use the current game’s block preview and signal state when building.',
      ],
    },
  ],
  references: {
    heading: 'Signal behavior and placement references',
    links: [
      { label: 'Coffee Stain Studios: Update 5 announcement — Signaling System', href: 'https://store.steampowered.com/news/posts/?appgroupname=Satisfactory&appids=526870&enddate=1638304636&feed=steam_community_announcements' },
      { label: 'Official Satisfactory Wiki: Train Signals', href: 'https://satisfactory.wiki.gg/wiki/Train_Signals' },
      { label: 'Example player question about Block and Path Signals', href: 'https://www.reddit.com/r/SatisfactoryGame/comments/1qh18ms/can_someone_explain_path_block_signals/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['vehicle-paths', 'production-planning-tutorial'],
  cta: {
    kind: 'sample',
    label: 'Check machine counts for the production line you will ship',
    sampleId: 'iron-plate',
  },
} as const satisfies HandwrittenArticle
