import type { HandwrittenArticle } from './types.ts'

export const sharedCircuitBoardComputerFeedstockBudgetArticle = {
  slug: 'shared-circuit-board-computer-feedstock-budget',
  title: '回路基板とコンピューターの共有原料を上流まで追う',
  description: 'コンピューター用の中間品と別用途の回路基板をまとめ、銅板・プラスチック・ケーブルの供給上限を見積もります。',
  publishedDate: '2026-10-18',
  versionNotice: 'Plannerに同梱された固定データはSatisfactory 1.1.xです。正確な1.1パッチは不明で、Update 1.2とのレシピ一致は確認していません。例は連続レートの計算であり、ゲーム内の設備や搬送量を測定したものではありません。',
  sections: [
    {
      heading: 'Computerの直接消費と中間品の消費を分ける',
      paragraphs: [
        'Computerと別用途のCircuit Boardを同じ工場で生産し、Copper SheetとPlasticを共有する計画を考えます。固定Satisfactory 1.1.xデータの基本レシピだけを使います。日本語名は同データの表記で、現行ビルドのUI表示を確認したものではありません。',
        '基本Computerレシピは、製造機で24秒ごとにCircuit Board 4枚、Cable 8個、Plastic 16個を使い、Computer 1個を作ります。Computer 1個あたりPlasticを16個直接使うほか、投入するCircuit Board 4枚を基本レシピで作る場合、その上流でもPlasticが必要です。',
        '基本Circuit Boardレシピは、組立機で8秒ごとにCopper Sheet 2枚とPlastic 4個を使い、Circuit Board 1枚を作ります。Computer用と別用途のCircuit Boardを同じ基本レシピで作るなら、上流の材料を合算します。',
      ],
    },
    {
      heading: '共有する2つの材料の需要を式にする',
      paragraphs: [
        'CをComputerの目標生産量（個/分）、BをComputerライン以外へ出すCircuit Board量（個/分）とします。Computerラインには毎分4C枚、別用途には毎分B枚のCircuit Boardが必要です。',
        '毎分のCircuit Board合計は4C + B枚です。基板製造に必要なCopper Sheetは2(4C + B) = 8C + 2B枚、基板製造用Plasticは4(4C + B) = 16C + 4B個です。Computerレシピが直接使うPlastic 16C個/分も加えると、Plastic合計は32C + 4B個/分になります。',
        'Cable = 8C 個/分。この8CはComputerラインで使う完成済みCableだけです。KをComputerラインに使える完成済みCableの供給量とします。この例ではCable製造を収支の外に置いています。Cableも同じ工場で基本レシピから作る場合は、WireとCopper Ingotsまで上流需要を展開し、追加の供給制約として確認してください。',
      ],
    },
    {
      heading: '数値例で先に尽きる供給を見つける',
      paragraphs: [
        'Computerを毎分2個、別用途のCircuit Boardを毎分3個作る目標を置きます。他の消費先を差し引いた後の供給上限を、Copper Sheet 25個/分、Plastic 90個/分、完成済みCable 20個/分と仮定します。これらは説明用の入力値で、ゲームの固定仕様や実測値ではありません。',
        'Computerラインが毎分8枚、別用途が毎分3枚を使うため、Circuit Boardは合計11枚/分です。基本レシピで11枚を作るにはCopper Sheet 22枚/分とPlastic 44個/分が必要です。Computerへの直接投入分のPlastic 32個/分を加えるとPlastic合計は76個/分、Cable需要は16個/分です。',
        'Circuit Boardの別用途量Bを変えずにComputerの目標をΔC個/分だけ増やすなら、各供給の残量をComputer 1個あたりの需要で割り、その最小値を確認します。ΔC ≤ min(3 ÷ 8, 14 ÷ 32, 4 ÷ 8) = 0.375個/分となり、この例ではCopper Sheetが先に制約になります。これは連続レートの計算結果であり、ゲーム内の機械タイミングや安定生産を保証しません。',
      ],
      tables: [{
        headers: ['入力', '例の供給上限', '目標に必要な量', '残り'],
        rows: [
          ['Copper Sheet', '25個/分', '22個/分', '3個/分'],
          ['Plastic', '90個/分', '76個/分', '14個/分'],
          ['完成済みCable', '20個/分', '16個/分', '4個/分'],
        ],
      }],
    },
    {
      heading: '供給やレシピを変えたら収支を組み直す',
      paragraphs: [
        '対象ラインで使える供給量をS（Copper Sheet）、P（Plastic）、K（完成済みCable）とし、他の消費先を先に差し引きます。基本レシピで目標を満たす条件は、S ≥ 8C + 2B、P ≥ 32C + 4B、K ≥ 8Cです。',
        'どれかの条件を満たさない場合は、その不足量を見てComputerまたは別用途のCircuit Board目標を調整します。別のCircuit BoardレシピやComputerレシピでは上流投入量が変わるため、係数をそのまま使わず選んだレシピごとに展開し直してください。手持ち在庫、立ち上がり時間、停止、余裕在庫はこの定常的な毎分収支に含みません。',
      ],
    },
    {
      heading: '公開済みの共有Quickwire計算との違い',
      paragraphs: [
        '公開済みのAIリミッター／高速コネクター記事は、2製品が直接消費するQuickwireを配分します。この記事ではComputerが消費する中間品のCircuit Boardを上流へ展開し、別用途に出す基板も合わせて計算します。Computerの直接Plasticと基板製造に含まれるPlasticを二重計上漏れなく扱う、複数段の材料収支が対象です。',
      ],
    },
  ],
  references: {
    heading: 'レシピ根拠と版の制約',
    links: [
      { label: 'Plannerのデータ版情報（1.1.xスナップショット）', href: 'https://github.com/mikirice/satisfactory-planner/blob/088cefd2578e47372d740ce953904187b071f9dd/data-source/DATA_SOURCES.md' },
      { label: 'Circuit BoardとComputerの基本レシピデータ', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/recipes.json' },
      { label: 'アイテムと日本語ラベル', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/items.json' },
      { label: '製造機と組立機の日本語ラベル', href: 'https://raw.githubusercontent.com/mikirice/satisfactory-planner/088cefd2578e47372d740ce953904187b071f9dd/src/data/buildings.json' },
    ],
  },
  relatedItemIds: [],
  relatedArticleSlugs: ['shared-quickwire-allocation-ai-limiters-high-speed-connectors', 'alternate-recipe-metrics', 'production-planning-tutorial'],
  cta: { kind: 'item', label: 'Computerの生産計画をPlannerで確認する', itemId: 'Desc_Computer_C', ratePerMin: 2 },
} as const satisfies HandwrittenArticle
