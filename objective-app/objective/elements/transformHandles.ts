import { ElementsMapOrArray, ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { NormalizedZoomValue, Zoom } from '../../../packages/excalidraw/types'
import { getObjectiveSingleMetaStrict } from '../meta/selectors'
import { ObjectiveMeta } from '../meta/types'

const PUSHPIN_DISTANCE_MARGIN = 10

export const getPushpinLineStart = (meta: ObjectiveMeta) =>
  meta.basis!.width / (meta.coreOpts?.pushpinRotationShiftFactor || 1)
export const getPushpinHandleDistance = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) =>
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
