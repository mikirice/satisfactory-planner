/**
 * UI 文言（日本語）。
 * i18n ライブラリは入れないが、文言はここに集約して後から差し替えられるようにする。
 */
export const T = {
  appTitle: 'Satisfactory 生産計画ツール',
  dataVersion: 'ゲームデータ',

  status: {
    idle: '目標を追加すると計算します',
    solving: '計算中',
    done: '最適解',
    infeasible: '実行不能',
    error: 'エラー',
    elapsed: (ms: number): string => `${ms.toFixed(0)} ms`,
  },

  sidebar: {
    targets: '目標産出',
    targetSearch: 'アイテムを検索して追加',
    targetSearchPlaceholder: 'アイテム名（例: 鉄板）',
    targetEmpty: 'まだ目標がありません。上の検索から追加してください。',
    targetRate: 'レート',
    remove: '削除',
    noMatch: '一致するアイテムがありません',

    objective: '目的関数',

    extraction: '採掘設備',
    miner: '固体ノードの採掘機',
    minerHint: 'クロック100%で計算します。端数の1台だけアンダークロック扱いです。',

    alternates: '代替レシピ',
    alternatesCount: (on: number, all: number): string => `${on} / ${all} 有効`,
    alternatesSearchPlaceholder: 'レシピ名で絞り込み',
    enableAll: 'すべて有効',
    disableAll: 'すべて無効',

    limits: '原料上限',
    limitsHint: '空欄はマップ上限。0 にするとその原料を使わない解を探します。',
    limitsReset: 'マップ上限に戻す',
    unlimited: '無制限',

    logistics: '物流',
    belt: 'ベルト',
    pipe: 'パイプ',
    logisticsHint: '物流シートの本数計算に使います。解には影響しません。',
  },

  plans: {
    heading: 'プラン',
    hint: '入力だけを保存します（結果は読み込み時に計算し直します）。',
    save: 'このプランを保存',
    saved: (name: string): string => `「${name}」を保存しました`,
    overwritten: (name: string): string => `「${name}」を上書きしました`,
    nameRequired: 'プラン名を入れてから保存してください（Excel出力の欄と共通です）',
    listEmpty: '保存したプランはまだありません',
    load: '読込',
    remove: '削除',
    confirmRemove: (name: string): string => `「${name}」を削除します。よろしいですか？`,
    loaded: (name: string): string => `「${name}」を読み込みました`,
    removed: (name: string): string => `「${name}」を削除しました`,
    share: '共有URLをコピー',
    shareHint: 'URLに入力内容を埋め込みます。開いた人はそのまま計算結果を見られます。',
    shareCopied: '共有URLをコピーしました',
    shareFailed: 'コピーできませんでした。URLを選択してコピーしてください',
    restoredFromUrl: '共有URLからプランを復元しました',
    restoredFromAutosave: '前回の作業内容を復元しました',
    restoreFailed: 'プランを復元できませんでした',
    warnings: (n: number): string => `${n} 件は読み込めず無視しました`,
    storageFailed: 'ブラウザに保存できませんでした',
    updatedAt: (d: Date): string =>
      `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
        d.getDate(),
      ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`,
  },

  export: {
    heading: 'Excel出力',
    planName: 'プラン名',
    planNamePlaceholder: '未入力なら plan',
    download: 'Excelダウンロード',
    downloading: '作成中…',
    needsSolution: '解が出てからダウンロードできます',
    failed: 'Excelの作成に失敗しました',
  },

  tabs: {
    summary: 'サマリー',
    steps: '生産ステップ',
    resources: '原料',
    balance: 'アイテム収支',
    flow: 'フローチャート',
  },

  flow: {
    heading: 'フローチャート',
    loading: 'レイアウトを計算しています…',
    empty: '表示できる生産フローがありません',
    failed: 'フローチャートを描画できませんでした',
    /** ノードの種類 */
    source: '原料供給',
    external: '持ち込み',
    target: '目標産出',
    byproduct: '副産物',
    inputs: '投入',
    outputs: '産出',
    requested: (rate: string): string => `要求 ${rate}`,
    machines: (built: number, clock: string): string => `${built} 台 @ ${clock}`,
    legend: '凡例',
    legendSolid: '固体（ベルト）',
    legendLiquid: '液体（パイプ）',
    legendGas: '気体（パイプ）',
    legendBottleneck: '1本で運べない（赤・太線）',
    stats: (nodes: number, edges: number): string => `${nodes} ノード / ${edges} フロー`,
    bottleneckCount: (n: number): string => `ボトルネック ${n} 本`,
    transportNote: (belt: string, pipe: string): string =>
      `${belt} / ${pipe} で換算（サイドバーの物流で変更できます）`,
    readOnly: 'ドラッグでの編集はできません（閲覧専用）。パン・ズーム・ミニマップが使えます',
  },

  summary: {
    heading: 'サマリー',
    targets: '目標産出',
    requested: '要求',
    produced: '産出',
    power: '総消費電力',
    powerManufacturing: '製造',
    powerExtraction: '採掘',
    machines: '建物',
    machineCountRunning: '稼働台数（小数）',
    machineCountBuilt: '建てる台数',
    extractorCount: '採掘設備',
    buildCost: '建設コスト',
    buildCostManufacturing: '製造建物',
    buildCostExtraction: '採掘設備',
    sinkPoints: 'シンクポイント',
    sinkPointsUnit: 'pt/分',
    byproducts: '副産物',
    byproductsEmpty: '副産物はありません',
    externalInputs: '持ち込み',
    unit: {
      mw: 'MW',
      count: '台',
    },
  },

  steps: {
    heading: '生産ステップ',
    empty: '生産ステップがありません',
    recipe: 'レシピ',
    machineCount: '稼働台数',
    built: '建てる台数',
    clock: 'クロック案',
    power: '消費電力 (MW)',
    inputs: '投入',
    outputs: '産出',
    subtotal: '小計',
    groupCount: (n: number): string => `${n} レシピ`,
    variablePowerNote: '可変電力レシピは幅で表示しています（値は中央値）',
  },

  resources: {
    heading: '原料と採掘計画',
    empty: '原料を使っていません',
    item: '原料',
    required: '必要レート',
    limit: 'マップ上限',
    usage: '上限比率',
    extractor: '設備',
    machines: '台数',
    nodes: '必要ノード（純度別）',
    power: '採掘電力 (MW)',
    pressurizer: '加圧機',
    shortfall: 'ノード不足',
    shortfallNote: (n: string): string => `マップのノードが足りず ${n} 分を賄えません`,
    purity: {
      pure: '高純度',
      normal: '通常',
      impure: '低純度',
    },
    nodesOf: (nodes: string, available: number): string =>
      Number.isFinite(available) ? `${nodes} / ${available}` : nodes,
    unlimitedNodes: '設置数の制限なし',
  },

  balance: {
    heading: 'アイテム収支',
    empty: '収支がありません',
    item: 'アイテム',
    produced: '産出',
    consumed: '消費',
    supplied: '外部供給',
    net: '差分',
    state: '状態',
    surplus: '余剰',
    shortage: '不足',
    balanced: '均衡',
    onlyNonZero: '差分が 0 の行を隠す',
  },

  infeasible: {
    heading: 'この条件では生産できません',
    hint: '次のどれかを見直してください。',
    reason: {
      unproducibleItem: 'レシピ不足',
      resourceLimit: '原料不足',
      unbounded: '目的関数',
      solverError: 'ソルバー',
    },
    advice: {
      unproducibleItem: '代替レシピを有効にするか、原料上限を 0 にしていないか確認してください。',
      resourceLimit: '原料上限を上げるか、目標レートを下げてください。',
      unbounded: '目的関数の重みを見直してください。',
      solverError: '入力を単純にして再試行してください。',
    },
  },

  error: {
    heading: '計算に失敗しました',
  },
} as const
