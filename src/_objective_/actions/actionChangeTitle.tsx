import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { useApp } from '../../components/App'
import { t } from '../../i18n'
import { KEYS } from '../../keys'
import { getSelectedElements } from '../../scene'
import { AppClassProperties } from '../../types'
import { focusNearestParent } from '../../utils'
import { TextField } from '../UI/TextField'
import { newNameRepr } from '../objects/primitives'
import { getObjectiveMetas } from '../selectors/selectors'
import { changeElementsMeta, updateMetaRepresentation } from './helpers'
import { register } from './register'

/**
 * Change object Name (aka Title, aka Label)
 */
export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (
    elements,
    appState,
    { newTextValue, app }: { newTextValue: string; app: AppClassProperties }
  ) => {
    const metas = getObjectiveMetas(getSelectedElements(elements, appState))

    // [1] change meta name representation(!)
    elements = updateMetaRepresentation(elements, metas, 'nameRepr', newTextValue, newNameRepr)

    // [2] change meta name
    elements = changeElementsMeta(elements, appState, { name: newTextValue })
    return {
      elements: elements,
      commitToHistory: !!newTextValue,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const app = useApp()
    const name = getFormValue(elements, appState, (element) => element.customData?.name, null)

    return (
      <TextField
        placeholder={t('labels.metaName', null, 'Label')}
        value={name || ''}
        onChange={(newTextValue) => updateData({ newTextValue, app })}
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target)}
      />
    )
  },
})
