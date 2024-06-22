import { mutateElement, newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'

import { AppClassProperties } from '../../../packages/excalidraw/types'
import { getObjectiveMetas, getMetaByObjectiveId } from '../meta/_selectors'
import { ObjectiveKinds, ObjectiveMeta, isKind } from '../meta/_types'

import { deleteMetaRepr } from './_metaRepr'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'

/**
 * Objective Delete Event Handler
 * - called from Excalidraw
 * - or called directly on other Objective actions
 *
 * Implementation:
 * - mutate some original elements with `isDeleted: true`
 * - or create new element with `changeElementProperty` and extend elements list with that changed el.
 *
 * BOTH soultion works
 */
export const deleteEventHandler = (
  app: AppClassProperties,
  elements: readonly ExcalidrawElement[],
  deletingElements: Set<ExcalidrawElement> | Array<ExcalidrawElement>
) => {
  // - Handle if deleting element not marked as deleted (in case direct call)
  elements = elements.map((el) =>
    el.isDeleted
      ? el
      : [...deletingElements].some((delitingEl) => delitingEl.id === el.id)
      ? newElementWith(el, { isDeleted: true })
      : el
  )

  // - Handle Excalidraw
  elements = deleteExcalidrawElements(app, elements, deletingElements)

  // - Handle Objective
  const delitingMetas = getObjectiveMetas([...deletingElements], {
    includingDelited: true,
  })
  elements = deleteObjectiveMetas(app, elements, delitingMetas)

  return elements
}

export const deleteExcalidrawElements = (
  app: AppClassProperties,
  elements: readonly ExcalidrawElement[],
  deletingElements: Set<ExcalidrawElement> | Array<ExcalidrawElement>
) => {
  deletingElements.forEach((target) => {
    // delete all pointers
    const pointers = target.boundElements?.reduce((pointers, el) => {
      if (el.type === 'arrow') {
        const element = app.scene.getElement(el.id)
        if (element) {
          mutateElement(element, { isDeleted: true })
          pointers.push(element)
        }
      }
      return pointers
    }, [] as ExcalidrawElement[])
    if (pointers) fixBindingsAfterDeletion(elements, pointers)
  })
  return elements
}

export const deleteObjectiveMetas = (
  app: AppClassProperties,
  elements: readonly ExcalidrawElement[],
  delitingMetas: readonly Readonly<ObjectiveMeta>[]
) => {
  delitingMetas.forEach((target) => {
    if (isKind(target, ObjectiveKinds.LABEL)) {
      // is case of deleting repr container itself
      const labelOfMeta = getMetaByObjectiveId(elements, target.labelOf)
      if (labelOfMeta) deleteMetaRepr(app.scene, labelOfMeta, 'nameRepr')
    } else {
      // delete repr container (if meta has repr)
      deleteMetaRepr(app.scene, target, 'nameRepr')
    }

    // .... other handlers per Objective kind
  })
  return elements
}
