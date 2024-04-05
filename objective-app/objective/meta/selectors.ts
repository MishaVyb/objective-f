import { useMemo } from 'react'
import isDeepEqual from 'lodash/isEqual'
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
import { AppState, Primitive } from '../../../packages/excalidraw/types'
import { useExcalidrawFiles } from '../components/ObjectiveInnerWrapper'
import {
  CameraMeta,
  LabelMeta,
  MaybeExcalidrawElement,
  ObjectiveElement,
  ObjectiveImageElement,
  ObjectiveKinds,
  ObjectiveMeta,
  ObjectiveMetas,
  ObjectiveWallElement,
  PointerMeta,
  ShotCameraMeta,
  WallMeta,
  isKindEl,
  isObjective,
  isWallElement,
} from './types'
import { isInitializedImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { randomId } from '../../../packages/excalidraw/random'
import { logger } from 'workbox-core/_private'
import { groupBy } from '../utils/helpers'

/**
 * Get readonly `el.customData` reference (net copy).
 * Simplified version of `getMeta` without `elements` nested field population.
 */
export const getMetaSimple = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>
): Readonly<TMeta> => el.customData

/**
 * Get *COPY* of element's meta (customData) with current Objective id and Objective basis.
 * @param el
 * @returns Objective's meta
 */
export const getMeta = <TMeta extends ObjectiveMeta>(
  el: ObjectiveElement<TMeta>,
  elementIds: readonly string[] = [],
  elements: readonly ExcalidrawElement[] = [],
  basis: ObjectiveMeta['basis'] | undefined = undefined
): TMeta => {
  // WARNING
  // DeepCopy here?
  return { ...el.customData, id: getObjectiveId(el), elementIds, elements, basis }
}

/**
 * Any Objective is always a group of excalidraw element and it is always first group id.
 * Group id assigned at library initialization and always uniq for each Objective element.
 * So it used ad Objective element unique identifier.
 *
 * @param element objective element
 * @returns first group id of element
 */
export const getObjectiveId = (element: ObjectiveElement | ObjectiveWallElement) => {
  // NOTE wall is always single line element without group, therefore `objective.id === line.id`
  if (isWallElement(element)) return element.id
  if (isKindEl(element, ObjectiveKinds.LABEL_TEXT)) return element.id

  if (element.groupIds[0]) return element.groupIds[0]

  logger.warn('No objective id: ', element.customData)
  return randomId()
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
 * @param kind takes only specific object kinds (camera \ character \ etc)
 * @returns unique meta instances (non deleted  & readonly)
 */
export const getObjectiveMetas = <TMeta extends ObjectiveMeta>(
  elements: ElementsMapOrArray,
  opts?: {
    kind?: ObjectiveKinds
    includingDelited?: boolean
  }
): readonly Readonly<TMeta>[] => {
  const [add, finalize] = extractObjectiveMetas(opts)
  elements.forEach(add)
  return finalize<TMeta>()
}

/** callbacks factory for `getObjectiveMetas`, could be used directly  */
export const extractObjectiveMetas = (opts?: {
  kind?: ObjectiveKinds
  includingDelited?: boolean
}) => {
  const objectivePredicate = opts?.kind
    ? (e: ExcalidrawElement): e is ObjectiveElement => isKindEl(e, opts.kind as ObjectiveKinds)
    : (e: ExcalidrawElement): e is ObjectiveElement => isObjective(e)

  // store only first element of any meta to use it as week meta ref later
  const uniqueMetaElement = new Set<ObjectiveElement>()
  const elementsByGroups = new Map<string, ExcalidrawElement[]>()

  // LEGACY use elements, not ids
  const idsByGroup = new Map<string, string[]>()

  const addElementCallback = (e: ExcalidrawElement) => {
    if (!opts?.includingDelited && e.isDeleted) return false
    if (!objectivePredicate(e)) return false

    const objectiveId = getObjectiveId(e as ObjectiveElement)

    // meta duplicates: append element id and omit meta duplicate
    if (idsByGroup.has(objectiveId)) {
      idsByGroup.get(objectiveId)?.push(e.id)
      elementsByGroups.get(objectiveId)?.push(e)
      return false
    }

    idsByGroup.set(objectiveId, [e.id])
    elementsByGroups.set(objectiveId, [e])
    uniqueMetaElement.add(e)
    return true
  }

  const finalizeCallback = <TMeta extends ObjectiveMeta>(): readonly Readonly<TMeta>[] =>
    [...uniqueMetaElement].map((e) => {
      const weekMeta = getMetaSimple(e)
      const els = elementsByGroups.get(getObjectiveId(e))
      const ids = idsByGroup.get(getObjectiveId(e))

      // NOTE: new API for accessing basis, replacement for `getObjectdiveBasis`
      const basis = els && els[weekMeta.basisIndex || 0] // TODO basis validation ???

      return getMeta<TMeta>(e as ObjectiveElement<TMeta>, ids, els, basis)
    })

  return [addElementCallback, finalizeCallback] as [
    typeof addElementCallback,
    typeof finalizeCallback
  ]
}

export const groupByKind = (metas: readonly Readonly<ObjectiveMeta>[]): ObjectiveMetas => {
  const map = groupBy(metas, 'kind')
  return {
    camera: (map.get(ObjectiveKinds.CAMERA) || []) as CameraMeta[],
    character: map.get(ObjectiveKinds.CHARACTER) || [],
    light: map.get(ObjectiveKinds.LIGHT) || [],
    location: map.get(ObjectiveKinds.LOCATION) || [],
    wall: (map.get(ObjectiveKinds.WALL) || []) as WallMeta[],
    set: map.get(ObjectiveKinds.SET) || [],
    prop: map.get(ObjectiveKinds.PROP) || [],
    outdor: map.get(ObjectiveKinds.OUTDOR) || [],
    pointer: (map.get(ObjectiveKinds.POINTER) || []) as PointerMeta[],
    label: (map.get(ObjectiveKinds.LABEL) || []) as LabelMeta[],
    labelText: map.get(ObjectiveKinds.LABEL_TEXT) || [],
  }
}

/**
 * Ensure provided elements are single Objective object and return its metas.
 * If there are no one or many metas found, return null.
 * */
export const getObjectiveSingleMeta = <TMeta extends ObjectiveMeta>(
  elements: ElementsMapOrArray,
  opts?: {
    kind?: TMeta['kind']
    includingDelited?: boolean
  }
): Readonly<TMeta> | null => {
  const metas = getObjectiveMetas<TMeta>(elements, opts)
  if (metas.length === 1) return metas[0]
  return null
}

/** Objective version for Excalidraw `getFormValue` */
export const getMetasCommonValue = <
  TResult extends Primitive | Record<string, any>,
  TMeta extends ObjectiveMeta = ObjectiveMeta
>(
  metas: readonly TMeta[],
  getAttr: keyof TMeta | ((meta: TMeta) => TResult | undefined),
  defaultValue?: TResult
): TResult | undefined => {
  const getAttrFunction =
    //@ts-ignore
    typeof getAttr === 'function' ? getAttr : (m: TMeta): TResult => m[getAttr]

  let result: TResult | undefined
  for (const m of metas) {
    let current = getAttrFunction(m)
    if (current === undefined && defaultValue !== undefined) current = defaultValue

    if (current !== undefined) {
      if (result === undefined) result = current // first value found
      else if (!isDeepEqual(result, current)) return undefined // different values found
      else {
        // the same value found: continue
      }
    }
  }
  return result
}

/** simple shortcut */
export const getSelectedSceneEls = (scene: Scene, appState: AppState) =>
  scene.getSelectedElements({ selectedElementIds: appState.selectedElementIds })

/** @deprecated `scene.getObjectiveMetas().camera` should be used */
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
    kind: ObjectiveKinds.CAMERA,
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

/** @deprecated `scene.getObjectiveMetas().camera` should be used */
export const getShotCameraMetas = (
  elements: readonly ExcalidrawElement[],
  opts?: { includingDelited?: boolean }
) =>
  getObjectiveMetas<ShotCameraMeta>(elements, { ...opts, kind: ObjectiveKinds.CAMERA }).filter(
    (c) => c.isShot
  )

/** @deprecated use `meta.basis` */
export const getObjectiveBasis = <T extends ExcalidrawElement>(
  meta: ObjectiveMeta | undefined | null
): T | undefined =>
  (meta?.elements?.length && (meta.elements[meta.basisIndex || 0] as T)) || undefined

export const getInternalElementsSet = (elements: readonly ExcalidrawElement[]) =>
  new Set(
    getObjectiveMetas(elements)
      .filter((m) => m.isInternalBasis)
      .map((m) => m.basis)
  )

export const getInternalElementsFromMetas = (metas: readonly ObjectiveMeta[]) =>
  new Set(metas.filter((m) => m.isInternalBasis).map((m) => m.basis))

export const getNotInternalElementsFromMeta = (meta: ObjectiveMeta) =>
  meta.isInternalBasis ? meta.elements.filter((e) => e !== meta.basis) : meta.elements

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
