import { isHittingElementNotConsideringBoundingBox } from '../../../packages/excalidraw/element/collision'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState, FrameNameBoundsCache, Point } from '../../../packages/excalidraw/types'
import { scene_getMetaByBasis } from '../meta/_scene'
import { ObjectiveMetas } from '../meta/_types'
import { getPushpinHeadElement } from './_newElement'
import { isPushbinHandlePotential } from './_transformHandles'

export const isObjectiveElementHit = (
  objectiveScene: ObjectiveMetas,
  appState: AppState,
  element: ExcalidrawElement,
  frameNameBoundsCache: FrameNameBoundsCache,
  point: Point
) => {
  const meta = scene_getMetaByBasis(objectiveScene, element)
  if (!meta) return false

  const isPushpin = isPushbinHandlePotential(objectiveScene, appState, meta)
  if (!isPushpin) return false

  const pushpin = getPushpinHeadElement(meta, appState.zoom.value)
  return isHittingElementNotConsideringBoundingBox(pushpin, appState, frameNameBoundsCache, point)
}
