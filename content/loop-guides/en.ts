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
      '5,000 MW minimum target. This whole-unit plan builds 7 full-output generators for 17,500 MW and reprocesses all Uranium and Plutonium Waste.',
    highlight:
      'Watch the Plutonium Waste pass through Ficsonium into fuel rods, with all three kinds of fuel rod entering the plants.',
    mechanism: [
      'Make Uranium Fuel Rod as in stage 1 and Plutonium Fuel Rod as in stage 2, and burn each in Nuclear Power Plants.',
      'Feed the Plutonium Waste into a Particle Accelerator with Singularity Cell and Dark Matter Residue to make Ficsonium.',
      'Dark Matter Residue comes from Reanimated SAM in a Converter. Singularity Cell is built in a Manufacturer from Nuclear Pasta, Dark Matter Crystal, Iron Plate and Concrete.',
      'Feed Ficsonium, Electromagnetic Control Rod, Ficsite Trigon and Excited Photonic Matter into a Quantum Encoder to make Ficsonium Fuel Rod. The Dark Matter Residue it gives back goes into the Ficsonium step.',
      'Burn the Ficsonium Fuel Rod in a Nuclear Power Plant. This rod leaves no waste, so no nuclear waste ever leaves the site.',
    ],
    tips: [
      'The plan reprocesses all of the Uranium Waste and all of the Plutonium Waste. A stall anywhere backs the waste up into the plants and stops the power, so put containers in front of each waste step as a buffer.',
      'The radioactive materials now include three kinds of fuel rod and two kinds of waste. Keep the reprocessing block away from the factory proper, and protect yourself with distance, a Hazmat Suit and Iodine-Infused Filters. Walls and floors do not shield radiation. This diagram is a steady-rate material-balance plan; it does not simulate startup inventories, pipe flow, or whether the loop will prime and circulate in a built factory.',
      'On top of Sulfuric Acid and Nitric Acid you need pipes for Excited Photonic Matter and Dark Matter Residue. Run the fluids and gases in before starting and confirm that the Particle Accelerators and the Quantum Encoder can accept them.',
      'Only two settings differ from stage 2: Ficsonium Fuel Rod was added to the fuels, and “leave none behind” is ticked for Plutonium Waste. To stop at plutonium, undo those two.',
      'The 5,000 MW target is not the generated output: the planner models whole non-biomass generators at 100% clock, so this plan estimates 17,500 MW. In-game you can manually underclock generators to match demand and lower fuel use; that adjustment is not modeled here.',
    ],
  },
}
