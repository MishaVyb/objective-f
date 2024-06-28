import { getCommonBounds } from '../../../packages/excalidraw'
import { getTransformHandlesFromCoords } from '../../../packages/excalidraw/element'
import {
  OMIT_SIDES_LEAVE_ANGLE,
  TRANSFORM_HANDLES_MARGIN_DEFAULT,
} from '../../../packages/excalidraw/element/transformHandles'
import { ElementsMapOrArray } from '../../../packages/excalidraw/element/types'
import {
  AppClassProperties,
  AppState,
  NormalizedZoomValue,
  PointerDownState,
} from '../../../packages/excalidraw/types'
import {
  getCore,
  getObjectiveSingleMetaStrict,
  getSelectedSceneEls,
  isElementSelected,
} from '../meta/_selectors'
import { ObjectiveMeta, isSupportsTurn } from '../meta/_types'
import { isHintingPushpin } from './_collision'
import { ensurePoint, getElementCenter } from './_math'

const PUSHPIN_DISTANCE_MARGIN = 10

export const getPushpinLineStart = (meta: ObjectiveMeta) =>
  meta.basis!.width / (meta.core.pushpinRotationShiftFactor || 1)

export const getPushpinLineDistance = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) =>
  meta.basis!.width + PUSHPIN_DISTANCE_MARGIN / Math.sqrt(zoomValue)

/**
 * @param target: selected elements or selected metas
 */
export const getPushpinAng = (target: ElementsMapOrArray | ObjectiveMeta | undefined) => {
  if (!target) return undefined
  const meta = 'kind' in target ? target : getObjectiveSingleMetaStrict(target)
  if (meta?.core?.isPushpinRotation)
    return meta.basis!.angle + (meta.core.pushpinRotationShiftAngle || 0)
  return undefined
}
/**
 * @param target: selected elements or selected metas
 */
export const getPushpinAngNoShift = (target: ElementsMapOrArray | ObjectiveMeta | undefined) => {
  if (!target) return undefined
  const meta = 'kind' in target ? target : getObjectiveSingleMetaStrict(target)
  if (meta?.core?.isPushpinRotation) return meta.basis!.angle
  return undefined
}

/** without rotation! */
export const getPushpinLineDemensions = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) => {
  let start = { x: 0, y: -getPushpinLineStart(meta) }
  let end = { x: 0, y: -getPushpinLineDistance(meta, zoomValue) }
  let center = getElementCenter(meta.basis!)
  return { start, end, center }
}

export const getPushpinHeadDemensions = (meta: ObjectiveMeta, zoomValue: NormalizedZoomValue) => {
  const [x1, y1, x2, y2] = getCommonBounds(meta.elements)
  const handle = getTransformHandlesFromCoords(
    [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2],
    0,
    { value: zoomValue },
    'mouse',
    OMIT_SIDES_LEAVE_ANGLE,
    TRANSFORM_HANDLES_MARGIN_DEFAULT,
    { meta }
  )
  const [rx, ry, rw, rh] = handle.rotation!
  return [rx, ry, rw, rh]
}

/** does Render Pushpin or/and does Handle pushpin as rotation handler on mouse hit */
export const isPushbinHandlePotential = (meta: ObjectiveMeta) => {
  const { scene, oScene, appState } = getCore()
  const selectedElements = getSelectedSceneEls(scene, appState)
  const isStrcitOneMetaSelected = !!getObjectiveSingleMetaStrict(selectedElements)
  if (!isStrcitOneMetaSelected) return false

  if (isSupportsTurn(meta)) {
    if (meta.turnParentId) {
      // looking for all parent's children
      const parent = oScene.getTurnParent(meta)
      if (parent) {
        const selectedChildren = oScene.getTurnChildren(parent, { isSelected: true })
        // at least one of children is selected (including current meta) OR parent is selected
        return !!selectedChildren.length || isElementSelected(appState, parent.basis!)
      }
    } else {
      // probably current meta is parent
      const selectedChildren = oScene.getTurnChildren(meta, { isSelected: true })
      // at least one of children is selected OR current meta (parent) is selected
      return !!selectedChildren.length || isElementSelected(appState, meta.basis!)
    }
  }

  return false
}

/**
 * Handler when single meta selected.
 */
export const handleSelectionOnPointerSingleMetaSelecttedEventListener = (
  app: AppClassProperties,
  meta: ObjectiveMeta,
  pointerDownState: PointerDownState // modified inside!
) => {
  const { oScene } = getCore()
  const turns = oScene.getTurns(meta)

  // Start rotattion on first Pushpin click (even if it's not selected)
  //    - modifie pointerDownState in case
  //    - select another elements in case
  for (const turn of turns) {
    const isHitPishpin = isHintingPushpin(turn, ensurePoint(pointerDownState.origin))

    if (isHitPishpin) {
      const els = app.scene.getNonDeletedElementsMap()
      const nextSelectedEls = turn.elements.map((e) => els.get(e.id)!)

      // SET ROTATION
      // modify pointerDownState directly as the same object will be used at mouse event listeners
      pointerDownState.resize.handleType = 'rotation'
      pointerDownState.resize.center = getElementCenter(turn.basis!)
      pointerDownState.hit.element = turn.basis!
      pointerDownState.hit.allHitElements = nextSelectedEls
      pointerDownState.hit.wasAddedToSelection = true

      // SELECT CHILD
      app.setState((prevState) => {
        const nextSelectedElementIds = Object.fromEntries(
          turn.elements.map((e) => [e.id, true])
        ) as AppState['selectedElementIds']
        return {
          previousSelectedElementIds: prevState.selectedElementIds,
          selectedElementIds: nextSelectedElementIds,
          selectedGroupIds: { [turn.id]: true },
        }
      })
      return nextSelectedEls
    }
  }
}
