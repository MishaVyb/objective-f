import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import {
  ExcalidrawElement,
  ExcalidrawLinearElement,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState, KeyboardModifiersObject, Point } from '../../../packages/excalidraw/types'

import {
  getCenter,
  getDistance,
  Vector,
  ensureVector,
  getAngRad,
  isTargetInsideSquare,
  ensurePoint,
} from './math'
import { getObjectiveBasis, getObjectiveMetas } from '../meta/selectors'
import { LocationMeta, isWallElement } from '../meta/types'
import { PointSnapLine } from '../../../packages/excalidraw/snapping'

const LOCATION_SNAP_DISTANCE = 50

export type LocationSnap = {
  basis: ExcalidrawLinearElement
  /** global coordinates [start, end] */
  basisPoints: Point[]
  /** global coordinates with dratOffset applied */
  basisCenter: Vector
  wall: ExcalidrawLinearElement
  /** global coordinates */
  partStart: Vector
  /** global coordinates */
  partEnd: Vector
  /** radians (normalized) */
  partAngle: number
  dist: number
  distAbs: number
}

export const shouldSnap = (target: LocationSnap, appState: AppState) => {
  // TODO LOCATION_SNAP_DISTANCE / appState.zoom.value
  if (LOCATION_SNAP_DISTANCE < target.distAbs) return false

  if (
    !isTargetInsideSquare(
      target.partStart,
      target.partEnd,
      target.basisCenter,
      LOCATION_SNAP_DISTANCE
    )
  )
    return false

  return true
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

  if (!target) return
  if (!shouldSnap(target, appState)) return

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
): { snapOffset: Vector; snapLines: PointSnapLine[] } => {
  const metas = getObjectiveMetas(selectedElements)
  const singleObjectiveItem = metas.length === 1
  if (singleObjectiveItem) {
    const meta = metas[0]
    const snap = getLocationSnap(meta, appState, scene, dragOffset)
    if (snap) {
      return {
        snapOffset: getLocationSnapOffset(snap),
        snapLines: [
          {
            type: 'points',
            points: [ensurePoint(snap.partStart), ensurePoint(snap.partEnd)], //
          },
        ],
      }
    }
  }
  // no snapping
  return {
    snapOffset: { x: 0, y: 0 },
    snapLines: [],
  }
}
