import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState } from '../../../packages/excalidraw/types'
import { objectValues } from '../utils/types'
import { isElementSelected } from './_selectors'
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
) => (opts?.kind ? _scene[opts?.kind].find((m) => m.id === id) : undefined)

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

/** get all turns for this meta (parent + children) */
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
  return scene_getTurnChildren(_scene, _appState, meta)
}

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
