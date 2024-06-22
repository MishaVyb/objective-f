import { isHittingElementNotConsideringBoundingBox } from '../../../packages/excalidraw/element/collision'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState, FrameNameBoundsCache, Point } from '../../../packages/excalidraw/types'
import { scene_getMetaByBasis, scene_getTurnChildren } from '../meta/_scene'
import { getMetaOrNone } from '../meta/_selectors'
import { ObjectiveMeta, ObjectiveMetas, WeekMeta, isSupportsTurn } from '../meta/_types'
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
  if (meta) {
    // handle hitting of this element as Objective basis
    return isObjectiveBasisElementHit(
      objectiveScene,
      appState,
      meta,
      frameNameBoundsCache,
      point //
    )
  } else {
    // handle hitting of this element as any other objective element (not basis)
    return isObjectiveNotBasisElementHit(
      objectiveScene,
      appState,
      getMetaOrNone(element),
      frameNameBoundsCache,
      point
    )
  }
}
export const isObjectiveNotBasisElementHit = (
  objectiveScene: ObjectiveMetas,
  appState: AppState,
  meta: WeekMeta | undefined,
  frameNameBoundsCache: FrameNameBoundsCache,
  point: Point
) => {
  if (!meta) return undefined
  if (isSupportsTurn(meta)) {
    if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
  }
  return undefined
}

export const isObjectiveBasisElementHit = (
  objectiveScene: ObjectiveMetas,
  appState: AppState,
  meta: ObjectiveMeta,
  frameNameBoundsCache: FrameNameBoundsCache,
  point: Point
) => {
  if (isSupportsTurn(meta)) {
    // probably hinting on of the child, so select Parent in that case
    const children = scene_getTurnChildren(objectiveScene, appState, meta)
    for (const child of children) {
      const isChildHint = isHittingElementNotConsideringBoundingBox(
        child.basis!,
        appState,
        frameNameBoundsCache,
        point
      )
      if (isChildHint) return true
    }

    // probably hinting Pushpin
    const isPushpin = isPushbinHandlePotential(objectiveScene, appState, meta)
    if (!isPushpin) {
      if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
      return undefined
    }
    const pushpin = getPushpinHeadElement(meta, appState.zoom.value)
    const isPushpinHint = isHittingElementNotConsideringBoundingBox(
      pushpin,
      appState,
      frameNameBoundsCache,
      point
    )
    if (!isPushpinHint) {
      if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
      return undefined
    }
    return true // yep, Pushpin is hitting
  }

  return undefined // handle by Excalidraw logic
}
