import { isDarwin } from "../constants";
import { t } from "../i18n";
import { SubtypeOf } from "../utility-types";
import { getShortcutKey } from "../utils";
import { ActionName } from "./types";

export type ShortcutName =
  | SubtypeOf<
      ActionName,
      | "toggleTheme"
      | "loadScene"
      | "clearCanvas"
      | "cut"
      | "copy"
      | "paste"
      | "copyStyles"
      | "pasteStyles"
      | "actionToggleScalable" // VBRN
      | "selectAll"
      | "deleteSelectedElements"
      | "deleteSelectedTurn" // VBRN
      | "duplicateSelection"
      | "sendBackward"
      | "bringForward"
      | "sendToBack"
      | "bringToFront"
      | "copyAsPng"
      | "copyAsSvg"
      | "group"
      | "ungroup"
      | "gridMode"
      | "toggleGridSnapMode" // VBRN
      | "zenMode"
      | "objectsSnapMode"
      | "stats"
      | "addToLibrary"
      | "viewMode"
      | "cropImage" // VBRN
      | "flipHorizontal"
      | "flipVertical"
      | "hyperlink"
      | "toggleElementLock"
    >
  | "saveScene"
  | "imageExport";

const shortcutMap: Record<ShortcutName, string[]> = {
  toggleTheme: [getShortcutKey("Shift+Alt+D")],
  saveScene: [getShortcutKey("CtrlOrCmd+S")],
  loadScene: [getShortcutKey("CtrlOrCmd+O")],
  clearCanvas: [getShortcutKey("CtrlOrCmd+Delete")],
  imageExport: [getShortcutKey("CtrlOrCmd+Shift+E")],
  cut: [getShortcutKey("CtrlOrCmd+X")],
  copy: [getShortcutKey("CtrlOrCmd+C")],
  paste: [getShortcutKey("CtrlOrCmd+V")],
  copyStyles: [getShortcutKey("CtrlOrCmd+Alt+C")],
  pasteStyles: [getShortcutKey("CtrlOrCmd+Alt+V")],
  actionToggleScalable: [getShortcutKey("Alt+T")], // VBRN
  selectAll: [getShortcutKey("CtrlOrCmd+A")],
  deleteSelectedElements: [getShortcutKey("Delete")],
  deleteSelectedTurn: [getShortcutKey("Delete")],
  duplicateSelection: [
    getShortcutKey("CtrlOrCmd+D"),
    getShortcutKey(`Alt+${t("helpDialog.drag")}`),
  ],
  sendBackward: [getShortcutKey("CtrlOrCmd+[")],
  bringForward: [getShortcutKey("CtrlOrCmd+]")],
  sendToBack: [
    isDarwin
      ? getShortcutKey("CtrlOrCmd+Alt+[")
      : getShortcutKey("CtrlOrCmd+Shift+["),
  ],
  bringToFront: [
    isDarwin
      ? getShortcutKey("CtrlOrCmd+Alt+]")
      : getShortcutKey("CtrlOrCmd+Shift+]"),
  ],
  copyAsPng: [getShortcutKey("Shift+Alt+C")],
  copyAsSvg: [],
  group: [getShortcutKey("CtrlOrCmd+G")],
  ungroup: [getShortcutKey("CtrlOrCmd+Shift+G")],
  gridMode: [getShortcutKey("CtrlOrCmd+'")],
  toggleGridSnapMode: [getShortcutKey("Alt+G")], // VBRN
  zenMode: [getShortcutKey("Alt+Z")],
  objectsSnapMode: [getShortcutKey("Alt+S")],
  stats: [getShortcutKey("Alt+/")],
  addToLibrary: [],
  cropImage: [getShortcutKey("Shift+C")], // VBRN
  flipHorizontal: [getShortcutKey("Shift+H")],
  flipVertical: [getShortcutKey("Shift+V")],
  viewMode: [getShortcutKey("Alt+R")],
  hyperlink: [getShortcutKey("CtrlOrCmd+K")],
  toggleElementLock: [getShortcutKey("CtrlOrCmd+Shift+L")],
};

export const getShortcutFromShortcutName = (name: ShortcutName) => {
  const shortcuts = shortcutMap[name];
  // if multiple shortcuts available, take the first one
  return shortcuts && shortcuts.length > 0 ? shortcuts[0] : "";
};
