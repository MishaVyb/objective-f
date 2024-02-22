import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { ExcalidrawLinearElement } from '../../../packages/excalidraw/element/types'

import { Point } from '../../../packages/excalidraw/types'
import { getObjectiveBasis } from '../selectors/selectors'
import { ObjectiveMeta } from '../types/types'

export const getAng = (start: Point, end: Point) =>
  (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI

export const MathRound = (n: number, k: number = 2) => n
// Math.round(n * Math.pow(10, k)) / Math.pow(10, k)

/** @deprecated use LinearElementEditor.getPointsGlobalCoordinates !!!!!!!!!! */
export const getAbsLineStartEnd = (
  el: ExcalidrawLinearElement,
  pointStart: Point,
  pointEnd: Point
): [Point, Point] => {
  const absStart = [...pointStart] as Point
  //@ts-ignore
  absStart[0] = el.x + pointStart[0]
  //@ts-ignore
  absStart[1] = el.y + pointStart[1]
  const absEnd = [...pointEnd] as Point
  //@ts-ignore
  absEnd[0] = el.x + pointEnd[0]
  //@ts-ignore
  absEnd[1] = el.y + pointEnd[1]
  return [absStart, absEnd]
}

export type Vector2D = {
  x: number
  y: number
}

type PointType = Vector2D | Point

const ensureXYPoint = (point: PointType): Vector2D => {
  return 'length' in point ? { x: point[0], y: point[1] } : point
}

/** Get distance between line _1<->_2 and point _0 */
export const getDistanceAbs = (_1: PointType, _2: PointType, _0: PointType) =>
  Math.abs(getDistance(_1, _2, _0))

/** Get distance between line _1<->_2 and point _0 */
export const getDistance = (_1: PointType, _2: PointType, _0: PointType) => {
  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line Line defined by two points

  _1 = ensureXYPoint(_1)
  _2 = ensureXYPoint(_2)
  _0 = ensureXYPoint(_0)

  return MathRound(
    ((_2.x - _1.x) * (_1.y - _0.y) - (_1.x - _0.x) * (_2.y - _1.y)) /
      Math.sqrt(Math.pow(_2.x - _1.x, 2) + Math.pow(_2.y - _1.y, 2))
  )
}

export const getCenter = (a: PointType, b: PointType): Vector2D => {
  a = ensureXYPoint(a)
  b = ensureXYPoint(b)
  return {
    x: a.x + (b.x - a.x) / 2,
    y: a.y + (b.y - a.y) / 2,
  }
}

export const getRotationCenterAndAngle = (
  selectedMeta: ObjectiveMeta,
  wallAngle: number
): [Vector2D, number] => {
  const basis = getObjectiveBasis<ExcalidrawLinearElement>(selectedMeta)
  const [a, b] = getAbsLineStartEnd(basis, basis.points[0], basis.points[1])
  const basisCenter = getCenter(a, b)
  const basisAngle = normalizeAngle(basis.angle) // NORMALIZE!
  const rotateForValue = wallAngle - basisAngle
  return [basisCenter, rotateForValue]
}

//----------------------------- unused for now, but could be used later ---------------------------//

export type Func = {
  slope: number
  intercept: number // y-intercept
}

export const getLineFunc = (start: Point, end: Point): Func => {
  // y = slope * x + intercept
  // slope = (y2 - y1) / (x2 - x1)
  // intercept = y - slope * x
  const slope = MathRound((end[1] - start[1]) / (end[0] - start[0]))
  const intercept = MathRound(start[1] - slope * start[0])
  return { slope, intercept }
}

export const getLineDistance = (a: Func, b: Func) => {
  if (a.slope !== b.slope) return Infinity // lines are not parallel
  const slope = a.slope
  return Math.abs(b.intercept - a.intercept) / Math.sqrt(Math.pow(slope, 2) + Math.pow(slope, 2))
}
