import { changeProperty, getFormValue } from '../../actions/actionProperties'
import { TextField } from '../../components/TextField'
import { newElementWith } from '../../element/mutateElement'
import { t } from '../../i18n'
import { KEYS } from '../../keys'
import { focusNearestParent } from '../../utils'
import { register } from './register'

export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (elements, appState, value) => {
    const name = value
    return {
      ...{
        elements: changeProperty(elements, appState, (el) =>
          newElementWith(el, {
            customData: { ...el.customData, name },
          })
        ),
      },
      appState: {
        ...appState,
        ...value,
      },
      commitToHistory: !!name,
    }
  },
  // eslint-disable-next-line react/prop-types
  PanelComponent: ({ elements, appState, updateData, appProps }) => {
    const name = getFormValue(elements, appState, (element) => element.customData?.name, null)

    return (
      <TextField
        placeholder={t('labels.metaName', null, 'Nickname')}
        value={name || ''}
        onChange={(v) => updateData(v)}
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target)}
      />
    )
  },
})
