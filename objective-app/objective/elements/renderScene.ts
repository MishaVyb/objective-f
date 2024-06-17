import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import { renderElement } from '../../../packages/excalidraw/renderer/renderElement'
import { StaticSceneRenderConfig } from '../../../packages/excalidraw/scene/types'
import { getObjectiveMetas } from '../meta/selectors'
import { isCameraMeta, isObjectiveHidden } from '../meta/types'
import { mapOmitNone } from '../utils/helpers'
import { objectKeys } from '../utils/types'
import { getCameraLensAngleElements, getPushpinElements } from './newElement'

export const renderObjectiveScene = (
  {
    canvas,
    rc,
    elementsMap,
    allElementsMap,
    visibleElements,
    scale,
    appState,
    renderConfig,
  }: StaticSceneRenderConfig,
  context: CanvasRenderingContext2D
) => {
  const ids = objectKeys(appState.selectedElementIds) as string[]
  const metas = getObjectiveMetas(elementsMap)
  const selectedMetas = getObjectiveMetas(mapOmitNone(ids, (k) => elementsMap.get(k)))
  const selectedSingleMeta = selectedMetas.length === 1 ? selectedMetas[0] : undefined
  const extraEls: ExcalidrawElement[] = []

  metas.forEach((m) => {
    if (isCameraMeta(m) && !isObjectiveHidden(m.basis!) && m.lensAngleRepr)
      extraEls.push(...getCameraLensAngleElements(m))

    if (
      // m.id === selectedSingleMeta?.id && // TODO
      m.coreOpts?.isPushpinRotation
    ) {
      extraEls.push(...getPushpinElements(m, { zoomValue: appState.zoom.value }))
    }
  })

  extraEls.forEach((e) =>
    renderElement(e, elementsMap, allElementsMap, rc, context, renderConfig, appState)
  )
}
