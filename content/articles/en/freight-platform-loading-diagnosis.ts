import type { HandwrittenArticle } from '../types.ts'

export const freight_platform_loading_diagnosis_enArticle = {
  slug: 'freight-platform-loading-diagnosis',
  title: 'Diagnose Freight Platform Loading and Unloading',
  description: 'Check freight-car/platform alignment, station orientation, belt connections and mixed cargo one step at a time.',
  sections: [
    {
      heading: 'Match each freight car to its platform position',
      paragraphs: [
        'When a station loads or unloads the wrong cargo, compare the order of the train’s freight cars with its Freight Platforms. The community wiki’s “Setting up freight stations” section says station facing matters, uses the locomotive-front marker (▶) and station front as orientation cues, and describes Empty Platforms as spacers for aligning a freight-car position. These are secondary-source instructions; current in-game behavior was not tested.',
        'The wiki’s platform-settings section documents Load/Unload controls but no receiving-side item-selection rule. Inspect a car’s contents when mixed cargo arrives; a car carrying multiple item types is a place to investigate. Separate cars are a suggested diagnostic aid, not a behavior tested here. Whether platforms can filter item types remains unverified in a live client.',
      ],
      lists: [{ ordered: true, items: [
        'Open the station where the train should stop and confirm that it is in the timetable.',
        'Count the freight cars and note their order. Check whether a car stops at a position without a platform.',
        'When the train stops, record which platform is in front of each car. If the order is unexpected, review station orientation and Empty Platform spacing one change at a time. Do not assume the mapping simply reverses when the station faces the opposite way; use the observed stopped layout.',
        'Assign cargo by freight car, then check the corresponding platform position at both the loading and receiving stations.',
      ]}],
    },
    {
      heading: 'Cargo does not move while the train is docked',
      paragraphs: [
        'After confirming that the car is in front of the intended platform, check the loading and unloading sides separately. On the loading side, confirm that the source conveyor reaches the platform. On the unloading side, confirm that the output belt reaches storage or a machine with room to accept items. The wiki’s “Loading and unloading” section says platform belts stop during automatic transfer and partial transfer occurs only when the receiver has a free slot. If transfer appears to stop partway, inspect receiver slots and platform mode. This is community-wiki documentation, not current-client testing.',
        'The current Japanese setting names and status labels have not been checked in game, so this guide does not prescribe a menu path or label. Read the displayed loading/unloading state and confirm that it matches the intended direction. Fluid Freight Platforms use pipe connections, so the solid-item belt checks do not apply to them as written.',
      ],
    },
    {
      heading: 'The receiving side gets the wrong item',
      paragraphs: [
        'Inspect the suspect car’s displayed contents and compare its assigned platform and belt at every stop. If a middle stop shares that car position, include it in the check. Record car contents and destination-belt items to find where mixing entered the route.',
        'As a diagnostic proposal, empty the car and run one round trip with a disposable test item, observing the car/platform match at each stop. This was not performed in a save for this guide.',
      ],
    },
    {
      heading: 'How this differs from related guides',
      paragraphs: [
        'The prepared Train Signals guide covers Block Signals, Path Signals, shared track, and deadlocks. This article covers car-to-platform alignment, loading and unloading, and why mixed cargo reaches the receiving side. The published Vehicle Paths article is about ground vehicles, while the Fluid Truck Delivery guide concerns liquid transport by truck; neither covers freight-train cargo diagnosis.',
      ],
    },
  ],
  references: {
    heading: 'Sources and evidence',
    links: [
      { label: 'Satisfactory Wiki — Freight Platform: Setting up freight stations', href: 'https://satisfactory.wiki.gg/wiki/Freight_Platform#Setting_up_freight_stations' },
      { label: 'Satisfactory Wiki — Freight Platform: Loading and unloading', href: 'https://satisfactory.wiki.gg/wiki/Freight_Platform#Loading_and_unloading' },
      { label: 'Satisfactory Wiki — Freight Car', href: 'https://satisfactory.wiki.gg/wiki/Freight_Car#Freight_Car' },
      { label: 'Coffee Stain Studios — Update 1.2 announcement (update context only)', href: 'https://coffeestain.com/news/satisfactory-1-2-update-out-now/' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['vehicle-paths', 'fluid-truck-delivery'],
  publishedDate: '2026-10-18',
  updatedDate: '2026-10-18',
  versionNotice: 'Planner data is 1.1.x. Loading and unloading steps follow community-wiki documentation. Freight-car/platform alignment, Japanese UI labels, and receiving-side behavior have not been tested in the current Update 1.2 client.',
} as const satisfies HandwrittenArticle
