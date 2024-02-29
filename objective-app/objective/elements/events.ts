import App from '../../../packages/excalidraw/components/App'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'

import Scene from '../../../packages/excalidraw/scene/Scene'
import {
  AppClassProperties,
  BinaryFiles,
  PointerDownState,
} from '../../../packages/excalidraw/types'
import { Mutable } from '../../../packages/excalidraw/utility-types'
import { cameraInitialMeta, getInitialMeta } from '../meta/initial'
import { newMetaReprElement } from './newElement'
import {
  getCameraBasis,
  getCameraMetas,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getPointerBetween,
} from '../meta/selectors'
import {
  ObjectiveKinds,
  ObjectiveMeta,
  isCameraElement,
  isCameraMeta,
  isObjective,
  isShotCameraMeta,
} from '../meta/types'
import {
  actionFinalizeSelectionDrag,
  performRotationLocationOnDragFinalize,
} from '../actions/actionOnDrag'
import { changeElementProperty, createMetaRepr, deleteMetaRepr } from './helpers'
import { snapDraggedElementsLocation } from './snapElements'
import { getCameraMetaReprStr } from '../actions/actionShootList'

/**
 * It's assumed that meta (`customData`) already copied properly by `_deppCopyElement`
 * @param elements new (cloned/copied) elements
 */
export const duplicateEventHandler = (elements: Mutable<ExcalidrawElement>[]) => {
  const extraNewEls: ExcalidrawElement[] = []
  const metas = getObjectiveMetas(elements) as Mutable<ObjectiveMeta>[]

  metas.forEach((meta) => {
    if (isCameraMeta(meta)) {
      if (meta.shotNumber) {
        // ??? incrase shot number on copy/past ?
        // Object.assign(meta, determineCameraMeta(elements, true))
      }
      if (meta.nameRepr)
        extraNewEls.push(
          ...createMetaRepr(meta, 'nameRepr', getCameraMetaReprStr(meta), newMetaReprElement)
        )

      meta.relatedImages = []
    } else {
      // all other els
      if (meta.nameRepr)
        extraNewEls.push(...createMetaRepr(meta, 'nameRepr', meta.name!, newMetaReprElement))
    }
  })

  return extraNewEls
}

export const duplicateAsInitialEventHandler = (el: Mutable<ExcalidrawElement>) => {
  if (isCameraElement(el)) Object.assign(el.customData, cameraInitialMeta)
  else if (isObjective(el)) Object.assign(el.customData, getInitialMeta(el.customData?.kind))
}

/**
 * `elements` are **NOT mutating** inside.
 * New changed element created by `changeElementProperty`.
 * @returns New array with unchanged previous elements and new elements with updated properties.
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
  const delitingMetas = getObjectiveMetas(elements, {
    extraPredicate: (meta) => [...deletingElements].some((el) => meta.elementIds.includes(el.id)),
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
  app: AppClassProperties,
  elements: readonly ExcalidrawElement[],
  delitingMetas: readonly Readonly<ObjectiveMeta>[]
) => {
  delitingMetas.forEach((target) => {
    // [0] delete repr
    deleteMetaRepr(app.scene, target, 'nameRepr')

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

  metas.forEach((meta) => {
    //
    // - handle name repr drag
    if (meta.nameRepr) {
      const container = scene.getNonDeletedElement(meta.nameRepr)
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

export const addElementsFromPasteOrLibraryHandler = (
  app: App,
  newElements: ExcalidrawElement[],
  /** original App handler opts */
  opts: {
    elements: readonly ExcalidrawElement[]
    files: BinaryFiles | null
    position: { clientX: number; clientY: number } | 'cursor' | 'center'
    retainSeed?: boolean
    fitToContent?: boolean
  }
) => {
  const location = getObjectiveSingleMeta(newElements, { kind: ObjectiveKinds.LOCATION })
  if (location) {
    performRotationLocationOnDragFinalize(newElements, location, app.state, app.scene)

    const { snapOffset } = snapDraggedElementsLocation(
      newElements,
      { x: 0, y: 0 },
      app.state,
      null,
      app.scene
    )
    newElements = newElements.map((element) => {
      return newElementWith(element, {
        x: element.x + snapOffset.x,
        y: element.y + snapOffset.y,
      })
    })
  }

  return newElements
}
