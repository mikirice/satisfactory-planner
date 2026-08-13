/** 入力サイドバー。 */
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
  return (
    <aside className="sidebar" hidden={hidden}>
      <TargetsPanel />
      <InputsPanel />
      <ObjectivePanel />
      <PowerPanel />
      <ClockPanel />
      <ExtractionPanel />
      <AlternatesPanel />
      <LimitsPanel />
      <LogisticsPanel />
      <PlansPanel />
      <ExportPanel />
      <AdSlot slot="rect" />
    </aside>
  )
}
