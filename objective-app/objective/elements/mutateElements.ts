import { mutateElement } from '../../../packages/excalidraw'
import { getElementAbsoluteCoords } from '../../../packages/excalidraw/element'
import { updateBoundElements } from '../../../packages/excalidraw/element/binding'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { getBoundTextElement } from '../../../packages/excalidraw/element/textElement'
import { isArrowElement, isFrameLikeElement } from '../../../packages/excalidraw/element/typeChecks'
import {
  ElementsMap,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import { rotate } from '../../../packages/excalidraw/math'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { PointerDownState } from '../../../packages/excalidraw/types'
import { changeProperty } from '../../../packages/excalidraw/actions/actionProperties'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import {
  ObjectiveElement,
  ObjectiveMeta,
  isElementRelatedToMeta,
  isElementTarget,
} from '../meta/types'

/**
 * New propertries generic type. Where `T` is `ObjectiveMeta` or `ExcalidrawElement`.
 * New properties object or predicate function to calculate that properties for each element apart.
 */
type TNewMetaAttrs<T extends ObjectiveMeta> = Partial<T> | ((meta: T) => Partial<T>)
type TNewElementAttrs<T extends ExcalidrawElement> = Partial<T> | ((element: T) => Partial<T>)

/**
 * @deprecated use `mutateElementMeta`
 * As `newElementWith`, but only for Objective meta properties.
 */
export const newMetaWith = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  newProperties: TNewMetaAttrs<TMeta>
) =>
  newElementWith(el, {
    customData: {
      // WARNING
      // Deep copy here ?
      ...el.customData,
      ...(typeof newProperties === 'function' ? newProperties(el.customData) : newProperties),
    },
  })

const mutateElementMeta = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  newMeta: TNewMetaAttrs<TMeta>
) => {
  return mutateElement(
    el,
    {
      customData: {
        ...el.customData, // WARNING Deep copy here ?
        ...(typeof newMeta === 'function' ? newMeta(el.customData) : newMeta),
      },
    },
    false // do not infrom mutation
  )
}

/**
 * Mutate all **selected**.
 * @requires selected elements should be only Objective elements
 * @returns selected elements
 */
export const mutateElementsMeta = <TMeta extends ObjectiveMeta>(
  app: AppClassProperties,
  newMeta: TNewMetaAttrs<TMeta>
) =>
  app.scene
    .getSelectedElements(app.state)
    // No runtime type guard as we know for shore that *ALL* selected elements are Objective.
    .map((el) => mutateElementMeta(el as ObjectiveElement<TMeta>, newMeta))

/** Mutate target meta */
export const mutateMeta = <TMeta extends ObjectiveMeta>(
  target: TMeta,
  newMeta: any //Partial<TMeta> TODO
) => {
  // HACK
  // As meta information are placed across each Objective primitive ExcalidrawElement
  // we update meta for Each element for target meta

  // LEGACY:
  let metaElementsNotFoundAtScene
  target.elementIds.forEach((id) => {
    const el = Scene.getScene(id)?.getElement(id) as ObjectiveElement<TMeta> | undefined
    if (el) mutateElementMeta(el, newMeta)
    else metaElementsNotFoundAtScene = true
  })

  // NEW:
  if (metaElementsNotFoundAtScene) {
    target.elements.forEach((el) => mutateElementMeta(el, newMeta as TMeta))
  }
}

/**
 * @deprecated use `mutateElementsMeta`
 * Shortcut to change elements metas for all selected (target) elements.
 *
 * @param elements All excalidraw elements.
 *                `getSelectedElements` are used internally to handle only tagret elements.
 * @param appState No changes applied to appState. Returned as it is.
 * @param newMeta New meta object overrides or function to determine new meta for specific selected
 *                element.
 * @returns Full object ready to return from `Perform` function.
 */
export const changeElementsMeta = <TMeta extends ObjectiveMeta>(
  allCanvasElements: readonly ExcalidrawElement[],
  appState: AppState,
  newMeta: TNewMetaAttrs<TMeta>
) =>
  changeProperty(allCanvasElements, appState, (el) =>
    // No runtime type guard as we know for shore that *ALL* selected elements are Objective.
    newMetaWith(el as ObjectiveElement<TMeta>, newMeta)
  )

/**
 * @deprecated use `mutateMeta`
 * As `changeElementsMeta`, but for known single element (target).
 * It's used, when we want to change specific element (not selected).
 *
 * @param newElements Extend result with this new elements (without any changes for this elements)
 */
export const changeElementMeta = <TMeta extends ObjectiveMeta>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TMeta,
  newProperties: TNewMetaAttrs<TMeta>,
  newElements: ExcalidrawElement[] = []
) => [
  ...allCanvasElements.map((el) =>
    isElementRelatedToMeta(el, target) ? newMetaWith(el, newProperties) : el
  ),
  ...newElements,
]

/**
 * @deprecated use `mutateElement`
 *
 * As `changeProperty`, but for known single element (target).
 * It's used, when we want to change specific element (not selected).
 *
 * @param newElements Extend result with this new elements (without any changes for this elements)
 */
export const changeElementProperty = <TElement extends ExcalidrawElement>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TElement | TElement['id'],
  newProperties: TNewElementAttrs<TElement>,
  newElements: ExcalidrawElement[] = []
) => [
  ...allCanvasElements.map((el) =>
    isElementTarget(el, target)
      ? newElementWith(el, {
          ...el,
          ...(typeof newProperties === 'function' ? newProperties(el) : newProperties),
        })
      : el
  ),
  ...newElements,
]

export const rotateMultipleElementsOnAngle = (
  originalElements: PointerDownState['originalElements'],
  elements: readonly NonDeletedExcalidrawElement[],
  elementsMap: ElementsMap,
  centerX: number,
  centerY: number,
  centerAngle: number
) => {
  elements
    .filter((element) => !isFrameLikeElement(element))
    .forEach((element) => {
      const [x1, y1, x2, y2] = getElementAbsoluteCoords(element)
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2
      const origAngle = originalElements.get(element.id)?.angle ?? element.angle
      const [rotatedCX, rotatedCY] = rotate(
        cx,
        cy,
        centerX,
        centerY,
        centerAngle + origAngle - element.angle
      )
      mutateElement(
        element,
        {
          x: element.x + (rotatedCX - cx),
          y: element.y + (rotatedCY - cy),
          angle: normalizeAngle(centerAngle + origAngle),
        },
        false
      )
      updateBoundElements(element, { simultaneouslyUpdated: elements })

      const boundText = getBoundTextElement(element, elementsMap)
      if (boundText && !isArrowElement(element)) {
        mutateElement(
          boundText,
          {
            x: boundText.x + (rotatedCX - cx),
            y: boundText.y + (rotatedCY - cy),
            angle: normalizeAngle(centerAngle + origAngle),
          },
          false
        )
      }
    })

  Scene.getScene(elements[0])?.informMutation()
}
