import { useMemo } from 'react'

import { useApp, useExcalidrawElements } from '../../../packages/excalidraw/components/App'
import {
  ElementsMap,
  ElementsMapOrArray,
  ExcalidrawBindableElement,
  ExcalidrawElement,
  InitializedExcalidrawImageElement,
  NonDeletedExcalidrawElement,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppState } from '../../../packages/excalidraw/types'
import { useExcalidrawFiles } from '../components/ObjectiveInnerWrapper'
import {
  CameraMeta,
  MaybeExcalidrawElement,
  ObjectiveElement,
  ObjectiveImageElement,
  ObjectiveKinds,
  ObjectiveMeta,
  ShotCameraMeta,
  ensureArray,
  isCameraElement,
  isKindEl,
  isObjective,
  isShotCameraElement,
} from './types'
import { isInitializedImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { randomId } from '../../../packages/excalidraw/random'
import { logger } from 'workbox-core/_private'

/**
 * Get readonly `el.customData` reference (net copy).
 * Simplified version of `getMeta` without `elements` nested field population.
 */
export const getMetaSimple = <TMeta extends ObjectiveMeta>(
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
export const getObjectiveId = (element: ObjectiveElement) => {
  if (!element.groupIds[0]) logger.warn('No objective id: ', element.customData)
  return element.groupIds[0] || randomId()
}

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
 * @param kind takes only specific object kinds (camera \ character \ etc)
 * @returns unique meta instances (non deleted  & readonly)
 */
export const getObjectiveMetas = <TMeta extends ObjectiveMeta>(
  elements: ElementsMapOrArray,
  opts?: {
    kind?: ObjectiveKinds
    extraPredicate?: (meta: TMeta) => boolean
    includingDelited?: boolean

    /** @deprecated use `kind` */
    objectivePredicate?: (el: MaybeExcalidrawElement) => el is ObjectiveElement
  }
): readonly Readonly<TMeta>[] => {
  if (opts?.kind && opts?.objectivePredicate) throw Error('Exclusive options')

  const kind = opts?.kind
  const objectivePredicate = kind
    ? (el: MaybeExcalidrawElement) => isKindEl(el, kind)
    : opts?.objectivePredicate || isObjective
  const extraPredicate = opts?.extraPredicate || (() => true)
  const idsByGroup = new Map<string, string[]>() // groupId : [element.id, element.id, ...]
  const elementsByGroups = new Map<string, ExcalidrawElement[]>() // groupId : [{...}, {...}, ...]

  return ensureArray(elements)
    .filter((e): e is ObjectiveElement<TMeta> => {
      if (!opts?.includingDelited && e.isDeleted) return false // Omit deleted element
      if (!objectivePredicate(e)) return false // Omit another Objective Element kind
      const objectiveId = getObjectiveId(e as ObjectiveElement)

      // meta duplicates: append element id and omit meta duplicate
      if (idsByGroup.has(objectiveId)) {
        idsByGroup.get(objectiveId)?.push(e.id) // TMP backwards capability! Use elements, not ids.
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
 * Ensure provided elements are single Objective object and return its metas.
 * If there are no one or many metas found, return null.
 * */
export const getObjectiveSingleMeta = <TKind extends ObjectiveKinds>(
  elements: ElementsMapOrArray,
  opts?: {
    kind?: TKind
    objectivePredicate?: (el: MaybeExcalidrawElement) => el is ObjectiveElement
    extraPredicate?: (meta: ObjectiveMeta<TKind>) => boolean
    includingDelited?: boolean
  }
): Readonly<ObjectiveMeta<TKind>> | null => {
  const metas = getObjectiveMetas(elements, opts)
  if (metas.length === 1) return metas[0]
  return null
}

/** simple shortcut */
export const getSelectedSceneEls = (scene: Scene, appState: AppState) =>
  scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })

export const getCameraMetas = (
  elements: readonly ExcalidrawElement[],
  opts?: {
    extraPredicate?: (meta: CameraMeta) => boolean
    includingDelited?: boolean
    sort?: boolean
  }
) => {
  const cameras = getObjectiveMetas<CameraMeta>(elements, {
    ...opts,
    objectivePredicate: isCameraElement,
  })

  if (opts?.sort) {
    const sorted = [...cameras]
    return sorted!.sort((a, b) => {
      const orderByNumber = (a.shotNumber || 0) - (b.shotNumber || 0)
      if (orderByNumber !== 0) return orderByNumber
      const orderByVersion = (a.shotVersion || 0) - (b.shotVersion || 0)
      return orderByVersion
    })
  }

  return cameras
}

export const getSelectedObjectiveMetas = <TMeta extends ObjectiveMeta>(
  scene: Scene,
  appState: AppState,
  opts?: {
    kind?: ObjectiveKinds
    extraPredicate?: (meta: TMeta) => boolean
    includingDelited?: boolean

    /** @deprecated use `kind` */
    objectivePredicate?: (el: MaybeExcalidrawElement) => el is ObjectiveElement
  }
): readonly Readonly<TMeta>[] =>
  getObjectiveMetas<TMeta>(getSelectedSceneEls(scene, appState), { ...opts })

export const getSelectedCameraMetas = (
  scene: Scene,
  appState: AppState,
  opts?: {
    extraPredicate?: (meta: CameraMeta) => boolean
    includingDelited?: boolean
  }
) => getCameraMetas(getSelectedSceneEls(scene, appState), opts)

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

export const getObjectiveBasis = <T extends ExcalidrawElement>(
  meta: ObjectiveMeta | undefined | null
): T | undefined =>
  // TODO basis validation
  (meta?.elements?.length && (meta.elements[meta.basisIndex || 0] as T)) || undefined

/**
 * we do not store ids of pointer at any special meta field,
 * so extract all lines/arrays from element.boundElements and find common elements,
 * @returns Set of common elements ids from `one/another.boundElements`
 */
export const getPointerIds = (
  one: ExcalidrawBindableElement | undefined,
  another: ExcalidrawBindableElement | undefined
) => {
  const oneBoundsIds = new Set(
    one?.boundElements?.filter((e) => e.type === 'arrow').map((e) => e.id)
  )
  const commonArrayBoundsIds = another?.boundElements
    ?.filter((e) => e.type === 'arrow' && oneBoundsIds.has(e.id))
    .map((e) => e.id)

  // Do not check for isPointerElement here, as user could create pointer by itself
  return new Set(commonArrayBoundsIds)
}

export const getPointers = (
  elements: ElementsMap,
  one: ExcalidrawBindableElement | undefined,
  another: ExcalidrawBindableElement | undefined
) =>
  [...getPointerIds(one, another)]
    .map((id) => elements.get(id))
    .filter((e): e is NonDeletedExcalidrawElement => !!e && e.isDeleted === false)

// TODO cache (see original Scene implementation)
export const getElementsByObjectiveId = (
  elements: readonly ExcalidrawElement[],
  id: ObjectiveMeta['id']
) => elements.filter((e) => isObjective(e) && getObjectiveId(e) === id)

export const getMetaByObjectiveId = (
  elements: readonly ExcalidrawElement[],
  id: ObjectiveMeta['id']
) => getObjectiveSingleMeta(getElementsByObjectiveId(elements, id))

// -------------------------- selectors hooks -----------------------//

export const useCamerasImages = (cameras: readonly CameraMeta[]) => {
  const files = useExcalidrawFiles()
  const elements = useExcalidrawElements()
  const app = useApp()
  const elsMap = app.scene.getElementsMapIncludingDeleted()

  return useMemo(() => {
    const imageElementIds: string[] = []
    cameras.forEach((c) => imageElementIds.push(...c.relatedImages))
    const imageElements = imageElementIds
      .map((id) => elsMap.get(id))
      .filter(
        (e): e is InitializedExcalidrawImageElement =>
          !!e && !e.isDeleted && isInitializedImageElement(e)
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
