import { getCommonBounds } from '../../../packages/excalidraw'
import { getTransformHandlesFromCoords } from '../../../packages/excalidraw/element'
import {
  OMIT_SIDES_LEAVE_ANGLE,
  TRANSFORM_HANDLES_MARGIN_DEFAULT,
} from '../../../packages/excalidraw/element/transformHandles'
import { ElementsMapOrArray } from '../../../packages/excalidraw/element/types'
import { NormalizedZoomValue } from '../../../packages/excalidraw/types'
import { getObjectiveSingleMetaStrict } from '../meta/selectors'
import { ObjectiveMeta } from '../meta/types'
import { getElementCenter } from './math'

const PUSHPIN_DISTANCE_MARGIN = 10

export const getPushpinLineStart = (meta: ObjectiveMeta) =>
  meta.basis!.width / (meta.coreOpts?.pushpinRotationShiftFactor || 1)

export const getPushpinLineDistance = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) =>
  meta.basis!.width + PUSHPIN_DISTANCE_MARGIN / Math.sqrt(zoomValue)

/**
 * @param target: selected elements or selected metas
 */
export const getPushpinAng = (target: ElementsMapOrArray | ObjectiveMeta | undefined) => {
  if (!target) return undefined
  const meta = 'kind' in target ? target : getObjectiveSingleMetaStrict(target)
  if (meta?.coreOpts?.isPushpinRotation)
    return meta.basis!.angle + (meta.coreOpts.pushpinRotationShiftAngle || 0)
  return undefined
}
/**
 * @param target: selected elements or selected metas
 */
export const getPushpinAngNoShift = (target: ElementsMapOrArray | ObjectiveMeta | undefined) => {
  if (!target) return undefined
  const meta = 'kind' in target ? target : getObjectiveSingleMetaStrict(target)
  if (meta?.coreOpts?.isPushpinRotation) return meta.basis!.angle
  return undefined
}

/** without rotation! */
export const getPushpinLineDemensions = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) => {
  let start = { x: 0, y: -getPushpinLineStart(meta) }
  let end = { x: 0, y: -getPushpinLineDistance(meta, zoomValue) }
  let center = getElementCenter(meta.basis!)
  return { start, end, center }
}

export const getPushpinHeadDemensions = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) => {
  const [x1, y1, x2, y2] = getCommonBounds(meta.elements)
  const handle = getTransformHandlesFromCoords(
    [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2],
    0,
    { value: zoomValue },
    'mouse',
    OMIT_SIDES_LEAVE_ANGLE,
    TRANSFORM_HANDLES_MARGIN_DEFAULT,
    { meta }
  )
  const [rx, ry, rw, rh] = handle.rotation!
  return [rx, ry, rw, rh]
}
