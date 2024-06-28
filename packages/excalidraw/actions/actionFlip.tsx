import { register } from "./register";
import { getSelectedElements } from "../scene";
import { getNonDeletedElements } from "../element";
import {
  ExcalidrawElement,
  NonDeleted,
  NonDeletedElementsMap,
  NonDeletedSceneElementsMap,
} from "../element/types";
import { resizeMultipleElements } from "../element/resizeElements";
import { AppState } from "../types";
import { arrayToMap } from "../utils";
import { CODES, KEYS } from "../keys";
import { getCommonBoundingBox } from "../element/bounds";
import {
  bindOrUnbindSelectedElements,
  isBindingEnabled,
  unbindLinearElements,
} from "../element/binding";
import { updateFrameMembershipOfSelectedElements } from "../frame";
import { ColumnSpacingIcon, RowSpacingIcon } from "@radix-ui/react-icons";
import { IconButton } from "@radix-ui/themes";
import {
  getObjectiveMetas,
  getSelectedSceneEls,
} from "../../../objective-app/objective/meta/_selectors";

export const actionFlipHorizontal = register({
  name: "flipHorizontal",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    // VBRN
    const metas = getObjectiveMetas(getSelectedSceneEls(app.scene, app.state));
    const disableFlip = metas.some((meta) => meta?.core?.disableFlip);
    if (disableFlip) return false;

    return {
      elements: updateFrameMembershipOfSelectedElements(
        flipSelectedElements(
          elements,
          app.scene.getNonDeletedElementsMap(),
          appState,
          "horizontal",
        ),
        appState,
        app,
      ),
      appState,
      commitToHistory: true,
    };
  },
  PanelComponent: ({ updateData }) => (
    <IconButton
      size={"2"}
      variant={"soft"}
      color={"gray"}
      onClick={() => updateData()}
      title={"Flip horizontal"}
    >
      <ColumnSpacingIcon />
    </IconButton>
  ),
  keyTest: (event) => event.shiftKey && event.code === CODES.H,
  contextItemLabel: "labels.flipHorizontal",
});

export const actionFlipVertical = register({
  name: "flipVertical",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    // VBRN
    const metas = getObjectiveMetas(getSelectedSceneEls(app.scene, app.state));
    const disableFlip = metas.some((meta) => meta?.core?.disableFlip);
    if (disableFlip) return false;

    return {
      elements: updateFrameMembershipOfSelectedElements(
        flipSelectedElements(
          elements,
          app.scene.getNonDeletedElementsMap(),
          appState,
          "vertical",
        ),
        appState,
        app,
      ),
      appState,
      commitToHistory: true,
    };
  },
  PanelComponent: ({ updateData }) => (
    <IconButton
      size={"2"}
      variant={"soft"}
      color={"gray"}
      onClick={() => updateData()}
      title={"Flip vertical"}
    >
      <RowSpacingIcon />
    </IconButton>
  ),
  keyTest: (event) =>
    event.shiftKey && event.code === CODES.V && !event[KEYS.CTRL_OR_CMD],
  contextItemLabel: "labels.flipVertical",
});

const flipSelectedElements = (
  elements: readonly ExcalidrawElement[],
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap,
  appState: Readonly<AppState>,
  flipDirection: "horizontal" | "vertical",
) => {
  const selectedElements = getSelectedElements(
    getNonDeletedElements(elements),
    appState,
    {
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    },
  );

  const updatedElements = flipElements(
    selectedElements,
    elementsMap,
    appState,
    flipDirection,
  );

  const updatedElementsMap = arrayToMap(updatedElements);

  return elements.map(
    (element) => updatedElementsMap.get(element.id) || element,
  );
};

const flipElements = (
  selectedElements: NonDeleted<ExcalidrawElement>[],
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap,
  appState: AppState,
  flipDirection: "horizontal" | "vertical",
): ExcalidrawElement[] => {
  const { minX, minY, maxX, maxY } = getCommonBoundingBox(selectedElements);

  resizeMultipleElements(
    elementsMap,
    selectedElements,
    elementsMap,
    "nw",
    true,
    flipDirection === "horizontal" ? maxX : minX,
    flipDirection === "horizontal" ? minY : maxY,
  );

  (isBindingEnabled(appState)
    ? bindOrUnbindSelectedElements
    : unbindLinearElements)(selectedElements);

  return selectedElements;
};
