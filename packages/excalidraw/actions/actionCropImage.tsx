import { register } from "./register";

import { Flex } from "@radix-ui/themes";
import { CropIcon, ResetIcon } from "@radix-ui/react-icons";
import { getSelectedSceneEls } from "../../../objective-app/objective/meta/_selectors";
import { CODES } from "../keys";
import { AspectRatioSelect } from "../../../objective-app/objective/actions/components/aspectRatioSelect";
import { ExcalRadixToggledIconButton } from "../../../objective-app/objective/actions/components/button";
import { isImageElement } from "../element/typeChecks";
import {
  cropElementProgramatecly,
  cropElementRestore,
  hasBeenCropped,
  isSupportChangeAspectRatio,
} from "./../../../objective-app/objective/elements/_cropElement";
import { deepCopyElement } from "../element/newElement";
import { getShortcutFromShortcutName } from "./shortcuts";
import { mutateElement } from "..";
import { getFormValue } from "./actionProperties";
import { MathRound } from "../../../objective-app/objective/elements/_math";

export const actionCropImage = register({
  name: "cropImage",
  trackEvent: { category: "element", action: "crop" },
  perform: (
    elements,
    appState,
    value:
      | "disable"
      | "enable"
      | "original"
      | "custom"
      | "restore"
      | "unlockAspectRatio"
      | "lockAspectRatio"
      | string
      | undefined,
    app,
  ) => {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    if (!isSupportChangeAspectRatio(selectedElements)) return false;

    // from keyTest
    if (!value) value = appState.croppingModeEnabled ? "disable" : "enable";
    if (value === "disable" || value === "enable") {
      let selectedElementIds = appState.selectedElementIds;
      if (selectedElements.length > 1) {
        selectedElementIds = {
          [selectedElements[0].id]: true,
        };
      }
      return {
        elements,
        appState: {
          ...appState,
          selectedElementIds,
          croppingModeEnabled: value === "enable",
        },
        commitToHistory: false,
      };
    }

    selectedElements.forEach((el) => {
      // //////////////////
      if (value === "original") {
        cropElementRestore(el);
        // mutateElement(el, { holdAspectRatio: true }); // FIXME
      } else if (value === "custom") {
        mutateElement(el, { holdAspectRatio: false });
        // TODO enable crop mode
      } else if (value === "restore") {
        cropElementRestore(el);
        mutateElement(el, { holdAspectRatio: false });
      }
      // //////////////////
      // if (value === "unlockAspectRatio") {
      //   mutateElement(el, { holdAspectRatio: false });
      //   return {
      //     elements,
      //     appState,
      //     commitToHistory: true,
      //   };
      // }
      // if (value === "lockAspectRatio") {
      //   // mutateElement(el, { holdAspectRatio: true }); // FIXME
      //   return {
      //     elements,
      //     appState,
      //     commitToHistory: true,
      //   };
      // }
      // //////////////////
      else {
        // crop on value (do not reset to original, use user prev changes)
        const underlyingEl = deepCopyElement(el);
        const underlyingAspectRatio = underlyingEl.width / underlyingEl.height;
        const nextAspectRatio = Number(value);
        const coef = underlyingAspectRatio / nextAspectRatio;
        const nextWidth = underlyingEl.width / coef;
        const nextHeight = underlyingEl.height * coef;
        const cropOn =
          nextAspectRatio < underlyingAspectRatio
            ? {
                x: (underlyingEl.width - nextWidth) / 2,
                y: 0,
              }
            : {
                x: 0,
                y: (underlyingEl.height - nextHeight) / 2,
              };

        cropElementProgramatecly(el, cropOn, "nw");
        cropElementProgramatecly(el, cropOn, "se");
        // mutateElement(el, { holdAspectRatio: true }); // FIXME
      }
    });

    return {
      elements,
      appState,
      commitToHistory: true,
    };
  },
  predicate(elements, appState, appProps, app) {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    return isSupportChangeAspectRatio(selectedElements);
  },
  keyTest: (event) => event.shiftKey && event.code === CODES.C,
  contextItemLabel: "labels.crop",
  PanelComponent: ({ elements, appState, updateData, app }) => {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    if (!isSupportChangeAspectRatio(selectedElements)) return null;

    const isCropping = appState.croppingModeEnabled;
    const originalValue = getFormValue(
      elements,
      appState,
      (element) =>
        isImageElement(element)
          ? MathRound(
              element.underlyingImageWidth / element.underlyingImageHeight,
              2,
            )
          : undefined,
      (element) => isImageElement(element),
      undefined,
    );
    const currentAspectRatio = getFormValue(
      elements,
      appState,
      (element) =>
        isImageElement(element)
          ? MathRound(element.width / element.height, 2)
          : undefined,
      (element) => isImageElement(element),
      undefined,
    );
    const isAllElementsCropped = getFormValue(
      elements,
      appState,
      (element) => (isImageElement(element) ? hasBeenCropped(element) : false),
      (element) => isImageElement(element),
      false,
    );
    const isAnyElementCropped = getFormValue(
      elements,
      appState,
      (element) => isImageElement(element) && hasBeenCropped(element),
      (element) => isImageElement(element) && hasBeenCropped(element),
      false,
    );

    return (
      <Flex direction={"column"}>
        <legend>{"Crop"}</legend>
        <Flex gap={"1"}>
          <ExcalRadixToggledIconButton
            title={`Crop image — ${getShortcutFromShortcutName("cropImage")}`}
            toggled={appState.croppingModeEnabled}
            onClick={() => updateData(isCropping ? "disable" : "enable")}
          >
            <CropIcon />
          </ExcalRadixToggledIconButton>

          {/*
          FIXME
          <ExcalRadixIconButton
            title={
              isLockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"
            }
            toggled={isLockAspectRatio}
            onClick={() =>
              updateData(
                isLockAspectRatio ? "unlockAspectRatio" : "lockAspectRatio",
              )
            }
            disabled={!hasBeenCropped(el)}
          >
            {isLockAspectRatio ? <LockClosedIcon /> : <LockOpen1Icon />}
          </ExcalRadixIconButton>
          */}

          <ExcalRadixToggledIconButton
            title={"Restore"}
            onClick={() => updateData("restore")}
            disabled={!isAnyElementCropped}
          >
            <ResetIcon />
          </ExcalRadixToggledIconButton>
          <AspectRatioSelect
            originalValue={originalValue}
            value={currentAspectRatio}
            updateData={(value) => updateData(value)}
            hasBeenChanged={isAllElementsCropped}
          />
        </Flex>
      </Flex>
    );
  },
});
