import { Arrowhead, ElementsMapOrArray } from '../../../packages/excalidraw/element/types'
import { getMeta } from '../meta/_selectors'
import { ObjectiveElement } from '../meta/_types'

export const getObjectiveCommonBounds = (elements: ElementsMapOrArray) => {
  // UNUSED
  // const meta = getObjectiveSingleMetaStrict(elements)
  // // makes door rotate around bases center
  // // so door won't shift while rotation and leaves fixed to its basis
  // if (meta?.core?.isBoundsTakenFromBasis) {
  //   // FIXME elements[0]
  //   // we need at least 2 elements to respond, otherwise Excalidraw fails on resize
  //   const extraBasis = meta.elements[0]
  //   if (meta.basis && extraBasis) return [extraBasis, meta.basis]
  // }

  return elements
}

export const getObjectiveArrowheadSize = (arrowhead: Arrowhead, element: ObjectiveElement) =>
  getMeta(element).core.arrowheadSize
