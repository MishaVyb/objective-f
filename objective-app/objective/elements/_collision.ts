import { isHittingElementNotConsideringBoundingBox } from '../../../packages/excalidraw/element/collision'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { Point } from '../../../packages/excalidraw/types'
import { getCore, getMetaOrNone } from '../meta/_selectors'
import { ObjectiveMeta, WeekMeta, isSupportsTurn } from '../meta/_types'
import { getPushpinHeadElements } from './_newElementObjectiveConstructors'
import { isPushbinHandlePotential } from './_transformHandles'

export const isObjectiveElementHit = (element: ExcalidrawElement, point: Point) => {
  const { oScene } = getCore()
  const meta = oScene.getMetaByBasis(element)
  if (meta) {
    // handle hitting of this element as Objective basis
    return isObjectiveBasisElementHit(meta, point)
  } else {
    // handle hitting of this element as any other objective element (not basis)
    return isObjectiveNotBasisElementHit(getMetaOrNone(element), point)
  }
}
export const isObjectiveNotBasisElementHit = (meta: WeekMeta | undefined, point: Point) => {
  if (!meta) return undefined
  if (isSupportsTurn(meta)) {
    if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
  }
  return undefined
}

export const isObjectiveBasisElementHit = (meta: ObjectiveMeta, point: Point) => {
  const { oScene, appState, app } = getCore()
  if (isSupportsTurn(meta)) {
    // probably hinting on of the child, so select Parent in that case
    const children = oScene.getTurnChildren(meta)
    for (const child of children) {
      const isChildHint = isHittingElementNotConsideringBoundingBox(
        child.basis!,
        appState,
        app.frameNameBoundsCache,
        point
      )
      if (isChildHint) return true
    }

    // probably hinting Pushpin
    return isHintingPushpin(meta, point)
  }

  return undefined // handle by Excalidraw logic
}

export const isHintingPushpin = (meta: ObjectiveMeta, point: Point) => {
  const { app, appState } = getCore()
  if (!isSupportsTurn(meta)) return undefined

  const isPushpin = isPushbinHandlePotential(meta)
  if (!isPushpin) {
    if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
    return undefined
  }
  const [pushpin, number] = getPushpinHeadElements(meta)
  const isPushpinHint = isHittingElementNotConsideringBoundingBox(
    pushpin,
    appState,
    app.frameNameBoundsCache,
    point
  )
  if (!isPushpinHint) {
    if (meta.turnParentId) return false // prevent selecting child by NOT Pushpin
    return undefined
  }
  return true // yep, Pushpin is hitting
}
