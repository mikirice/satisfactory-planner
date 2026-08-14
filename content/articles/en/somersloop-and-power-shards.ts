import type { HandwrittenArticle } from '../types.ts'

export const somersloopAndPowerShardsArticleEn = {
  slug: 'somersloop-and-power-shards',
  title: 'When to Use Somersloops and Power Shards — Double Output and What It Costs',
  description:
    'Compare Somersloops and Power Shards by output multiplier, ingredient consumption, building count, units required and clock-adjusted power draw.',
  sections: [
    {
      heading: 'Two boosters, two different jobs',
      paragraphs: [
        'Somersloops and Power Shards both let fewer buildings produce more, but they do completely different things in the maths. A Power Shard raises the speed at which a recipe is processed. A Somersloop leaves ingredient consumption untouched and multiplies what comes out.',
      ],
    },
    {
      heading: 'Use Power Shards to cut machine count',
      paragraphs: [
        'Each Power Shard raises the clock limit by 50 percentage points, up to three per machine and a maximum of 250%. Raising the production clock limit in the planner does not change the 100%-equivalent machine requirement or the ingredient balance. It changes the allocation that follows: the number of machines to build is the machine equivalent divided by the clock limit, rounded up, and each machine is then set to the clock that meets the required rate. Three machines’ worth of work at a 250% limit, for example, becomes two machines at 150% each, with one shard in each of them.',
        'The cost is power. Production draw grows roughly with the clock raised to the power of 1.322, so every step up makes each item more expensive in energy. Underclocking the remainder evenly across several machines does the opposite and saves power. Power Shards suit places where land or construction materials are short, where the number of resource nodes is the limit, or where a building is too expensive to duplicate. In a power-constrained factory, treat 100% as the ceiling instead.',
      ],
    },
    {
      heading: 'Use Somersloops to save ingredients',
      paragraphs: [
        'Filling every slot of a supported building with Somersloops doubles all of its output while the ingredient input stays the same. Power consumption becomes four times the normal draw at a 100% clock. The planner does not model partially filled buildings; a step is either normal or fully looped. Enter the number of Somersloops you can spare and the solver mixes normal and fully looped steps according to the objective. Doubling a step close to the finished product shrinks the requirement of the entire chain behind it. Applying it at several stages compounds the resource saving, but the power draw and the number of Somersloops climb with it.',
      ],
    },
    {
      heading: 'Check the results and the warnings',
      paragraphs: [
        'Read the summary for Somersloops used, raw resources and clock-adjusted power, then read the production steps to see which recipe received how many. The internal allocation works in continuous machine equivalents and rounds up to the machines you actually build when displaying them, so a warning appears when the slots needed exceed the number you entered. When that happens, raise the number available or adjust the clock limit or the target rate.',
        'The reliable way to decide is to solve the same target twice, once with zero Somersloops and once with the number you own, and put the resource saving and the added power side by side.',
      ],
    },
  ],
  relatedItemIds: ['Desc_WAT1_C', 'Desc_CrystalShard_C', 'Desc_IronPlate_C'],
  cta: {
    kind: 'item',
    label: 'Try Somersloops on 60 Iron Plate/min',
    itemId: 'Desc_IronPlate_C',
    ratePerMin: 60,
    somersloops: 20,
  },
} as const satisfies HandwrittenArticle
