import { useMemo } from 'react'

import { useExcalidrawElements } from '../../components/App'
import { getNonDeletedElements, isNonDeletedElement } from '../../element'
import { ExcalidrawElement, InitializedExcalidrawImageElement } from '../../element/types'
import { useExcalidrawFiles } from '../components/ObjectiveWrapper'
import {
  CameraMeta,
  ObjectiveElement,
  ObjectiveImageElement,
  ObjectiveMeta,
  ShotCameraMeta,
  isCameraElement,
  isObjective,
  isPointerElement,
  isShotCameraElement,
} from '../types/types'

/**
 * Get *COPY* of element's meta (customData) with current Objective id.
 * @param el
 * @returns Objective's meta
 */
export const getMeta = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  elementIds: readonly string[] = []
): TMeta => {
  // WARNIGN
  // DeepCopy here?
  return { ...el.customData, id: getObjectiveId(el), elementIds: [...elementIds] }
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
 * The same list of elementIds could be accessed from groupId
 *
 * @param elements any elements
 * @returns unique meta instances (non deleted  & readonly)
 */
export const getObjectiveMetas = <TMeta extends ObjectiveMeta>(
  elements: readonly ExcalidrawElement[],
  objectivePredicate: typeof isObjective = isObjective
): readonly Readonly<TMeta>[] => {
  const groups = new Map<string, Array<string>>() // groupId : [element.id, element.id, ...]

  return getNonDeletedElements(elements)
    .filter((e): e is ObjectiveElement<TMeta> => {
      if (!objectivePredicate(e)) return false
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
  getObjectiveMetas<CameraMeta>(elements, isCameraElement)

/**
 * Extract unique Camera metas from elements (only cameras in Shot List).
 */
export const getShotCameraMetas = (elements: readonly ExcalidrawElement[]) =>
  getObjectiveMetas<ShotCameraMeta>(elements, isShotCameraElement)

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

/**
 * NOTE: If element type is known from context, it could be specified via generic.
 * But be aware, there are no checks for type guard for real.
 */
export const getElementById = <TElement extends ExcalidrawElement>(
  elements: readonly ExcalidrawElement[],
  id: string
) => elements.find((el) => el.id === id) as TElement | undefined

/**
 * NOTE: If element type is known from context, it could be specified via generic.
 * But be aware, there are no checks for type guard for real.
 */
export const getElementsByIds = <TElement extends ExcalidrawElement>(
  elements: readonly ExcalidrawElement[],
  ids: readonly string[]
) =>
  elements.reduce<TElement[]>((accumulator, element) => {
    if (ids.includes(element.id)) accumulator.push(element as TElement)
    return accumulator
  }, [])

export const getPointerBetween = (
  elements: readonly ExcalidrawElement[],
  one: ExcalidrawElement,
  another: ExcalidrawElement
) => {
  const ids =
    one.boundElements?.filter((elOne) =>
      another.boundElements?.some((elAnother) => elAnother.id === elOne.id)
    ) || []
  const pointers = elements.filter(
    (e) => isPointerElement(e) && isNonDeletedElement(e) && ids.some((o) => o.id === e.id)
  )
  if (pointers.length === 0) return null
  if (pointers.length > 1) console.warn('Found more than 1 pointers.')
  return pointers[0]
}

// -------------------------- selectors hooks -----------------------//

export const useCamerasImages = (cameras: readonly CameraMeta[]) => {
  const files = useExcalidrawFiles()
  const elements = useExcalidrawElements()

  return useMemo(() => {
    const imageElementIds: string[] = []
    cameras.forEach((c) => imageElementIds.push(...c.relatedImages))
    const imageElements = getElementsByIds<InitializedExcalidrawImageElement>(
      elements,
      imageElementIds
    )
    const images: ObjectiveImageElement[] = []
    imageElements.forEach((e) =>
      files[e.fileId] ? images.push({ ...files[e.fileId], ...e }) : null
    )
    return images
  }, [files, elements, cameras])
}

export const useCameraImages = (camera: CameraMeta) => useCamerasImages([camera])

//--------------------- TS tests ------------------------ //

const __test = () => {
  const obj = {} as ObjectiveElement<CameraMeta>
  const aaa = getMeta(obj)
}
