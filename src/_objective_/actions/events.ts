import { isImageElement } from '../../element/typeChecks'
import { ExcalidrawElement } from '../../element/types'
import { AppState } from '../../types'
import {
  getCameraBasis,
  getCameraMetas,
  getObjectiveMetas,
  getPointerBetween,
} from '../selectors/selectors'
import { ObjectiveMeta, isCameraMeta } from '../types/types'
import { changeElementProperty } from './helpers'

/**
 * NOTE:
 * `elements` are **NOT mutating** insice.
 * New changed element created by `changeElementProperty`.
 * @returns New array with unchanged previous elements and new elements with updated properties.
 */
export const deleteEventHandler = (
  elements: readonly ExcalidrawElement[],
  deletingElements: Set<ExcalidrawElement>,
  appState: AppState
) => {
  elements = deleteExcalidrawElements(deletingElements, elements)

  const delitingMetas = getObjectiveMetas(elements, {
    extraPredicate: (meta) => [...deletingElements].some((el) => meta.elementIds.includes(el.id)),
    includingDelited: true,
  })
  elements = deleteObjectiveMetas(delitingMetas, elements)

  return elements
}

const deleteExcalidrawElements = (
  deletingElements: Set<ExcalidrawElement>,
  elements: readonly ExcalidrawElement[]
) => {
  deletingElements.forEach((target) => {
    // [case 1] delete image
    if (isImageElement(target)) {
      const image = target
      const otherCamerasRelatedToImage = getCameraMetas(elements, {
        extraPredicate: (c) => c.relatedImages.includes(image.id),
      })

      console.log('remove image hook', { imageId: image.id, otherCamerasRelatedToImage })

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

const deleteObjectiveMetas = (
  delitingMetas: readonly Readonly<ObjectiveMeta>[],
  elements: readonly ExcalidrawElement[]
) => {
  delitingMetas.forEach((target) => {
    // [case 2] delete camera
    if (isCameraMeta(target)) {
      const camera = target // getMeta(target, [])
      const otherImagesRelatedToCamera = elements.filter(
        (element) => element.type === 'image' && camera.relatedImages.includes(element.id)
      )

      // console.log('remove image hook', { imageId: image.id, otherCamerasRelatedToImage })
      otherImagesRelatedToCamera.forEach((image) => {
        const cameraBasis = getCameraBasis(elements, camera)

        // in case we handle deliting not camera basis, but another camera primitive
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
