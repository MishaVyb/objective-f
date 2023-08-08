import { ExcalidrawElement } from '../../element/types'
import { CameraMeta, ObjectiveMeta, getMeta, isCameraElement, isObjective } from '../types/types'

/**
 * Extract objective metas from elements.
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
    if (e.groupIds.length) {
      const currentGroup = e.groupIds[0] // FIXME
      if (takenGroups.has(currentGroup)) return
      takenGroups.add(currentGroup)
    }

    metas.push(getMeta(e))
  })
  return metas
}

export const getCameraMetas = (elements: readonly ExcalidrawElement[]) =>
  getObjectiveMetas(elements, isCameraElement) as Readonly<CameraMeta>[]

export const selectObjectiveElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isObjective)

export const selectCameraElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(isCameraElement)
