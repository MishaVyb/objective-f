import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import { between } from '../elements/math'

import { rotateMultipleElementsOnAngle } from '../elements/mutateElements'
import { getLocationSnap } from '../elements/snapElements'
import { getObjectiveMetas } from '../meta/selectors'
import { ObjectiveMeta, isLocationMeta } from '../meta/types'
import { register } from './register'

/** Internal action called at `onPointerUpFromPointerDownEventHandler` */
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

// /** Internal action called at `onPointerUpFromPointerDownEventHandler` */
// export const actionFinalizeSelectionDrag = register({
//   name: 'actionFinalizeSelectionDrag',
//   trackEvent: { category: 'element' },
//   perform: (elements, appState, formData, app: AppClassProperties) => {
//     const selected = app.scene.getSelectedElements({
//       selectedElementIds: app.state.selectedElementIds,
//     })
//     const metas = getObjectiveMetas(selected)
//     const singleObjectiveItem = metas.length === 1

//     if (singleObjectiveItem && isLocationMeta(metas[0])) {
//       performRotationLocationOnDragFinalize(selected, metas[0], appState, app.scene)
//     }

//     return {
//       elements,
//       commitToHistory: false,
//     }
//   },
// })

export const performRotationLocationOnDragFinalize = (
  selected: ExcalidrawElement[],
  meta: ObjectiveMeta,
  appState: AppState,
  scene: Scene
) => {
  const snap = getLocationSnap(meta, appState, scene)
  if (snap) {
    const PI = Math.PI
    const basisAngle = normalizeAngle(snap.basis.angle)

    // makes rotation not more than 90 degrees (1 PI radian)
    // 0 - 0.5 PI -- ok, rotate to wall part line
    // 0.5 PI - 1 PI -- should change rotion amount to revers wall part line
    // 1 PI - 1.5 PI -- should change rotion amount to revers wall part line
    // 1.5 PI - 2 PI -- ok, rotate to wall part line
    let ang = normalizeAngle(snap.partAngle - basisAngle)
    if (between(0.5 * PI, ang, PI)) ang = ang + PI
    else if (between(PI, ang, 1.5 * PI)) ang = ang - PI

    rotateMultipleElementsOnAngle(
      scene.getElementsMapIncludingDeleted(),
      selected,
      scene.getElementsMapIncludingDeleted(),
      snap.basisCenter.x,
      snap.basisCenter.y,
      ang // rotate on that value
    )
  }
}
