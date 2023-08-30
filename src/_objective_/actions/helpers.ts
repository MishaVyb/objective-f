import { changeProperty } from '../../actions/actionProperties'
import { newElementWith } from '../../element/mutateElement'
import { ExcalidrawElement } from '../../element/types'
import { AppState } from '../../types'
import {
  ObjectiveElement,
  ObjectiveMeta,
  isElementRelatedToMeta,
  isElementTarget,
} from '../types/types'

/**
 * New propertries generic type. Where `T` is `ObjectiveMeta` or `ExcalidrawElement`.
 * New properties object or predicate function to calculate that properties for each element apart.
 */
type TNewMetaAttrs<T extends ObjectiveMeta> = Partial<T> | ((meta: T) => Partial<T>)
type TNewElementAttrs<T extends ExcalidrawElement> = Partial<T> | ((element: T) => Partial<T>)

/**
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

/**
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
 * As `changeProperty`, but for known single element (target).
 * It's used, when we want to change specific element (not selected).
 *
 * @param newElements Extend result with this new elements (without any changes for this elements)
 */
export const changeElementProperty = <TElement extends ExcalidrawElement>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TElement,
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
