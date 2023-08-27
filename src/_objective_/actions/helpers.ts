import { changeProperty } from '../../actions/actionProperties'
import { newElementWith } from '../../element/mutateElement'
import { ExcalidrawElement } from '../../element/types'
import { AppState } from '../../types'
import { ObjectiveElement, ObjectiveMeta, isElementRelatedToMeta } from '../types/types'

/**
 * New propertries generic type. Where `T` is `ObjectiveMeta` or `ExcalidrawElement`.
 */
type TNewProperties<T = unknown> = Partial<T> | ((meta: T) => Partial<T>)

/**
 * As `newElementWith`, but only for Objective meta properties.
 */
export const newMetaWith = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  newProperties: TNewProperties<TMeta>
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
  newMeta: TNewProperties<TMeta>
) => ({
  // @ts-ignore
  elements: changeProperty(allCanvasElements, appState, (el) => newMetaWith(el, newMeta)),
  appState: appState,
  commitToHistory: true,
})

/**
 * As `changeElementsMeta`, but for known single element (target).
 * It's used, when we want to change specific element (not selected).
 */
export const changeElementMeta = <TMeta extends ObjectiveMeta>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TMeta,
  appState: AppState,
  newProperties: TNewProperties<TMeta>
) => ({
  elements: allCanvasElements.map((el) =>
    isElementRelatedToMeta(el, target) ? newMetaWith(el, newProperties) : el
  ),
  appState: appState,
  commitToHistory: true,
})

/**
 * As `changeProperty`, but for known single element (target).
 * It's used, when we want to change specific element (not selected).
 */
export const changeElementProperty = <TElement extends ExcalidrawElement>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TElement,
  appState: AppState,
  newProperties: TNewProperties<TElement>
) => ({
  elements: allCanvasElements.map((el) =>
    el.id === target.id
      ? newElementWith(el, {
          ...el,
          // @ts-ignore
          ...(typeof newProperties === 'function' ? newProperties(el) : newProperties),
        })
      : el
  ),

  appState: appState,
  commitToHistory: true,
})
