const zh = { purityLabel: '資源節點純度', purityNames: { impure: '不純', normal: '普通', pure: '純' } }
const en = { purityLabel: 'Resource node purity', purityNames: { impure: 'Impure', normal: 'Normal', pure: 'Pure' } }
const ja = { purityLabel: '資源ノード純度', purityNames: { impure: '低純度', normal: '通常', pure: '高純度' } }
export const extractionSettingsText = (locale: string) => locale.startsWith('zh') ? zh : locale === 'ja' ? ja : en
