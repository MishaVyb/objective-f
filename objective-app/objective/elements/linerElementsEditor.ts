import { changeProperty } from '../../../packages/excalidraw/actions/actionProperties'
import { duplicateElement } from '../../../packages/excalidraw/element'
import { mutateElement, newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import {
  getBoundTextElement,
  handleBindTextResize,
} from '../../../packages/excalidraw/element/textElement'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawLinearElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import {
  ObjectiveElement,
  ObjectiveKinds,
  ObjectiveMeta,
  isElementRelatedToMeta,
  isElementTarget,
  isKind,
} from '../meta/types'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { getObjectiveBasis } from '../meta/selectors'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'

export const decomposeWall = (e: ExcalidrawLinearElement) => {
  if (e.points.length <= 2) return [e]

  const result = []
  let prevPoint
  const points = LinearElementEditor.getPointsGlobalCoordinates(e)
  for (const currentPoint of points) {
    if (prevPoint) {
      result.push(
        duplicateElement(null, new Map(), e, {
          x: prevPoint[0],
          y: prevPoint[1],
          width: Math.abs(currentPoint[0] - prevPoint[0]),
          height: Math.abs(currentPoint[1] - prevPoint[1]),
          points: [
            [0, 0],
            [currentPoint[0] - prevPoint[0], currentPoint[1] - prevPoint[1]],
          ],
        })
      )
    }
    prevPoint = currentPoint
  }
  return result
}

