import { newElementWith } from '../../element/mutateElement'
import { isImageElement } from '../../element/typeChecks'
import { ExcalidrawElement, NonDeletedExcalidrawElement } from '../../element/types'
import Scene from '../../scene/Scene'
import { AppState } from '../../types'
import {
  getCameraBasis,
  getCameraMetas,
  getObjectiveMetas,
  getPointerBetween,
} from '../selectors/selectors'
import { ObjectiveMeta, isCameraMeta, isShotCameraMeta } from '../types/types'
import { changeElementProperty } from './helpers'

/**
 * NOTE:
 * `elements` are **NOT mutating** insice.
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
    // [case 2] delete camera
    if (isCameraMeta(target)) {
      const camera = target // getMeta(target, [])
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
    }

    // .... other handlers per Objective kind
  })
  return elements
}

/**
 * Populate `elementsToUpdate` with new elements to move it alongside with selected.
 */
export const dragEventHandler = (
  selectedElements: NonDeletedExcalidrawElement[],
  elementsToUpdate: Set<NonDeletedExcalidrawElement>,
  scene: Scene
) => {
  //
  // - handle camera drag
  const metas = getObjectiveMetas(selectedElements)
  metas.forEach((meta) => {
    if (meta.nameRepr) {
      const nameReprContainer = scene.getNonDeletedElement(meta.nameRepr)
      if (nameReprContainer) elementsToUpdate.add(nameReprContainer)
    }
    if (isShotCameraMeta(meta) && meta.shotNumberRepr) {
      const nameReprContainer = scene.getNonDeletedElement(meta.shotNumberRepr)
      if (nameReprContainer) elementsToUpdate.add(nameReprContainer)
    }
  })
  // handle other elements drag
}
