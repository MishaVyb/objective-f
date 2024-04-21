import App from '../../../packages/excalidraw/components/App'
import { mutateElement, newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import {
  ElementsMap,
  ExcalidrawArrowElement,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawEllipseElement,
  NonDeletedExcalidrawElement,
  NonDeletedSceneElementsMap,
} from '../../../packages/excalidraw/element/types'

import {
  AppClassProperties,
  BinaryFiles,
  PointerDownState,
} from '../../../packages/excalidraw/types'
import { Mutable } from '../../../packages/excalidraw/utility-types'
import { newMetaReprElement, newPointerBeetween } from './newElement'
import {
  getObjectiveBasis,
  getObjectiveMetas,
  getObjectiveSingleMeta,
  getMetaByObjectiveId,
  getPointerIds,
  getMetaSimple,
} from '../meta/selectors'
import {
  AnyObjectiveMeta,
  ObjectiveKinds,
  ObjectiveMeta,
  PointerMeta,
  isCameraMeta,
  isKind,
  isObjective,
} from '../meta/types'
import {
  actionSnapLocation,
  performRotationLocationOnDragFinalize,
} from '../actions/actionLocation'

import { snapDraggedElementsLocation } from './snapElements'
import { getCameraMetaReprStr } from '../actions/actionCamera'
import { AllExcalidrawElements } from '../../../packages/excalidraw/actions/types'
import { arrangeElements } from './zindex'

import { Vector, getElementCenter } from './math'
import { getDistance } from '../../../packages/excalidraw/gesture'
import { actionCreatePointer, actionDeletePointer } from '../actions/actionMetaCommon'
import { mutateMeta } from './mutateElements'
import { createMetaRepr, deleteMetaRepr } from './metaRepr'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'
import { getContainerElement } from '../../../packages/excalidraw/element/textElement'

export type DuplicateHandlerOpts = {
  addPointerWith?: ObjectiveMeta
  addPointerSubkind?: PointerMeta['subkind']
  addPointerOverrides?: Partial<ExcalidrawArrowElement>
  addPointerReverseDirection?: boolean
  newElementsMeta?: Partial<AnyObjectiveMeta>
}

/**
 * filters out element we do not copy directly: LABEL and LABEL_TEXT
 * (because it wll be add as copied extraElements later)
 */
export const duplicateObjectiveEventHandlerFilter = (
  selectedElements: ElementsMap,
  scene: Scene
) => {
  const excludeElementIds = new Set<string>([])
  const metasMap = new Map(getObjectiveMetas(selectedElements).map((m) => [m.id, m]))

  for (const e of selectedElements.values()) {
    if (!isObjective(e)) continue
    const weekMeta = getMetaSimple(e)

    if (isKind(weekMeta, ObjectiveKinds.LABEL) && metasMap.has(weekMeta.labelOf))
      excludeElementIds.add(e.id)

    if (isKind(weekMeta, ObjectiveKinds.LABEL_TEXT)) {
      //@ts-ignore
      const container = getContainerElement(e, scene.getNonDeletedElementsMap())
      const containerWeekMeta = isObjective(container) ? getMetaSimple(container) : null
      if (
        isKind(containerWeekMeta, ObjectiveKinds.LABEL) &&
        metasMap.has(containerWeekMeta.labelOf)
      )
        excludeElementIds.add(e.id)
    }
  }

  for (const id of excludeElementIds) selectedElements.delete(id)
  return selectedElements
}

/**
 * It's assumed that elements metas already copied properly by `initial.duplicateMeta`
 * @param newElements new (cloned/copied) elements
 */
export const duplicateObjectiveEventHandler = (
  newElements: Mutable<ExcalidrawElement>[],
  opts?: DuplicateHandlerOpts & {
    scene: Scene
  }
) => {
  const extraNewEls: ExcalidrawElement[] = []
  const metas = getObjectiveMetas(newElements) as Mutable<ObjectiveMeta>[]

  metas.forEach((meta) => {
    if (opts?.newElementsMeta) mutateMeta(meta, opts.newElementsMeta)

    if (opts?.addPointerWith)
      extraNewEls.push(
        newPointerBeetween(
          opts?.addPointerReverseDirection
            ? getObjectiveBasis(meta)
            : getObjectiveBasis(opts.addPointerWith),
          opts?.addPointerReverseDirection
            ? getObjectiveBasis(opts.addPointerWith)
            : getObjectiveBasis(meta),

          // HACK we know for sure that those new els have no pointer between
          new Map([]) as NonDeletedSceneElementsMap,

          {
            scene: opts?.scene,
            subkind: opts.addPointerSubkind,
            overrides: opts?.addPointerOverrides,
          }
        )!
      )

    if (isCameraMeta(meta)) {
      if (meta.nameRepr)
        extraNewEls.push(
          ...createMetaRepr(
            meta,
            'nameRepr',
            getCameraMetaReprStr(meta, {
              name: opts?.newElementsMeta?.name,
              shotNumber: opts?.newElementsMeta?.shotNumber,
              shotVersion: opts?.newElementsMeta?.shotVersion,
            }),
            newMetaReprElement
          )
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
