import { actionWrapTextInContainer } from '../../../packages/excalidraw/actions/actionBoundText'
import { actionPaste } from '../../../packages/excalidraw/actions/actionClipboard'
import { actionUnlockAllElements } from '../../../packages/excalidraw/actions/actionElementLock'
import {
  actionRemoveAllElementsFromFrame,
  actionSelectAllElementsInFrame,
} from '../../../packages/excalidraw/actions/actionFrame'
import { actionToggleViewMode } from '../../../packages/excalidraw/actions/actionToggleViewMode'
import {
  CONTEXT_MENU_SEPARATOR,
  ContextMenuItems,
} from '../../../packages/excalidraw/components/ContextMenu'
import {
  actionBindText,
  actionBringToFront,
  actionCopy,
  actionCopyAsPng,
  actionCopyStyles,
  actionCut,
  actionDeleteSelected,
  actionDuplicateSelection,
  actionFlipHorizontal,
  actionFlipVertical,
  actionGroup,
  actionLink,
  actionPasteStyles,
  actionSelectAll,
  actionSendToBack,
  actionToggleElementLock,
  actionToggleGridMode,
  actionToggleLinearEditor,
  actionToggleObjectsSnapMode,
  actionToggleZenMode,
  actionUnbindText,
  actionUngroup,
  copyText,
} from '../../../packages/excalidraw/actions'
import { actionToggleScalable } from '../actions/actionMetaCommon'
import { actionToggleGridSnapMode } from '../actions/actionSettings'
import {
  getCore,
  getMeta,
  getObjectiveMetas,
  getObjectiveSingleMetaStrict,
} from '../meta/_selectors'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import {
  ObjectiveKinds,
  SimpleMeta,
  isCameraMeta,
  isKind,
  isObjective,
  isSupportsTurn,
} from '../meta/_types'
import { actionDeleteSelectedTurn } from '../../../packages/excalidraw/actions/actionDeleteSelected'
import {
  actionCameraAddTurn,
  actionCameraMoveFrom,
  actionCameraMoveTo,
} from '../actions/actionCamera'
import {
  actionCharacterAddTurn,
  actionCharacterMoveFrom,
  actionCharacterMoveTo,
} from '../actions/actionCharacter'

export const getObjectiveContextMenuItems = (
  type: 'canvas' | 'element',
  /** single hitElement or all selected elements if their common bounding box was hitted */
  hitElements: readonly ExcalidrawElement[]
): ContextMenuItems => {
  const { appState, objectiveProps } = getCore()

  // canvas contextMenu
  // -------------------------------------------------------------------------

  if (type === 'canvas') {
    if (appState.viewModeEnabled) {
      return [
        actionCopyAsPng,
        CONTEXT_MENU_SEPARATOR,
        actionToggleGridMode,
        actionToggleGridSnapMode,
        actionToggleZenMode,
        objectiveProps.isMyScene ? actionToggleViewMode : null,
      ]
    }

    return [
      actionPaste,
      CONTEXT_MENU_SEPARATOR,
      actionCopyAsPng,
      copyText,
      CONTEXT_MENU_SEPARATOR,
      actionSelectAll,
      actionUnlockAllElements,
      CONTEXT_MENU_SEPARATOR,
      actionToggleGridMode,
      actionToggleGridSnapMode,
      actionToggleObjectsSnapMode,
      actionToggleZenMode,
      objectiveProps.isMyScene ? actionToggleViewMode : null,
    ]
  }

  // element contextMenu
  // -------------------------------------------------------------------------
  let metas: readonly SimpleMeta[]
  let singleMetaStrict: SimpleMeta | undefined
  if (hitElements.length === 1 && isObjective(hitElements[0])) {
    // Objective Item is not selected, but is hitting, we got 1 element at this point
    metas = [getMeta(hitElements[0])]
    singleMetaStrict = getMeta(hitElements[0])
  }
  //
  else {
    // one or many Objective Items are selected, we got all its elements at this point
    metas = getObjectiveMetas(hitElements)
    singleMetaStrict = getObjectiveSingleMetaStrict(hitElements)
  }

  const isChildTurn =
    singleMetaStrict && isSupportsTurn(singleMetaStrict) && singleMetaStrict.turnParentId
  const disableFlip = metas.some((meta) => meta?.core?.disableFlip)
  const disableResizeAlways = metas.some((meta) => meta?.core?.disableResizeAlways)

  if (appState.viewModeEnabled) {
    return [actionCopy, copyText, actionCopyAsPng]
  }

  return [
    actionCut,
    actionCopy,
    // actionPaste, // not needed here as we hit element
    actionSelectAllElementsInFrame,
    actionRemoveAllElementsFromFrame,
    CONTEXT_MENU_SEPARATOR,
    ...(isCameraMeta(singleMetaStrict)
      ? [
          actionCameraMoveFrom,
          actionCameraMoveTo,
          actionCameraAddTurn, //
        ]
      : []),
    ...(isKind(singleMetaStrict, ObjectiveKinds.CHARACTER)
      ? [
          actionCharacterMoveFrom,
          actionCharacterMoveTo,
          actionCharacterAddTurn, //
        ]
      : []),
    CONTEXT_MENU_SEPARATOR,
    singleMetaStrict ? null : actionCopyAsPng,
    // actionCopyAsSvg, // too specific option, PNG is enough
    copyText,
    CONTEXT_MENU_SEPARATOR,
    actionCopyStyles,
    actionPasteStyles,
    disableResizeAlways ? null : actionToggleScalable, // VBRN
    CONTEXT_MENU_SEPARATOR,
    actionGroup,
    actionUnbindText,
    actionBindText,
    actionWrapTextInContainer,
    actionUngroup,
    CONTEXT_MENU_SEPARATOR,
    // actionSendBackward, // too specific option, global sentToBack/Front is enough
    // actionBringForward, // too specific option, global sentToBack/Front is enough
    actionSendToBack,
    actionBringToFront,
    ...(disableFlip
      ? []
      : [
          CONTEXT_MENU_SEPARATOR,
          actionFlipHorizontal,
          actionFlipVertical, //
        ]),
    CONTEXT_MENU_SEPARATOR,
    actionToggleLinearEditor,
    isChildTurn ? null : actionLink, // not specific for child turns
    actionDuplicateSelection,
    actionToggleElementLock,
    CONTEXT_MENU_SEPARATOR,
    isChildTurn ? actionDeleteSelectedTurn : actionDeleteSelected,
  ]
}
