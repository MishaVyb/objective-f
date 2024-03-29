import {
  getElementAbsoluteCoords,
  newElement,
  newLinearElement,
  newTextElement,
} from '../../../packages/excalidraw/element'
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
import { getObjectiveBasis, getPointerIds } from '../meta/selectors'
import { CameraMeta, ObjectiveKinds, ObjectiveMeta, PointerMeta } from '../meta/types'
import { getInitialMeta } from '../meta/initial'

import { randomId } from '../../../packages/excalidraw/random'
import { DEFAULT_FONT_SIZE } from '../../../packages/excalidraw/constants'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { Vector, ensurePoint, ensureVector, getElementCenter } from './math'
import { rotate } from '../../../packages/excalidraw/math'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { mutateElement } from '../../../packages/excalidraw'
import { DEFAULT_FOCUS_DISTANCE, getCameraLensAngle } from '../actions/actionCamera'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { rotateElementOnAngle } from './mutateElements'

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
  strokeWidth: 4,
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
  strokeWidth: 4,
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
  strokeWidth: 1,
  strokeStyle: 'dotted',
  startArrowhead: null,
  endArrowhead: null,
})

const STORYBOARD_POINTER = (): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, { subkind: 'storyboardPointer' }),
  strokeColor: '#868e96',
  strokeWidth: 1,
  strokeStyle: 'dotted',
  startArrowhead: null,
  endArrowhead: null,
})

const CAMERA_LENS_ANGLE_LINE = (): Partial<ExcalidrawArrowElement> => ({
  customData: getInitialMeta(ObjectiveKinds.POINTER, { subkind: 'cameraLensAngle' }),
  strokeWidth: 1,
  strokeStyle: 'dashed',
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
    type: 'line',
    ...overrides,
    //
    x: leftX,
    y: leftY,
    points: [ensurePoint(pointsStart), ensurePoint(pointsEnd)],
    strokeStyle: 'dotted',
    opacity: 50,
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
    type: 'line',
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
  opacity: 30,
  strokeColor: 'transparent',

  roundness: null,
  locked: false, // so user can move it easily, but we prevent it from multiply selection
})

export const newMetaReprElement = (meta: ObjectiveMeta, initialValue: string | undefined) => {
  const basis = getObjectiveBasis(meta)
  const gap = 1
  const [w, h] = [70, 30] // TODO dynamic ?

  //@ts-ignore
  const container = newElement({
    customData: getInitialMeta(ObjectiveKinds.LABEL, { labelOf: meta.id }),
    width: w,
    height: h,
    x: basis!.x + basis!.width / 2 - w / 2,
    y: basis!.y + basis!.height + gap,
    backgroundColor: basis!.backgroundColor,
    groupIds: [randomId()],
    ...META_REPR_CONTAINER_INITIAL(),
  })

  // All other props generated dynamically inside
  const widthExtension = 12
  const text = newTextElement({
    // customData -- bound text not marked as Objective as we handle only its container as Obj.

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
