import type { HandwrittenArticle } from '../types.ts'
import { strongAlternateRecipesArticleEn } from './strong-alternate-recipes.ts'
import { productionPlanningTutorialArticleEn } from './production-planning-tutorial.ts'
import { blueprintDesignerWorkflowArticleEn } from './blueprint-designer-workflow.ts'
import { space_elevator_project_assembly_batch_planning_guide_enArticle } from './space-elevator-project-assembly-batch-planning-guide.ts'
import { aluminumProductionGuideArticleEn } from './aluminum-production-guide.ts'
import { packagedNitrogenEmptyFluidTankCirculationPlanningArticleEn } from './packaged-nitrogen-empty-fluid-tank-circulation-planning.ts'
const addSections = (base: HandwrittenArticle, additions: HandwrittenArticle['sections'], relatedArticleSlugs: readonly string[]): HandwrittenArticle => ({ ...base, updatedDate: '2026-10-20', sections: [...base.sections, ...additions], relatedArticleSlugs })

export const strongAlternateRecipesArticleMergedEn = addSections(strongAlternateRecipesArticleEn, [
  { heading: 'For 15 Motors/min, choose from the parts you already have', paragraphs: [
    'Compare the recipes at the same 15 Motors/min target and separate direct inputs from upstream work. In the Planner’s bundled 1.1.x data, the standard recipe uses 3 Assemblers, 30 Rotors/min, and 30 Stators/min; Electric Motor uses 2 Assemblers, 15 Rotors/min, and 7.5 Electromagnetic Control Rods/min; Rigor Motor uses 2 Manufacturers, 7.5 Rotors/min, 7.5 Stators/min, and 2.5 Crystal Oscillators/min.',
    'If Rotors and Stators are already in surplus, the standard route is simple. If you can supply Control Rods without adding a new chain, Electric Motor uses half as many Rotors and no Stators. If both parts are constrained but Crystal Oscillators are available, Rigor Motor is an option. These are final-recipe inputs only; solve the full upstream plan if you must build the Rod or Oscillator supply.',
  ], tables: [{ caption: 'Direct recipe inputs for 15 Motors/min (bundled 1.1.x data)', headers: ['Recipe', 'Machines', 'Rotors/min', 'Stators/min', 'Added input/min'], rows: [
    ['Standard', '3 Assemblers', '30', '30', 'None'],
    ['Electric Motor', '2 Assemblers', '15', '0', '7.5 Electromagnetic Control Rods'],
    ['Rigor Motor', '2 Manufacturers', '7.5', '7.5', '2.5 Crystal Oscillators'],
  ]}] },
], ['somersloop-and-power-shards','production-planning-tutorial'])

export const productionPlanningTutorialArticleMergedEn = addSections(productionPlanningTutorialArticleEn, [
  { heading: 'Check belt count and machine count against one example', paragraphs: [
    'The standard-recipe 60 Iron Plates/min sample places one Miner Mk.3, three Smelters, and three Constructors. Its stages carry 90 Iron Ore/min into 90 Iron Ingots/min, then 60 Iron Plates/min. Bundled 1.1.x belt ratings are Mk.1 60, Mk.2 120, Mk.3 270, Mk.4 480, Mk.5 780, and Mk.6 1,200 items/min; pipes are Mk.1 300 and Mk.2 600 m³/min. One Mk.2 belt is nominally enough for each 90/min segment; 60 Plates/min exactly matches Mk.1. This is a rating comparison, not a measurement of in-game merges or congestion.',
    'Count placed machines from the build list, divide each flow by belt capacity and round up, then add every consumer on shared segments. If another 60/min line joins a 120/min Mk.2 belt, the nominal segment is exactly full. Separate the lines or choose a higher tier if another consumer or fluctuation exists, then check actual arrival at the endpoints.',
  ], tables: [{ caption: 'Belt check for the 60 Iron Plates/min example (bundled 1.1.x data)', headers: ['Segment', 'Rate', 'Rating to compare', 'Decision'], rows: [
    ['Iron Ore → Smelters', '90/min', 'Mk.2 120/min', 'Within nominal capacity'],
    ['Iron Ingots → Constructors', '90/min', 'Mk.2 120/min', 'Add other shared uses'],
    ['Iron Plates → storage', '60/min', 'Mk.1 60/min', 'No nominal margin; inspect destination'],
  ]}] },
  { heading: 'Turn results into a field build order', paragraphs: [
    'Read production steps by machine and recipe, then make one work-list row for machine count, clock, input belt, and output belt. Build in stages: source, first processing step, intermediates, then final product. Record both equivalent operating machines and the whole machines you will place; they are not always the same number.',
    'Planner floor area is an estimate of project scale from selected recipes and machine counts. It is not a finished floor plan that includes walkways, columns, height changes, belt turns, pipes, or maintenance access. Use the build list to lay out a real module, measure it, and adjust. Do not turn the area estimate directly into one side length of a platform.',
  ], lists: [{ ordered: true, items: [
    'Secure input resources and the upstream units that must stay powered.',
    'Record both whole machine count and equivalent count; mark clocks below 100%.',
    'Trace shared belts and pipes and compare total demand with displayed capacity.',
    'Measure each installed area after changing the layout; keep that measurement separate from the estimate.',
  ]}] },
], ['excel-export-guide','strong-alternate-recipes'])

export const blueprintDesignerWorkflowArticleMergedEn = addSections(blueprintDesignerWorkflowArticleEn, [
  { heading: 'Test Auto Connect on a short pair of modules', paragraphs: [
    'Blueprint Auto Connect concerns candidate links while placing saved modules; it is separate from designing and saving a Blueprint. Put the belt or pipe endpoints on the same side of each module boundary. Place two small modules first and inspect the candidate shown by the current placement UI.',
    'If no candidate appears, check endpoint alignment, transport type, and whether an endpoint is obstructed, one at a time. A displayed candidate does not prove that the finished route has enough throughput. Keep the original orientation and be ready to use a manual connection. The author has not verified every current input control or eligible connection type in-game.',
  ]},
], ['production-planning-tutorial','somersloop-and-power-shards'])

export const spaceElevatorBatchArticleMergedEn = addSections(space_elevator_project_assembly_batch_planning_guide_enArticle, [
  { heading: 'Use whole batches for finite stock', paragraphs: [
    'A deadline plan compares continuous per-minute rates; processing a finite warehouse stock needs whole recipe cycles first. In the bundled 1.1.x Solid Biofuel recipe, 8 Biomass become 4 Solid Biofuel in 4 seconds. With 3,008 Biomass, floor(3,008÷8)=376 cycles produce 1,504 fuel. With 3,009 Biomass, the same 376 cycles leave 1 Biomass.',
    'At 100% clock with uninterrupted operation, one Constructor takes 376×4=1,504 seconds (25:04). Two split the work into 188 cycles each and take 752 seconds (12:32); three assigned 126, 125, and 125 cycles finish in 504 seconds (8:24). Machine count changes ideal time, not total yield. This arithmetic excludes outages, transport, manual handling, and real startup.',
    'This is not the Space Elevator quantity or deadline formula. Confirm version, recipe inputs, outputs, and cycle time; record finite stock separately from per-minute targets. Planner solves a continuous rate plan and does not consume a finite inventory in recipe-sized batches to predict completion time.',
  ]},
], ['production-planning-tutorial','resource-throughput-capacity-guide'])

export const aluminumProductionGuideArticleMergedEn = addSections(aluminumProductionGuideArticleEn, [
  { heading: 'For 60 Batteries/min, separate return water from fresh water', paragraphs: [
    'The 60 Aluminum Ingots/min example and the 60 Batteries/min sample have different water balances. In the bundled 1.1.x Battery example, the Battery process returns 90 m³/min and the Scrap process returns 45 m³/min, for 135 m³/min reused in Alumina Solution. Producing 210 m³/min of Alumina Solution uses 315 m³/min of water; the Sulfuric Acid chain needs another 150 m³/min. Fresh water is therefore 315+150−135=330 m³/min.',
    'The 135 m³/min return is water available to this process, not proof that the whole factory is water-self-sufficient. At startup, return water does not exist yet: supply fresh water to prime the line, then verify the return path after Scrap starts. Keep the separate 150 m³/min Sulfuric Acid demand from being counted twice.',
  ], tables: [{ caption: 'Water balance for the 60 Batteries/min sample (1.1.x calculation)', headers: ['Path', 'Water m³/min', 'Treatment'], rows: [
    ['Battery return', '90', 'Return to Alumina Solution'],
    ['Scrap return', '45', 'Return to Alumina Solution'],
    ['Alumina Solution demand', '315', '135 return + 180 fresh'],
    ['Sulfuric Acid demand', '150', 'Separate fresh-water supply'],
    ['Total fresh water', '330', '180 + 150'],
  ]}] },
], ['oil-products-basics','pipeline-flow-head-lift-troubleshooting'])

export const packagedCirculationArticleMergedEn = addSections(packagedNitrogenEmptyFluidTankCirculationPlanningArticleEn, [
  { heading: 'Separate startup containers from circulating stock', paragraphs: [
    'When sizing an empty-container loop, distinguish the initial items needed to start from containers circulating during steady operation. The Planner’s packaged diluted-fuel sample starts with four canisters for a 120 m³/min fuel example, then returns empty canisters to packaging. If part of the return belt blocks, packaging can run out of empty containers before the fuel line looks empty.',
    'Four is a value for that sample setup, not a universal route requirement. For another layout, use measured loop time and consumption to calculate ceil(rate × loop time), then add loss and startup reserve separately. Check that containers return and that by-product outlets such as Resin stay clear.',
  ], tables: [{ caption: 'Keep startup and circulation inventories separate', headers: ['Inventory', 'Purpose', 'Check'], rows: [
    ['Startup containers', 'External items to prime the loop', 'Did they reach the packaging input before startup?'],
    ['Circulating containers', 'Packaging → transport → unpackaging → return', 'Return route, cycle time, blockage, loss'],
    ['Reserve', 'Buffer for delays', 'Base it on the longest measured delay'],
  ]}] },
], ['fluid-truck-delivery','oil-loop-complete','packaged-diluted-fuel-loop'])
