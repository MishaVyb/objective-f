import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState } from '../../../packages/excalidraw/types'
import { getMeta, isElementSelected } from './_selectors'
import { ObjectiveKinds, ObjectiveMeta, ObjectiveMetas, isObjective, isSupportsTurn } from './_types'

// TODO
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
  element: ExcalidrawElement,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta | undefined => {
  if (!isObjective(element)) return

  const meta = getMeta(element)
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
  element: ExcalidrawElement,
  opts?: {
    isSelected?: boolean
  }
): ObjectiveMeta[] => {
  if (!isObjective(element)) return []

  const meta = getMeta(element)
  if (!isSupportsTurn(meta)) return []

  return _scene[meta.kind].filter(
    (m) =>
      isSupportsTurn(m) &&
      m.turnParentId === meta.id &&
      (opts?.isSelected === undefined || isElementSelected(_appState, m.basis!))
  )
}
