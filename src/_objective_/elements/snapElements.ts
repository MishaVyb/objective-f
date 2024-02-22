import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import {
  ExcalidrawElement,
  ExcalidrawLinearElement,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState, KeyboardModifiersObject } from '../../../packages/excalidraw/types'

import { getCenter, getDistanceAbs, getDistance, Vector2D } from './math'
import { getObjectiveBasis, getObjectiveMetas } from '../selectors/selectors'
import { isWallElement } from '../types/types'

/** Objective `snapDraggedElements` event handler */
export const snapDraggedElementsLocation = (
  selectedElements: ExcalidrawElement[],
  dragOffset: Vector2D,
  appState: AppState,
  event: KeyboardModifiersObject,
  scene: Scene
) => {
  const metas = getObjectiveMetas(selectedElements)
  const singleObjectiveItem = metas.length === 1
  if (singleObjectiveItem) {
    const meta = metas[0]
    const elements = scene.getNonDeletedElements()
    const walls = elements.filter(isWallElement)
    const targetWall = walls.length === 1 ? walls[0] : null
    if (targetWall) {
      const basis = getObjectiveBasis<ExcalidrawLinearElement>(meta)
      const basisPoints = LinearElementEditor.getPointsGlobalCoordinates(basis)
      const center = getCenter(basisPoints[0], basisPoints[1])

      // make basis center follow user cursor XY
      center.x = center.x + dragOffset.x
      center.y = center.y + dragOffset.y

      // TODO handle not only 1-2 wall points, but all point and all walls
      const [wa, wb] = LinearElementEditor.getPointsGlobalCoordinates(targetWall)
      const dist = getDistanceAbs(wa, wb, center)
      const distNotAbs = getDistance(wa, wb, center)
      const isShouldSnap = 0 < dist && dist < 40

      if (isShouldSnap) {
        const wallAngle = normalizeAngle(Math.atan2(wb[1] - wa[1], wb[0] - wa[0]))
        const distAngle = 90 - wallAngle
        const snapOffset = {
          x: Math.cos(distAngle) * distNotAbs * -1,
          y: Math.sin(distAngle) * distNotAbs,
        }

        return {
          snapOffset,
          snapLines: [],
        }
      }
    }
  }
  // no snapping
  return {
    snapOffset: { x: 0, y: 0 },
    snapLines: [],
  }
}
