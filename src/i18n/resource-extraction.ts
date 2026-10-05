const zh = {
  back: '返回流程圖', save: '儲存設定', leaveQuestion: '產能不足，是否不儲存設定離開？', keepEditing: '繼續設定', discard: '不儲存離開', idleWarning: (n: number) => `有 ${n} 台設備未分配需求`,
  title: '各資源開採設定', intro: '每個節點組代表一台開採設備。新增或移除節點組即可調整台數；恢復預設值會依左側設定與目前需求重建節點組。',
  global: '沿用側邊欄預設', automatic: '個別設定（自動台數）', mixed: '混合節點',
  mode: '設定方式', miner: '開採設備', purity: '節點純度', clock: '時脈 (%)', count: '配置台數',
  add: '新增節點組', remove: '移除', reset: '恢復預設值', each: '單台產出上限', capacity: '產出上限',
  configured: '已自訂', required: '需求', allocated: '已供應', shortfall: '供應不足',
  mixedNote: '每個節點組代表一台開採設備。未用滿的設備仍列入產能、耗電與建造成本；不會自動增添其他節點。台數不得超過地圖可用節點。資源井的加壓機依衛星節點平均數估算。',
  customizedClock: '各資源可使用不同時脈；表內顯示各組設定。', empty: '尚未配置節點，供應量為 0。',
  purityNames: { impure: '不純', normal: '普通', pure: '純' },
}
const en: typeof zh = {
  back: 'Back to graph', save: 'Save settings', leaveQuestion: 'Insufficient capacity. Leave without saving?', keepEditing: 'Keep editing', discard: 'Discard and leave', idleWarning: (n: number) => `${n} machines have no allocated demand`,
  title: 'Resource extraction settings', intro: 'Each node group represents one extractor. Add or remove groups to change the installed count. Restore defaults rebuilds groups from sidebar settings and current demand.',
  global: 'Use sidebar defaults', automatic: 'Custom settings (automatic count)', mixed: 'Mixed nodes',
  mode: 'Mode', miner: 'Extractor', purity: 'Node purity', clock: 'Clock (%)', count: 'Installed count',
  add: 'Add node group', remove: 'Remove', reset: 'Restore defaults', each: 'Single-machine output limit', capacity: 'Output limit',
  configured: 'Customized', required: 'Required', allocated: 'Supplied', shortfall: 'Insufficient supply',
  mixedNote: 'Each group represents one installed extractor. Idle equipment is included in capacity, power and costs. No other nodes are added automatically. Counts are capped by map availability. Well pressurizers use an average satellite-node estimate.',
  customizedClock: 'Resources may use different clocks; each group shows its setting.', empty: 'No nodes configured: supply is zero.',
  purityNames: { impure: 'Impure', normal: 'Normal', pure: 'Pure' },
}
export const resourceExtractionText = (locale: string) => locale.startsWith('zh') ? zh : en
