import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { AppState } from '../../../packages/excalidraw/types'
import { getObjectiveId } from '../meta/_selectors'
import { ObjectiveMeta, isObjective } from '../meta/_types'
import { objectKeys } from '../utils/types'

export const isUngroupDissalawed = (
  metas: readonly ObjectiveMeta[],
  appState: Pick<AppState, 'selectedGroupIds'>
) => {
  const selectedGroupIds = new Set(objectKeys(appState.selectedGroupIds))
  return metas.some((meta) => selectedGroupIds.has(meta.id))
}

export const isGroupEditingDissalawed = (hitElement: ExcalidrawElement, selectedGroupId: string) =>
  isObjective(hitElement) && getObjectiveId(hitElement) === selectedGroupId

