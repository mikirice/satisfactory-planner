/**
 * English text of the loop-template guides (計画書 §5).
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
  readonly sources?: readonly { readonly label: string; readonly href: string }[]
  /** Only for byproduct loops: what the circulating fluid means. */
  readonly circulationMeaning?: string
}

export const LOOP_GUIDES_EN: Readonly<Record<string, LoopGuideEn>> = {
  'oil-loop-complete': {
    title: 'Complete Oil Recycling',
    headline: 'How the Complete Oil Recycling Loop Works and How to Build It',
    description:
      'A steady-state balance for 300/min each of Plastic and Rubber using Heavy Oil Residue, Diluted Fuel, Residual Rubber, and two recycling recipes.',
    highlight:
      'All Fuel returns to the two recycling steps; the net products are 300/min each of Plastic and Rubber.',
    mechanism: [
      'This example is a steady-state calculation with four alternate recipes enabled: Heavy Oil Residue, Diluted Fuel, Recycled Plastic, and Recycled Rubber. Residual Rubber is the standard recipe.',
      'Process 200 m³/min of Crude Oil into 266.67 m³/min of Heavy Oil Residue and 133.33 Polymer Resin/min. Send all the residue to Diluted Fuel in Blenders; with 533.33 m³/min of Water, it makes 533.33 m³/min of Fuel.',
      'Use 133.33 Polymer Resin/min and 133.33 m³/min of Water in Residual Rubber to make 66.67 Rubber/min. Total Water input is 666.67 m³/min.',
      'Recycled Plastic consumes 277.78 Rubber/min and 277.78 Fuel/min to make 555.56 Plastic/min. Return 255.56 Plastic/min to Recycled Rubber and take the remaining 300/min as product.',
      'Recycled Rubber consumes 255.56 Plastic/min and 255.56 Fuel/min to make 511.11 Rubber/min. Including Residual Rubber, 577.78 Rubber/min is available: return 277.78/min to Recycled Plastic and take 300/min as product.',
      'The two recycling steps consume all 533.33 m³/min of Fuel. The plan uses 30 Refineries and 6 Blenders, 36 production buildings total; resource extractors are not included.',
    ],
    tips: [
      'The steady-state solver does not include startup inventory. At the default building count, one initial batch across all 10 Recycled Plastic and 9 Recycled Rubber Refineries takes 60 Rubber, 54 Plastic, and 114 Fuel items. First build Rubber and Fuel stock from Polymer Resin and Water; start one side, reserve its output, then start the other. These are recipe-batch amounts, not per-minute rates.',
      'Prioritize Polymer Resin to Residual Rubber and send only overflow to storage or a sink. Diverting all resin before you have seed Rubber can leave the recycling loop without startup stock.',
      'Prioritize the return belts and pipes before product takeoff. If product output backs up, check the return splits, Fuel distribution, and where the Resin goes; a blocked return can back up intermediates and stop Crude Oil processing.',
      'This is a continuous recipe-ratio calculation. It does not simulate inventories, recipe-cycle timing, belt or pipe filling and flow, head lift, or in-game stalls. Start in stages and check the actual flows. If you do not have all four alternate recipes, choose available recipes and solve the plan again; the same rates and building count will not apply. Recipe rates use the Satisfactory 1.1.x game-bundled CommunityResources/Docs. See https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md for the source record and version fingerprint; the mirrored game Docs are at https://github.com/aringadre76/satisfactory-api/tree/master/Docs.',
    ],
  },

  'diluted-fuel-power': {
    title: 'Efficient Fuel Power',
    headline: 'How Diluted Fuel Power Works and How to Build It',
    description:
      'A 2,500 MW gross plan that turns 75 m³/min of Crude Oil into 200 m³/min of Fuel, with machine counts, power use and start-up steps.',
    highlight:
      'Follow the balance from 75 m³/min of Crude Oil to 100 m³/min of Heavy Oil Residue, then to 200 m³/min of Fuel with Water.',
    mechanism: [
      'This example uses the Satisfactory Planner’s bundled 1.1.x recipe data and sets total Fuel-Powered Generator output to 2,500 MW. Ten generators at their rated output consume 200 m³/min of Fuel.',
      'Alternate: Heavy Oil Residue turns 3 m³/min of Crude Oil into 4 m³/min of Heavy Oil Residue and 2 Polymer Resin/min. Processing 75 m³/min of Crude Oil with 2.5 Refinery-equivalents produces 100 m³/min of Heavy Oil Residue and 50 Polymer Resin/min. In the game, build three Refineries: two at 100% and one at 83⅓%.',
      'Alternate: Diluted Fuel turns 5 m³/min of Heavy Oil Residue and 10 m³/min of Water into 10 m³/min of Fuel. Two Blenders process 100 m³/min of Heavy Oil Residue and 200 m³/min of Water into 200 m³/min of Fuel for the generators.',
      'One Fuel-Powered Generator consumes 20 m³/min of Fuel and produces 250 MW. Ten generators use 200 m³/min and produce 2,500 MW combined. That is gross rated generation, before subtracting the power used by production.',
      'At the standard machine draw, the 2.5 Refinery-equivalents use 75 MW and the two Blenders use 150 MW, for 225 MW total. Subtracting only this production load leaves 2,275 MW. Oil and Water extraction, pipeline pumps and other factory loads are outside that figure, so the usable surplus will be lower.',
    ],
    tips: [
      'Unlock the recipes before building. Heavy Oil Residue and Diluted Fuel are alternate recipes obtained through Hard Drive analysis. If either is locked, solve again with the recipes in your save. Rates here use the game-bundled Community Resources Docs recorded for 1.1.x; values have not been checked against Update 1.2 or later. See the linked data-version record and recipe references below.',
      'For start-up, use an existing grid or Biomass Burners to power the Water and Oil Extractors, Refineries and Blenders first. Make Fuel and fill the Fuel pipe and generator inputs; connect the generators to the main grid once flow is steady. Keep 200 m³/min of Water and 200 m³/min of Fuel on separate pipe networks. Each is below the nominal 300 m³/min limit of a Mk.1 Pipeline, but elevation, pump head lift and uneven splits can reduce delivery. Distribute flow across the generator row and raise the load in stages while the pipes fill. The fuel plant cannot start itself while its production machines have no power.',
      'Route the 50 Polymer Resin/min from the Refineries to storage, an Awesome Sink or a recipe that uses Resin; a blocked outlet stops Crude Oil processing. If output drops, check Fuel at the generator inputs first, then Blender Water and Heavy Oil Residue, then Refinery Crude Oil and the Resin outlet. If machines run but generation is still short, check extractor and pump power, pipe head lift and total grid demand.',
      'To shut down, disconnect the generator row or lower grid demand first. Let the pipes drain before cutting power to fuel production, or reserve Fuel in a buffer for an easier restart. The Planner solves steady per-minute balances and recipe-equivalent machine counts; it does not simulate pipe filling, machine inventories, start-up Fuel stock, head lift, blockages or moment-to-moment demand. The chain needs 2.5 Refinery-equivalents and 2 Blenders; build three Refineries and two Blenders in game. Generators are counted as whole machines at 100% clock, so manual underclocking is not modeled. Generator and pipe references are linked below.',
    ],
    sources: [
      { label: 'Planner game-data source and version record', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Fuel-Powered Generator — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
      { label: 'Heavy Oil Residue recipe — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Heavy_Oil_Residue' },
      { label: 'Diluted Fuel recipe — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Diluted_Fuel' },
      { label: 'Pipeline flow and head lift — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Pipeline' },
    ],
  },

  'turbofuel-power': {
    title: 'Turbofuel Power',
    headline: 'How Turbofuel Power Works and How to Build It',
    description:
      'A 2,000 MW gross plan that turns 108 m³/min of Crude Oil, 48 Coal/min and 48 Sulfur/min into 60 m³/min of Turbofuel, including the Converter power range.',
    highlight:
      'Follow the merge: 72 m³/min of Fuel and 48 Compacted Coal/min enter Refineries and leave as 60 m³/min of Turbofuel.',
    mechanism: [
      'This example uses the Planner’s bundled 1.1.x recipe data and targets 2,000 MW total from Fuel-Powered Generators. Eight generators consume 60 m³/min of Turbofuel.',
      'The Refinery Turbofuel recipe turns 6 m³/min of Fuel and 4 Compacted Coal/min into 5 m³/min of Turbofuel. To make 60 m³/min, supply 72 m³/min of Fuel and 48 Compacted Coal/min. That is 3.2 Refinery-equivalents; build four Refineries, with one at 80% and the other three at 100%.',
      'The standard Fuel recipe turns 6 m³/min of Crude Oil into 4 m³/min of Fuel and 3 Polymer Resin/min. Making 72 m³/min of Fuel therefore takes 108 m³/min of Crude Oil and 1.8 Refinery-equivalents. Two Refineries at 90% each match the rate, and the chain also produces 54 Polymer Resin/min.',
      'The Assembler Compacted Coal recipe uses 5 Coal/min and 5 Sulfur/min to make 5 Compacted Coal/min. For 48/min, supply 48 Coal/min and 48 Sulfur/min, or 1.92 Assembler-equivalents.',
      'The Sulfur (Iron) recipe in a Converter turns 1 Reanimated SAM/min and 30 Iron Ore/min into 12 Sulfur/min. For 48 Sulfur/min, supply 4 Reanimated SAM/min and 120 Iron Ore/min. A Constructor turns 16 raw SAM/min into those 4 Reanimated SAM/min.',
      'The eight generators have 2,000 MW of gross rated output. At 100%-clock-equivalent recipe loads, the production chain uses 279.3 MW (a 219.3–339.3 MW range because Converter power varies), leaving 1,720.7 MW net by that calculation (range 1,660.7–1,780.7 MW). Extractors, Water supply pumps, pipeline pumps and other factory loads are not included.',
    ],
    tips: [
      'Unlock Compacted Coal and Turbofuel in the MAM Sulfur Research chain. This Sulfur route also needs a Converter from Tier 9 Matter Conversion and Reanimated SAM, unlocked through MAM Alien Technology Research or Tier 9. Rates here use the bundled 1.1.x data; recipe values from Update 1.2 or later have not been checked. Until the chain is available, build regular Fuel power and set the Planner to fuels unlocked in your save.',
      'Start with an existing grid or Biomass Burners. Feed raw SAM to the Constructor, Reanimated SAM and Iron Ore to the Converter, and Coal and Sulfur to the Assembler; then run the Crude Oil-to-Fuel and Fuel-to-Turbofuel stages in order. Fill the Fuel and Turbofuel pipes through to the generator inputs before connecting the row to the main grid. Remove the temporary supply after output is steady.',
      'Keep the 48 Coal/min and 48 Sulfur/min on separate belts so a shortage is easy to see. Feed 72 m³/min of Fuel and 60 m³/min of Turbofuel through separate pipe networks and split them evenly across the generators. If output falls, check Turbofuel at the generator inputs, then Fuel and Compacted Coal at the Turbofuel Refineries, Coal and Sulfur at the Assembler, and Reanimated SAM and Iron Ore at the Converter. Also check the Polymer Resin outlet; a full output can stop Fuel production.',
      'Planner machine counts are 100%-clock recipe-equivalents. A practical build uses 8 generators, four Turbofuel Refineries (one at 80%), two Fuel Refineries (both at 90%), two Compacted Coal Assemblers (96% each), one Converter at 40% and one Reanimated SAM Constructor at about 13⅓%: 18 buildings total. The Planner’s full-clock-equivalent factory draw is 279.3 MW (219.3–339.3 MW), leaving 1,720.7 MW net (1,660.7–1,780.7 MW). With the listed machine clocks, its adjusted draw is about 244.7 MW (200.0–289.4 MW), or 1,755.3 MW net (1,710.6–1,800.0 MW); mining and pump power still need to be subtracted. The Planner does not simulate pipe filling, inventories, head lift, start-up flow or blockages. When shutting down, disconnect the generator load first and reserve Turbofuel if you want an easier restart.',
    ],
    sources: [
      { label: 'Planner game-data source and version record', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Turbofuel recipe and unlock — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Turbofuel' },
      { label: 'Compacted Coal recipe and MAM research — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Compacted_Coal' },
      { label: 'Reanimated SAM and Converter recipes — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/RSAM' },
      { label: 'Fuel-Powered Generator — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Fuel-Powered_Generator' },
    ],
  },

  'aluminum-water-loop': {
    title: 'Aluminum Ingot Water Loop',
    headline: 'How the Aluminum Refining Water Loop Works and How to Build It',
    description:
      'Make 120 Aluminum Ingot per minute with a steady outside Water supply of 120 m³/min by reusing the Water returned from Aluminum Scrap.',
    highlight:
      'Alumina Solution needs 180 m³/min of Water, but Aluminum Scrap returns 60 m³/min, so the line needs 120 m³/min of fresh Water once it reaches steady operation.',
    mechanism: [
      'With the standard recipe, make 120 m³/min of Alumina Solution. One Refinery at 100% uses 120 Bauxite/min and 180 m³/min of Water, and returns 50 Silica/min.',
      'Make 180 Aluminum Scrap/min. One Refinery at 50% uses 120 m³/min of Alumina Solution and 60 Coal/min, and returns 60 m³/min of Water.',
      'Connect the return pipe to the Water header feeding Alumina Solution. The balance is 180 m³/min of gross Water demand minus 60 m³/min returned, leaving 120 m³/min to pump in.',
      'Two Foundries use 180 Aluminum Scrap/min and 150 Silica/min to make 120 Aluminum Ingot/min. After the 50 Silica/min from Alumina Solution, make up the remaining 100 Silica/min. The standard Silica recipe needs 2⅔ Constructors and 60 Raw Quartz/min.',
    ],
    tips: [
      'Start upstream: power the Water Extractors and Alumina Solution Refinery first. Once Alumina Solution reaches the scrap step, start that Refinery. When the return flow is visible, set outside Water to the steady 120 m³/min. If you temporarily supply 180 m³/min to prime the pipes, reduce it as soon as return Water starts flowing; leaving that feed running will create excess Water and can block the scrap output.',
      'Do not depend on a pipe junction to give one source priority. Limit the fresh-Water line to 120 m³/min and join it with the unrestricted return line; together they supply the 180 m³/min the Alumina Solution step needs. If you use a Valve, put it on the fresh-Water line, not on the return.',
      'Check the stalled step: for Alumina Solution, verify combined Water supply, pump head lift, power and Bauxite. If only Aluminum Scrap stops, check Alumina Solution and Coal supply, its Water outlet, the return connection to the same network, and a full pipe or buffer with nowhere to flow. Temporarily stop fresh Water so downstream machines can consume the excess, fix the return connection or head lift, then restore the 120 m³/min make-up supply. A buffer cannot correct an imbalance. The Planner solves steady rates, not pipe filling during start-up, elevation, Valve placement or local blockages, so inspect the in-game pipes too.',
      'Sources: recipe rates from Coffee Stain Studios’ bundled Satisfactory Community Resources Docs (1.1.x game data), cross-checked against the official community-driven wiki’s Recipes page: https://satisfactory.wiki.gg/wiki/Recipes . Pipe and head-lift behavior: the same wiki’s Pipelines and Head lift pages: https://satisfactory.wiki.gg/wiki/Pipeline and https://satisfactory.wiki.gg/wiki/Head_lift .',
    ],
    circulationMeaning:
      'The standard Aluminum Scrap recipe returns 60 m³/min, all of which can be reused by Alumina Solution. The figure below is the circulating amount; it is separate from the 120 m³/min of fresh Water needed at steady state.',
  },

  'packaged-diluted-fuel-loop': {
    title: 'Packaged Diluted Fuel Canister Loop',
    headline: 'Packaged Diluted Fuel: Canister Loop, Rates, and Start-up',
    description:
      '120 m³/min of Fuel from 120 m³/min of Water and 60 m³/min of Heavy Oil Residue, with 120 Empty Canisters per minute circulating.',
    highlight:
      'Follow the Empty Canisters back to Packager. This is Diluted Packaged Fuel made in a Refinery; it is a different recipe from the liquid Diluted Fuel made in a Blender.',
    mechanism: [
      'With Alternate: Heavy Oil Residue, 45 m³/min of Crude Oil yields 60 m³/min of Heavy Oil Residue and 30 Polymer Resin per minute.',
      'Two Packagers turn 120 m³/min of Water and 120 Empty Canisters per minute into 120 Packaged Water per minute.',
      'Two Refineries running Alternate: Diluted Packaged Fuel turn 60 m³/min of Heavy Oil Residue and 120 Packaged Water per minute into 120 Packaged Fuel per minute.',
      'Two Packagers unpackage that Fuel into 120 m³/min of liquid Fuel and return 120 Empty Canisters per minute. Returning them to water packaging makes the loop’s steady-state net canister demand zero.',
      'Alternate: Diluted Fuel in a Blender makes 10 m³ of liquid Fuel from 5 m³ of Heavy Oil Residue and 10 m³ of Water every six seconds. At 120 m³/min, its Water and Heavy Oil Residue needs match this example; it skips the packaging and unpackaging steps.',
      'At 100% clock with no overclock, build eight machines for the canister loop: two Refineries for Heavy Oil Residue (one at 50%), two for Diluted Packaged Fuel, and four Packagers. The Blender route needs four total: two Refineries and two Blenders.',
    ],
    tips: [
      'For the first recipe batch, put two Empty Canisters in each of the two Water Packagers (four total). Add more as buffer for belts and machine inventories in the actual game.',
      'Return the Empty Canisters to the Water Packagers, and make the temporary start-up feed easy to disconnect once the loop is circulating.',
      'If production stalls, first check whether Unpackage Fuel is returning Empty Canisters and whether Packaged Water reaches the dilution Refineries. Also give the 30 Polymer Resin per minute a clear route out.',
      'This steady-state calculation uses the Planner’s 1.1.x game data. Its source and version check are recorded at https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md. The solver does not model start-up inventory or belt/pipe fill, and Update 1.2 recipe values have not been verified here.',
    ],
  },

  'battery-water-loop': {
    title: 'Battery Water Loop',
    headline: 'How the Battery Water Loop Works and How to Build It',
    description:
      '60 Battery per minute. Return water from Battery production and aluminum refining to Alumina Solution to reduce fresh-water demand.',
    highlight:
      'Watch the return lines from Battery and Aluminum Scrap join the feed for Alumina Solution.',
    mechanism: [
      'Make Alumina Solution from Bauxite and Water. Both aluminum refining and Battery production use it.',
      'Make Aluminum Scrap from Alumina Solution and Coal; Water comes back as a byproduct. Turn the Scrap into Aluminum Ingots, then make the Aluminum Casing for Batteries.',
      'Make Sulfuric Acid from Sulfur and Water, then send Alumina Solution, Sulfuric Acid and Aluminum Casing to a Blender to make Batteries.',
      'The Battery step also returns Water. Join both return streams back into the Alumina Solution feed to reduce fresh-water intake.',
    ],
    tips: [
      'Prime the pipes with external Water and start both aluminum refining and Sulfuric Acid production first. Keep the external supply on until the return streams begin flowing.',
      'Send the returned Water to Alumina Solution first, and keep a separate supply for Sulfuric Acid. If a return backs up, check that its receiving process is running, that pipes or buffers are not full, and that the junction is not starving one branch. Continuing to produce while a byproduct outlet is blocked will stall the downstream line.',
      'This sample enables no alternate recipes. Alternate: Classic Battery makes 4 Batteries every 8 seconds from 6 Sulfur, 7 Aluminum Plate, 8 Plastic and 12 Wire; it uses no Water and returns none. Switching to it removes the Battery step’s 90 m³/min return. Aluminum refining still supplies the Aluminum Plate, so Scrap still returns Water, but the rate changes with the amount of Aluminum Plate required.',
      'These are build-time steady-state rates from the Planner’s Satisfactory 1.1.x recipe data, sourced from a mirror of the game-bundled CommunityResources/Docs. The data has not been checked against in-game recipes after Update 1.2, so use the current in-game values where they differ. The planner sums recipe flows; it does not simulate pipe routing, head lift, transient fluid behavior or priority at junctions. Prime and balance the actual pipes in game. Version and source provenance: https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md (mirror of the primary game data: https://github.com/aringadre76/satisfactory-api/tree/master/Docs).',
    ],
    circulationMeaning:
      'The total below is the byproduct Water from Battery production and upstream aluminum refining at this sample’s target of 60 Batteries/min. With the standard recipes, 60 × 1.5 = 90 m³/min comes from Batteries, and 135 Aluminum Scrap × 2/6 = 45 m³/min comes from Scrap, for 135 m³/min returned. Producing 210 Alumina Solution/min (120 for Batteries + 90 for Scrap) consumes 210 × 18/12 = 315 m³/min of Water; Sulfuric Acid consumes a further 150 m³/min. The plant therefore needs 315 + 150 − 135 = 330 m³/min of external Water. Flow summary: return 135 (Battery 90 + Scrap 45) → Alumina Solution; fresh Water 180 → Alumina Solution and fresh Water 150 → Sulfuric Acid. The figure is recycled byproduct flow, not the plant’s total water independence. Recipe values use the Satisfactory 1.1.x game-bundled Docs; see https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md for version identification and source provenance.',
  },

  'nuclear-simplified': {
    title: 'Simplified Uranium Power',
    headline: 'How Simplified Nuclear Power with Alternate Recipes Works and How to Build It',
    description:
      '2,500 MW of nuclear power built from alternate recipes, so the uranium chain never touches Sulfuric Acid and runs on belts alone.',
    highlight:
      'Watch the straight run from Uranium to Uranium Fuel Rod, with no acid pipework anywhere along it.',
    mechanism: [
      'Mine Uranium and send it to a Manufacturer together with Silica, Sulfur and Quickwire — instead of Sulfuric Acid, this line needs a supply of Raw Quartz and Caterium Ore.',
      'Make Encased Uranium Cell with Infused Uranium Cell: it needs no Sulfuric Acid, so the Blender and the Refinery both disappear from the line.',
      'Make Encased Industrial Beam from Steel Pipe and Concrete with Encased Industrial Pipe, which drops the Steel Beam step.',
      'Feed Encased Uranium Cell, Encased Industrial Beam and Electromagnetic Control Rod into a Manufacturer to make Uranium Fuel Rod.',
      'Send the fuel rods to Nuclear Power Plants for 2,500 MW; the only pipe on the site is the reactor cooling water.',
      'Carry the Uranium Waste out on a belt and keep it in storage.',
    ],
    tips: [
      'Uranium Waste is worth 0 sink points and cannot be disposed of in the AWESOME Sink, so decide where it goes — storage or a reprocessing line — before you build.',
      'Uranium, Encased Uranium Cell, Uranium Fuel Rod and Uranium Waste are all radioactive: keep the belts and the storage away from walkways and wear an Iodine-Infused Filter.',
      'Both alternate recipes come from Hard Drive research; having them in hand before you start saves rebuilding the line later.',
      'The SAM limit is set to 0 so that the Converter route to Uranium is off the table. Build this where you can mine Uranium directly.',
    ],
  },

  'nuclear-uranium': {
    title: 'Nuclear, stage 1: uranium power',
    headline: 'How a Uranium-Only Nuclear Plant Works and How to Build It',
    description:
      '5,000 MW from Uranium Fuel Rod alone: the smallest nuclear setup, and the one where the Uranium Waste has to be stored.',
    highlight:
      'Watch the Uranium Waste leaving the Nuclear Power Plants: it feeds nothing and simply dead-ends.',
    mechanism: [
      'Mine Uranium and feed it into a Blender with Sulfuric Acid and Concrete to make Encased Uranium Cell. The Sulfuric Acid comes from Sulfur and Water in a Refinery.',
      'In this plan the Sulfur and Caterium Ore are made in Converters from Reanimated SAM plus Iron Ore and Copper Ore; if you can mine them where you build, swap those steps for Miners.',
      'Assemble Encased Industrial Beam from Steel Beam and Concrete, and Electromagnetic Control Rod from Stator and AI Limiter.',
      'Feed Encased Uranium Cell, Encased Industrial Beam and Electromagnetic Control Rod into a Manufacturer to make Uranium Fuel Rod.',
      'Send the fuel rods to Nuclear Power Plants, pipe in the cooling Water and generate.',
      'The Uranium Waste that comes out has no use at this stage, so belt it away and keep it in storage containers.',
    ],
    tips: [
      'Uranium Waste is worth 0 sink points and cannot go into the AWESOME Sink. It keeps piling up for as long as the plants run, so decide where the storage containers go before you build.',
      'Uranium, Encased Uranium Cell, Uranium Fuel Rod and Uranium Waste are all radioactive: keep the belts and the storage away from walkways and wear an Iodine-Infused Filter.',
      'This stage is the power plan with Uranium Fuel Rod as the only fuel and every “leave none behind” box unticked. To move on to reprocessing, add Plutonium Fuel Rod to the fuels and tick “leave none behind” for Uranium Waste — that is stage 2.',
      'The resource limit for Uranium is set to unlimited. In the solver’s resource cost Uranium is the scarcest ore, and left alone it would rather make Uranium in a Converter from SAM and Bauxite than mine it. All three stages share this setting. If you also want the Sulfur and Caterium Ore mined, set the SAM limit to 0.',
    ],
  },

  'nuclear-plutonium': {
    title: 'Nuclear, stage 2: reprocess to plutonium',
    headline: 'How Reprocessing Uranium Waste into Plutonium Fuel Works and How to Build It',
    description:
      '5,000 MW minimum target. Whole full-output generators make this plan 3 units and 7,500 MW; all Uranium Waste is reprocessed, leaving Plutonium Waste.',
    highlight:
      'Watch the Uranium Waste enter the Non-Fissile Uranium step and come back to the plants as Plutonium Fuel Rod.',
    mechanism: [
      'Make Uranium Fuel Rod exactly as in stage 1 and burn it in Nuclear Power Plants.',
      'Feed the Uranium Waste into a Blender with Silica, Nitric Acid and Sulfuric Acid to make Non-Fissile Uranium. The Nitric Acid comes from Nitrogen Gas, Water and Iron Plate in another Blender.',
      'Put Non-Fissile Uranium and Uranium Waste into a Particle Accelerator to make Plutonium Pellet.',
      'Assemble Encased Plutonium Cell from Plutonium Pellet and Concrete, then turn it into Plutonium Fuel Rod in a Manufacturer together with Steel Beam, Electromagnetic Control Rod and Heat Sink.',
      'Burn Plutonium Fuel Rod in an additional Nuclear Power Plant. This worked example still needs two Uranium generators to supply the rod chain, so its Uranium use stays at 40/min while actual generation rises to 7,500 MW for a 5,000 MW minimum target.',
      'Burning Plutonium Fuel Rod leaves Plutonium Waste, which has no use at this stage and goes into storage.',
    ],
    tips: [
      'The plan reprocesses all of the Uranium Waste. If the reprocessing line stalls, the waste backs up into the plants and the power goes with it — put containers in front of the Blenders as a buffer.',
      'Plutonium Waste is also worth 0 sink points and cannot be disposed of. There is far less of it than Uranium Waste, so a few containers are enough.',
      'Two acid pipes are needed, Sulfuric Acid and Nitric Acid. The Blenders are easy to mis-plumb, so colour or label the pipes before you start rearranging.',
      'Only two settings differ from stage 1: Plutonium Fuel Rod was added to the fuels, and “leave none behind” is ticked for Uranium Waste. For stage 3, add Ficsonium Fuel Rod to the fuels and tick “leave none behind” for Plutonium Waste as well.',
      'The requested MW is a minimum in the planner model. It counts whole non-biomass generators at 100% clock and reports their resulting output and fuel use. You can manually underclock generators in-game to reduce surplus output and fuel consumption.',
    ],
  },

  'nuclear-reprocessing': {
    title: 'Nuclear, stage 3: closed loop with Ficsonium',
    headline: 'How a Closed Nuclear Loop with Ficsonium Works and How to Build It',
    description:
      'A steady-rate plan using the Planner’s 1.1.x data: target at least 5,000 MW, build 7 full-output generators for 17,500 MW, and reprocess 40 Uranium Waste and 2 Plutonium Waste per minute.',
    highlight:
      'The 1.1.x calculation turns 40 Uranium Waste and 2 Plutonium Waste per minute back into fuel, leaving no surplus of either nuclear waste.',
    mechanism: [
      'Open “Nuclear, stage 3: closed loop with Ficsonium” from the planner’s share button. The 5,000 MW target is a minimum. The planner counts whole generators at full output, so this setup uses 4 Uranium, 2 Plutonium and 1 Ficsonium plant: 7 generators and 17,500 MW.',
      'With the 1.1.x recipes, supply 0.8 Uranium Fuel Rod, 0.2 Plutonium Fuel Rod and 1 Ficsonium Fuel Rod per minute. The plants produce 10,000, 5,000 and 2,500 MW respectively and use 960, 480 and 240 m³ of cooling Water per minute.',
      'Of the 40 Uranium Waste/min, send 30/min through Non-fissile Uranium and 10/min through Plutonium Pellet. The latter branch makes Plutonium Fuel Rod; there is no direct disposal step for Uranium Waste.',
      'The two Plutonium plants produce 2 Plutonium Waste/min. Combine it with 2 Singularity Cells/min and 40 Dark Matter Residue/min in the Particle Accelerator to make 2 Ficsonium/min.',
      'Feed 2 Ficsonium/min, Electromagnetic Control Rods, Ficsite Trigons and Excited Photonic Matter to the Quantum Encoder. It makes 1 Ficsonium Fuel Rod/min and returns 20 Dark Matter Residue/min. Reuse that 20/min at the Particle Accelerator and supply the other 20/min from outside.',
      'Burning the Ficsonium Fuel Rod produces no nuclear waste. With all three fuel types burning, both Uranium Waste and Plutonium Waste balance to zero.',
    ],
    tips: [
      'Provide power from a separate grid before starting the nuclear plants. The solved production chain draws about 3,026 MW; extractor power is not included. Make the first Uranium Fuel Rods outside the reactor loop. Prepare waste processing, acid, Singularity Cells and Dark Matter Residue, then start the Uranium plants. Once waste flows to both the 30/min and 10/min branches, bring up Plutonium Rod production and plants, followed by the Ficsonium section.',
      'Put a roomy storage buffer on each nuclear-waste belt. It only buys time to find a blockage; it does not dispose of waste. If a buffer keeps filling, stop sending fuel to the plant creating that waste, then check the belt, machine power, missing inputs and blocked outputs before restarting.',
      'If the Ficsonium line stops, check for Plutonium Waste, Singularity Cells and Dark Matter Residue at the Particle Accelerator. Then check Excited Photonic Matter and output space at the Quantum Encoder, followed by flow in the return line. If a reactor stops, check its fuel, cooling water and waste outlet in that order.',
      'Uranium Waste and Plutonium Waste cannot go directly into the AWESOME Sink: both are worth 0 points in the 1.1.x data. Plutonium Fuel Rods can be sunk, but burning them makes unsinkable Plutonium Waste. To stop at Plutonium, sink the rods without burning them; burn Ficsonium Fuel Rods for power instead (0 Sink points in this dataset, but no nuclear waste).',
      'Keep radioactive materials away from walkways and living areas. Wear a Hazmat Suit and Iodine-Infused Filters; do not rely on walls or floors as radiation shielding, and avoid carrying radioactive items for long periods.',
      '“Closed loop” refers to the two nuclear-waste streams. The 1.1.x plan still leaves 6.4 m³/min of Heavy Oil Residue as a separate byproduct. This steady-rate balance does not predict startup inventory, installed machine counts and clocks, pipe fill and head lift, downtime or successful loop priming. Recipe values for 1.2 have not been checked against updated Docs.',
    ],
    sources: [
      { label: 'Planner game-data source and version record', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Uranium Waste — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Uranium_Waste' },
      { label: 'Plutonium Waste — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Plutonium_Waste' },
      { label: 'Ficsonium Fuel Rod — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Ficsonium_Fuel_Rod' },
      { label: 'Radioactivity — Satisfactory Wiki', href: 'https://satisfactory.wiki.gg/wiki/Radioactivity' },
    ],
  },
}
