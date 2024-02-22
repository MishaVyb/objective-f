import { mutateElement } from '../../../packages/excalidraw'
import { getElementAbsoluteCoords } from '../../../packages/excalidraw/element'
import { updateBoundElements } from '../../../packages/excalidraw/element/binding'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { getBoundTextElement } from '../../../packages/excalidraw/element/textElement'
import { isArrowElement, isFrameLikeElement } from '../../../packages/excalidraw/element/typeChecks'
import {
  ElementsMap,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import { rotate } from '../../../packages/excalidraw/math'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { PointerDownState } from '../../../packages/excalidraw/types'

export const rotateMultipleElementsOnAngle = (
  originalElements: PointerDownState['originalElements'],
  elements: readonly NonDeletedExcalidrawElement[],
  elementsMap: ElementsMap,
  centerX: number,
  centerY: number,
  centerAngle: number
) => {
  elements
    .filter((element) => !isFrameLikeElement(element))
    .forEach((element) => {
      const [x1, y1, x2, y2] = getElementAbsoluteCoords(element)
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2
      const origAngle = originalElements.get(element.id)?.angle ?? element.angle
      const [rotatedCX, rotatedCY] = rotate(
        cx,
        cy,
        centerX,
        centerY,
        centerAngle + origAngle - element.angle
      )
      mutateElement(
        element,
        {
          x: element.x + (rotatedCX - cx),
          y: element.y + (rotatedCY - cy),
          angle: normalizeAngle(centerAngle + origAngle),
        },
        false
      )
      updateBoundElements(element, { simultaneouslyUpdated: elements })

      const boundText = getBoundTextElement(element, elementsMap)
      if (boundText && !isArrowElement(element)) {
        mutateElement(
          boundText,
          {
            x: boundText.x + (rotatedCX - cx),
            y: boundText.y + (rotatedCY - cy),
            angle: normalizeAngle(centerAngle + origAngle),
          },
          false
        )
      }
    })

  Scene.getScene(elements[0])?.informMutation()
}
