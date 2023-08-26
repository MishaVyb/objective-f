import { changeProperty } from '../../actions/actionProperties'
import { newElementWith } from '../../element/mutateElement'
import { ExcalidrawElement } from '../../element/types'
import { AppState } from '../../types'
import { ObjectiveElement, ObjectiveMeta, isElementRelatedToMeta } from '../types/types'

type TNewMeta<TMeta extends ObjectiveMeta> =
  | Partial<TMeta>
  | ((meta: TMeta) => Partial<TMeta>)

/**
 * As newElementWith, but only for Objective meta properties.
 */
export const newMetaWith = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  newMeta: TNewMeta<TMeta>
) =>
  newElementWith(el, {
    customData: {
      // WARNING
      // Deep copy here ?
      ...el.customData,
      ...(typeof newMeta === 'function' ? newMeta(el.customData) : newMeta),
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
  newMeta: TNewMeta<TMeta>
) => ({
  // @ts-ignore
  elements: changeProperty(allCanvasElements, appState, (el) => newMetaWith(el, newMeta)),
  appState: appState,
  commitToHistory: true,
})

/**
 * As `changeElementsMeta`, but when we want to change specific element (not selected).
 */
export const changeElementMeta = <TMeta extends ObjectiveMeta>(
  allCanvasElements: readonly ExcalidrawElement[],
  target: TMeta,
  appState: AppState,
  newMeta: TNewMeta<TMeta>
) => ({
  elements: allCanvasElements.map((el) =>
    isElementRelatedToMeta(el, target) ? newMetaWith(el, newMeta) : el
  ),
  appState: appState,
  commitToHistory: true,
})
