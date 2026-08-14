/**
 * English text of the seven loop-template guides (計画書 §5).
 *
 * The Japanese source lives with the templates themselves (`src/plan/samples.ts`, `SampleGuide`),
 * because the planner renders it next to the solved result. The English mirror is kept here
 * instead of next to the data for two reasons:
 *  - the static pages are the only consumer today (the in-app loop guide is Japanese-only until
 *    the localized guide panel lands), so nothing is added to the app bundle
 *  - the article headline, the lead and the CTA label need real English sentences, not a
 *    template applied to a translated noun ("How Nuclear Power and Reprocessing Work…")
 *
 * Every entry is a translation of the matching Japanese guide, sentence by sentence rather than
 * phrase by phrase, and all game terms use the official English names from the game data.
 * tests/build-pages.test.ts fails if a loop template has no entry here.
 */
export type LoopGuideEn = {
  /** Template name as shown in the CTA and the article index ("Open X in the planner"). */
  readonly title: string
  /** `<h1>` and `<title>` of the article. Written per template so the English reads naturally. */
  readonly headline: string
  /** Hero lead, and the first sentence of the meta description. */
  readonly description: string
  /** "What this layout shows" — the part of the flow worth watching. */
  readonly highlight: string
  /** Ordered steps of how the loop runs. */
  readonly mechanism: readonly string[]
  /** Practical notes for building it in game. */
  readonly tips: readonly string[]
  /** Only for byproduct loops: what the circulating fluid means. */
  readonly circulationMeaning?: string
}

export const LOOP_GUIDES_EN: Readonly<Record<string, LoopGuideEn>> = {
  'oil-loop-complete': {
    title: 'Complete Oil Recycling Loop',
    headline: 'How the Complete Oil Recycling Loop Works and How to Build It',
    description:
      '300 per minute each of Plastic and Rubber, with Fuel circulating between the two halves of a fully closed recycling loop.',
    highlight: 'Watch the pair of lines that feed Plastic and Rubber back into each other’s recipe.',
    mechanism: [
      'Process Crude Oil with the Heavy Oil Residue recipe so that as much residue as possible comes out.',
      'Turn the Polymer Resin byproduct into Rubber with Residual Rubber; this is what gets the loop started.',
      'Add Water to the Heavy Oil Residue and stretch it into Fuel with Diluted Fuel.',
      'Make Recycled Plastic from Fuel and Rubber.',
      'Make Recycled Rubber from Fuel and Plastic.',
      'Send part of the Plastic and Rubber back into each other’s step and take the remainder out as product.',
    ],
    tips: [
      'Start the Heavy Oil Residue and Residual Rubber steps first and only feed the recycling steps once the first Rubber arrives — the loop then starts without hand-feeding anything.',
      'Wait until the Fuel pipes are full before bringing the Refineries up one at a time; when something stalls it is far easier to see why.',
    ],
  },

  'diluted-fuel-power': {
    title: 'Efficient Fuel Power',
    headline: 'How Diluted Fuel Power Works and How to Build It',
    description:
      '2,500 MW, following Crude Oil through Heavy Oil Residue and Diluted Fuel into Fuel-Powered Generators.',
    highlight:
      'Watch the line where Water joins the Heavy Oil Residue and leaves again as Fuel for the generators.',
    mechanism: [
      'Process Crude Oil with the Heavy Oil Residue recipe so that as much residue as possible comes out.',
      'Send the residue and Water to a Blender and stretch them into Fuel with Diluted Fuel.',
      'Feed the Fuel to Fuel-Powered Generators for continuous output.',
    ],
    tips: [
      'Keep Water and Fuel on separate pipe runs, and add a pump wherever the head lift is not enough.',
      'Generators running at 100% need no Power Shards.',
    ],
  },

  'turbofuel-power': {
    title: 'Turbofuel Power',
    headline: 'How Turbofuel Power Works and How to Build It',
    description:
      '2,000 MW, using the power chain that turns Compacted Coal and Fuel into Turbofuel.',
    highlight: 'Watch the point where Fuel and Compacted Coal merge into Turbofuel.',
    mechanism: [
      'Turn SAM into Reanimated SAM, then feed it with Iron Ore into a Converter to produce Sulfur.',
      'Make Compacted Coal from Coal and Sulfur.',
      'Refine Crude Oil into the Fuel that Turbofuel is built from.',
      'Feed Fuel and Compacted Coal into a Refinery to make Turbofuel.',
      'Send the Turbofuel to Fuel-Powered Generators, which then produce the same power from a much smaller flow.',
    ],
    tips: [
      'Split the belts so that Coal and Sulfur arrive in equal amounts; a blockage is much easier to spot that way.',
      'Generators running at 100% need no Power Shards.',
    ],
  },

  'aluminum-water-loop': {
    title: 'Aluminum Ingot Water Loop',
    headline: 'How the Aluminum Refining Water Loop Works and How to Build It',
    description:
      '120 Aluminum Ingot per minute, reusing the Water that the Aluminum Scrap step sends back upstream.',
    highlight:
      'Watch the line that carries Water from Aluminum Scrap back into the Alumina Solution step.',
    mechanism: [
      'Make Alumina Solution from Bauxite and Water.',
      'Make Aluminum Scrap from Alumina Solution and Coal; the step returns Water as a byproduct.',
      'Merge that Water back into the Alumina Solution step so less has to be pumped in.',
      'Smelt the Aluminum Scrap and take out Aluminum Ingot.',
    ],
    tips: [
      'On start-up, fill the pipes from the Water Extractors and only throttle the intake once the loop is running.',
      'Set the valves and merge points so that the returning Water is always consumed first.',
      'If the byproduct Water backs up, every step stops — an emergency outlet is worth building.',
    ],
    circulationMeaning:
      'The Water returned by the scrap step is reused upstream. The figure below is the amount that circulates, and therefore never has to be pumped in from outside.',
  },

  'packaged-diluted-fuel-loop': {
    title: 'Packaged Fuel Canister Loop',
    headline: 'How the Packaged Diluted Fuel Canister Loop Works and How to Build It',
    description:
      '120 Fuel per minute: package the Water, then recover the Empty Canisters after dilution and use them again.',
    highlight: 'Watch the line that returns Empty Canisters to the water packaging step.',
    mechanism: [
      'Take Heavy Oil Residue out of Crude Oil, and fill Empty Canisters with Water.',
      'Make Diluted Packaged Fuel from the residue and the Packaged Water.',
      'Unpackaging the Fuel hands the canisters straight back.',
      'Return the Empty Canisters to the water packaging step so the same canisters keep going round.',
    ],
    tips: [
      'Hand-feed one loop’s worth of Empty Canisters before you start it up.',
      'Once it is circulating you no longer have to produce canisters, so build the canister supply belt so it can be disconnected.',
    ],
  },

  'battery-water-loop': {
    title: 'Battery Water Loop',
    headline: 'How the Battery Water Loop Works and How to Build It',
    description:
      '60 Battery per minute, returning the Water produced along the way to the Alumina Solution step.',
    highlight: 'Watch the line that carries Water from the Battery step back to Alumina Solution.',
    mechanism: [
      'Prepare Alumina Solution from Bauxite and Water.',
      'Make Sulfuric Acid from Sulfur and Water, and produce Aluminum Casing on a separate branch.',
      'Making Batteries from Alumina Solution, Sulfuric Acid and Aluminum Casing returns Water as a byproduct.',
      'Merge that Water back into the Alumina Solution step and use it again.',
    ],
    tips: [
      'Fill the pipes with outside Water on start-up, then switch over to the return line once Batteries are coming out.',
      'Battery production stops as soon as the return line backs up, so leave slack in the pipework.',
      'Draw on the circulating Water first and top up from the Water Extractors only for the shortfall.',
    ],
    circulationMeaning:
      'Water that appears as a byproduct of the Battery step and of the aluminium refining upstream is returned to the Alumina Solution step. The figure below is how much circulates across the whole line without being pumped in from outside.',
  },

  'nuclear-reprocessing': {
    title: 'Nuclear Power and Reprocessing',
    headline: 'How Nuclear Power and Reprocessing Work and How to Build Them',
    description:
      '5,000 MW plus 0.1 Ficsonium Fuel Rod per minute, following every reprocessing stage that starts from nuclear waste.',
    highlight:
      'Watch the reprocessing line that runs from Uranium Waste all the way to Ficsonium Fuel Rod.',
    mechanism: [
      'Process Uranium into Uranium Fuel Rod and send it to the Nuclear Power Plants.',
      'Route the Uranium Waste that comes back out into reprocessing, beginning with Non-Fissile Uranium.',
      'Turn the reprocessed material into Plutonium Pellet, then Encased Plutonium Cell, then fuel rods.',
      'Convert the plutonium waste into Ficsonium and carry it through to Ficsonium Fuel Rod.',
      'The fuel rods chosen for power go to the Nuclear Power Plants, while Ficsonium Fuel Rod is taken out as the end of the reprocessing chain.',
    ],
    tips: [
      'Put a generous buffer in front of each waste stage so that a stall downstream never reaches the reactors.',
      'Keep the radioactive area away from the factory proper, and protect yourself with walls, distance and Iodine-Infused Filters.',
      'Before starting, run the acids, water and supporting materials in first and confirm that the reprocessing line can accept them.',
    ],
  },
}
