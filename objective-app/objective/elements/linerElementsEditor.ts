import { duplicateElement } from '../../../packages/excalidraw/element'
import { ExcalidrawLinearElement } from '../../../packages/excalidraw/element/types'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'

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
