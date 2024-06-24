import { newElement, newLinearElement, newTextElement } from '../../../packages/excalidraw/element'
import {
  bindLinearElement,
  updateBoundElements,
} from '../../../packages/excalidraw/element/binding'
import {
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawLinearElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
  NonDeletedSceneElementsMap,
} from '../../../packages/excalidraw/element/types'
import { getCore, getObjectiveBasis, getPointerIds, isElementSelected } from '../meta/_selectors'
import { CameraMeta, ObjectiveKinds, ObjectiveMeta, PointerMeta } from '../meta/_types'
import { getInitialMeta } from '../meta/_initial'

import { randomId } from '../../../packages/excalidraw/random'
import { DEFAULT_FONT_SIZE } from '../../../packages/excalidraw/constants'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { Vector, ensurePoint, ensureVector, getElementCenter } from './_math'
import { DEFAULT_FOCUS_DISTANCE, getCameraLensAngle } from '../actions/actionCamera'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'

import { HEX_TO_COLOR } from '../UI/colors'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import {
  getPushpinAng,
  getPushpinHeadDemensions,
  getPushpinLineDemensions,
} from './_transformHandles'
import { getObjectiveRotationCenter, rotateElementOnAngle } from './_resizeElements'
import { scene_getNextTurn, scene_getTurnNumber, scene_getTurns } from '../meta/_scene'
import { rotate } from '../../../packages/excalidraw/math'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'

export const POINTER_COMMON = (): Partial<ExcalidrawArrowElement> => ({
  // locked: true, // ??? lock for label but not for images...
  type: 'arrow',
  x: 1,
  y: 1,
  fillStyle: 'hachure',
  points: [
    [0, 0],
    [100, 100],
  ],
  groupIds: [randomId()],
  opacity: 100,
})

const CAMERA_MOVEMENT_POINTER = (
  ref: ExcalidrawBindableElement
): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, {
    subkind: 'cameraMovementPointer',
    name: 'Camera Movement',
  }),
  strokeColor: ref.backgroundColor,
  strokeWidth: 2,
  strokeStyle: 'solid',
  roundness: {
    type: 2,
  },
  startArrowhead: null,
  endArrowhead: 'triangle',
})

const CHARACTER_MOVEMENT_POINTER = (
  ref: ExcalidrawBindableElement
): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, {
    subkind: 'characterMovementPointer',
    name: 'Character Movement',
  }),
  strokeColor: ref.backgroundColor,
  strokeWidth: 2,
  strokeStyle: 'dashed',
  roundness: {
    type: 2,
  },
  startArrowhead: null,
  endArrowhead: 'triangle_outline',
})

const LABEL_POINTER = (): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, { subkind: 'labelPointer' }),
  strokeColor: '#868e96',
  strokeWidth: 0.5,
  strokeStyle: 'solid',
  startArrowhead: null,
  endArrowhead: null,
})

const STORYBOARD_POINTER = (): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, { subkind: 'storyboardPointer' }),
  strokeColor: '#868e96',
  strokeWidth: 0.5,
  strokeStyle: 'solid',
  startArrowhead: null,
  endArrowhead: null,
})

const CAMERA_LENS_ANGLE_LINE = (): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, { subkind: 'cameraLensAngle' }),
  strokeWidth: 1,
  // strokeStyle: 'dashed',
  startArrowhead: null,
  endArrowhead: null,
})

/**
 * Elements are **MUTATING** insdie!
 * @param one arrow start
 * @param another arrow end
 * @returns new arrow
 */
export const newPointerBeetween = (
  one: ExcalidrawBindableElement | undefined,
  another: ExcalidrawBindableElement | undefined,
  nonDeletedElements: NonDeletedSceneElementsMap,
  opts?: {
    scene?: Scene
    subkind?: PointerMeta['subkind']
    overrides?: Partial<ExcalidrawArrowElement>
  }
) => {
  if (!another || !one) return console.warn('Cannot get pointer for undefined element. ')

  for (const pointer of getPointerIds(one, another)) {
    if (nonDeletedElements.get(pointer)) return // already has NON DELETED pointer
  }

  let overrides: Partial<ExcalidrawArrowElement>
  if (opts?.subkind === 'labelPointer') overrides = LABEL_POINTER()
  else if (opts?.subkind === 'storyboardPointer') overrides = STORYBOARD_POINTER()
  else if (opts?.subkind === 'cameraMovementPointer') overrides = CAMERA_MOVEMENT_POINTER(one)
  else if (opts?.subkind === 'characterMovementPointer') overrides = CHARACTER_MOVEMENT_POINTER(one)
  else overrides = LABEL_POINTER()

  if (opts?.overrides) overrides = { ...overrides, ...opts.overrides }

  const newPointer = newLinearElement({
    ...POINTER_COMMON(),
    ...overrides,
  } as ExcalidrawArrowElement)

  bindLinearElement(newPointer, one, 'start')
  bindLinearElement(newPointer, another, 'end')
  updateBoundElements(another, {
    justCreatedBounds: [newPointer],
    justCreatedBoundsAreBoundTo: [another, one],
    scene: opts?.scene,
  })
  updateBoundElements(one, {
    justCreatedBounds: [newPointer],
    justCreatedBoundsAreBoundTo: [another, one],
    scene: opts?.scene,
  })
  return newPointer
}

export const getCameraLensAngleElements = (
  camera: CameraMeta,
  opts?: { overrides?: Partial<ExcalidrawArrowElement> }
) => {
  const { basis, focalLength } = camera
  if (!focalLength || !basis) return []

  const distance = camera.focusDistance || DEFAULT_FOCUS_DISTANCE
  const focalAngle = getCameraLensAngle(camera)!
  const basisCenter = getElementCenter(basis)
  const overrides = {
    ...CAMERA_LENS_ANGLE_LINE(),
    ...(opts?.overrides || {}),
    strokeColor: basis.backgroundColor,
    opacity: camera.elements[1]?.opacity || 100, // FIXME we cannot use basis here as it always has opacity 0
  }

  const leftSide = getCameraLensAngleSide(
    basis.angle,
    basisCenter,
    -focalAngle / 2,
    distance,
    overrides
  )
  const rightSide = getCameraLensAngleSide(
    basis.angle,
    basisCenter,
    focalAngle / 2,
    distance,
    overrides
  )
  const focusLine = getCameraLensFocusLine(leftSide, rightSide, overrides)

  return [
    leftSide,
    rightSide,
    focusLine,
    // centerLine:
    // getCameraLensAngleSide(basis.angle, basisCenter, 0, distance, overrides)
  ]
}

const PUSHPIN_ACTIVE_COLOR = '#3c2a8c'
const PUSHPIN_BG_ACTIVE_COLOR = '#5654a8'

export const getPushpinElements = (
  meta: ObjectiveMeta,
  opts?: {
    overrides?: Partial<ExcalidrawArrowElement>
  }
) => [
  getPushpinLineElement(meta),
  ...getPushpinHeadElements(meta),
  ...getPushpinArrowElements(meta),
]

export const getPushpinLineElement = (meta: ObjectiveMeta) => {
  const { oScene, appState } = getCore()
  const zoomValue = appState.zoom.value
  const isSelected = isElementSelected(appState, meta.basis!)

  const { start, end, center } = getPushpinLineDemensions(meta, zoomValue)
  const pushpinLine = newLinearElement({
    customData: getInitialMeta(ObjectiveKinds.PUSHPIN),
    type: 'arrow',
    strokeWidth: 0.7 / zoomValue,
    strokeColor: isSelected ? PUSHPIN_ACTIVE_COLOR : COLOR_PALETTE.black,
    // strokeStyle: 'dotted',
    // startArrowhead: null,
    // endArrowhead: null,
    //
    x: center.x,
    y: center.y,
    points: [ensurePoint(start), ensurePoint(end)],
  })
  return rotateElementOnAngle(pushpinLine, center, getPushpinAng(meta)!)
}

export const getPushpinArrowElements = (meta: ObjectiveMeta) => {
  const PI = Math.PI
  const { oScene, appState } = getCore()
  const zoomValue = appState.zoom.value
  const total = scene_getTurns(oScene, appState, meta)
  const number = scene_getTurnNumber(oScene, appState, meta) || 0
  const isSelected = isElementSelected(appState, meta.basis!)

  const nextMeta = scene_getNextTurn(oScene, appState, meta)
  if (!nextMeta) return []

  // absolute
  const angDiff = normalizeAngle(nextMeta.basis!.angle - meta.basis!.angle)
  if (angDiff < 0.1 || 2 * PI - 0.1 < angDiff) return []

  const basisCenter = getElementCenter(meta.basis!)
  const rotationCenter = getObjectiveRotationCenter(meta, basisCenter.x, basisCenter.y)

  const tooManyTurns = 4
  const pointShiftXOffset = total.length < tooManyTurns ? 32 : 27
  const pointerShiftXCoef = number < tooManyTurns ? number : tooManyTurns
  const pointShiftX = pointShiftXOffset + pointerShiftXCoef * 6

  let angStartShift = 0
  // if (angDiff < 0.4 || PI * 2 - 0.4 < angDiff) angStartShift = 0 // no shift on small angles
  // else if (angDiff < PI / 2) angStartShift = 0.05
  // else if (angDiff < PI) angStartShift = 0.1
  // else if (angDiff < PI * 1.5) angStartShift = -0.1
  // else if (angDiff < PI * 2) angStartShift = -0.05

  let angEndShiftCoef = 1
  // if (angDiff < 0.4 || PI * 2 - 0.4 < angDiff) angEndShiftCoef = 1 // no shift on small angles
  // else if (angDiff < PI / 2) angEndShiftCoef = 0.9
  // else if (angDiff < PI) angEndShiftCoef = 0.99
  // else if (angDiff < PI * 1.5) angEndShiftCoef = 1.01
  // else if (angDiff < PI * 2) angEndShiftCoef = 1.01

  const centerAbsolute = {
    x: rotationCenter.x + pointShiftX,
    y: rotationCenter.y,
  }
  const startAbsolute = ensureVector(
    rotate(
      centerAbsolute.x,
      centerAbsolute.y,
      rotationCenter.x,
      rotationCenter.y,
      angStartShift //
    )
  )

  const _getMiddlePoint = (_masterAng: number, _coef: number, _shift: number) => {
    const angMiddle =
      _masterAng > PI ? 2 * PI - ((2 * PI - _masterAng) * _coef) / 2 : (_masterAng * _coef) / 2

    // const _angMiddleNorm = angMiddle > PI ? normalizeAngle(2 * PI - angMiddle) : angMiddle
    // const _shiftMiddleNorm = _xShift
    const _middleAbsolute = ensureVector(
      rotate(
        rotationCenter.x + _shift,
        rotationCenter.y,
        rotationCenter.x,
        rotationCenter.y,
        angMiddle
      )
    )
    const _middle = {
      x: _middleAbsolute.x - centerAbsolute.x,
      y: _middleAbsolute.y - centerAbsolute.y,
    }
    return ensurePoint(_middle)
  }

  let middlePoints: (readonly [number, number])[] = []

  // very very small angles
  if (angDiff < 0.2 || PI * 2 - 0.2 < angDiff) middlePoints = []
  // small angles
  else if (angDiff < 0.4 || PI * 2 - 0.4 < angDiff)
    middlePoints = [
      _getMiddlePoint(angDiff, 1, pointShiftX), //
    ]
  // 0-90˚ or 270-360˚
  else if (angDiff < PI / 2 || (PI * 1.5 < angDiff && angDiff < PI * 2))
    middlePoints = [
      _getMiddlePoint(angDiff, 0.75, pointShiftX),
      _getMiddlePoint(angDiff, 1.25, pointShiftX),
    ]
  // 90-180˚ or 180-270˚
  else
    middlePoints = [
      _getMiddlePoint(angDiff, 0.25, pointShiftX),
      _getMiddlePoint(angDiff, 0.5, pointShiftX),
      _getMiddlePoint(angDiff, 0.75, pointShiftX),
      _getMiddlePoint(angDiff, 1, pointShiftX),
      _getMiddlePoint(angDiff, 1.25, pointShiftX),
      _getMiddlePoint(angDiff, 1.5, pointShiftX),
      _getMiddlePoint(angDiff, 1.75, pointShiftX),
    ]

  const endAbsolute = ensureVector(
    rotate(
      centerAbsolute.x,
      centerAbsolute.y,
      rotationCenter.x,
      rotationCenter.y,
      angDiff * angEndShiftCoef //
    )
  )

  // relative
  const start = { x: 0, y: 0 }
  const end = {
    x: endAbsolute.x - centerAbsolute.x,
    y: endAbsolute.y - centerAbsolute.y,
  }

  let pushpinArrow = newLinearElement({
    customData: getInitialMeta(ObjectiveKinds.PUSHPIN, {
      excalidrawExtra: {
        arrowheadSize: 7 / zoomValue, //
      },
    }),
    type: 'arrow',
    strokeWidth: 0.7 / zoomValue,
    strokeColor: isSelected ? PUSHPIN_ACTIVE_COLOR : COLOR_PALETTE.black,
    roundness: { type: 2 },
    // startArrowhead: 'bar',
    endArrowhead: 'triangle',
    x: startAbsolute.x,
    y: startAbsolute.y,
    points: [ensurePoint(start), ...middlePoints, ensurePoint(end)],
  })

  // NOTE
  // we do not consider meta rotation itself at calculation above, so rotate result on meta angle
  pushpinArrow = rotateElementOnAngle(
    pushpinArrow,
    rotationCenter,
    normalizeAngle(meta.basis!.angle - PI / 2 + (meta.coreOpts?.pushpinRotationShiftAngle || 0))
  )
  return [pushpinArrow]
}

export const getPushpinHeadElements = (meta: ObjectiveMeta) => {
  const { oScene, appState } = getCore()
  const zoomValue = appState.zoom.value
  const isSelected = isElementSelected(appState, meta.basis!)
  const number = scene_getTurnNumber(oScene, appState, meta)
  const [rx, ry, rw, rh] = getPushpinHeadDemensions(meta, zoomValue)
  return [
    newElement({
      customData: getInitialMeta(ObjectiveKinds.PUSHPIN),
      type: 'ellipse',
      strokeWidth: 0.7 / zoomValue,
      strokeColor: isSelected ? PUSHPIN_ACTIVE_COLOR : COLOR_PALETTE.black,
      backgroundColor: isSelected && number ? PUSHPIN_BG_ACTIVE_COLOR : COLOR_PALETTE.white,
      x: rx,
      y: ry,
      height: rw,
      width: rh,
    }),
    newTextElement({
      customData: getInitialMeta(ObjectiveKinds.PUSHPIN),
      text: number ? String(number) : '',
      x: rx + 3 / zoomValue,
      y: ry + 1 / zoomValue,
      fontSize: 9 / zoomValue,
      fontFamily: 2,
      strokeColor: isSelected ? COLOR_PALETTE.white : COLOR_PALETTE.black,
      opacity: 100,
    }),
  ]
}

const getCameraLensFocusLine = (
  leftSide: ExcalidrawLinearElement,
  rightSide: ExcalidrawLinearElement,
  overrides: Partial<ExcalidrawArrowElement>
) => {
  const pointsStart = { x: 0, y: 0 }
  const [leftX, leftY] = LinearElementEditor.getPointAtIndexGlobalCoordinates(leftSide, 1)
  const [rightX, rightY] = LinearElementEditor.getPointAtIndexGlobalCoordinates(rightSide, 1)
  const pointsEnd = { x: rightX - leftX, y: rightY - leftY }
  return newLinearElement({
    customData: getInitialMeta(ObjectiveKinds.CAMERA_LENS),
    type: 'arrow',
    ...overrides,
    //
    x: leftX,
    y: leftY,
    points: [ensurePoint(pointsStart), ensurePoint(pointsEnd)],
  } as ExcalidrawArrowElement)
}

const getCameraLensAngleSide = (
  basisAngle: number,
  basisCenter: Vector,
  shiftAngle: number,
  distance: number,
  overrides: Partial<ExcalidrawArrowElement>
) => {
  const lineStart = { x: 10, y: 0 }
  const lineEnd = { x: distance, y: 0 }

  const element = newLinearElement({
    customData: getInitialMeta(ObjectiveKinds.CAMERA_LENS),
    type: 'arrow',
    ...overrides,
    //
    x: basisCenter.x,
    y: basisCenter.y,
    points: [ensurePoint(lineStart), ensurePoint(lineEnd)],
  } as ExcalidrawArrowElement)

  const targetAngle = basisAngle + shiftAngle
  return rotateElementOnAngle(element, basisCenter, targetAngle)
}

export const META_REPR_CONTAINER_INITIAL = (): Partial<ExcalidrawElement> => ({
  type: 'rectangle',
  fillStyle: 'solid',
  strokeWidth: 1,
  strokeStyle: 'solid',
  roughness: 0,
  opacity: 70,
  strokeColor: 'transparent',

  roundness: null,
  locked: false, // so user can move it easily, but we prevent it from multiply selection
})

export const newMetaReprElement = (meta: ObjectiveMeta, initialValue: string | undefined) => {
  const basis = getObjectiveBasis(meta)
  const gap = 1
  const [w, h] = [70, 30] // TODO dynamic ?

  const colorName = HEX_TO_COLOR.get(basis!.backgroundColor)
  let bg
  if (colorName) bg = COLOR_PALETTE[colorName][1]

  //@ts-ignore
  const container = newElement({
    customData: getInitialMeta(ObjectiveKinds.LABEL, { labelOf: meta.id }),

    width: w,
    height: h,
    x: basis!.x + basis!.width / 2 - w / 2,
    y: basis!.y + basis!.height + gap,
    backgroundColor: bg || basis!.backgroundColor,
    groupIds: [randomId()],
    ...META_REPR_CONTAINER_INITIAL(),
  })

  // All other props generated dynamically inside
  const widthExtension = 12
  const text = newTextElement({
    customData: getInitialMeta(ObjectiveKinds.LABEL_TEXT),

    x: container.x + container.width / 2,
    y: container.y + container.height / 2,
    width: container.width / 2 + widthExtension,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    text: initialValue || '',
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: 3,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: container.id,
  })
  // @ts-ignore
  container.boundElements = [
    {
      type: 'text',
      id: text.id,
    },
  ]
  return [container, text] as [ExcalidrawRectangleElement, ExcalidrawTextElementWithContainer]
}
