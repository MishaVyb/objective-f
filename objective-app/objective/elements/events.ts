import App from '../../../packages/excalidraw/components/App'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawEllipseElement,
  ExcalidrawImageElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'

import {
  AppClassProperties,
  BinaryFiles,
  PointerDownState,
} from '../../../packages/excalidraw/types'
import { Mutable } from '../../../packages/excalidraw/utility-types'
import { newMetaReprElement } from './newElement'
import {
  getObjectiveBasis,
  getCameraMetas,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getMetaByObjectiveId,
  getPointerIds,
  getPointers,
} from '../meta/selectors'
import { ObjectiveKinds, ObjectiveMeta, isCameraMeta, isKind } from '../meta/types'
import {
  actionFinalizeSelectionDrag,
  performRotationLocationOnDragFinalize,
} from '../actions/actionOnDrag'

import { snapDraggedElementsLocation } from './snapElements'
import { getCameraMetaReprStr } from '../actions/actionShootList'
import { AllExcalidrawElements } from '../../../packages/excalidraw/actions/types'
import { arrangeElements } from '../actions/zindex'

import { Vector, getElementCenter } from './math'
import { getDistance } from '../../../packages/excalidraw/gesture'
import { actionCreatePointer, actionDeletePointer } from '../actions/actionMetaCommon'
import { changeElementProperty } from './mutateElements'
import { createMetaRepr, deleteMetaRepr } from './metaRepr'

/**
 * It's assumed that elements metas already copied properly by `duplicateAsInitialEventHandler`
 * @param newElements new (cloned/copied) elements
 */
export const duplicateObjectiveEventHandler = (newElements: Mutable<ExcalidrawElement>[]) => {
  const extraNewEls: ExcalidrawElement[] = []
  const metas = getObjectiveMetas(newElements) as Mutable<ObjectiveMeta>[]

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
      // all other meta kinds
      if (meta.nameRepr)
        extraNewEls.push(...createMetaRepr(meta, 'nameRepr', meta.name!, newMetaReprElement))
    }
  })

  return extraNewEls
}

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
    // extraPredicate: (meta) => [...deletingElements].some((el) => meta.elementIds.includes(el.id)),
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
    //
    //
    if (isImageElement(target)) {
      const image = target
      const otherCamerasRelatedToImage = getCameraMetas(elements, {
        extraPredicate: (c) => c.relatedImages.includes(image.id),
      })
      otherCamerasRelatedToImage.forEach((camera) => {
        const cameraBasis = getObjectiveBasis<ExcalidrawEllipseElement>(camera)
        getPointers(app.scene.getNonDeletedElementsMap(), image, cameraBasis).forEach((pointer) => {
          elements = changeElementProperty(elements, pointer, {
            isDeleted: true,
          })
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

    if (isKind(target, ObjectiveKinds.LABEL)) {
      // is case of deleting repr container, we call for specific handler that implements all logic
      const labelOfMeta = getMetaByObjectiveId(app.scene, target.labelOf)
      if (labelOfMeta) deleteMetaRepr(app.scene, labelOfMeta, 'nameRepr')
    }

    if (isCameraMeta(target)) {
      //
      // [1.1] delete storyboard
      const camera = target
      const otherImagesRelatedToCamera = elements.filter(
        (element): element is ExcalidrawImageElement =>
          element.type === 'image' && camera.relatedImages.includes(element.id)
      )
      otherImagesRelatedToCamera.forEach((image) => {
        const cameraBasis = getObjectiveBasis<ExcalidrawEllipseElement>(camera)

        // UNUSED... in case we handle deliting not whole Camera, but separate camera primitive
        if (!cameraBasis) return

        getPointers(app.scene.getNonDeletedElementsMap(), image, cameraBasis).forEach((pointer) => {
          elements = changeElementProperty(elements, pointer, {
            isDeleted: true,
          })
        })
      })
    }

    // .... other handlers per Objective kind
  })
  return elements
}

const DRAG_META_LABEL_MAX_GAP = 100

/**
 * Populate `elementsToUpdate` with new elements to move it alongside with selected.
 */
export const dragEventHandler = (
  pointerDownState: PointerDownState,
  selectedElements: NonDeletedExcalidrawElement[],
  elementsToUpdate: Set<NonDeletedExcalidrawElement>,
  adjustedOffset: Vector,
  app: AppClassProperties
): Set<NonDeletedExcalidrawElement> => {
  const allSceneMetas = getObjectiveMetas(app.scene.getElementsMapIncludingDeleted())

  // NOTE: be aware of using/mutating `selectedElements` directly, as Excalidraw may call for event
  // handler twice per 'one moment' and mutateElement will be called several times... but if we refer
  // to original elements, we have deal with original-not-mutated elements and prevent this unexpected
  // behavior
  const originalSelectedElements = selectedElements.map(
    (e) => pointerDownState.originalElements.get(e.id) || e
  )
  // elements state before drag had started
  // const metasOrig = getObjectiveMetas(originalSelectedElements)

  // current elements state
  const metasCurrent = getObjectiveMetas(selectedElements)

  metasCurrent.forEach((meta) => {
    if (isKind(meta, ObjectiveKinds.LABEL)) {
      const containerMeta = meta
      const container = containerMeta.elements[0]

      const cameraMeta = allSceneMetas.find((meta) => meta.nameRepr === container.id)
      const basis = getObjectiveBasis<ExcalidrawEllipseElement>(cameraMeta)
      if (basis) {
        const basisCenter = getElementCenter(basis)
        const dist = getDistance([getElementCenter(container), basisCenter])

        if (dist > DRAG_META_LABEL_MAX_GAP) {
          app.actionManager.executeAction(actionCreatePointer, 'internal', [container, basis])
        } else {
          app.actionManager.executeAction(actionDeletePointer, 'internal', [container, basis])
        }
      }
    }
    //
    // - handle name repr drag
    else if (meta.nameRepr) {
      const container = app.scene.getNonDeletedElement(meta.nameRepr) as ExcalidrawBindableElement
      if (container) {
        const basis = getObjectiveBasis<ExcalidrawBindableElement>(meta)
        if (basis) {
          // TODO
          // drag container if camera is close to container, but there are pointer already
          // FIXME handle label jump in that case with help of `adjustedOffset`
          //
          // const basisCenter = getElementCenter(basis)
          // const currentDist = getDistance([getElementCenter(container), basisCenter])

          if (
            // currentDist < DRAG_META_LABEL_MAX_GAP ||
            !getPointerIds(container, basis).size
          ) {
            elementsToUpdate.add(container)
          }
        }
      }
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

/** mutate new elements. merge new elements with current scene elements, return all elements */
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
): AllExcalidrawElements => {
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

  return arrangeElements(app.scene.getElementsMapIncludingDeleted(), newElements)
}