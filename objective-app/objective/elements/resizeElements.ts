import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import {
  ElementsMap,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import { rotate } from '../../../packages/excalidraw/math'
import { PointerDownState } from '../../../packages/excalidraw/types'
import { getObjectiveMetas, getObjectiveSingleMetaStrict } from '../meta/selectors'
import { ObjectiveMeta, isPure } from '../meta/types'
import { mapOmitNone } from '../utils/helpers'
import { getPushpinAng, getPushpinAngNoShift } from './transformHandles'

// pure elements doesn't support disabling resize
export const isResizeDisabled = (meta: ObjectiveMeta) => !isPure(meta) && meta.disableResize

export const isElementsScalable = (selectedEls: readonly NonDeletedExcalidrawElement[]) => {
  const metas = getObjectiveMetas(selectedEls)

  // all element are not scalable if at least one meta has disableResize flag
  return !metas.some(isResizeDisabled)
}

export const rotateMultipleElementsObjectiveHandler = (
  originalElements: PointerDownState['originalElements'],
  elements: readonly NonDeletedExcalidrawElement[],
  elementsMap: ElementsMap,
  pointerX: number,
  pointerY: number,
  shouldRotateWithDiscreteAngle: boolean,
  centerX: number,
  centerY: number,
  centerAngle: number
): [number, number, number] => {
  const selectedOriginalElements = mapOmitNone(elements, (e) => originalElements.get(e.id))
  const meta = getObjectiveSingleMetaStrict(selectedOriginalElements)
  const pushpingAng = getPushpinAng(meta)
  if (pushpingAng) {
    centerAngle -= pushpingAng
    const centerShiftFactor = meta?.coreOpts?.pushpinRotationCenterShiftFactor
    if (centerShiftFactor) {
      const newRotattionCenter = rotate(
        centerX - meta.basis!.width / centerShiftFactor,
        centerY,
        centerX,
        centerY,
        normalizeAngle(getPushpinAngNoShift(meta)!)
      )
      ;[centerX, centerY] = newRotattionCenter
    }
  }

  return [centerX, centerY, centerAngle]
}
