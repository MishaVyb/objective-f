import { mutateElement } from '../../../packages/excalidraw/element/mutateElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'

import { getObjectiveMetas, getCore } from '../meta/_selectors'
import { ObjectiveKinds, ObjectiveMeta, isKind } from '../meta/_types'

import { deleteMetaRepr } from './_metaRepr'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'
import { isBoundToContainer } from '../../../packages/excalidraw/element/typeChecks'

/**
 * similar to original `deleteSelectedElements` Excalidraw impl
 */
export const deleteSelectedElementsEventHandler = () => {
  const { appState, scene } = getCore()
  const delitingElements = new Set<ExcalidrawElement>()

  scene.getElementsIncludingDeleted().map((el) => {
    if (appState.selectedElementIds[el.id]) {
      delitingElements.add(el)
    }

    // UNUSED ???
    // if (el.frameId && framesToBeDeleted.has(el.frameId)) {
    //   delitingElements.add(el);
    //   return newElementWith(el, { isDeleted: true });
    // }

    if (isBoundToContainer(el) && appState.selectedElementIds[el.containerId]) {
      delitingElements.add(el)
    }
    return el
  })

  return deleteEventHandler(delitingElements)
}

/**
 *
 * @param deletingElements
 * @returns all scene elements with mutations
 */
export const deleteEventHandler = (
  deletingElements: Set<ExcalidrawElement> | readonly ExcalidrawElement[]
) => {
  const { scene } = getCore()
  deletingElements.forEach((e) => {
    if (!e.isDeleted) mutateElement(e, { isDeleted: true })
  })

  deletePointers(deletingElements)

  const delitingMetas = getObjectiveMetas([...deletingElements], { includingDelited: true })
  deleteObjectiveMetas(delitingMetas)

  // NOTE as we mutating scene elements directly, respond with just mutated scene elements
  return scene.getElementsIncludingDeleted()
}

// elements might be Objective Items, might be simple Excalidraw (like Image)
export const deletePointers = (
  deletingElements: Set<ExcalidrawElement> | readonly ExcalidrawElement[]
) => {
  const { app, scene } = getCore()
  deletingElements.forEach((target) => {
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
    if (pointers?.length) fixBindingsAfterDeletion(scene.getElementsIncludingDeleted(), pointers)
  })
}

export const deleteObjectiveMetas = (delitingMetas: readonly Readonly<ObjectiveMeta>[]) => {
  const { scene, oScene, appState } = getCore()

  delitingMetas.forEach((target) => {
    if (isKind(target, ObjectiveKinds.LABEL)) {
      // delete repr container itself
      const labelOfMeta = oScene.getMeta(target.labelOf)
      if (labelOfMeta) deleteMetaRepr(scene, labelOfMeta, 'nameRepr')
    } else {
      // delete repr container (if meta has repr)
      deleteMetaRepr(scene, target, 'nameRepr')
    }

    // delete turns (if any)
    oScene.getTurnChildren(target).forEach((child) => {
      deleteMetaRepr(scene, child, 'nameRepr')
      deletePointers(child.elements)
      child.elements.forEach((e) => mutateElement(e, { isDeleted: true }))
    })
  })
}
