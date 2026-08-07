/** 入力サイドバー。 */
import { AlternatesPanel } from './AlternatesPanel.tsx'
import { LimitsPanel } from './LimitsPanel.tsx'
import { ExtractionPanel, ObjectivePanel } from './OptionsPanel.tsx'
import { TargetsPanel } from './TargetsPanel.tsx'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <TargetsPanel />
      <ObjectivePanel />
      <ExtractionPanel />
      <AlternatesPanel />
      <LimitsPanel />
    </aside>
  )
}
