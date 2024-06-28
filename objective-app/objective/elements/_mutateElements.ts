import { mutateElement } from '../../../packages/excalidraw'
import { newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { ObjectiveElement, ObjectiveMeta } from '../meta/_types'

/**
 * New propertries generic type. Where `T` is `ObjectiveMeta` or `ExcalidrawElement`.
 * New properties object or predicate function to calculate that properties for each element apart.
 */
type TNewMetaAttrs<T extends ObjectiveMeta> = Partial<T> | ((meta: T) => Partial<T>)

export const mutateElementMeta = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  newMeta: TNewMetaAttrs<TMeta>
) => {
  return mutateElement(
    el,
    {
      customData: {
        ...el.customData,
        ...(typeof newMeta === 'function' ? newMeta(el.customData as TMeta) : newMeta),
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
