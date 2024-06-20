import { isHittingElementNotConsideringBoundingBox } from '../../../packages/excalidraw/element/collision'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState, FrameNameBoundsCache, Point } from '../../../packages/excalidraw/types'
import { scene_getTurnChildren, scene_getTurnParent } from '../meta/_scene'
import { getMeta } from '../meta/_selectors'
import { ObjectiveMetas, isObjective } from '../meta/_types'
import { getPushpinHeadElement } from './_newElement'

export const isObjectiveElementHit = (
  objectiveScene: ObjectiveMetas,
  appState: AppState,
  element: ExcalidrawElement,
  frameNameBoundsCache: FrameNameBoundsCache,
  point: Point
) => {
  if (!isObjective(element)) return false

  const selectedParent = scene_getTurnParent(objectiveScene, appState, element, {
    isSelected: true,
  })
  const selectedChildren = scene_getTurnChildren(objectiveScene, appState, element, {
    isSelected: true,
  })
  if (!selectedParent && !selectedChildren.length) return false

  const meta = getMeta(element)!
  const pushpin = getPushpinHeadElement(meta, appState.zoom.value)
  return isHittingElementNotConsideringBoundingBox(pushpin, appState, frameNameBoundsCache, point)
}
