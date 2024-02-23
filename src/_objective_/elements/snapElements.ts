import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import {
  ExcalidrawElement,
  ExcalidrawLinearElement,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState, KeyboardModifiersObject, Point } from '../../../packages/excalidraw/types'

import { getCenter, getDistance, Vector, ensureVector, getAngRad } from './math'
import { getObjectiveBasis, getObjectiveMetas } from '../selectors/selectors'
import { LocationMeta, isWallElement } from '../types/types'

const LOCATION_SNAP_DISTANCE = 50

export const getRequiredMinDistToSnap = (appState: AppState) => {
  return LOCATION_SNAP_DISTANCE // TODO LOCATION_SNAP_DISTANCE / appState.zoom.value
}

export type LocationSnap = {
  basis: ExcalidrawLinearElement

  /** [start, end] */
  basisPoints: Point[]

  /** with dratOffset applied! */
  basisCenter: Vector
  //
  wall: ExcalidrawLinearElement
  partStart: Vector
  partEnd: Vector
  /** radians */
  partAngle: number
  dist: number
  distAbs: number
  // isShouldSnap: boolean
}

export const getLocationSnap = (
  draggedMeta: LocationMeta,
  appState: AppState,
  scene: Scene,
  dragOffset: Vector = { x: 0, y: 0 }
) => {
  const elements = scene.getNonDeletedElements()
  const walls = elements.filter(isWallElement)
  if (!walls.length) return

  const basis = getObjectiveBasis<ExcalidrawLinearElement>(draggedMeta)
  if (!basis) return
  if (basis.points.length !== 2) return

  const basisPoints = LinearElementEditor.getPointsGlobalCoordinates(basis)
  const basisCenter = getCenter(basisPoints[0], basisPoints[1])

  // make basis center follow user cursor XY
  basisCenter.x = basisCenter.x + dragOffset.x
  basisCenter.y = basisCenter.y + dragOffset.y

  let minDist = Infinity
  let target: LocationSnap | null = null
  for (const wall of walls) {
    const points = LinearElementEditor.getPointsGlobalCoordinates(wall)

    let prevPoint
    for (const currentPoint of points) {
      if (prevPoint) {
        const dist = getDistance(prevPoint, currentPoint, basisCenter)
        const distAbs = Math.abs(dist)
        if (distAbs < minDist) {
          minDist = distAbs
          target = {
            basis,
            basisPoints,
            basisCenter,
            wall,
            partStart: ensureVector(prevPoint),
            partEnd: ensureVector(currentPoint),
            dist,
            distAbs,
            partAngle: NaN, // populate it later
          }
        }
      }
      prevPoint = currentPoint
    }
  }

  if (!target) return null
  if (getRequiredMinDistToSnap(appState) < target.distAbs) return

  target.partAngle = getAngRad(target.partStart, target.partEnd)
  return target
}

const getLocationSnapOffset = (snap: LocationSnap) => ({
  x: Math.cos(90 - snap.partAngle) * snap.dist * -1,
  y: Math.sin(90 - snap.partAngle) * snap.dist,
})

/** Objective `snapDraggedElements` event handler */
export const snapDraggedElementsLocation = (
  selectedElements: ExcalidrawElement[],
  dragOffset: Vector,
  appState: AppState,
  event: KeyboardModifiersObject,
  scene: Scene
) => {
  const metas = getObjectiveMetas(selectedElements)
  const singleObjectiveItem = metas.length === 1
  if (singleObjectiveItem) {
    const meta = metas[0]
    const snap = getLocationSnap(meta, appState, scene, dragOffset)
    if (snap) {
      const [wb, wa] = [snap.partStart, snap.partEnd]
      const wallAngle = normalizeAngle(Math.atan2(wb.y - wa.y, wb.x - wa.x))
      console.log(wallAngle)

      return {
        snapOffset: getLocationSnapOffset(snap),
        snapLines: [],
      }
    }
  }
  // no snapping
  return {
    snapOffset: { x: 0, y: 0 },
    snapLines: [],
  }
}
