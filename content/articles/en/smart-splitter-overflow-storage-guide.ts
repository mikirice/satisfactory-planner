import type { HandwrittenArticle } from '../types.ts'

export const smart_splitter_overflow_storage_guide_enArticle = {
  slug: 'smart-splitter-overflow-storage-guide',
  title: 'Route Storage Overflow to an AWESOME Sink',
  description: 'Use a Smart Splitter to store one item and send it to an Overflow route only when no other output can be used.',
  sections: [
    {
      heading: 'Basic connections',
      paragraphs: [
        'This pattern stores one target item and routes it to the Sink only when no other output is usable. The Smart Splitter wiki’s “Filters” section describes Overflow as a fallback when other outputs are full or no suitable rule applies. It also says multiple Overflow outputs distribute overflowed items, so this basic pattern uses one. The current Japanese UI label is unverified.',
      ],
      lists: [{ ordered: true, items: [
        'Feed one item type during the initial test.',
        'Assign that item explicitly to one storage output.',
        'Assign Overflow to a different output and connect it to the Sink. Keep other rules minimal so the target item has no unexamined alternate route.',
        'Observe the route while storage has room and when it is full.',
      ]}],
    },
    {
      heading: 'If routing does not match expectations',
      paragraphs: [
        'If an item reaches the Sink while storage has room, check whether its explicit storage rule is on the intended output, whether another output also has a suitable rule, and whether the belt uses the intended port. Overflow is a fallback when no other output can be used, not a permanently preferred excess lane.',
        'If items do not reach the Sink once storage is full, check the Overflow assignment and downstream belt, then look for another rule that can accept the item. The wiki does not settle every interaction between a physically blocked belt and Overflow selection, so do not assume every belt jam invokes Overflow.',
        'For mixed input, map each item to its intended output before testing. Define explicit rules rather than routing every item to storage by default, then check each item that will reach the Sink against current acceptance information.',
      ],
    },
    {
      heading: 'Test it safely',
      paragraphs: [
        'Test one expendable item at a time, first with storage space and then with storage full. Observe the route under both conditions. Before connecting any item to the Sink, check eligibility: the AWESOME Sink wiki’s “Items not allowed to sink” section lists items that cannot be fed into the Sink and can clog its input. Do not mix an unverified item into the shared Sink belt.',
        'This is a proposed test plan, not a test performed for this guide. The wiki list was not checked against the live client.',
      ],
    },
    {
      heading: 'How this differs from related guides',
      paragraphs: [
        'The published AWESOME Sink article covers item point values. This guide is about a single-item Smart Splitter fallback route and Sink-ineligible-item precautions. The Priority Merger article covers input priority, and the Conveyor Throughput Monitor article covers belt readings; they address different tasks.',
      ],
    },
  ],
  references: {
    heading: 'Sources and evidence',
    links: [
      { label: 'Satisfactory Wiki — Smart Splitter: Filters', href: 'https://satisfactory.wiki.gg/wiki/Smart_Splitter#Filters' },
      { label: 'Satisfactory Wiki — AWESOME Sink: Items not allowed to sink', href: 'https://satisfactory.wiki.gg/wiki/AWESOME_Sink#Items_not_allowed_to_sink' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['awesome-sink-points', 'priority-merger-use-cases-guide'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Planner data is 1.1.x. Splitter and Sink mechanics are attributed to the community wiki. Current Update 1.2 Japanese UI labels, Sink eligibility, and behavior with physically blocked belts were not tested in game.',
} as const satisfies HandwrittenArticle
