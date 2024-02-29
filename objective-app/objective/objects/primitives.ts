import { newElement, newLinearElement, newTextElement } from '../../../packages/excalidraw/element'
import {
  bindLinearElement,
  updateBoundElements,
} from '../../../packages/excalidraw/element/binding'
import {
  ExcalidrawBindableElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
} from '../../../packages/excalidraw/element/types'
import { getObjectiveBasis } from '../meta/selectors'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/types'
import { getBaseInitialMeta } from './initial'

export const newMockPointer = () =>
  newLinearElement({
    type: 'arrow',
    x: 1,
    y: 1,
    strokeColor: '#868e96',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'dotted',
    points: [
      [0, 0],
      [100, 100],
    ],
    startArrowhead: null,
    endArrowhead: null,
    customData: getBaseInitialMeta(ObjectiveKinds.POINTER),
  })

/**
 * Elements are **MUTATING** insdie!
 * @param one arrow start
 * @param another arrow end
 * @returns new arrow
 */
export const newPointerBeetween = (
  one: ExcalidrawBindableElement | undefined,
  another: ExcalidrawBindableElement | undefined
) => {
  if (!another || !one)
    throw Error(
      'Cannot get pointer for undefined element. ' +
        'You are probably getting Objective basis element not properly' +
        `${one} ${another}`
    )

  const newPointer = newMockPointer()
  bindLinearElement(newPointer, one, 'start')
  bindLinearElement(newPointer, another, 'end')
  updateBoundElements(another, {
    justCreatedBounds: [newPointer],
    justCreatedBoundsAreBoundTo: [another, one],
  })
  updateBoundElements(one, {
    justCreatedBounds: [newPointer],
    justCreatedBoundsAreBoundTo: [another, one],
  })
  return newPointer
}

export const createMetaReprElement = (meta: ObjectiveMeta, initialValue: string) => {
  const basis = getObjectiveBasis(meta)
  const gap = 1
  const [w, h] = [70, 30]
  const container = newElement({
    customData: getBaseInitialMeta(ObjectiveKinds.LABEL),

    type: 'rectangle',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 30,
    x: basis!.x + basis!.width / 2 - w / 2,
    y: basis!.y + basis!.height + gap,
    strokeColor: 'transparent',
    backgroundColor: basis!.backgroundColor,
    width: w,
    height: h,
    roundness: null,
    locked: false, // so user can move it easily, but we prevent it from multiply selection
  })

  // All other props generated dynamically inside
  const widthExtension = 12
  const text = newTextElement({
    customData: getBaseInitialMeta(ObjectiveKinds.LABEL),

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
    text: initialValue,
    fontSize: 14,
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
