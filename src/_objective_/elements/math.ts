import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'

import { Point } from '../../../packages/excalidraw/types'

export type Vector = {
  x: number
  y: number
}

type PointType = Vector | Point

export const ensureVector = (arg: PointType): Vector =>
  'length' in arg ? { x: arg[0], y: arg[1] } : arg

export const ensurePoint = (arg: PointType): Point => ('length' in arg ? arg : [arg.x, arg.y])

export const getAngRad = (a: PointType, b: PointType) => {
  a = ensureVector(a)
  b = ensureVector(b)
  return normalizeAngle(Math.atan2(b.y - a.y, b.x - a.x))
}

export const getAngDeg = (a: PointType, b: PointType) => (getAngRad(a, b) * 180) / Math.PI

export const MathRound = (x: number, decimalPlaces = 6) => {
  return Math.round(x * 10 ** decimalPlaces) / 10 ** decimalPlaces
}

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

export const isHorizontallLine = (a: Vector, b: Vector) => a.y === b.y
export const isVerticalLine = (a: Vector, b: Vector) => a.x === b.x

export const isTargetInsideSquare = (
  a: Vector,
  b: Vector,
  target: Vector,
  paddingShift: number = 0
) => {
  const padding = { x: 0, y: 0 }
  if (isHorizontallLine(a, b)) padding.y = paddingShift
  if (isVerticalLine(a, b)) padding.x = paddingShift

  // x condition or x condition reversed
  // y condition or y condition reversed
  const XCond = a.x - padding.x < target.x && target.x < b.x + padding.x
  const XCondRev = b.x - padding.x < target.x && target.x < a.x + padding.x
  const YCond = a.y - padding.y < target.y && target.y < b.y + padding.y
  const YCondRev = b.y - padding.y < target.y && target.y < a.y + padding.y
  return (XCond || XCondRev) && (YCond || YCondRev)
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
