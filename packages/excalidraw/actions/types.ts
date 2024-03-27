import React from "react";
import { ExcalidrawElement } from "../element/types";
import {
  AppClassProperties,
  AppState,
  BinaryFiles,
  ExcalidrawProps,
} from "../types";
import { MarkOptional } from "../utility-types";

export type ActionSource =
  | "ui"
  | "keyboard"
  | "contextMenu"
  | "api"
  | "internal"; // VBRN flag

/** if false, the action should be prevented */
export type ActionResult =
  | {
      elements?: readonly ExcalidrawElement[] | null;
      appState?: MarkOptional<
        AppState,
        "offsetTop" | "offsetLeft" | "width" | "height"
      > | null;
      files?: BinaryFiles | null;
      commitToHistory: boolean;
      syncHistory?: boolean;
      replaceFiles?: boolean;
    }
  | false;

/**
 * All current scene elements, including deleted. Verbose type alias to `readonly ExcalidrawElement[]`.
 */
export type AllExcalidrawElements = readonly ExcalidrawElement[];

type ActionFn = (
  elements: AllExcalidrawElements,
  appState: Readonly<AppState>,
  formData: any,
  app: AppClassProperties,
) => ActionResult | Promise<ActionResult>;

export type UpdaterFn = (res: ActionResult) => void;
export type ActionFilterFn = (action: Action) => void;

export type ActionName =
  | "copy"
  | "cut"
  | "paste"
  | "copyAsPng"
  | "copyAsSvg"
  | "copyText"
  | "sendBackward"
  | "bringForward"
  | "sendToBack"
  | "bringToFront"
  | "copyStyles"
  | "selectAll"
  | "pasteStyles"
  | "gridMode"
  | "zenMode"
  | "objectsSnapMode"
  | "stats"
  | "changeStrokeColor"
  | "changeBackgroundColor"
  | "changeFillStyle"
  | "changeStrokeWidth"
  | "changeStrokeShape"
  | "changeSloppiness"
  | "changeStrokeStyle"
  | "changeArrowhead"
  | "changeOpacity"
  | "changeFontSize"
  | "toggleCanvasMenu"
  | "toggleEditMenu"
  | "undo"
  | "redo"
  | "finalize"
  | "changeProjectName"
  | "changeExportBackground"
  | "changeExportEmbedScene"
  | "changeExportScale"
  | "saveToActiveFile"
  | "saveFileToDisk"
  | "loadScene"
  | "duplicateSelection"
  | "deleteSelectedElements"
  | "changeViewBackgroundColor"
  | "clearCanvas"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "zoomToFit"
  | "zoomToFitSelection"
  | "zoomToFitSelectionInViewport"
  | "changeFontFamily"
  | "changeTextAlign"
  | "changeVerticalAlign"
  | "toggleFullScreen"
  | "toggleShortcuts"
  | "group"
  | "ungroup"
  | "goToCollaborator"
  | "addToLibrary"
  | "changeRoundness"
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "alignVerticallyCentered"
  | "alignHorizontallyCentered"
  | "distributeHorizontally"
  | "distributeVertically"
  | "flipHorizontal"
  | "flipVertical"
  | "viewMode"
  | "exportWithDarkMode"
  | "toggleTheme"
  | "increaseFontSize"
  | "decreaseFontSize"
  | "unbindText"
  | "hyperlink"
  | "bindText"
  | "unlockAllElements"
  | "toggleElementLock"
  | "toggleLinearEditor"
  | "toggleEraserTool"
  | "toggleHandTool"
  | "selectAllElementsInFrame"
  | "removeAllElementsFromFrame"
  | "updateFrameRendering"
  | "setFrameAsActiveTool"
  | "setEmbeddableAsActiveTool"
  | "createContainerFromText"
  | "wrapTextInContainer"

  // VBRN:
  // common:
  | "actionDisplayMetaHeader"
  | "actionChangeMetaName"
  | "actionToggleScalable"

  // cameras:
  | "actionChangeMetaDescription"
  | "actionChangeMetaCameraShot"
  | "actionChangeMetaCameraVersion" // includes Move To/From
  | "actionChangeCameraDetails"

  // characters:
  | "actionMoveCharacterToFrom"

  // images:
  | "actionInitStoryboard"
  | "actionStoryboard"

  // settings:
  | "toggleObjectiveSettings"
  | "toggleGridSnapMode"

  // location
  | "actionSnapLocation"

  // internal:
  | "actionCreatePointer"
  | "actionDeletePointer";

export type PanelComponentProps<TFormData = any> = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  updateData: (formData?: TFormData) => void;
  appProps: ExcalidrawProps;
  data?: Record<string, any>;
  app: AppClassProperties;
};

export interface Action {
  name: ActionName;
  PanelComponent?: React.FC<PanelComponentProps>;
  perform: ActionFn;
  keyPriority?: number;
  keyTest?: (
    event: React.KeyboardEvent | KeyboardEvent,
    appState: AppState,
    elements: readonly ExcalidrawElement[],
    app: AppClassProperties,
  ) => boolean;
  contextItemLabel?:
    | string
    | ((
        elements: readonly ExcalidrawElement[],
        appState: Readonly<AppState>,
        app: AppClassProperties,
      ) => string);
  predicate?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    appProps: ExcalidrawProps,
    app: AppClassProperties,
  ) => boolean;
  checked?: (appState: Readonly<AppState>, app?: AppClassProperties) => boolean;
  trackEvent:
    | false
    | {
        category:
          | "toolbar"
          | "element"
          | "canvas"
          | "export"
          | "history"
          | "menu"
          | "collab"
          | "hyperlink";
        action?: string;
        predicate?: (
          appState: Readonly<AppState>,
          elements: readonly ExcalidrawElement[],
          value: any,
        ) => boolean;
      };
  /** if set to `true`, allow action to be performed in viewMode.
   *  Defaults to `false` */
  viewMode?: boolean;
}
