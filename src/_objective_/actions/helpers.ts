import { changeProperty } from '../../actions/actionProperties'
import { mutateElement, newElementWith } from '../../element/mutateElement'
import { getBoundTextElement, handleBindTextResize } from '../../element/textElement'
import {
  ExcalidrawElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
} from '../../element/types'
import Scene from '../../scene/Scene'
import { AppClassProperties, AppState } from '../../types'
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
 * // LEGACY //
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

/** mutate target meta */
export const mutateMeta = <TMeta extends ObjectiveMeta>(
  target: TMeta,
  newMeta: TNewMetaAttrs<TMeta>
) =>
  // HACK
  // As meta information are placed across each Objective primitive ExcalidrawElement
  // we update meta for Each element for target meta
  target.elementIds.forEach((id) => {
    const el = Scene.getScene(id)?.getElement(id) as ObjectiveElement<TMeta>
    mutateElementMeta(el, newMeta)
  })

/**
 * // LEGACY //
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
 * // LEGACY //
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
 * // LEGACY //
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

type TNewReprConstructor = (
  meta: ObjectiveMeta,
  value: string
) => [ExcalidrawRectangleElement, ExcalidrawTextElementWithContainer]

/**
 * Generic function to create\update\remove `on Canvas` representation  for meta information.
 */
export const updateMetaRepresentation = <TMeta extends ObjectiveMeta>(
  metas: readonly TMeta[],
  fieldName: keyof TMeta,
  newValue: string | ((meta: TMeta) => string),
  newRepr: TNewReprConstructor
) => {
  const newEls: ExcalidrawElement[] = []
  metas.forEach((meta) => {
    newValue = typeof newValue === 'function' ? newValue(meta) : newValue
    if (newValue && !meta[fieldName]) {
      // Create representation:
      const [rectangle, text] = newRepr(meta, newValue)
      // @ts-ignore
      mutateMeta(meta, { [fieldName]: rectangle.id })
      newEls.push(rectangle, text)
    } else if (newValue && meta[fieldName]) {
      // Change representation:
      const containerId = meta[fieldName] as ExcalidrawElement['id']
      const container = Scene.getScene(containerId)?.getElement(containerId)
      handleBindTextResize(container!, false, { newOriginalText: newValue })
    } else if (!newValue && meta[fieldName]) {
      // Unlink representation:
      // @ts-ignore
      mutateMeta(meta, { [fieldName]: undefined })

      // Delete representation:
      const containerId = meta[fieldName] as ExcalidrawElement['id']
      const container = Scene.getScene(containerId)?.getElement(containerId)
      const text = getBoundTextElement(container!)
      mutateElement(container!, { isDeleted: true })
      mutateElement(text!, { isDeleted: true })
    }
  })
  return newEls
}
