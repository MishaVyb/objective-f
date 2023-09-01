import { newLinearElement } from '../../element'
import { bindLinearElement, updateBoundElements } from '../../element/binding'
import { ExcalidrawBindableElement } from '../../element/types'
import { ObjectiveKinds } from '../types/types'

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
    customData: { kind: ObjectiveKinds.POINTER, id: '', elementIds: [] },
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
