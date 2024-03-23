import { NonDeletedExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getObjectiveMetas } from '../meta/selectors'
import { ObjectiveMeta, isPure } from '../meta/types'

// pure elements doesn't support disabling resize
export const isResizeDisabled = (meta: ObjectiveMeta) => !isPure(meta) && meta.disableResize

export const isElementsScalable = (selectedEls: readonly NonDeletedExcalidrawElement[]) => {
  const metas = getObjectiveMetas(selectedEls)

  // all element are not scalable if at least one meta has disableResize flag
  return !metas.some(isResizeDisabled)
}
