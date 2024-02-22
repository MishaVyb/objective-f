import { useMemo } from 'react'

import { useExcalidrawElements } from '../../../packages/excalidraw/components/App'
import { isNonDeletedElement } from '../../../packages/excalidraw/element'
import {
  ElementsMapOrArray,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  InitializedExcalidrawImageElement,
  SceneElementsMap,
} from '../../../packages/excalidraw/element/types'
import Scene, { ElementKey } from '../../../packages/excalidraw/scene/Scene'
import { AppState } from '../../../packages/excalidraw/types'
import { useExcalidrawFiles } from '../components/ObjectiveInnerWrapper'
import {
  CameraMeta,
  ObjectiveElement,
  ObjectiveImageElement,
  ObjectiveMeta,
  ShotCameraMeta,
  ensureArray,
  isCameraElement,
  isObjective,
  isPointerElement,
  isShotCameraElement,
} from '../types/types'
import { toBrandedType } from '../../../packages/excalidraw/utils'

/**
 * Simplified version of `getMeta`, when we know that elements belongs to single Objective Item
 */
export const getMetaReference = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>
): Readonly<TMeta> => el.customData

/**
 * Get *COPY* of element's meta (customData) with current Objective id.
 * @param el
 * @returns Objective's meta
 */
export const getMeta = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  elementIds: readonly string[] = [],
  elements: readonly ExcalidrawElement[] = []
): TMeta => {
  // WARNING
  // DeepCopy here?
  return { ...el.customData, id: getObjectiveId(el), elementIds, elements }
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
 * As each excalidraw element in group contains meta, we omit meta duplicates.
 * And populate these props:
 * - `meta.elementIds` (LEGACY)
 * - `meta.elements`
 *
 * NOTE:
 * The same list of elementIds could be accessed from groupId
 *
 * @param elements any elements
 * @param extraPredicate takes only specific metas (custom filter)
 * @param objectivePredicate takes only specific object kinds (camera \ character \ etc)
 * @returns unique meta instances (non deleted  & readonly)
 */
export const getObjectiveMetas = <TMeta extends ObjectiveMeta>(
  elements: ElementsMapOrArray,
  opts?: {
    objectivePredicate?: typeof isObjective
    extraPredicate?: (meta: TMeta) => boolean
    includingDelited?: boolean
  }
): readonly Readonly<TMeta>[] => {
  const objectivePredicate = opts?.objectivePredicate || isObjective
  const extraPredicate = opts?.extraPredicate || (() => true)
  const idsByGroup = new Map<string, string[]>() // groupId : [element.id, element.id, ...]
  const elementsByGroups = new Map<string, ExcalidrawElement[]>() // groupId : [{...}, {...}, ...]

  return ensureArray(elements)
    .filter((e): e is ObjectiveElement<TMeta> => {
      if (!opts?.includingDelited && e.isDeleted) return false // Omit deleted element
      if (!objectivePredicate(e)) return false // Omit another Objective Element kind
      const objectiveId = getObjectiveId(e)

      // meta duplicates: append element id and omit meta duplicate
      if (idsByGroup.has(objectiveId)) {
        idsByGroup.get(objectiveId)?.push(e.id) // TMP backwards capability! Now using elements not ids
        elementsByGroups.get(objectiveId)?.push(e)
        return false
      }

      idsByGroup.set(objectiveId, [e.id])
      elementsByGroups.set(objectiveId, [e])
      return true
    })
    .map((e) =>
      getMeta(e, idsByGroup.get(getObjectiveId(e)), elementsByGroups.get(getObjectiveId(e)))
    )
    .filter((meta) => extraPredicate(meta))
}

/**
 * Extract unique Camera metas from elements.
 */
export const getCameraMetas = (
  elements: readonly ExcalidrawElement[],
  opts?: {
    extraPredicate?: (meta: CameraMeta) => boolean
    includingDelited?: boolean
  }
) => getObjectiveMetas<CameraMeta>(elements, { ...opts, objectivePredicate: isCameraElement })
/**
 * Extract unique Camera metas from elements.
 */
export const getSelectedCameraMetas = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  opts?: {
    extraPredicate?: (meta: CameraMeta) => boolean
    includingDelited?: boolean
  }
) =>
  getCameraMetas(elements, {
    extraPredicate: (meta) =>
      meta.elementIds.some((id) => appState.selectedElementIds[id]) &&
      (opts?.extraPredicate ? opts.extraPredicate(meta) : true),
  })

/**
 * Extract unique Camera metas from elements (only cameras in Shot List).
 */
export const getShotCameraMetas = (
  elements: readonly ExcalidrawElement[],
  opts?: {
    extraPredicate?: (meta: CameraMeta) => boolean
    includingDelited?: boolean
  }
) =>
  getObjectiveMetas<ShotCameraMeta>(elements, {
    ...opts,
    objectivePredicate: isShotCameraElement,
  })

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

export const getObjectiveBasis = <T extends ExcalidrawElement>(meta: ObjectiveMeta): T =>
  meta.elements[meta.basisIndex || 0] as T
/**
 * Camera Basis is a half-transparent circle. Camera are located inside it.
 * We bind any pointer to this circle by default.
 */
export const getCameraBasis = (elements: readonly ExcalidrawElement[], camera: CameraMeta) =>
  getElementById(elements, camera.elementIds[0]) as ExcalidrawBindableElement | undefined

/**
 * @deprecated use getElement
 *
 * NOTE: If element type is known from context, it could be specified via generic.
 * But be aware, there are no checks for type guard for real.
 */
export const getElementById = <TElement extends ExcalidrawElement>(
  elements: readonly ExcalidrawElement[],
  id: string | undefined
) => (id ? (elements.find((el) => el.id === id) as TElement | undefined) : undefined)

/**
 * Get element by id using `Scene`
 *
 * NOTE: If element type is known from context, it could be specified via generic.
 * But be aware, there are no checks for type guard for real.
 */
export const getElement = <TElement extends ExcalidrawElement>(id: string | undefined) =>
  id ? (Scene.getScene(id)?.getElement(id) as TElement) || undefined : undefined

/**
 * Shortcat to get Elements Map associated with provided Elements from global Scene.
 */
export const getElementsMap = (elementKey: ElementKey | undefined | null) =>
  Scene.getScene(elementKey)?.getElementsMapIncludingDeleted()

/**
 * Shortcat to get Elements Map associated with provided Elements from global Scene.
 */
export const getElementsMapStrict = (elementKey: ElementKey | undefined | null) => {
  const map = Scene.getScene(elementKey)?.getElementsMapIncludingDeleted()
  if (!map) {
    console.warn('[VBRN] No elements map, but it should be. Fallback to new empty Map. ')
    return toBrandedType<SceneElementsMap>(new Map())
  }
  return map
}

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
  one: ExcalidrawElement | undefined,
  another: ExcalidrawElement | undefined
) => {
  if (!another || !one)
    throw Error(
      'Cannot get pointer for undefined element. ' +
        'You are probably getting Objective basis element not properly' +
        `${one} ${another}`
    )

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

export const getObjectiveCommonBounds = (elements: ElementsMapOrArray) => {
  // maybe used latter to modify Excalidraw default behavior
  // depending on basis
  return elements
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
