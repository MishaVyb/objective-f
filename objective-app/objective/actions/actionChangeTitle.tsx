import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { KEYS } from '../../../packages/excalidraw/keys'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { focusNearestParent } from '../../../packages/excalidraw/utils'
import { TextField } from '../UI/TextField'
import { newMetaReprElement } from '../elements/newElement'
import { getObjectiveBasis, getObjectiveMetas, getObjectiveSingleMeta } from '../meta/selectors'
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
      elements: newEls.length ? arrangeElements(elements, newEls) : elements,
      commitToHistory: !!newTextValue,
    }
  },

  PanelComponent: ({ elements, appState, updateData, app }: PanelComponentProps) => {
    const name = getFormValue(
      elements,
      appState,
      (element) => element.customData?.name,
      true,
      null //
    )

    const singleMeta = getObjectiveSingleMeta(
      app.scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })
    )
    const basis = getObjectiveBasis(singleMeta)
    const bgOpacity = '30' // from `00` up to `FF`
    const bgColor = basis ? basis.backgroundColor + bgOpacity : null

    return (
      <>
        <TextField
          placeholder='Label'
          value={name || ''}
          onChange={(newTextValue) => updateData({ newTextValue })}
          onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target as any)}
          bgColor={bgColor}
        />
      </>
    )
  },
})
