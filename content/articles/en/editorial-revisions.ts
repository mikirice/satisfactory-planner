import type { HandwrittenArticle } from '../types.ts'
import { awesomeSinkPointsArticleEn } from './awesome-sink-points.ts'
import { fluidTruckDeliveryArticleEn } from './fluid-truck-delivery.ts'
import { vehiclePathsArticleEn } from './vehicle-paths.ts'
import { conveyor_throughput_monitor_guide_enArticle } from './conveyor-throughput-monitor-guide.ts'
import { hypertube_junction_routing_guide_enArticle } from './hypertube-junction-routing-guide.ts'
import { freight_platform_loading_diagnosis_enArticle } from './freight-platform-loading-diagnosis.ts'
import { pipeline_flow_head_lift_troubleshooting_enArticle } from './pipeline-flow-head-lift-troubleshooting.ts'
import { smart_splitter_overflow_storage_guide_enArticle } from './smart-splitter-overflow-storage-guide.ts'

const revised = (base: HandwrittenArticle, title: string, description: string, versionNotice: string, sections: HandwrittenArticle['sections'], relatedArticleSlugs: readonly string[]): HandwrittenArticle => ({ ...base, title, description, updatedDate: '2026-10-20', versionNotice, sections, relatedArticleSlugs })
const DATA_SCOPE = 'Planner values are calculations from its bundled 1.1.x data, not current in-game measurements by the author.'

export const awesomeSinkPointsArticleRevisionEn = revised(awesomeSinkPointsArticleEn,
  'Before You Sink It — Compare Points, Upstream Work, and Stock',
  'Compare points per minute with upstream inputs and reserved inventory to decide what can safely go to the AWESOME Sink.',
  `${DATA_SCOPE} Coupon thresholds can vary by save progression; this guide does not promise a coupon time.`, [
    { heading: 'Separate surplus from stock you still need', paragraphs: [
      'Before choosing a Sink input, subtract planned construction, research, deliveries, and reserve stock. Only the remainder is surplus. A direct belt from production to the Sink can destroy items you intended to keep. Route through storage or a controlled overflow path, then test with one item at a time.',
      'The bundled item data stores sinkPoints per item. Sink eligibility is a separate check: this Planner counts solid items with a positive point value. A value alone does not mean a liquid or gas can be inserted.',
    ]},
    { heading: 'Compare the same time window in points per minute', paragraphs: [
      'Use sinkable items/min × points/item = points/min. In the bundled data, 20 Iron Plates/min at 6 points each is 120 points/min. Sinking the 30 Iron Ore/min used by the standard recipe directly would yield 30 points/min. On this recipe path, processing the same ore into plates gives four times the theoretical points. The tradeoff is smelter power, machine capacity, and plates you may need later.',
      'When comparing one recipe, count only sinkable solids on both input and output sides. Fluids such as Water, Crude Oil, and Sulfuric Acid are not part of that ratio, so a recipe multiplier is not a whole-factory efficiency score.',
    ], tables: [{ caption: 'Simple comparison for 20 Iron Plates/min (bundled 1.1.x data)', headers: ['Choice', 'Amount sunk', 'Points/min', 'Cost of the choice'], rows: [
      ['Sink Iron Ore directly', '30 ore/min', '30', 'Ore no longer available upstream'],
      ['Process to Iron Plates', '20 plates/min', '120', 'Smelter power, machine time, plate stock'],
      ['Store required stock; sink surplus', 'Measured surplus only', 'surplus × 6', 'Storage and routing rules'],
    ]}] },
    { heading: 'Advance a process only when its tradeoff fits', paragraphs: [
      'A higher point total does not make processing the right choice in every save. The alternate recipe may be locked, machines or power may be scarce, or the output may be needed later. Compare the same output period, ore stock, and unlocked recipes, then include added machines and auxiliaries.',
      'To estimate time to a coupon, check the save’s remaining points and use its measured points/min: remaining points ÷ points/min. If the rate changes over time, a constant-rate estimate is not valid. Do not apply a fixed coupon threshold without checking the save.',
    ]},
    { heading: 'What Planner can calculate and what the save must confirm', paragraphs: [
      'Planner pages can compare bundled item values, recipe inputs, and theoretical output rates. Whether stock is truly surplus, whether the belt reaches storage, whether the Sink accepts the item, and how quickly points accrue must be checked in the save. For a test, isolate one item and record starting stock, times, displayed points, and remaining storage.',
    ]},
  ], ['strong-alternate-recipes','smart-splitter-overflow-storage-guide'])

export const fluidTruckDeliveryArticleRevisionEn = revised(fluidTruckDeliveryArticleEn,
  'Can Fluid Trucks Meet Demand? Measure Loads, Loops, and Buffer',
  'Separate capacity from supply rate, then use measured unloads, loop time, and the longest delivery gap to size a route and buffer.',
  'The 3,200 m³ truck and station capacity is stated in the Update 1.2 announcement. The measurements below are examples, not values tested by the author in-game.', [
    { heading: 'Keep capacity, average supply, and delivery gaps separate', paragraphs: [
      'A 3,200 m³ capacity describes storage, not a per-minute delivery rate. To decide whether a route can support a consumer, measure the amount that actually reaches the consumer and the interval between deliveries. A full-load capacity divided by average loop time can mislead when the truck spends part of the loop driving without cargo.',
      'For continuous demand, compare average delivered rate with average consumption, then size a buffer for the longest gap without a delivery. A route can meet the long-run average and still starve a consumer between batches.',
    ], tables: [{ caption: 'Record one loop (illustrative values only)', headers: ['Event', 'Record', 'Example'], rows: [
      ['Start and end', 'Total inventory in the same receiving tanks', '100 m³ start, 40 m³ end'],
      ['During interval', 'Consumption plus other inflows and outflows', '300 m³ consumed, 50 m³ other inflow'],
      ['Return', 'Loop time T and calculated truck delivery', 'T=12 min, 300+(40−100)−50=190 m³'],
      ['Between stops', 'No-delivery time, traffic, loading wait', 'Record separately'],
      ['Next loop', 'Repeat under the same conditions', 'Use at least two loops'],
    ]}] },
    { heading: 'Measure delivery while the receiver is consuming', paragraphs: [
      'Fix the boundary at the receiving tank group. At the start and end, total the fluid in the same tanks. Separately record fluid consumed downstream during the interval, every non-truck inflow, and every drain or branch that leaves the boundary.',
      'Truck delivery = ending inventory − starting inventory + consumption during the interval + other outflows − other inflows. For example, if inventory falls from 100 to 40 m³ while machines consume 300 m³, another pipe supplies 50 m³, and there are no other outflows, the truck delivered (40−100)+300−50=190 m³. The inventory change alone (−60 m³) is not the delivered amount.',
      'Measure consumption for only the machines inside the boundary using their displayed input rate and actual run time, or an independent flow record. Let the pipe inventory settle before starting and avoid changing other connections during the interval. If another flow cannot be measured, report the result as an estimate rather than a confirmed truck delivery.',
    ]},
    { heading: 'Calculate average supply and minimum buffer', paragraphs: [
      'Suppose a consumer uses 40 m³/min and a truck actually delivers 480 m³ every 12 minutes. Average supply is 480 ÷ 12 = 40 m³/min, exactly equal to demand. The stock needed to bridge that 12-minute gap is 40 × 12 = 480 m³. Add the longest observed gap, competing consumers, and any unload that stops early.',
      'A rough buffer requirement is consumption rate × longest minutes without delivery. If load size varies, calculate a conservative case using the smallest delivery and longest interval. A station capacity of 3,200 m³ does not by itself settle the question: truck cargo, consumer storage, and stop time are separate constraints.',
    ], tables: [{ caption: 'Decide from the example record', headers: ['Condition', 'Calculation', 'Interpretation'], rows: [
      ['Average supply', '480 ÷ 12 = 40 m³/min', 'No average margin for demand of 40'],
      ['Stock between deliveries', '40 × 12 = 480 m³', 'Illustrative minimum at that interval'],
      ['Longest gap is 15 min', '40 × 15 = 600 m³', 'Recalculate from the longest observed gap'],
    ]}] },
    { heading: 'When average supply is short or stock still runs out', paragraphs: [
      'If average delivery is below demand, check actual unload per trip, source stock, and other consumers before adding vehicles. If average supply is enough but stock runs out, inspect the longest gap, traffic or route stops, and consumer buffer. Change only one factor—vehicle count, route, or buffer—and repeat the same measurement.',
      'When trucks share a station or road, more vehicles can increase waiting time. Compare several loops after adding a truck; do not assume loop time stayed constant.',
    ]},
    { heading: 'Make the measurement reproducible', paragraphs: [
      'Record game version, fluid, truck count, delivered amount per trip, departure and return time, consumer stock at both ends, running consumers, and waits. The 40 m³/min and 12-minute values are an arithmetic example. Keep the public capacity statement separate from measurements in your own save.',
    ]},
  ], ['vehicle-paths','train-replenishment-buffer-planning-guide'])

export const vehiclePathsArticleRevisionEn = revised(vehiclePathsArticleEn,
  'Switch Vehicle Paths Safely — Short Trials and Failure Diagnosis',
  'Test a new vehicle path on a short segment while preserving the old route; check passage, stops, and the return leg separately.',
  'Feature descriptions and fix history refer to official update notes. The author has not tested the current client or confirmed input-specific button labels.', [
    { heading: 'Build a short test before replacing a working route', paragraphs: [
      'First test a short round trip without junctions or loading. Add turns or junctions one at a time only if the production route needs them. Keep the previous route until the new one passes, and compare both with the same vehicle, start, and destination. Follow the current on-screen prompt; do not infer exact controls from another UI version.',
    ], lists: [{ ordered: true, items: [
      'In Build Menu > Transport, choose the Vehicle Path for your vehicle type. Use the Build Gun to place a short connected path from Station A to Station B and back to A.',
      'Place the vehicle on the path and confirm that Stations A and B appear in its available Vehicle Menu entries.',
      'Enter the vehicle and open Vehicle Menu > Stations / Routes. Select or configure one round trip in the order A → B → A, following the choices shown by the current UI. If a station is missing, check its connection to the path first.',
      'Confirm the displayed stop order, then watch the vehicle complete the outward leg, stop at B, and return to A.',
      'Repeat at least two loops and record each stop, collision, or wrong turn.',
      'Switch the production route only after the test passes; keep the old route available for rollback.',
    ]}] },
    { heading: 'Separate no-start, stop, and wrong-turn symptoms', paragraphs: [
      'If a vehicle does not leave the start, check its operating state, start connection, and position on the path one at a time. If it stops mid-route, inspect the section immediately before the stop for an obstacle or broken connection and retry the same segment. If it takes the wrong branch, confirm the path reaches the junction first, then change only the branch selection or input timing.',
    ], tables: [{ caption: 'First check by symptom', headers: ['Symptom', 'Check first', 'If changing something'], rows: [
      ['Does not leave start', 'Operating state, start link, vehicle position', 'Change one start or vehicle condition'],
      ['Stops at the same point', 'Clearance and path continuity there', 'Change one obstacle or node'],
      ['Takes wrong branch', 'Path to junction and return direction', 'Change one branch setting and retry'],
      ['Only return leg fails', 'Return start and connection direction', 'Inspect return-side links separately'],
    ]}] },
    { heading: 'Read current behavior separately from patch history', paragraphs: [
      'An official note can establish that a feature was added or a specific defect was fixed. It does not guarantee success for your vehicle, curve, or junction. Check the displayed game build before applying an old known issue as the cause.',
      'For a current reproduction, report build number, input device, path shape, trial count, failure location, and before/after change. This guide supplies a check procedure, not an author-tested result in the current game.',
    ]},
  ], ['fluid-truck-delivery','freight-platform-loading-diagnosis'])

export const conveyorThroughputMonitorArticleRevisionEn = revised(conveyor_throughput_monitor_guide_enArticle,
  'Use the Conveyor Throughput Monitor — Compare a Plan with a Measured Window',
  'Fix the observation interval, record display units and idle time, and separate an upstream shortage from a meter or setup issue.',
  'Monitor behavior and fixes refer to the cited materials. This measurement protocol and its numbers are examples, not a current-game measurement by the author.', [
    { heading: 'First put the plan and observation in matching units', paragraphs: [
      'Planner targets are usually items/min; a field display may show a rate or a count over a window. Check the current UI to learn whether the reading is a per-minute conversion, a period count, or a value refreshed at a particular time. Do not compare an unknown unit to a production rate.',
      'Fix one segment from start to end. Record plan input, game version, item, clock, upstream stock, and running consumers. If the observation window is 60 seconds, 108 items in that window converts to 108/min. Record time with an empty belt separately.',
    ], tables: [{ caption: 'Illustrative log (not a measured result)', headers: ['Window', 'Count', 'Converted rate', 'Also record'], rows: [
      ['60 seconds', '108 items', '108/min', 'Empty time and upstream stock'],
      ['Next 60 seconds', '120 items', '120/min', 'Consumer and belt stop state'],
      ['Compare', 'Plan: 120/min', '−12 then 0', 'Inspect upstream and splits in the first window'],
    ]}] },
    { heading: 'Do not treat zero or a low reading as proof of failure', paragraphs: [
      'If the display reads zero, check whether items actually moved during the window, whether the display refreshed, and whether the correct belt and direction are selected. A window that includes idle time is not the same as peak throughput. But if idle time causes real shortages, keep it in the operational average instead of excluding it.',
      'Planner calculates recipes and equipment; it does not predict a live meter reading. When values differ, compare recipe, clock, duty cycle, and upstream supply one item at a time.',
    ]},
    { heading: 'Test one hypothesis at a time', paragraphs: [
      'Before upgrading a belt, check whether stock immediately upstream falls, and compare flow on both sides of the first shared split. An empty upstream buffer supports a supply-shortage hypothesis; a difference appearing only across a split points to allocation or route conditions. Do not change machine, belt, and meter together.',
    ], lists: [{ ordered: true, items: [
      'Measure the same item and segment in at least two equal windows.',
      'Record upstream stock, meter value, downstream stock, and idle time at each end.',
      'Make one change and repeat the same window under the same conditions.',
      'Revert it to see whether the symptom returns; set a success condition in advance.',
    ]}] },
    { heading: 'Keep a reusable reproduction log', paragraphs: [
      'Include build, location, item, window length, count, units, plan target, upstream stock, downstream demand, empty time, belt type, and each change. A screenshot alone does not establish elapsed time or operating state. Check your build number against the official fix record before applying a known issue.',
    ]},
  ], ['resource-throughput-capacity-guide','priority-merger-use-cases-guide'])

export const hypertubeJunctionArticleRevisionEn = revised(hypertube_junction_routing_guide_enArticle,
  'Troubleshoot a Hypertube Junction — Test One Branch at a Time',
  'When a junction will not accept you, sends you to the wrong exit, or leaves you unable to return, inspect prompts and geometry on a short route.',
  'The author has not tested current Update 1.2.x input or junction behavior. Follow the current on-screen prompt; this guide does not guess a key or controller action.', [
    { heading: 'Reduce the route to one test junction', paragraphs: [
      'Do not troubleshoot a large travel network at once. Keep only the entrance, one junction, and one exit. Make the connected tube segments distinguishable and record the prompt shown by the current UI. Keyboard and controller prompts can differ, so do not copy a control from another setup.',
    ], lists: [{ ordered: true, items: [
      'Travel from the entrance to the junction and note your movement just before it.',
      'If a selection or direction prompt appears, use the displayed hint once.',
      'Record whether you leave through the selected branch and when the prompt disappears.',
      'Test the return leg from the exit separately.',
    ]}] },
    { heading: 'Choose the next check from the symptom', paragraphs: [
      'If you cannot enter, inspect connections, approach angle, and whether a straight segment works at the same location. If you take the wrong branch, check prompt timing and branch shape separately. If you reach an exit but cannot return, treat the return path as its own junction; do not infer that both directions expose identical choices.',
    ], tables: [{ caption: 'Symptom-led checks', headers: ['Symptom', 'Observe', 'Next test'], rows: [
      ['Cannot enter', 'Connection and approach direction', 'Compare with a straight segment'],
      ['Wrong branch', 'Prompt timing and branch connections', 'Change timing only on the same short route'],
      ['Prompt disappears', 'Position when it appears and disappears', 'Stop just before the junction and observe'],
      ['Return leg fails', 'Return entrance, exit, and direction', 'Test the return as a separate segment'],
    ]}] },
    { heading: 'Change one geometry variable and record the result', paragraphs: [
      'Change one property at a time—rotate the junction, shorten a branch, or straighten an entrance. Retry from the same position with the same input device and record before/after results. Community posts and old-version instructions are clues, not proof of current behavior.',
      'A useful reproduction includes build number, input device, junction shape, approach direction, prompt, and successful/failed trial count. These are proposed diagnostic steps, not an author-run Update 1.2 test.',
    ]},
  ], ['vehicle-paths','blueprint-designer-workflow'])

export const freightPlatformArticleRevisionEn = revised(freight_platform_loading_diagnosis_enArticle,
  'Freight Station Not Moving Cargo? Check Car Position with a One-Car Test',
  'Map each freight car to its platform, then use one item and two inventory readings to locate a loading or unloading failure.',
  'Setup and loading descriptions refer to cited materials. The author has not tested the current client UI, fluid cargo, or every train length.', [
    { heading: 'Start with one car and one test item', paragraphs: [
      'A train arriving at a station does not prove that the intended platform is loading or unloading. With several cars and platforms, map each car from the locomotive end to the platform beneath it. Reduce the test to one car, one item, and one station at a time before investigating mixed cargo.',
    ], lists: [{ ordered: true, items: [
      'Record station approach and stop position; identify the platform under the test car.',
      'Load a small amount of one test item and note the car and platform at both stations.',
      'Record platform stock, car inventory, and departure time at each stop.',
      'Run the same train back and compare the mapping in both directions.',
    ]}] },
    { heading: 'When the train stops but inventory does not change', paragraphs: [
      'First confirm that the belt or pipe is connected to the intended input or output side. Then check platform type and position, and whether the source or destination is empty or full. Distinguish cargo that never moved from cargo that moved briefly after the stop.',
      'Check source stock → clear output path → car position → platform type → inventory before and after the stop. Recording each stage separates loading from unloading.',
    ]},
    { heading: 'Trace the wrong item with a station-by-station table', paragraphs: [
      'For mixed cargo, list each car, its item, and the platform expected at every stop. If the arriving car and received item do not match, check car order, platform pairing, station configuration, and belt connection before changing train signals.',
    ], tables: [{ caption: 'Simple cargo trace', headers: ['Station', 'Car position', 'Expected item', 'Inventory change', 'Next check'], rows: [
      ['Pickup', 'Car 1 → platform 1', 'Test item A', 'Record', 'Supply and load side'],
      ['Drop-off', 'Car 1 → platform 1', 'Test item A', 'Record', 'Car contents and unload side'],
    ]}] },
    { heading: 'Keep signaling separate from cargo handling', paragraphs: [
      'Signals determine whether a train can proceed; cargo handling determines whether inventory transfers while it is stopped. If the block test in the Train Signals guide shows a normal stop, inspect inventory and platform pairing before moving signals. Check pipes separately for fluids; a solid-belt test does not prove fluid cargo behavior.',
      'For a current reproduction, record build, station direction, car order, platform type, test item, dwell time, and inventory before/after values.',
    ]},
  ], ['train-signals-guide','train-replenishment-buffer-planning-guide'])

export const pipelineFlowArticleRevisionEn = revised(pipeline_flow_head_lift_troubleshooting_enArticle,
  'Diagnose a Pipe Shortage — Test Supply, Head Lift, and Shared Demand',
  'When a pipe endpoint starves, isolate total supply, elevation, and shared consumers with a one-change-at-a-time procedure.',
  'All numeric examples are assumptions to explain a balance. The author has not measured current in-game flow, head-lift displays, or split behavior.', [
    { heading: 'Put supply and demand in the same units', paragraphs: [
      'If a pipe endpoint stalls, add consumer demand in the same time unit. With an assumed supply of 100 m³/min and two consumers using 40 and 50 m³/min, a simple balance leaves 10 m³/min. That does not guarantee field flow, but it separates a total shortage from other causes. Record each machine’s recipe and clock because its displayed demand may differ.',
      'At the source, observe pumps, extraction, tank level, and the pipe before the first split. At consumers, record which units are running and whether demand changes. If stopping a consumer lets upstream stock recover, that is useful evidence about the shortage.',
    ]},
    { heading: 'Test elevation separately from total supply', paragraphs: [
      'If supply appears adequate but a raised segment starves, inspect the pipe elevation and pump display before and after that section. Do not add several pumps at once. Check orientation and placement indicators, then note the build and observed display; head-lift indicators can depend on game version.',
    ], tables: [{ caption: 'Hypothesis-led observation points', headers: ['Hypothesis', 'Where to observe', 'Clue'], rows: [
      ['Total supply shortage', 'Source and first point before a split', 'Upstream stock recovers when demand stops'],
      ['Elevation/head lift', 'Raised segment and pump before/after it', 'Only the elevated section is short under the same supply'],
      ['Shared allocation', 'Before and after split; each consumer', 'Total supply exists but one branch varies'],
      ['Configuration mismatch', 'Machine recipe, clock, running state', 'Planned and configured demand differ'],
    ]}] },
    { heading: 'At junctions, change one condition at a time', paragraphs: [
      'Record flow before and after the split, branch connections, and other consumers on the same line. Do not assume equal, prioritized, or fixed-ratio distribution without evidence. Stop one consumer at a time and observe what changes.',
      'Do not change a tank, pump, split, and recipe together. For example, move one pump and compare the same operating interval. If there is no change, revert and test the next hypothesis. Define success as a specific outcome, such as all consumers running continuously under the same load.',
    ]},
    { heading: 'What a useful field log contains', paragraphs: [
      'Record build, fluid, supply rate, each consumer rate, clocks, tank level, elevation changes, pump locations, and observation interval. Keep stop time in the log. The 100 versus 40+50 example is arithmetic only, not an experiment.',
    ]},
  ], ['aluminum-production-guide','resource-throughput-capacity-guide'])

export const smartSplitterArticleRevisionEn = revised(smart_splitter_overflow_storage_guide_enArticle,
  'Send Overflow to the Sink Only When Storage Is Full — A Two-State Test',
  'Use a single-item test to check storage and full states, and avoid losing stock to unknown items or a blocked downstream belt.',
  'Splitter and Sink behavior refers to the cited Wiki description and official fix history. The author has not tested the current client.', [
    { heading: 'Limit the test input and route', paragraphs: [
      'Use one known Sink-eligible item. Trace the input, storage output, Overflow output, and the belt to the AWESOME Sink. Do not test with production stock or rare items. Add mixed items and multiple Overflow outputs only after the single-item route is understood.',
    ], lists: [{ ordered: true, items: [
      'Set an explicit filter for one item and use a source that sends no other item.',
      'With storage space available, confirm the item reaches storage.',
      'Fill storage using test stock, then send more of the same item and observe the overflow path.',
      'Record stock after the splitter and before the Sink in both states.',
    ]}] },
    { heading: 'Expected result and how to distinguish a failure', paragraphs: [
      'The Wiki describes Overflow as a fallback when no other output is available, not as a permanently preferred surplus lane. If items go to the Sink while storage has room, check the filter, other output rules, and belt connections. If items do not flow when storage is full, check the Overflow setting, downstream blockage, and whether a non-sinkable item is mixed in.',
    ], tables: [{ caption: 'Single-item expected observations', headers: ['State', 'Expected observation', 'If different'], rows: [
      ['Storage has room', 'Item flows to storage', 'Check filter and output connection'],
      ['Storage is full', 'Item can use Overflow path', 'Check setting and downstream passage'],
      ['Ineligible item enters', 'Stop test and inspect blockage', 'Do not connect unknown mix to production'],
    ]}] },
    { heading: 'Make a rule table before using mixed items', paragraphs: [
      'For each item, list its storage output, Overflow destination, Sink eligibility, and other matching rules. A rejected item may block the downstream route. Keep unknown items on a hold path and test them individually before joining the production line.',
      'For a simple example, output at 60/min and normal demand at 40/min leaves 20/min by arithmetic. Set a stock floor for construction, then check storage, Sink count, and downstream supply after a small test. If storage has room but an item goes to the Sink, inspect priority, filters, and merges. If full storage blocks overflow, inspect the Overflow setting and the downstream belt.',
      'Record any lost test items and the settings changed so you can restore the original route. This is a proposed test procedure, not an author-verified current-game result.',
    ]},
  ], ['awesome-sink-points','priority-merger-use-cases-guide'])
