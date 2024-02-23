import App from '../../../packages/excalidraw/components/App'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'

import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState, PointerDownState } from '../../../packages/excalidraw/types'
import { Mutable } from '../../../packages/excalidraw/utility-types'
import { cameraInitialMeta, getBaseInitialMeta } from '../objects/initial'
import { newNameRepr, newShotNumberRepr } from '../objects/primitives'
import {
  getCameraBasis,
  getCameraMetas,
  getObjectiveMetas,
  getPointerBetween,
} from '../selectors/selectors'
import {
  ObjectiveMeta,
  isCameraElement,
  isCameraMeta,
  isObjective,
  isShotCameraMeta,
} from '../types/types'
import { actionFinalizeSelectionDrag } from '../actions/actionOnDrag'
import { changeElementProperty, createMetaRepr, deleteMetaRepr } from './helpers'

/**
 * It's assumed that meta (`customData`) already copied properly by `_deppCopyElement`
 * @param elements new (cloned/copied) elements
 */
export const duplicateEventHandler = (elements: Mutable<ExcalidrawElement>[]) => {
  const extraNewEls: ExcalidrawElement[] = []
  const metas = getObjectiveMetas(elements) as Mutable<ObjectiveMeta>[] // !!!

  metas.forEach((meta) => {
    if (meta.nameRepr)
      extraNewEls.push(...createMetaRepr(meta, 'nameRepr', meta.name!, newNameRepr))

    if (isCameraMeta(meta)) {
      if (meta.shotNumber) {
        // ??? incrase shot number on copy/past ?
        // Object.assign(meta, determineCameraMeta(elements, true))
      }
      if (meta.shotNumberRepr)
        extraNewEls.push(
          ...createMetaRepr(meta, 'shotNumberRepr', `cam ${meta.shotNumber}`, newShotNumberRepr)
        )

      meta.relatedImages = []
    }
  })

  return extraNewEls
}

export const duplicateAsInitialEventHandler = (el: Mutable<ExcalidrawElement>) => {
  if (isCameraElement(el)) Object.assign(el.customData, cameraInitialMeta)
  else if (isObjective(el)) Object.assign(el.customData, getBaseInitialMeta(el.customData?.kind))
}

/**
 * `elements` are **NOT mutating** inside.
 * New changed element created by `changeElementProperty`.
 * @returns New array with unchanged previous elements and new elements with updated properties.
 */
export const deleteEventHandler = (
  elements: readonly ExcalidrawElement[],
  deletingElements: Set<ExcalidrawElement> | Array<ExcalidrawElement>,
  appState: AppState
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
  elements = deleteExcalidrawElements(elements, deletingElements)

  // - Handle Objective
  const delitingMetas = getObjectiveMetas(elements, {
    extraPredicate: (meta) => [...deletingElements].some((el) => meta.elementIds.includes(el.id)),
    includingDelited: true,
  })
  elements = deleteObjectiveMetas(elements, delitingMetas)

  return elements
}

export const deleteExcalidrawElements = (
  elements: readonly ExcalidrawElement[],
  deletingElements: Set<ExcalidrawElement> | Array<ExcalidrawElement>
) => {
  deletingElements.forEach((target) => {
    // [case 1] delete image
    if (isImageElement(target)) {
      const image = target
      const otherCamerasRelatedToImage = getCameraMetas(elements, {
        extraPredicate: (c) => c.relatedImages.includes(image.id),
      })
      otherCamerasRelatedToImage.forEach((camera) => {
        const cameraBasis = getCameraBasis(elements, camera)
        const pointer = getPointerBetween(elements, image, cameraBasis)
        if (pointer)
          elements = changeElementProperty(elements, pointer, {
            isDeleted: true,
          })
      })
    }

    // .... other handlers per Excalidraw type
  })
  return elements
}

export const deleteObjectiveMetas = (
  elements: readonly ExcalidrawElement[],
  delitingMetas: readonly Readonly<ObjectiveMeta>[]
) => {
  delitingMetas.forEach((target) => {
    // [0] delete repr
    deleteMetaRepr(target, 'nameRepr')

    // [1] delete camera
    if (isCameraMeta(target)) {
      //
      // [1.1] delete storyboard
      const camera = target
      const otherImagesRelatedToCamera = elements.filter(
        (element) => element.type === 'image' && camera.relatedImages.includes(element.id)
      )
      otherImagesRelatedToCamera.forEach((image) => {
        const cameraBasis = getCameraBasis(elements, camera)

        // UNUSED... in case we handle deliting not whole Camera, but separate camera primitive
        if (!cameraBasis) return

        const pointer = getPointerBetween(elements, image, cameraBasis)
        if (pointer)
          elements = changeElementProperty(elements, pointer, {
            isDeleted: true,
          })
      })
      // [1.2] delete delete repr
      deleteMetaRepr(target, 'shotNumberRepr')
    }

    // .... other handlers per Objective kind
  })
  return elements
}

/**
 * Populate `elementsToUpdate` with new elements to move it alongside with selected.
 */
export const dragEventHandler = (
  pointerDownState: PointerDownState,
  selectedElements: NonDeletedExcalidrawElement[],
  elementsToUpdate: Set<NonDeletedExcalidrawElement>,
  scene: Scene
): Set<NonDeletedExcalidrawElement> => {
  //
  // NOTE: be aware of using/mutating `selectedElements` directly, as Excalidraw may call for event
  // handler twice per 'one moment' and mutateElement will be called several times... but if we refer
  // to original elements, we have deal with original-not-mutated elements and prevent this unexpected
  // behavior
  const originalSelectedElements = selectedElements.map(
    (e) => pointerDownState.originalElements.get(e.id) || e
  )
  const metas = getObjectiveMetas(originalSelectedElements)
  const singleObjectiveItem = metas.length === 1

  metas.forEach((meta) => {
    //
    // - handle name repr drag
    if (meta.nameRepr) {
      const container = scene.getNonDeletedElement(meta.nameRepr)
      if (container) elementsToUpdate.add(container)
    }
    //
    // - handle camera drag
    if (isShotCameraMeta(meta) && meta.shotNumberRepr) {
      const container = scene.getNonDeletedElement(meta.shotNumberRepr)
      if (container) elementsToUpdate.add(container)
    }
  })

  return elementsToUpdate
}

export const onPointerUpFromPointerDownEventHandler = (
  app: App,
  pointerDownState: PointerDownState
) => {
  if (app.state.draggingElement?.type === 'selection')
    app.actionManager.executeAction(actionFinalizeSelectionDrag)
}
