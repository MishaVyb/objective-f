import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState } from '../../../packages/excalidraw/types'
import { objectValues } from '../utils/types'
import { isElementSelected } from './_selectors'
import {
  ObjectiveKinds,
  ObjectiveMeta,
  ObjectiveMetas, isObjective,
  isSupportsTurn
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
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta | undefined => {
  if (!isSupportsTurn(meta)) return
  if (!meta.turnParentId) return

  const turnParentItem = scene_getMeta(_scene, meta.turnParentId, { kind: meta.kind })
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
  meta: ObjectiveMeta,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta[] => {
  if (!isSupportsTurn(meta)) return []
  return _scene[meta.kind].filter(
    (m) =>
      isSupportsTurn(m) &&
      m.turnParentId === meta.id &&
      (opts?.isSelected === undefined || isElementSelected(_appState, m.basis!))
  )
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
