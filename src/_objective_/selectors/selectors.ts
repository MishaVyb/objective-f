import { ExcalidrawElement } from '../../element/types'
import {
  CameraMeta,
  ObjectiveElement,
  ObjectiveMeta,
  getMeta,
  isCameraElement,
  isObjective,
} from '../types/types'

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
 * As each excalidraw element in group contains meta, we omit meta duplicates.
 *
 * @param elements any elements
 * @returns unique meta instances (readonly)
 */
export const getObjectiveMetas = (
  elements: readonly ExcalidrawElement[],
  objectivePredicate = isObjective // TODO Type...
) => {
  const metas: Readonly<ObjectiveMeta>[] = []
  const takenGroups = new Set()
  elements.filter(objectivePredicate).forEach((e) => {
    const objectiveId = getObjectiveId(e)
    if (takenGroups.has(objectiveId)) return // omit meta duplicates
    takenGroups.add(objectiveId)
    metas.push(getMeta(e))
  })
  return metas
}

/**
 * Extract unique Camera metas from elements.
 */
export const getCameraMetas = (elements: readonly ExcalidrawElement[]) =>
  getObjectiveMetas(elements, isCameraElement) as Readonly<CameraMeta>[]

/**
 * Select all Objective primitive elements.
 * For example, it returns all excalidraw elements for single Camera Element
 * as every single Camera represented by a few elements, not the only one.
 */
export const selectObjectiveElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isObjective)

/**
 * Select all Camera primitive elements.
 * For example, it returns all excalidraw elements for single Camera Element
 * as every single Camera represented by a few elements, not the only one.
 */
export const selectCameraElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isCameraElement)
