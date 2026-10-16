import type { HandwrittenArticle } from '../types.ts'

/** Recipe rates and inputs are calculated from the repository's verified Satisfactory 1.1.x data. */
export const motorProductionRecipesArticleEn = {
  slug: 'motor-production-recipes',
  title: 'Satisfactory Motor Recipes Compared: Rotor, Stator or Control Rod?',
  description:
    'Compare the standard Motor, Electric Motor and Rigor Motor recipes at 15 Motors/min using Satisfactory 1.1.x data. See their direct inputs and machine counts, then choose around the parts your factory already makes.',
  publishedDate: '2026-10-16',
  sections: [
    {
      heading: 'Start with the parts you can supply',
      paragraphs: [
        'There are three Motor recipes to compare: the standard recipe, Electric Motor and Rigor Motor. Output alone does not tell you which one to use. The standard recipe needs both Rotors and Stators; Electric Motor replaces Stators with Electromagnetic Control Rods; Rigor Motor adds Crystal Oscillators while using fewer Rotors and Stators. Choose around the parts your factory can already provide.',
        'At a common target of 15 Motors/min, the standard recipe needs 30 Rotors/min and 30 Stators/min. Electric Motor needs 15 Rotors/min and 7.5 Electromagnetic Control Rods/min. Rigor Motor needs 7.5 Rotors/min, 7.5 Stators/min and 2.5 Crystal Oscillators/min. These are nominal rates scaled from recipe inputs; they do not account for transport jams or downtime.',
      ],
      tables: [
        {
          caption: 'Direct recipe inputs for 15 Motors/min (repository 1.1.x data)',
          headers: ['Recipe', 'Required machines', 'Rotors', 'Stators', 'Additional input'],
          rows: [
            ['Motor', '3 Assemblers', '30/min', '30/min', 'None'],
            ['Electric Motor', '2 Assemblers', '15/min', 'None', '7.5 Electromagnetic Control Rods/min'],
            ['Rigor Motor', '2 Manufacturers', '7.5/min', '7.5/min', '2.5 Crystal Oscillators/min'],
          ],
        },
      ],
    },
    {
      heading: 'Standard Motor: balance Rotors and Stators',
      paragraphs: [
        'The standard recipe makes one Motor every 12 seconds in an Assembler, or 5/min per machine. It consumes two Rotors and two Stators per cycle. A 15/min target therefore takes three Assemblers, 30 Rotors/min and 30 Stators/min. If both component lines already exist, this is the baseline that needs no extra intermediate product.',
        'If either Rotors or Stators are in short supply, check that upstream line before expanding the standard recipe. The figures here cover only the Motor recipe inputs; they do not include the materials or power needed to make Rotors and Stators.',
      ],
    },
    {
      heading: 'Electric Motor: swap Stators for Control Rods',
      paragraphs: [
        'Electric Motor produces two Motors every 16 seconds in an Assembler, or 7.5/min per machine. It consumes two Rotors and one Electromagnetic Control Rod per cycle. For 15 Motors/min, that is two Assemblers, 15 Rotors/min and 7.5 Control Rods/min. It uses half the Rotor rate of the standard recipe and replaces Stators with Electromagnetic Control Rods.',
        'This can fit a factory that already produces Electromagnetic Control Rods for another line. If you need to build a new Control Rod supply just for Motors, include that upstream chain when comparing total ore, power and buildings. Fewer inputs at the final recipe do not automatically mean a smaller factory overall.',
      ],
    },
    {
      heading: 'Rigor Motor: trade crystal parts for fewer Rotors and Stators',
      paragraphs: [
        'Rigor Motor produces six Motors every 48 seconds in a Manufacturer, or 7.5/min per machine. It consumes three Rotors, three Stators and one Crystal Oscillator. Scaling to 15 Motors/min brings Rotor and Stator use down to 7.5/min each, plus 2.5 Crystal Oscillators/min.',
        'The direct recipe inputs show a 75% reduction in Rotors and Stators, but this is not a total resource-efficiency comparison because it adds Crystal Oscillators. If you need to build that entire upstream chain, Rigor Motor may not make the overall factory lighter than the standard or Electric Motor recipe. Compare the complete production plan before choosing.',
      ],
    },
    {
      heading: 'Compare at the same target in the planner',
      paragraphs: [
        'The plan at the end of this article targets 15 Motors/min. In recipe settings, enable only the alternate recipes you have unlocked, then compare the results against the constraint you care about: resource efficiency, power or building count. Enabling every alternate recipe can include recipes you have not unlocked, so match the settings to your save.',
        'The planner calculates production recipe balances. It does not simulate conveyor jams, operating uptime, building placement or power failures. Check transport capacity and power connections separately in your factory.',
      ],
    },
  ],
  references: {
    heading: 'References',
    links: [
      { label: 'Official Satisfactory Wiki — Motor (English)', href: 'https://satisfactory.wiki.gg/wiki/Motor' },
      { label: 'Satisfactory Planner — game data and version notes (Japanese)', href: 'https://github.com/mikirice/satisfactory-planner/blob/main/data-source/DATA_SOURCES.md' },
      { label: 'Strong Alternate Recipes and When to Use Them (English)', href: 'https://satisfactory-planner.net/en/articles/strong-alternate-recipes/' },
    ],
  },
  relatedItemIds: ['Desc_Motor_C', 'Desc_Rotor_C', 'Desc_Stator_C', 'Desc_ElectromagneticControlRod_C', 'Desc_CrystalOscillator_C'],
  relatedArticleSlugs: ['strong-alternate-recipes', 'alternate-recipe-metrics', 'production-planning-tutorial'],
  cta: {
    kind: 'item',
    label: 'Open the 15 Motors/min plan and compare recipes',
    itemId: 'Desc_Motor_C',
    ratePerMin: 15,
    alternateRecipeIds: ['Recipe_Alternate_ElectricMotor_C', 'Recipe_Alternate_Motor_1_C'],
  },
} as const satisfies HandwrittenArticle
