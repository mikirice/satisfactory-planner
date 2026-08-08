/** 入力サイドバー。 */
import { AlternatesPanel } from './AlternatesPanel.tsx'
import { ExportPanel } from './ExportPanel.tsx'
import { LimitsPanel } from './LimitsPanel.tsx'
import { ExtractionPanel, LogisticsPanel, ObjectivePanel } from './OptionsPanel.tsx'
import { PlansPanel } from './PlansPanel.tsx'
import { TargetsPanel } from './TargetsPanel.tsx'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <TargetsPanel />
      <ObjectivePanel />
      <ExtractionPanel />
      <AlternatesPanel />
      <LimitsPanel />
      <LogisticsPanel />
      <PlansPanel />
      <ExportPanel />
    </aside>
  )
}
