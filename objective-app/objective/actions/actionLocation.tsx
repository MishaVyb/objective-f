import { Button } from '@radix-ui/themes'
import { normalizeAngle } from '../../../packages/excalidraw/element/resizeElements'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import { between } from '../elements/math'

import { rotateMultipleElementsOnAngle } from '../elements/mutateElements'
import { getLocationSnap } from '../elements/snapElements'
import { getObjectiveSingleMeta, getSelectedSceneEls } from '../meta/selectors'
import { LocationMeta, ObjectiveKinds, ObjectiveMeta, isWallElement } from '../meta/types'
import { register } from './register'
import { Share1Icon } from '@radix-ui/react-icons'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { ACCENT_COLOR } from '../../objective-plus/constants'

/** Internal action called at `onPointerUpFromPointerDownEventHandler` */
export const actionSnapLocation = register({
  name: 'actionSnapLocation',
  trackEvent: { category: 'element' },
  perform: (elements, appState, formData, app: AppClassProperties) => {
    const selected = app.scene.getSelectedElements({
      selectedElementIds: app.state.selectedElementIds,
    })
    const meta = getObjectiveSingleMeta(selected, { kind: ObjectiveKinds.LOCATION })
    if (meta) {
      performRotationLocationOnDragFinalize(selected, meta, appState, app.scene)
    }

    return {
      elements,
      commitToHistory: false,
    }
  },
})

export const actionToggleEditWall = register({
  name: 'actionToggleEditWall',
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    const selectedElements = getSelectedSceneEls(app.scene, appState)
    const wall = isWallElement(selectedElements[0]) ? selectedElements[0] : null

    if (!wall) return false

    return {
      appState: {
        ...appState,
        editingLinearElement: value ? new LinearElementEditor(wall, app.scene) : null,
      },
      commitToHistory: false,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps, app }) => {
    if (appState.activeTool.type !== 'selection') return <></>
    appState.editingLinearElement

    return (
      <Button
        style={{ width: 'min-content' }}
        variant={appState.editingLinearElement ? 'outline' : 'soft'}
        color={appState.editingLinearElement ? ACCENT_COLOR : 'gray'}
        onClick={() => updateData(!appState.editingLinearElement)}
      >
        <Share1Icon /> {appState.editingLinearElement ? 'Done' : 'Edit'}
      </Button>
    )
  },
})

export const performRotationLocationOnDragFinalize = (
  selected: ExcalidrawElement[],
  meta: ObjectiveMeta,
  appState: AppState,
  scene: Scene
) => {
  const snap = getLocationSnap(meta as LocationMeta, appState, scene)
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
