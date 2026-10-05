const zhTabs = {
  summary: '查看目標、用電、建築數量、佔地與建造成本的總覽。',
  steps: '查看每個配方的規劃需求、建築與輸入輸出。',
  resources: '查看規劃所需的原始資源與開採設備。',
  balance: '查看目標需求的每分鐘收支，並對照建築的產能與消耗上限。',
  flow: '查看資源與配方之間的連接；點擊配方節點可比較與替換配方。',
  build: '依建造順序查看整數台數，以及需求和設定時脈下的合計產能或消耗。',
}
const enTabs: typeof zhTabs = {
  summary: 'View targets, power, building counts, footprint and construction costs.',
  steps: 'View planned requirements, buildings and input/output flows for each recipe.',
  resources: 'View planned raw-resource needs and extraction equipment.',
  balance: 'View planned per-minute balances alongside building capacity and maximum consumption.',
  flow: 'View resource and recipe connections; click recipe nodes to compare and replace recipes.',
  build: 'View buildings in construction order, with requirements and full configured capacity or consumption.',
}
export const tabHelpText = (locale: string) => locale.startsWith('zh') ? zhTabs : enTabs
