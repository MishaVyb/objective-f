import { register } from "./register";

import { Flex } from "@radix-ui/themes";
import { CropIcon, ResetIcon } from "@radix-ui/react-icons";
import { getSelectedSceneEls } from "../../../objective-app/objective/meta/_selectors";
import { CODES } from "../keys";
import { ExcalidrawElement, ExcalidrawImageElement } from "../element/types";
import { AspectRatioSelect } from "../../../objective-app/objective/actions/components/aspectRatioSelect";
import { ExcalRadixIconButton } from "../../../objective-app/objective/actions/components/button";
import { isImageElement } from "../element/typeChecks";
import {
  cropElementProgramatecly,
  cropElementRestore as cropElementReset,
} from "../element/cropElement";
import { deepCopyElement } from "../element/newElement";
import { getShortcutFromShortcutName } from "./shortcuts";
import { mutateElement } from "..";

const isSupportCropping = (selectedElements: ExcalidrawElement[]) =>
  selectedElements.length === 1 && selectedElements[0].type === "image";

const hasBeenCropped = (el: ExcalidrawImageElement) =>
  Boolean(
    el.eastCropAmount ||
      el.westCropAmount ||
      el.northCropAmount ||
      el.southCropAmount,
  );

export const actionCropImage = register({
  name: "cropImage",
  trackEvent: { category: "element", action: "crop" },
  perform: (
    elements,
    appState,
    value: "disable" | "enable" | "reset" | "custom" | string | undefined,
    app,
  ) => {
    const selectedElements = getSelectedSceneEls(app.scene, appState);
    const el = selectedElements[0];
    if (!isImageElement(el)) return false;

    // from keyTest
    if (!value) value = appState.croppingModeEnabled ? "disable" : "enable";
    if (value === "custom") value = "enable";

    if (value === "disable" || value === "enable") {
      return {
        elements,
        appState: {
          ...appState,
          croppingModeEnabled: value === "enable",
        },
        commitToHistory: false,
      };
    }

    if (value === "reset") {
      cropElementReset(el);
      return {
        elements,
        appState,
        commitToHistory: false,
      };
    }

    // reset to original & crop on value
    cropElementReset(el);
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
    mutateElement(el, { holdAspectRatio: true });

    return {
      elements,
      appState,
      commitToHistory: true,
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
    const el = selectedElements[0];
    if (!isImageElement(el)) return <></>;
    const currentAspectRatio = el.width / el.height;
    const isCropping = appState.croppingModeEnabled;

    return (
      <Flex direction={"column"}>
        <legend>{"Aspect ratio"}</legend>
        <Flex gap={"1"}>
          <ExcalRadixIconButton
            title={`Crop image — ${getShortcutFromShortcutName("cropImage")}`}
            toggled={appState.croppingModeEnabled}
            onClick={() => updateData(isCropping ? "disable" : "enable")}
          >
            <CropIcon />
          </ExcalRadixIconButton>

          <ExcalRadixIconButton
            onClick={() => updateData("reset")}
            disabled={!hasBeenCropped(el)}
          >
            <ResetIcon />
          </ExcalRadixIconButton>
          <AspectRatioSelect
            value={currentAspectRatio}
            updateData={(value) => updateData(value)}
            hasBeenChanged={hasBeenCropped(el)}
          />
        </Flex>
      </Flex>
    );
  },
});
