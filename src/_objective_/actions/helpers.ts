import { changeProperty } from '../../actions/actionProperties'
import { isTextElement } from '../../element'
import { newElementWith } from '../../element/mutateElement'
import { getBoundTextElement, handleBindTextResize } from '../../element/textElement'
import {
  ExcalidrawElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
} from '../../element/types'
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
  elements: readonly ExcalidrawElement[],
  metas: readonly TMeta[],
  fieldName: keyof TMeta,
  newValue: string | ((meta: TMeta) => string),
  newRepr: TNewReprConstructor
) => {
  metas.forEach((meta) => {
    newValue = typeof newValue === 'function' ? newValue(meta) : newValue
    if (newValue && !meta[fieldName]) {
      //
      // Add repr:
      const [rectangle, text] = newRepr(meta, newValue)
      // @ts-ignore
      elements = changeElementMeta<TMeta>(elements, meta, { [fieldName]: rectangle.id })
      elements = [...elements, rectangle, text]
      //-------------------------------------//
    } else if (newValue && meta[fieldName]) {
      //
      // Change repr text
      const container = elements.find((e) => e.id === meta[fieldName]) as ExcalidrawElement
      const textElement = getBoundTextElement(container)
      handleBindTextResize(container, false, { newOriginalText: newValue })

      // HACK
      // If we do not replace prev text element with mutated text element, it won't take effect.
      // Because inside `resizeSingleElement` text element is taken from Scene, not from `elements` Array.
      // And after `perform` call, all Scene elements overwrithe all Scene elements,
      // even if it was just mutated above, as in our case.
      elements = changeElementProperty(elements, textElement!, textElement!)

      //-------------------------------------//
    } else if (!newValue && meta[fieldName]) {
      //
      // Remove repr:
      // @ts-ignore
      elements = changeElementMeta(elements, meta, { [fieldName]: undefined })
      elements = elements.map((e) =>
        e.id === meta[fieldName] || (isTextElement(e) && e.containerId === meta[fieldName])
          ? newElementWith(e, { isDeleted: true })
          : e
      )
      //-------------------------------//
    }
  })
  return elements
}
