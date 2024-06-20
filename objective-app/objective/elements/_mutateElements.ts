import { mutateElement } from '../../../packages/excalidraw'
import { changeProperty } from '../../../packages/excalidraw/actions/actionProperties'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import {
  ObjectiveElement,
  ObjectiveMeta,
  isElementRelatedToMeta,
  isElementTarget,
} from '../meta/_types'

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

export const mutateElementMeta = <TMeta extends ObjectiveMeta>(
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
export const mutateSelectedElsMeta = <TMeta extends ObjectiveMeta>(
  app: AppClassProperties,
  newMeta: TNewMetaAttrs<TMeta>
) =>
  app.scene
    .getSelectedElements(app.state)
    // No runtime type guard as we know for shore that *ALL* selected elements are Objective.
    .map((el) => mutateElementMeta(el as ObjectiveElement<TMeta>, newMeta))

/**
 * Mutate target.elements.customData property. Do not modify `target` meta values itself.
 *
 * @returns REFERENCE to new meta values
 * */
export const mutateMeta = <TMeta extends ObjectiveMeta>(target: TMeta, newMeta: Partial<TMeta>) => {
  // NOTE
  // As meta information are placed across each Objective primitive ExcalidrawElement
  // we update meta for Each element for target meta
  target.elements.forEach((el) => mutateElementMeta(el, newMeta as TMeta))
  return { ...target, ...newMeta }
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
