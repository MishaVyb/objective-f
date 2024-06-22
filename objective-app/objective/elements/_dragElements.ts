import App from '../../../packages/excalidraw/components/App'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawEllipseElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'

import {
  AppClassProperties,
  BinaryFiles,
  PointerDownState,
} from '../../../packages/excalidraw/types'
import {
  getObjectiveBasis,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getPointerIds,
} from '../meta/_selectors'
import { ObjectiveKinds, isKind } from '../meta/_types'
import {
  actionSnapLocation,
  performRotationLocationOnDragFinalize,
} from '../actions/actionLocation'

import { snapDraggedElementsLocation } from './_snapElements'
import { AllExcalidrawElements } from '../../../packages/excalidraw/actions/types'
import { arrangeElements } from './_zIndex'

import { Vector, getElementCenter } from './_math'
import { getDistance } from '../../../packages/excalidraw/gesture'
import { actionCreatePointer, actionDeletePointer } from '../actions/actionMetaCommon'

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

  // ORIGINAL ELEMENTS STATE // UNUSED

  // NOTE: be aware of using/mutating `selectedElements` directly, as Excalidraw may call for event
  // handler twice per 'one moment' and mutateElement will be called several times... but if we refer
  // to original elements, we have deal with original-not-mutated elements and prevent this unexpected
  // behavior

  // const originalSelectedElements = selectedElements.map(
  //   (e) => pointerDownState.originalElements.get(e.id) || e
  // )

  // metas form elements with state before drag had started:
  // const metasOriginal = getObjectiveMetas(originalSelectedElements)

  // CURRENT ELEMENTS STATE
  const metasCurrent = getObjectiveMetas(selectedElements)

  metasCurrent.forEach((meta) => {
    if (isKind(meta, ObjectiveKinds.LABEL)) {
      const containerMeta = meta
      const container = containerMeta.elements[0] as ExcalidrawBindableElement

      const cameraMeta = allSceneMetas.find((meta) => meta.nameRepr === container.id)
      const basis = getObjectiveBasis<ExcalidrawEllipseElement>(cameraMeta)
      if (basis) {
        const basisCenter = getElementCenter(basis)
        const dist = getDistance([getElementCenter(container), basisCenter])

        if (dist > DRAG_META_LABEL_MAX_GAP) {
          app.actionManager.executeAction(actionCreatePointer, 'internal', {
            targets: [container, basis],
            subkind: 'labelPointer',
          })
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
    app.actionManager.executeAction(actionSnapLocation)
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
