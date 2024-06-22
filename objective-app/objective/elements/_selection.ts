import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getMetaOrNone } from '../meta/_selectors'
import { ObjectiveKinds, isKindEl, isSupportsTurn } from '../meta/_types'

export const isNotSelectableOnGroupSelection = (el: ExcalidrawElement) => {
  // isWallElement(el) // ???
  const weekMeta = getMetaOrNone(el)
  return (
    isKindEl(el, ObjectiveKinds.LABEL) ||
    isKindEl(el, ObjectiveKinds.POINTER) ||
    (isSupportsTurn(weekMeta) && weekMeta.turnParentId)
  )
}
