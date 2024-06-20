import { mutateElement } from '../../../packages/excalidraw'
import { getElementAbsoluteCoords } from '../../../packages/excalidraw/element'
import {
  normalizeAngle,
  transformElements,
} from '../../../packages/excalidraw/element/resizeElements'
import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import { rotate } from '../../../packages/excalidraw/math'
import { PointerDownState } from '../../../packages/excalidraw/types'
import { getObjectiveMetas, getObjectiveSingleMetaStrict } from '../meta/_selectors'
import { ObjectiveMeta, isPure } from '../meta/_types'
import { Vector, ensureVector } from './_math'
import { getPushpinAng, getPushpinAngNoShift } from './_transformHandles'

// pure elements doesn't support disabling resize
export const isResizeDisabled = (meta: ObjectiveMeta) => !isPure(meta) && meta.disableResize

export const isElementsScalable = (selectedEls: readonly NonDeletedExcalidrawElement[]) => {
  const metas = getObjectiveMetas(selectedEls)

  // all element are not scalable if at least one meta has disableResize flag
  return !metas.some(isResizeDisabled)
}

export const getObjectiveRotationCenter = (
  meta: ObjectiveMeta | undefined,
  centerX: number,
  centerY: number
) => {
  const factor = meta?.coreOpts?.pushpinRotationCenterShiftFactor
  if (factor) {
    const newRotattionCenter = rotate(
      centerX - meta.basis!.width / factor,
      centerY,
      centerX,
      centerY,
      normalizeAngle(getPushpinAngNoShift(meta)!)
    )
    ;[centerX, centerY] = newRotattionCenter
  }
  return ensureVector([centerX, centerY])
}

/**
 * @param originalElements could be empty map, in case we handle just  created programatecly elements
 */
export const getObjectiveItemRotationArgs = (
  originalElements: PointerDownState['originalElements'],
  elements: readonly NonDeletedExcalidrawElement[],
  centerX: number,
  centerY: number,
  centerAngle: number
): [number, number, number] => {
  const selectedOriginalElements = elements.map((e) => originalElements.get(e.id) || e)
  const meta = getObjectiveSingleMetaStrict(selectedOriginalElements)

  const pushpingAng = getPushpinAng(meta)
  if (pushpingAng !== undefined) centerAngle -= pushpingAng

  const center = getObjectiveRotationCenter(meta, centerX, centerY)

  return [center.x, center.y, centerAngle]
}

/**
 * Objective version of Excalidraw impl.
 *
 * @see {@link transformElements} -> rotateSingleElement
 * */
export const rotateElementOnAngle = <T extends ExcalidrawElement>(
  element: T,
  rotatePoint: Vector,
  rotateAngle: number // radian
) => {
  const [x1, y1, x2, y2, cx, cy] = getElementAbsoluteCoords(element)
  const [rotatedCX, rotatedCY] = rotate(cx, cy, rotatePoint.x, rotatePoint.y, rotateAngle)
  mutateElement<ExcalidrawElement>(
    element,
    {
      x: element.x + (rotatedCX - cx),
      y: element.y + (rotatedCY - cy),
      angle: normalizeAngle(rotateAngle),
    },
    false
  )
  return element
}
