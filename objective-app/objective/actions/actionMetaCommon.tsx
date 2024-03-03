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
import { ObjectiveMeta, isCameraElement, isCameraMeta, isObjective } from '../meta/types'
import { getCameraMetaReprStr, getCameraVersionStr } from './actionShootList'
import { arrangeElements } from './zindex'
import { Flex, Kbd } from '@radix-ui/themes'

export const actionDisplayMeta = register({
  name: 'actionDisplayMeta',
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
      <Flex justify={'between'}>
        <Kbd>{metaKind}</Kbd>
        {shotNumber ? (
          <Kbd style={{ minWidth: 30 }}>
            {shotVersion ? `${shotNumber}-${getCameraVersionStr(shotVersion)}` : `${shotNumber}`}
          </Kbd>
        ) : null}
      </Flex>
    )
  },
})

export const actionChangeMetaName = register({
  name: 'actionChangeMetaName',
  trackEvent: false,
  perform: (elements, appState, newTextValue: string, app: AppClassProperties) => {
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
    const bgOpacity = '20' // from `00` up to `FF`
    const bgColor = basis ? basis.backgroundColor + bgOpacity : null

    return (
      <>
        <TextField
          placeholder='Label'
          value={name || ''}
          onChange={(newTextValue) => updateData(newTextValue)}
          onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target as any)}
          bgColor={bgColor}
        />
      </>
    )
  },
})

export const actionChangeMetaDescription = register({
  name: 'actionChangeMetaDescription',
  trackEvent: false,
  perform: (elements, appState, newTextValue: string, app: AppClassProperties) => {
    mutateElementsMeta(app, { description: newTextValue })
    return {
      elements: elements,
      commitToHistory: !!newTextValue,
    }
  },

  PanelComponent: ({ elements, appState, updateData, app }: PanelComponentProps) => {
    const singleMeta = getObjectiveSingleMeta(
      app.scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })
    )
    if (!singleMeta) return <></>

    return (
      <div>
        {/* CSS: /packages/excalidraw/css/styles.scss#550*/}
        <legend>Description</legend>
        <textarea
          style={{
            maxWidth: 160, // how to inherit width properly?
          }}
          // placeholder='...'
          value={singleMeta.description || ''}
          onChange={(e) => updateData(e.target.value)}
          onKeyDown={(event) => event.key === KEYS.ENTER && focusNearestParent(event.target as any)}
        />
      </div>
    )
  },
})
