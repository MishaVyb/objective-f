import { ElementsMapOrArray, ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState } from '../../../packages/excalidraw/types'
import { objectValues } from '../utils/types'
import { getObjectiveMetas, isElementSelected } from './_selectors'
import {
  ObjectiveKinds,
  ObjectiveMeta,
  ObjectiveMetas,
  isObjective,
  isSupportsTurn,
} from './_types'

// TODO
/** Objective CRUD repository. Abstraction above row elements list.  */
class ObjectiveMetaScene {}

export const scene_getMeta = (
  _scene: ObjectiveMetas,
  id: ObjectiveMeta['id'],
  opts?: {
    kind?: ObjectiveKinds
  }
) =>
  opts?.kind
    ? _scene[opts?.kind].find((m) => m.id === id)
    : scene_getAllMetas(_scene).find((m) => m.id === id)

export const scene_getTurnParent = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  child: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta | undefined => {
  if (!isSupportsTurn(child)) return
  if (!child.turnParentId) return

  const turnParentItem = scene_getMeta(_scene, child.turnParentId, { kind: child.kind })
  if (!turnParentItem) return

  if (
    opts?.isSelected !== undefined &&
    isElementSelected(_appState, turnParentItem.basis!) !== opts.isSelected
  )
    return

  return turnParentItem
}

export const scene_getTurnChildren = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  parent: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta[] => {
  if (!isSupportsTurn(parent)) return []
  return _scene[parent.kind].filter(
    (m) =>
      isSupportsTurn(m) &&
      m.turnParentId === parent.id &&
      (opts?.isSelected === undefined || isElementSelected(_appState, m.basis!))
  )
}

/**
 * get all turns for this meta (parent + children)
 * @returns [] if no turns for this meta (do not return self meta in that case)
 */
export const scene_getTurns = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta[] => {
  if (!isSupportsTurn(meta)) return []

  // looking for all parent's children
  if (meta.turnParentId) {
    const parent = scene_getTurnParent(_scene, _appState, meta)
    if (!parent) return []
    return [parent, ...scene_getTurnChildren(_scene, _appState, parent, opts)]
  }

  // probably current meta is parent
  const children = scene_getTurnChildren(_scene, _appState, meta)
  if (children.length) return [meta, ...children] // yep, its parent

  // meta has not child turns and it's not child itself
  return []
}

// TODO CACHE (populate map[meta.id, value] that once on every render loop and use populated value)
export const scene_getTurnNumber = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
) => {
  const index = scene_getTurns(_scene, _appState, meta, opts).findIndex(
    (turn) => turn.id === meta.id
  )
  return index === -1 ? undefined : index + 1
}

export const scene_getNextTurn = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
) => {
  const turns = scene_getTurns(_scene, _appState, meta, opts)
  const index = turns.findIndex((turn) => turn.id === meta.id)
  return index === -1 ? undefined : turns[index + 1]
}

/** get all turns for this meta (parent + children) excluding itself */
export const scene_getTurnsExcludingThis = (
  _scene: ObjectiveMetas,
  _appState: AppState,
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta[] => scene_getTurns(_scene, _appState, meta, opts).filter((m) => m.id != meta.id)

export const scene_getMetaByElement = (
  _scene: ObjectiveMetas,
  element: ExcalidrawElement
): ObjectiveMeta | undefined => {
  if (!isObjective(element)) return
  for (const gr of objectValues(_scene)) {
    const res = gr.find((m) => m.elements.find((e) => e.id === element.id))
    if (res) return res
  }
}

export const scene_getMetaByBasis = (
  _scene: ObjectiveMetas,
  element: ExcalidrawElement
): ObjectiveMeta | undefined => {
  if (!isObjective(element)) return
  for (const gr of objectValues(_scene)) {
    const res = gr.find((m) => m.basis!.id == element.id)
    if (res) return res
  }
}

export const scene_getAllMetas = (_scene: ObjectiveMetas): ObjectiveMeta[] => {
  const result = []
  for (const gr of objectValues(_scene)) result.push(...gr)
  return result
}

export const scene_getMetaByNameReprId = (
  _scene: ObjectiveMetas,
  containerId: ObjectiveMeta['nameRepr']
) => scene_getAllMetas(_scene).find((meta) => meta.nameRepr === containerId)

export const scene_getMetasByElements = (_scene: ObjectiveMetas, elements: ElementsMapOrArray) => {
  // ??? implement map: element -> meta, use Set to return single metas
  return getObjectiveMetas(elements)
}

export const scene_getSelectedMetas = (_scene: ObjectiveMetas, _appState: AppState) => {
  return scene_getAllMetas(_scene).filter((m) => isElementSelected(_appState, m.basis!))
}
