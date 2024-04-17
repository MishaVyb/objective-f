import { ElementsMapOrArray } from '../../../packages/excalidraw/element/types'
import { getObjectiveSingleMetaStrict } from '../meta/selectors'
import { ObjectiveKinds } from '../meta/types'

export const getObjectiveCommonBounds = (elements: ElementsMapOrArray) => {
  const meta = getObjectiveSingleMetaStrict(elements)

  // makes door rotate around bases center
  // so door won't shift while rotation and leaves fixed to its basis
  if (meta?.coreOpts?.isBoundsTakenFromBasis) {
    // FIXME elements[0]
    // we need at least 2 elements to respond, otherwise Excalidraw fails on resize
    const extraBasis = meta.elements[0]
    if (meta.basis && extraBasis) return [extraBasis, meta.basis]
  }
  return elements
}
