import { useLocale } from '../i18n/index.ts'
import { sidebarSettingsText } from '../i18n/sidebar-settings.ts'
import { convertibleRawResources } from '../plan/recipe-selection.ts'
import { usePlanner } from '../store/planner.ts'
import { CollapsiblePanel } from './CollapsiblePanel.tsx'
import { ItemIcon } from './ItemIcon.tsx'

export function RawResourcesPanel() {
  const { locale, displayName } = useLocale()
  const P = sidebarSettingsText(locale)
  const selected = usePlanner(state => state.rawOnlyResources)
  const setRawOnly = usePlanner(state => state.setRawOnlyResource)
  return <CollapsiblePanel panelId="raw-resources" title={P.rawTitle}>
    <p className="hint">{P.rawHint}</p>
    <ul className="check-list">{convertibleRawResources.map(item => <li key={item.id}>
      <label className="check">
        <input type="checkbox" checked={!!selected[item.id]} onChange={event => setRawOnly(item.id, event.target.checked)} />
        <ItemIcon id={item.id} name={displayName(item)} size={24} />
        <span>{displayName(item)} <span className="raw-resource-option__hint">{P.rawOnly}</span></span>
      </label>
    </li>)}</ul>
  </CollapsiblePanel>
}
