import { getNonDeletedElements } from '../../element'
import { ExcalidrawElement } from '../../element/types'
import {
  CameraMeta,
  ObjectiveElement,
  ObjectiveMeta,
  isCameraElement,
  isObjective,
} from '../types/types'

/**
 * Get *COPY* of element's meta (customData) with current Objective id.
 * @param el
 * @returns Objective's meta
 */
export const getMeta = (el: ObjectiveElement, elementIds?: string[]) => {
  return { ...el.customData, id: getObjectiveId(el), elementIds } as ObjectiveMeta
}

/**
 * Any Objective is always a group of excalidraw element and it is always first group id.
 * Group id assigned at library initialization and always uniq for each Objective element.
 * So it used ad Objective element unique identifier.
 *
 * @param element objective element
 * @returns first group id of element
 */
export const getObjectiveId = (element: ObjectiveElement) => element.groupIds[0]

/**
 * Extract unique objective metas from elements.
 * Useful shortcut to access objective metas to handle any Objective logic.
 * As each excalidraw element in group contains meta, we omit meta duplicates,
 * but populate `meta.elementIds` with every element id.
 *
 * NOTE:
 * The same list of elementIds could be accessed 
 *
 * @param elements any elements
 * @returns unique meta instances (non deleted  & readonly)
 */
export const getObjectiveMetas = (
  elements: readonly ExcalidrawElement[],
  objectivePredicate = isObjective // TODO Type...
) => {
  const groups = new Map<string, Array<string>>() // groupId : [element.id, element.id, ...]

  return getNonDeletedElements(elements)
    .filter(objectivePredicate)
    .filter((e) => {
      const objectiveId = getObjectiveId(e)

      // meta duplicates: append element id and omit meta duplicate
      if (groups.has(objectiveId)) {
        groups.get(objectiveId)?.push(e.id)
        return false
      }

      groups.set(objectiveId, [e.id])
      return true
    })
    .map((e) => getMeta(e, groups.get(getObjectiveId(e))))
}

/**
 * Extract unique Camera metas from elements.
 */
export const getCameraMetas = (elements: readonly ExcalidrawElement[]) =>
  getObjectiveMetas(elements, isCameraElement) as Readonly<CameraMeta>[]

/**
 * Select all Objective primitive elements (including *deleted)*.
 * For example, it returns all excalidraw elements for single Camera Element
 * as every single Camera represented by a few elements, not the only one.
 */
export const selectObjectiveElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isObjective)

/**
 * Select all Camera primitive elements (including *deleted)*.
 * For example, it returns all excalidraw elements for single Camera Element
 * as every single Camera represented by a few elements, not the only one.
 */
export const selectCameraElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isCameraElement)