import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { t } from '../../../packages/excalidraw/i18n'
import { isCameraElement, isObjective } from '../meta/types'
import style from './actionRepresentation.module.css'
import { register } from './register'

export const representationMeta = register({
  name: 'representationMeta',
  trackEvent: false,
  perform: (elements, appState, value) => {
    return false // No perform action, actually
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const metaKind = getFormValue(
      elements,
      appState,
      (element) => isObjective(element) && element.customData.kind,
      true,
      null
    )
    const shotNumber = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotNumber,
      true,
      null
    )
    const shotVersion = getFormValue(
      elements,
      appState,
      (element) => isCameraElement(element) && element.customData.shotVersion,
      true,
      null
    )

    return (
      <div className={style.container}>
        <div className={style.metaKind}>{metaKind && t('labels.metaKind', null, metaKind)}</div>
        <div className={style.shotNumber}>
          {shotNumber && ` ${shotNumber}`}
          {shotVersion && ` (${shotVersion})`}
        </div>
      </div>
    )
  },
})

