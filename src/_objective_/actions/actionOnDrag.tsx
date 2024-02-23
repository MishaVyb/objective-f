import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'

import { rotateMultipleElementsOnAngle } from '../elements/mutateElements'
import { getLocationSnap } from '../elements/snapElements'
import { getObjectiveMetas } from '../selectors/selectors'
import { ObjectiveMeta, isLocationMeta } from '../types/types'
import { register } from './register'

/** Internal action called on `pointerUp` event handler */
export const actionFinalizeSelectionDrag = register({
  name: 'actionFinalizeSelectionDrag',
  trackEvent: { category: 'element' },
  perform: (elements, appState, formData, app: AppClassProperties) => {
    const selected = app.scene.getSelectedElements({
      selectedElementIds: app.state.selectedElementIds,
    })
    const metas = getObjectiveMetas(selected)
    const singleObjectiveItem = metas.length === 1

    if (singleObjectiveItem && isLocationMeta(metas[0])) {
      performRotationLocationOnDragFinalize(selected, metas[0], appState, app.scene)
    }

    return {
      elements,
      commitToHistory: false,
    }
  },
})

const performRotationLocationOnDragFinalize = (
  selected: ExcalidrawElement[],
  meta: ObjectiveMeta,
  appState: AppState,
  scene: Scene
) => {
  const snap = getLocationSnap(meta, appState, scene)
  if (snap) {
    const basisAngle = normalizeAngle(snap.basis.angle)
    const rotateForValue = snap.partAngle - basisAngle
    rotateMultipleElementsOnAngle(
      scene.getElementsMapIncludingDeleted(),
      selected,
      scene.getElementsMapIncludingDeleted(),
      snap.basisCenter.x,
      snap.basisCenter.y,
      rotateForValue
    )
  }
}
