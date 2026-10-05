/** 入力サイドバー。 */
import { useLocale } from '../i18n/index.ts'
import { sidebarSettingsText } from '../i18n/sidebar-settings.ts'
import { useSidebarPanels } from '../store/sidebar-panels.ts'
import { RawResourcesPanel } from './RawResourcesPanel.tsx'
import { AdSlot } from './AdSlot.tsx'
import { AlternatesPanel } from './AlternatesPanel.tsx'
import { ExportPanel } from './ExportPanel.tsx'
import { InputsPanel } from './InputsPanel.tsx'
import { LimitsPanel } from './LimitsPanel.tsx'
import { ClockPanel, ExtractionPanel, LogisticsPanel, ObjectivePanel } from './OptionsPanel.tsx'
import { PlansPanel } from './PlansPanel.tsx'
import { PowerPanel } from './PowerPanel.tsx'
import { TargetsPanel } from './TargetsPanel.tsx'

export function Sidebar({ hidden = false }: { hidden?: boolean }) {
  const { locale } = useLocale()
  const P = sidebarSettingsText(locale)
  const setAll = useSidebarPanels(state => state.setAll)
  return (
    <aside className="sidebar" hidden={hidden}>
      <div className="sidebar__toggles button-row">
        <button type="button" className="button" onClick={() => setAll(true)}>{P.expandAll}</button>
        <button type="button" className="button" onClick={() => setAll(false)}>{P.collapseAll}</button>
      </div>
      <TargetsPanel />
      <InputsPanel />
      <ObjectivePanel />
      <PowerPanel />
      <ClockPanel />
      <ExtractionPanel />
      <RawResourcesPanel />
      <AlternatesPanel />
      <LimitsPanel />
      <LogisticsPanel />
      <PlansPanel />
      <ExportPanel />
      <AdSlot slot="rect" />
    </aside>
  )
}
