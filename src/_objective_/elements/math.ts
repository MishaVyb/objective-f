import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'

import { Point } from '../../../packages/excalidraw/types'

export type Vector = {
  x: number
  y: number
}

type PointType = Vector | Point

export const ensureVector = (point: PointType): Vector => {
  return 'length' in point ? { x: point[0], y: point[1] } : point
}
export const getAngRad = (a: PointType, b: PointType) => {
  a = ensureVector(a)
  b = ensureVector(b)
  return normalizeAngle(Math.atan2(b.y - a.y, b.x - a.x))
}

export const getAngDeg = (a: PointType, b: PointType) => (getAngRad(a, b) * 180) / Math.PI

export const MathRound = (n: number, k: number = 2) => n
// Math.round(n * Math.pow(10, k)) / Math.pow(10, k)

/** Get distance between line _1<->_2 and point _0 */
export const getDistanceAbs = (_1: PointType, _2: PointType, _0: PointType) =>
  Math.abs(getDistance(_1, _2, _0))

/** Get distance between line _1<->_2 and point _0 */
export const getDistance = (_1: PointType, _2: PointType, _0: PointType) => {
  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line Line defined by two points

  _1 = ensureVector(_1)
  _2 = ensureVector(_2)
  _0 = ensureVector(_0)

  return MathRound(
    ((_2.x - _1.x) * (_1.y - _0.y) - (_1.x - _0.x) * (_2.y - _1.y)) /
      Math.sqrt(Math.pow(_2.x - _1.x, 2) + Math.pow(_2.y - _1.y, 2))
  )
}

export const getCenter = (a: PointType, b: PointType): Vector => {
  a = ensureVector(a)
  b = ensureVector(b)
  return {
    x: a.x + (b.x - a.x) / 2,
    y: a.y + (b.y - a.y) / 2,
  }
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
