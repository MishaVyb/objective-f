import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { renderElement } from '../../../packages/excalidraw/renderer/renderElement'
import { StaticSceneRenderConfig } from '../../../packages/excalidraw/scene/types'
import { getObjectiveMetas } from '../meta/selectors'
import { isCameraMeta } from '../meta/types'
import { getCameraLensAngleElements } from './newElement'

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
  // visibleElements: readonly NonDeletedExcalidrawElement[]
  const metas = getObjectiveMetas(visibleElements)
  const extraEls: ExcalidrawElement[] = []
  metas.forEach((m) => {
    if (isCameraMeta(m)) extraEls.push(...getCameraLensAngleElements(m))
  })

  extraEls.forEach((e) =>
    renderElement(e, elementsMap, allElementsMap, rc, context, renderConfig, appState)
  )
}