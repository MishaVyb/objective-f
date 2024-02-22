import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import {
  ExcalidrawElement,
  ExcalidrawLinearElement,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties } from '../../../packages/excalidraw/types'

import { getAbsLineStartEnd, getDistanceAbs, getRotationCenterAndAngle } from '../elements/math'
import { rotateMultipleElementsOnAngle } from '../elements/mutateElements'
import { getObjectiveBasis, getObjectiveMetas } from '../selectors/selectors'
import { ObjectiveMeta, isLocationMeta, isWallElement } from '../types/types'
import { register } from './register'

/** Internal action called on `pointerUp` event handler */
export const actionSnapLocation = register({
  name: 'actionSnapLocation',
  trackEvent: { category: 'element' },
  perform: (elements, appState, formData, app: AppClassProperties) => {
    const selected = app.scene.getSelectedElements({
      selectedElementIds: app.state.selectedElementIds,
    })
    const metas = getObjectiveMetas(selected)
    const singleObjectiveItem = metas.length === 1

    if (singleObjectiveItem && isLocationMeta(metas[0])) {
      performActionSnapLocation(selected, metas[0], app.scene)
    }

    return {
      elements,
      commitToHistory: false,
    }
  },
})

const performActionSnapLocation = (
  selected: readonly ExcalidrawElement[],
  meta: ObjectiveMeta,
  scene: Scene
) => {
  const elements = scene.getNonDeletedElements()
  const walls = elements.filter(isWallElement)
  const targetWall = walls.length === 1 ? walls[0] : null
  if (targetWall) {
    let wallAngle = 0

    let prevPoint = null
    for (const currentPoint of targetWall.points) {
      if (prevPoint) {
        const [a, b] = getAbsLineStartEnd(targetWall, prevPoint, currentPoint)
        wallAngle = normalizeAngle(Math.atan2(b[1] - a[1], b[0] - a[0])) // NORMALIZE!
      }
      prevPoint = currentPoint
    }

    const [basisCenterOrig, rotateForValueOrig] = getRotationCenterAndAngle(meta, wallAngle)

    const basis = getObjectiveBasis<ExcalidrawLinearElement>(meta)
    const basisPoints = LinearElementEditor.getPointsGlobalCoordinates(basis)

    const wallPoints = LinearElementEditor.getPointsGlobalCoordinates(targetWall)
    const dist = getDistanceAbs(wallPoints[0], wallPoints[1], basisCenterOrig)
    const isShouldSnap = 0 < dist && dist < 50

    // do rotate only if there are angle (if not, drag elements)
    if (isShouldSnap && rotateForValueOrig) {
      console.log('DO ROTATE')

      rotateMultipleElementsOnAngle(
        scene.getElementsMapIncludingDeleted(),
        selected,
        scene.getElementsMapIncludingDeleted(),
        basisCenterOrig.x,
        basisCenterOrig.y,
        rotateForValueOrig
      )

      // NOTE:
      // do not drag elements at the same time with rotation, otherwise elements in group go appart
      // so return empty elementsToUpdate to prevent dragging
    }
    //
    // no rotaion..
  }
  //
  // no rotaion..
}
