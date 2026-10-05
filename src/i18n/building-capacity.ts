const zh = {
  minute: '每分鐘', resource: '資源', required: '需要', capacity: '合計產能上限', consumption: '合計消耗上限', transport: '運輸',
  outputLimit: '產出上限', consumptionLimit: '消耗上限',
  note: '收支依目標需求計算；產能及消耗上限依整數建築、設定時脈與薩莫斯環另列。上限不代表實際產出，也不會增加上游需求。外部供應列實際使用量。',
  intro: '建築台數與材料依目標需求計算；上限欄位表示所有建築依設定運轉的能力。運輸本數依需求與側邊欄等級計算。',
}
const en: typeof zh = {
  minute: 'per minute', resource: 'Resource', required: 'Required', capacity: 'Total capacity', consumption: 'Total consumption', transport: 'Transport',
  outputLimit: 'Output limit', consumptionLimit: 'Consumption limit',
  note: 'Balances use target demand. Capacity and maximum consumption use whole buildings, configured clock and Somersloops; they do not increase upstream demand. External supply shows the amount used.',
  intro: 'Building counts and materials follow demand. Capacity shows the configured equipment limit. Transport uses demand and the selected tier.',
}
export const buildingCapacityText = (locale: string) => locale.startsWith('zh') ? zh : en
