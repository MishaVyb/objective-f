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
  actionBringForward,
  actionBringToFront,
  actionCopy,
  actionCopyAsPng,
  actionCopyAsSvg,
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
  actionSendBackward,
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
import { getCore, getObjectiveMetas } from '../meta/_selectors'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'

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
        actionCopyAsSvg,
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
      actionCopyAsSvg,
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
  const metas = getObjectiveMetas(hitElements)
  const disableFlip = metas.some((meta) => meta?.coreOpts?.disableFlip)
  const disableResizeAlways = metas.some((meta) => meta?.coreOpts?.disableResizeAlways)

  if (appState.viewModeEnabled) {
    return [
      actionCopy,
      copyText,
      actionCopyAsPng,
      actionCopyAsSvg, //
    ]
  }

  return [
    actionCut,
    actionCopy,
    actionPaste,
    actionSelectAllElementsInFrame,
    actionRemoveAllElementsFromFrame,
    CONTEXT_MENU_SEPARATOR,
    actionCopyAsPng,
    actionCopyAsSvg,
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
    actionSendBackward,
    actionBringForward,
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
    actionLink,
    actionDuplicateSelection,
    actionToggleElementLock,
    CONTEXT_MENU_SEPARATOR,
    actionDeleteSelected,
  ]
}
