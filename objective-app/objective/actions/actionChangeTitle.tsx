import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { useApp } from '../../../packages/excalidraw/components/App'
import { t } from '../../../packages/excalidraw/i18n'
import { KEYS } from '../../../packages/excalidraw/keys'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { focusNearestParent } from '../../../packages/excalidraw/utils'
import { TextField } from '../UI/TextField'
import { newMetaReprElement } from '../elements/newElement'
import { getObjectiveMetas } from '../meta/selectors'
import { handleMetaRepresentation, mutateElementsMeta } from '../elements/helpers'
import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { ObjectiveMeta, isCameraMeta } from '../meta/types'
import { getCameraMetaReprStr } from './actionShootList'
import { arrangeElements } from './zindex'

/**
 * Change object Name (aka Title, aka Label)
 */
export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (
    elements,
    appState,
    { newTextValue }: { newTextValue: string },
    app: AppClassProperties
  ) => {
    // [1] change name in representation
    const metas = getObjectiveMetas(getSelectedElements(elements, appState))
    const newEls = handleMetaRepresentation(
      app.scene,
      metas,
      'nameRepr',
      (m: ObjectiveMeta) =>
        isCameraMeta(m) ? getCameraMetaReprStr(m, { name: newTextValue }) : newTextValue,
      newMetaReprElement
    )

    // [2] change name in meta
    mutateElementsMeta(app, { name: newTextValue })

    return {
      elements: arrangeElements(elements, newEls),
      commitToHistory: !!newTextValue,
    }
  },

  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const app = useApp()
    const name = getFormValue(
      elements,
      appState,
      (element) => element.customData?.name,
      true,
      null //
    )

    return (
      <TextField
        placeholder={t('labels.metaName', null, 'Label')}
        value={name || ''}
        onChange={(newTextValue) => updateData({ newTextValue, app })}
        //@ts-ignore
        onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target)}
      />
    )
  },
})
