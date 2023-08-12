import { getFormValue } from '../../actions/actionProperties'
import { t } from '../../i18n'
import { isCameraElement, isObjective } from '../types/types'
import { register } from './register'

export const representationMeta = register({
  name: 'representationMeta',
  trackEvent: false,
  perform: (elements, appState, value) => {
    return {
      elements,
      appState,
      commitToHistory: false,
    }
  },
  // eslint-disable-next-line react/prop-types
  PanelComponent: ({ elements, appState, updateData, appProps }) => {
    const metaKind = getFormValue(
      elements,
      appState,
      (element) => isObjective(element) && element.customData.kind,
      null
    )
    const shotNumber = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotNumber,
      null
    )
    const shotVersion = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotVersion,
      null
    )

    return (
      <h2>
        {metaKind && t('labels.metaKind', null, metaKind)}
        {shotNumber && ` ${shotNumber}`}
        {shotVersion && ` (${shotVersion})`}
      </h2>
    )
  },
})
