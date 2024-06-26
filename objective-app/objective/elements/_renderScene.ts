import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { renderElement } from '../../../packages/excalidraw/renderer/renderElement'
import { StaticSceneRenderConfig } from '../../../packages/excalidraw/scene/types'
import { AppState } from '../../../packages/excalidraw/types'
import { getCoreSafe, getObjectiveMetas } from '../meta/_selectors'
import { isCameraMeta, isObjectiveHidden } from '../meta/_types'
import {
  getCameraLensAngleElements,
  getPushpinArrowElements,
  getPushpinElements,
} from './_newElement'
import { isPushbinHandlePotential } from './_transformHandles'

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
  const metas = getObjectiveMetas(elementsMap)
  const extraEls: ExcalidrawElement[] = []

  const { app } = getCoreSafe()

  metas.forEach((meta) => {
    // lens angle & focus lines
    if (isCameraMeta(meta) && !isObjectiveHidden(meta.basis!) && meta.lensAngleRepr)
      extraEls.push(...getCameraLensAngleElements(meta))

    // pushpin
    if (app) {
      if (isPushbinHandlePotential(meta)) {
        extraEls.push(...getPushpinElements(meta))
      } else {
        extraEls.push(...getPushpinArrowElements(meta))
      }
    }
  })

  extraEls.forEach((e) =>
    renderElement(e, elementsMap, allElementsMap, rc, context, renderConfig, appState)
  )
}
