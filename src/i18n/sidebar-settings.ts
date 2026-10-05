const zh = {
  expandAll: '全部展開', collapseAll: '全部收合', rawTitle: '原始資源使用',
  rawHint: '勾選後，排除以該資源為主產物的製造／轉換配方；其他製程的副產資源仍可回收使用。未勾選則由求解器選擇。',
  rawOnly: '只使用原始資源', conflict: '此配方的主產物已設定為「只使用原始資源」。請先取消側邊欄中的勾選。',
}
const en: typeof zh = {
  expandAll: 'Expand all', collapseAll: 'Collapse all', rawTitle: 'Raw resource sourcing',
  rawHint: 'Checked resources exclude recipes making them as the main product. Byproducts from other processes can still be recycled. Unchecked resources are chosen by the solver.',
  rawOnly: 'Use raw resource only', conflict: 'This recipe’s main product is restricted to raw sourcing. Uncheck that resource in the sidebar first.',
}
const ja: typeof zh = {
  expandAll: 'すべて展開', collapseAll: 'すべて折りたたむ', rawTitle: '原料の供給方法',
  rawHint: 'チェックした資源を主産物とする製造・変換レシピを除外します。他の工程の副産物は再利用できます。未チェックの資源はソルバーが選択します。',
  rawOnly: '天然資源のみを使用', conflict: 'このレシピの主産物は天然資源のみを使用する設定です。先にサイドバーでチェックを外してください。',
}
export const sidebarSettingsText = (locale: string) => locale.startsWith('zh') ? zh : locale === 'ja' ? ja : en
