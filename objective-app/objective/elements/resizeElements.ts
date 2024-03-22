import { NonDeletedExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getMetaSimple } from '../meta/selectors'
import { isObjective } from '../meta/types'

export const isElementsScalable = (selectedEls: readonly NonDeletedExcalidrawElement[]) => {
  // all element are not scalable if at least one element has disableResize flag
  return !selectedEls.some((el) => isObjective(el) && getMetaSimple(el).disableResize)
}
