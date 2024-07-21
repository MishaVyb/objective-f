import { getSelectedElements, isSomeElementSelected } from "../scene";
import { register } from "./register";
import { getNonDeletedElements } from "../element";

import { IconButton } from "@radix-ui/themes";
import { CropIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { getSelectedSceneEls } from "../../../objective-app/objective/meta/_selectors";
import { CODES } from "../keys";
import { getShortcutFromShortcutName } from "./shortcuts";
import { ExcalidrawElement } from "../element/types";

const isSupportCropping = (selectedElements: ExcalidrawElement[]) =>
  selectedElements.length === 1 && selectedElements[0].type === "image";

export const actionCropImage = register({
  name: "cropImage",
  trackEvent: { category: "element", action: "crop" },
  perform: (elements, appState, _, app) => {
    let croppingModeEnabled = appState.croppingModeEnabled;
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    if (isSupportCropping(selectedElements)) {
      croppingModeEnabled = !croppingModeEnabled;
    } else {
      croppingModeEnabled = false;
    }

    return {
      elements,
      appState: {
        ...appState,
        croppingModeEnabled,
      },
      commitToHistory: isSomeElementSelected(
        getNonDeletedElements(elements),
        appState,
      ),
    };
  },
  predicate(elements, appState, appProps, app) {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    return isSupportCropping(selectedElements);
  },
  keyTest: (event) => event.shiftKey && event.code === CODES.C,
  contextItemLabel: "labels.crop",
  PanelComponent: ({ elements, appState, updateData, app }) => {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    if (!isSupportCropping(selectedElements)) return null;
    return (
      <IconButton
        className={clsx("objective-toggled-icon-button", {
          toggled: appState.croppingModeEnabled,
        })}
        size={"2"}
        variant={"soft"}
        color={"gray"}
        onClick={() => updateData(null)}
        title={`Crop image — ${getShortcutFromShortcutName("cropImage")}`}
      >
        <CropIcon />
      </IconButton>
    );
  },
});
