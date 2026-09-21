import type { HandwrittenArticle } from '../types.ts'

/**
 * English version of content/articles/strong-alternate-recipes.ts. Every figure comes from the
 * same recipe, generator, extractor and map-limit data (see the source list in the Japanese file).
 */
export const strongAlternateRecipesArticleEn = {
  slug: 'strong-alternate-recipes',
  title: 'The Strongest Alternate Recipes and When to Use Them — Ore, Buildings and Power Compared with Real Numbers',
  description:
    'Pure Iron Ingot, Steel Screws, Solid Steel Ingot, Wet Concrete, Diluted Fuel, Fused Quickwire and other high-impact alternates, compared with the standard recipes at the same output: ore saved, buildings saved, power added, plus how to use them in the planner and when they backfire.',
  publishedDate: '2026-09-21',
  sections: [
    {
      heading: 'Decide what "strong" means first',
      paragraphs: [
        'An alternate recipe can be strong in four different ways: it needs less ore for the same output, it needs fewer buildings, it avoids a resource that is scarce on the map, or it turns a byproduct such as Heavy Oil Residue into an ingredient. Those are not interchangeable. The map holds 92,100 Iron Ore per minute but only 15,000 Caterium Ore and 12,300 Bauxite, so "30% less ore" is worth far more on caterium than on iron. Every comparison below holds the output rate equal to the standard recipe and works from the recipe inputs, outputs and cycle time. How to read the individual metrics is covered in the article on choosing alternate recipes.',
      ],
    },
    {
      heading: 'Early iron and copper',
      paragraphs: [
        'Pure Iron Ingot runs in a Refinery: 35 Iron Ore and 20 m³ of Water per minute become 65 Iron Ingot. The Smelter turns one ore into one ingot, so the ore needed for those 65 ingots drops from 65 to 35, a 46% saving. The price is power: 2.17 Smelters draw 8.7 MW, one Refinery draws 30 MW. Iron Alloy Ingot runs in a Foundry, 40 Iron Ore and 10 Copper Ore per minute for 75 ingots, which is 47% less iron ore and 33% less ore in total. It unlocks earlier than the Refinery and needs no water, so it is the safer first pick.',
        'Screws have two useful alternates. Cast Screws makes 50 screws per minute directly from 12.5 Iron Ingot and skips the Iron Rod step. Screws per ingot stay at 4, the same as the standard route, but for 260 screws per minute the building count falls from 13 to 7.4 and power from 52 MW to 29.5 MW. Steel Screws turns 5 Steel Beam per minute into 260 screws; even after adding 0.33 of a beam Constructor and 0.44 of a Foundry, the chain is 1.8 buildings and 12.4 MW, fed by 20 Iron Ore and 20 Coal per minute. Against the 65 Iron Ore of the standard route, that is 69% less iron ore.',
        'For copper, Pure Copper Ingot (15 Copper Ore plus 10 m³ Water per minute for 37.5 ingots) cuts ore by 60%, and Copper Alloy Ingot (50 Copper Ore plus 50 Iron Ore for 100 ingots) cuts copper ore by 50%. Copper Alloy uses the same total ore as the standard recipe; it is really a way to spend surplus iron as copper.',
      ],
    },
    {
      heading: 'Steel and concrete',
      paragraphs: [
        'Solid Steel Ingot runs in a Foundry: 40 Iron Ingot and 40 Coal per minute become 60 Steel Ingot. The standard recipe spends one ore and one coal per ingot, so this is 33% less of both. It adds 1.33 Smelters, but the power for 60 steel per minute stays at 21.3 MW, the same as 1.33 standard Foundries. Coke Steel Ingot uses 75 Iron Ore and 75 Petroleum Coke per minute for 100 ingots: 25% less iron ore, and instead of coal it absorbs 25 m³ of Heavy Oil Residue per minute (0.63 of a Petroleum Coke Refinery). Compacted Steel Ingot (5 Iron Ore plus 2.5 Compacted Coal per minute for 10 ingots) has the best numbers on paper, 50% less ore and 75% less coal, but one Foundry makes only 10 per minute against the standard 45, so 60 per minute needs six Foundries (96 MW) and a sulfur supply.',
        'Wet Concrete runs in a Refinery: 120 Limestone and 100 m³ of Water per minute become 80 Concrete. Limestone per concrete halves from 3 to 1.5, and 5.33 Constructors collapse into one Refinery. Power rises from 21.3 MW to 46.7 MW (30 MW for the Refinery plus 16.7 MW for 0.83 of a Water Extractor), so the choice depends on whether limestone or power is what you want to save.',
      ],
    },
    {
      heading: 'Oil and fuel power',
      paragraphs: [
        'Oil is where the gap is widest. The standard Fuel recipe turns 60 m³ of Crude Oil into 40 m³ of Fuel, 0.67 fuel per oil. Chain the alternates Heavy Oil Residue (30 m³ Crude Oil per minute into 40 m³ Heavy Oil Residue plus 20 Polymer Resin) and Diluted Fuel (50 m³ Heavy Oil Residue plus 100 m³ Water into 100 m³ Fuel) and 30 m³ of oil yields 80 m³ of fuel, 2.67 per oil, four times the standard. A Fuel-Powered Generator makes 250 MW from 20 m³ of fuel per minute, so that 80 m³ runs four generators for 1,000 MW. Subtract one Refinery at 30 MW, 0.8 of a Blender at 60 MW and 0.67 of a Water Extractor at 13.3 MW and about 897 MW remains, roughly 3.8 times the 235 MW net that the standard recipe gets from the same 30 m³ of oil.',
        'Turbofuel turns 22.5 m³ of Fuel and 15 Compacted Coal per minute into 18.75 m³ of Turbofuel. A generator makes 250 MW from 7.5 m³ of Turbofuel, so those 18.75 m³ are worth 625 MW, 2.2 times the 281 MW you would get from burning the 22.5 m³ of fuel directly. The extra cost is 15 Coal and 15 Sulfur per minute, one Refinery at 30 MW and 0.6 of an Assembler at 9 MW. Turbofuel and Compacted Coal carry no "Alternate" prefix in the game data, so the planner always has them enabled.',
        'Recycled Plastic and Recycled Rubber, combined with Heavy Oil Residue, Diluted Fuel and Residual Rubber, turn 30 m³ of Crude Oil and 100 m³ of Water per minute into 45 Plastic and 45 Rubber. Making the same amount with standard recipes takes 135 m³ of oil and leaves 67.5 m³ of Heavy Oil Residue behind. That is 78% less oil and no byproduct.',
      ],
    },
    {
      heading: 'Aluminum, caterium and electronics',
      paragraphs: [
        'Caterium Ore is one sixth as plentiful as iron on the map, which makes every ore-saving alternate more valuable. Pure Caterium Ingot uses 24 Caterium Ore and 24 m³ of Water per minute for 12 ingots: 2 ore per ingot instead of 3, a 33% saving. But that is one 30 MW Refinery for 12 ingots, against 3.2 MW for 0.8 of a Smelter, so the power cost is steep. Fused Quickwire turns 7.5 Caterium Ingot and 37.5 Copper Ingot per minute into 90 Quickwire, 12 per caterium ingot instead of 5, so the Caterium Ore behind 90 quickwire per minute falls from 54 to 22.5, a 58% cut.',
        'Silicon Circuit Board (27.5 Copper Sheet plus 27.5 Silica per minute for 12.5 boards) takes oil out of circuit boards entirely. The standard recipe needs 50 Plastic per minute for 12.5 boards, meaning 75 m³ of Crude Oil and 25 m³ of leftover Heavy Oil Residue, while the silicon version needs 16.5 Raw Quartz and drops the chain from 116.7 MW to 36.3 MW. Insulated Cable (45 Wire plus 30 Rubber per minute for 100 Cable) cuts wire per cable from 2 to 0.45, so 100 cable per minute needs 22.5 Copper Ore instead of 100. It costs 30 Rubber per minute, about 45 m³ of oil, so it is the pick when copper is the bottleneck.',
        'Aluminum alternates are more modest. Electrode Aluminum Scrap (180 m³ Alumina Solution plus 60 Petroleum Coke per minute for 300 scrap) lowers alumina per scrap from 0.67 to 0.6, a 10% saving, and swaps coal for coke. Sloppy Alumina (200 Bauxite plus 200 m³ Water for 240 m³ Alumina Solution) uses 17% less bauxite and doubles output per Refinery, but it drops the Silica byproduct of the standard recipe, so that silica has to come from extra Raw Quartz.',
      ],
    },
    {
      heading: 'Using this in the planner',
      paragraphs: [
        'Enable the alternates you own in recipe mode, then solve the same target rate under minimize resources, minimize power and minimize buildings in turn. The differences above show up as raw resources, total power and building count for the whole plan. Enable only the recipes you have actually unlocked. As a hard drive priority, ordered by the size of the gain in this article: Diluted Fuel with Heavy Oil Residue, Steel Screws or Cast Screws, Pure Iron or Iron Alloy Ingot, Solid Steel Ingot, Wet Concrete, Fused Quickwire, then Silicon Circuit Board.',
      ],
    },
    {
      heading: 'When a strong recipe works against you',
      paragraphs: [
        'Saving ore does not help if you hit a different limit. First, extra ingredients: Coated Iron Plate wants Plastic, Insulated Cable wants Rubber and Compacted Steel wants Sulfur, each of which means a new supply line for oil or sulfur. Second, power: Pure Iron, Pure Copper and Wet Concrete add a Refinery and Water Extractors on top of the standard chain, so while power is short the standard recipe can be easier to run. Third, logistics: Coke Steel puts out 100 items per minute per Foundry and Sloppy Alumina 240 m³ per Refinery, so check the Conveyor Belt Mk.2 limit of 120 per minute and the 300 m³ pipeline limit first. Read the result to see whether resources, power or buildings went up, and adopt whichever fits the constraint you are actually under.',
      ],
    },
  ],
  relatedItemIds: [
    'Desc_IronIngot_C',
    'Desc_IronScrew_C',
    'Desc_SteelIngot_C',
    'Desc_Cement_C',
    'Desc_LiquidFuel_C',
    'Desc_HeavyOilResidue_C',
    'Desc_HighSpeedWire_C',
    'Desc_CircuitBoard_C',
  ],
  relatedArticleSlugs: [
    'alternate-recipe-metrics',
    'oil-products-basics',
    'diluted-fuel-power',
    'oil-loop-complete',
    'coal-power-startup',
  ],
  cta: {
    kind: 'item',
    label: 'Plan 260 Screws per minute with Steel Screws and Pure Iron Ingot enabled',
    itemId: 'Desc_IronScrew_C',
    ratePerMin: 260,
    alternateRecipeIds: ['Recipe_Alternate_Screw_2_C', 'Recipe_Alternate_PureIronIngot_C'],
  },
} as const satisfies HandwrittenArticle
