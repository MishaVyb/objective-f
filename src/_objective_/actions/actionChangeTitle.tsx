import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { t } from '../../i18n'
import { KEYS } from '../../keys'
import { focusNearestParent } from '../../utils'
import { TextField } from '../UI/TextField'
import { changeElementsMeta } from './helpers'
import { register } from './register'

/**
 * Change object Name (aka Title, aka Label)
 */
export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (elements, appState, name) => {
    return {
      elements: changeElementsMeta(elements, appState, { name: name }),
      commitToHistory: !!name,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const name = getFormValue(elements, appState, (element) => element.customData?.name, null)

    return (
      <TextField
        placeholder={t('labels.metaName', null, 'Label')}
        value={name || ''}
        onChange={(v) => updateData(v)}
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target)}
      />
    )
  },
})
