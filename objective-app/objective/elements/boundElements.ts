import {
  ElementsMapOrArray,
  ExcalidrawLinearElement,
} from '../../../packages/excalidraw/element/types'
import { getObjectiveBasis, getObjectiveSingleMeta } from '../meta/selectors'
import { ObjectiveKinds } from '../meta/types'

export const getObjectiveCommonBounds = (elements: ElementsMapOrArray) => {
  const location = getObjectiveSingleMeta(elements, { kind: ObjectiveKinds.LOCATION })
  if (location) {
    // makes door rotate around bases center
    // so door won't shift while rotation and leaves fixed to its basis
    const basis = getObjectiveBasis<ExcalidrawLinearElement>(location)
    const extraBasis = location.elements[0] // TODO refactor

    // we need at least 2 elements to respond, otherwise Excalidraw fails on resize
    return [extraBasis, basis]
  }
  return elements
}
