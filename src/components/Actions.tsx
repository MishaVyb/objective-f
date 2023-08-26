import {
  isAllElementsObjective,
  isAnyElementsObjective,
} from "../_objective_/types/types";
import { actionToggleZenMode } from "../actions";
import { ActionManager } from "../actions/manager";
import { trackEvent } from "../analytics";
import { useDevice } from "../components/App";
import { getNonDeletedElements } from "../element";
import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign,
} from "../element/textElement";
import {
  hasBoundTextElement,
  isInitializedImageElement,
} from "../element/typeChecks";
import { ExcalidrawElement, PointerType } from "../element/types";
import { t } from "../i18n";
import { KEYS } from "../keys";
import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
  hasText,
} from "../scene";
import { hasStrokeColor } from "../scene/comparisons";
import { SHAPES } from "../shapes";
import { UIAppState, Zoom } from "../types";
import {
  capitalizeString,
  isTransparent,
  setCursorForShape,
  updateActiveTool,
} from "../utils";
import "./Actions.scss";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { Tooltip } from "./Tooltip";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import { extraToolsIcon, frameToolIcon } from "./icons";
import { act } from "@testing-library/react";
import clsx from "clsx";
import React, { useState } from "react";

export const SelectedShapeActions = ({
  appState,
  elements,
  renderAction,
}: {
  appState: UIAppState;
  elements: readonly ExcalidrawElement[];
  renderAction: ActionManager["renderAction"];
}) => {
  // console.log(targetElements)
  // console.log(elements.map(e => e.groupIds))
  const [showOBJStyle, setShowOBJStyle] = useState(false);

  const targetElements = getTargetElements(
    getNonDeletedElements(elements),
    appState,
  );

  let isSingleElementBoundContainer = false;
  if (
    targetElements.length === 2 &&
    (hasBoundTextElement(targetElements[0]) ||
      hasBoundTextElement(targetElements[1]))
  ) {
    isSingleElementBoundContainer = true;
  }
  const isEditing = Boolean(appState.editingElement);
  const device = useDevice();
  const isRTL = document.documentElement.getAttribute("dir") === "rtl";

  const showFillIcons =
    hasBackground(appState.activeTool.type) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );
  const showChangeBackgroundIcons =
    hasBackground(appState.activeTool.type) ||
    targetElements.some((element) => hasBackground(element.type));

  const showLinkIcon =
    targetElements.length === 1 || isSingleElementBoundContainer;

  let commonSelectedType: string | null = targetElements[0]?.type || null;

  for (const element of targetElements) {
    if (element.type !== commonSelectedType) {
      commonSelectedType = null;
      break;
    }
  }

  // NAV actions: SelectedShapeActions
  const isAllObjective = isAllElementsObjective(targetElements);
  const isAnyObjective = isAnyElementsObjective(targetElements);
  const isAllExcali = !isAnyObjective;
  const isObjAndExcali = !isAllObjective && isAnyObjective;
  const isSingleImage = isInitializedImageElement(targetElements[0]);

  const actionsToRender = {
    stroke: isAllExcali,
    fill: isAllExcali || showOBJStyle,
    fillStyle: isAllExcali || showOBJStyle,
    strokeWidth: isAllExcali,
    strokeStyle: isAllExcali,
    sloppiness: isAllExcali,
    roundness: isAllExcali,
    arrowheads: isAllExcali,
    textStyle: isAllExcali,
    opacity: isAllExcali || showOBJStyle || isObjAndExcali,
    layers: isAllExcali || showOBJStyle || isObjAndExcali,
    align: isAllExcali || showOBJStyle || isObjAndExcali,
    actions: isAllExcali || showOBJStyle || isObjAndExcali,
  };

  return (
    <div className="panelColumn">
      {isSingleImage && renderAction("actionInitStoryboard")}
      {isAllObjective && objectiveActions()}
      {isAllObjective && objectiveStyleButton()}
      {excalidrawActions()}
    </div>
  );

  function objectiveActions() {
    return (
      <>
        {renderAction("representationMeta")}
        {renderAction("actionChangeMetaName")}
        {renderAction("actionChangeMetaCameraShot")}
      </>
    );
  }

  function objectiveStyleButton() {
    return (
      <button onClick={() => setShowOBJStyle(!showOBJStyle)}>
        {showOBJStyle ? "hide style" : "show style"}
      </button>
    );
  }

  function excalidrawActions() {
    return (
      <>
        <div>
          {((hasStrokeColor(appState.activeTool.type) &&
            appState.activeTool.type !== "image" &&
            commonSelectedType !== "image" &&
            commonSelectedType !== "frame") ||
            targetElements.some((element) => hasStrokeColor(element.type))) &&
            actionsToRender.stroke &&
            renderAction("changeStrokeColor")}
        </div>
        {actionsToRender.fill && showChangeBackgroundIcons && (
          <div>{renderAction("changeBackgroundColor")}</div>
        )}

        {excalidrawExtraActions()}

        {shouldAllowVerticalAlign(targetElements) &&
          renderAction("changeVerticalAlign")}
        {(canHaveArrowheads(appState.activeTool.type) ||
          targetElements.some((element) => canHaveArrowheads(element.type))) &&
          actionsToRender.arrowheads && <>{renderAction("changeArrowhead")}</>}

        {actionsToRender.opacity && renderAction("changeOpacity")}

        {actionsToRender.layers && (
          <fieldset>
            <legend>{t("labels.layers")}</legend>
            <div className="buttonList">
              {renderAction("sendToBack")}
              {renderAction("sendBackward")}
              {renderAction("bringToFront")}
              {renderAction("bringForward")}
            </div>
          </fieldset>
        )}

        {targetElements.length > 1 &&
          !isSingleElementBoundContainer &&
          actionsToRender.align && (
            <fieldset>
              <legend>{t("labels.align")}</legend>
              <div className="buttonList">
                {
                  // swap this order for RTL so the button positions always match their action
                  // (i.e. the leftmost button aligns left)
                }
                {isRTL ? (
                  <>
                    {renderAction("alignRight")}
                    {renderAction("alignHorizontallyCentered")}
                    {renderAction("alignLeft")}
                  </>
                ) : (
                  <>
                    {renderAction("alignLeft")}
                    {renderAction("alignHorizontallyCentered")}
                    {renderAction("alignRight")}
                  </>
                )}
                {targetElements.length > 2 &&
                  renderAction("distributeHorizontally")}
                {/* breaks the row ˇˇ */}
                <div style={{ flexBasis: "100%", height: 0 }} />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: ".5rem",
                    marginTop: "-0.5rem",
                  }}
                >
                  {renderAction("alignTop")}
                  {renderAction("alignVerticallyCentered")}
                  {renderAction("alignBottom")}
                  {targetElements.length > 2 &&
                    renderAction("distributeVertically")}
                </div>
              </div>
            </fieldset>
          )}
        {actionsToRender.actions && !isEditing && targetElements.length > 0 && (
          <fieldset>
            <legend>{t("labels.actions")}</legend>
            <div className="buttonList">
              {!device.isMobile && renderAction("duplicateSelection")}
              {!device.isMobile && renderAction("deleteSelectedElements")}
              {renderAction("group")}
              {renderAction("ungroup")}
              {showLinkIcon && renderAction("hyperlink")}
            </div>
          </fieldset>
        )}
      </>
    );
  }

  function excalidrawExtraActions() {
    return (
      <>
        {actionsToRender.fillStyle &&
          showFillIcons &&
          renderAction("changeFillStyle")}
        {(hasStrokeWidth(appState.activeTool.type) ||
          targetElements.some((element) => hasStrokeWidth(element.type))) &&
          actionsToRender.strokeWidth &&
          renderAction("changeStrokeWidth")}
        {(appState.activeTool.type === "freedraw" ||
          targetElements.some((element) => element.type === "freedraw")) &&
          actionsToRender.strokeStyle &&
          renderAction("changeStrokeShape")}
        {(hasStrokeStyle(appState.activeTool.type) ||
          targetElements.some((element) => hasStrokeStyle(element.type))) &&
          actionsToRender.strokeStyle && (
            <>
              {renderAction("changeStrokeStyle")}
              {renderAction("changeSloppiness")}
            </>
          )}
        {(canChangeRoundness(appState.activeTool.type) ||
          targetElements.some((element) => canChangeRoundness(element.type))) &&
          actionsToRender.roundness && <>{renderAction("changeRoundness")}</>}
        {(hasText(appState.activeTool.type) ||
          targetElements.some((element) => hasText(element.type))) &&
          actionsToRender.textStyle && (
            <>
              {renderAction("changeFontSize")}

              {renderAction("changeFontFamily")}

              {suppportsHorizontalAlign(targetElements) &&
                renderAction("changeTextAlign")}
            </>
          )}
      </>
    );
  }
};

export const ShapesSwitcher = ({
  canvas,
  activeTool,
  setAppState,
  onImageAction,
  appState,
}: {
  canvas: HTMLCanvasElement | null;
  activeTool: UIAppState["activeTool"];
  setAppState: React.Component<any, UIAppState>["setState"];
  onImageAction: (data: { pointerType: PointerType | null }) => void;
  appState: UIAppState;
}) => {
  const [isExtraToolsMenuOpen, setIsExtraToolsMenuOpen] = useState(false);
  const device = useDevice();
  return (
    <>
      {SHAPES.map(({ value, icon, key, numericKey, fillable }, index) => {
        const label = t(`toolBar.${value}`);
        const letter =
          key && capitalizeString(typeof key === "string" ? key : key[0]);
        const shortcut = letter
          ? `${letter} ${t("helpDialog.or")} ${numericKey}`
          : `${numericKey}`;
        return (
          <ToolButton
            className={clsx("Shape", { fillable })}
            key={value}
            type="radio"
            icon={icon}
            checked={activeTool.type === value}
            name="editor-current-shape"
            title={`${capitalizeString(label)} — ${shortcut}`}
            keyBindingLabel={numericKey || letter}
            aria-label={capitalizeString(label)}
            aria-keyshortcuts={shortcut}
            data-testid={`toolbar-${value}`}
            onPointerDown={({ pointerType }) => {
              if (!appState.penDetected && pointerType === "pen") {
                setAppState({
                  penDetected: true,
                  penMode: true,
                });
              }
            }}
            onChange={({ pointerType }) => {
              if (appState.activeTool.type !== value) {
                trackEvent("toolbar", value, "ui");
              }
              const nextActiveTool = updateActiveTool(appState, {
                type: value,
              });
              setAppState({
                activeTool: nextActiveTool,
                multiElement: null,
                selectedElementIds: {},
              });
              setCursorForShape(canvas, {
                ...appState,
                activeTool: nextActiveTool,
              });
              if (value === "image") {
                onImageAction({ pointerType });
              }
            }}
          />
        );
      })}
      <div className="App-toolbar__divider" />
      {/* TEMP HACK because dropdown doesn't work well inside mobile toolbar */}
      {device.isMobile ? (
        <ToolButton
          className={clsx("Shape", { fillable: false })}
          type="radio"
          icon={frameToolIcon}
          checked={activeTool.type === "frame"}
          name="editor-current-shape"
          title={`${capitalizeString(
            t("toolBar.frame"),
          )} — ${KEYS.F.toLocaleUpperCase()}`}
          keyBindingLabel={KEYS.F.toLocaleUpperCase()}
          aria-label={capitalizeString(t("toolBar.frame"))}
          aria-keyshortcuts={KEYS.F.toLocaleUpperCase()}
          data-testid={`toolbar-frame`}
          onPointerDown={({ pointerType }) => {
            if (!appState.penDetected && pointerType === "pen") {
              setAppState({
                penDetected: true,
                penMode: true,
              });
            }
          }}
          onChange={({ pointerType }) => {
            trackEvent("toolbar", "frame", "ui");
            const nextActiveTool = updateActiveTool(appState, {
              type: "frame",
            });
            setAppState({
              activeTool: nextActiveTool,
              multiElement: null,
              selectedElementIds: {},
            });
          }}
        />
      ) : (
        <DropdownMenu open={isExtraToolsMenuOpen}>
          <DropdownMenu.Trigger
            className="App-toolbar__extra-tools-trigger"
            onToggle={() => setIsExtraToolsMenuOpen(!isExtraToolsMenuOpen)}
            title={t("toolBar.extraTools")}
          >
            {extraToolsIcon}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            onClickOutside={() => setIsExtraToolsMenuOpen(false)}
            onSelect={() => setIsExtraToolsMenuOpen(false)}
            className="App-toolbar__extra-tools-dropdown"
          >
            <DropdownMenu.Item
              onSelect={() => {
                const nextActiveTool = updateActiveTool(appState, {
                  type: "frame",
                });
                setAppState({
                  activeTool: nextActiveTool,
                  multiElement: null,
                  selectedElementIds: {},
                });
              }}
              icon={frameToolIcon}
              shortcut={KEYS.F.toLocaleUpperCase()}
              data-testid="toolbar-frame"
            >
              {t("toolBar.frame")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      )}
    </>
  );
};

export const ZoomActions = ({
  renderAction,
  zoom,
}: {
  renderAction: ActionManager["renderAction"];
  zoom: Zoom;
}) => (
  <Stack.Col gap={1} className="zoom-actions">
    <Stack.Row align="center">
      {renderAction("zoomOut")}
      {renderAction("resetZoom")}
      {renderAction("zoomIn")}
    </Stack.Row>
  </Stack.Col>
);

export const UndoRedoActions = ({
  renderAction,
  className,
}: {
  renderAction: ActionManager["renderAction"];
  className?: string;
}) => (
  <div className={`undo-redo-buttons ${className}`}>
    <div className="undo-button-container">
      <Tooltip label={t("buttons.undo")}>{renderAction("undo")}</Tooltip>
    </div>
    <div className="redo-button-container">
      <Tooltip label={t("buttons.redo")}> {renderAction("redo")}</Tooltip>
    </div>
  </div>
);

export const ExitZenModeAction = ({
  actionManager,
  showExitZenModeBtn,
}: {
  actionManager: ActionManager;
  showExitZenModeBtn: boolean;
}) => (
  <button
    className={clsx("disable-zen-mode", {
      "disable-zen-mode--visible": showExitZenModeBtn,
    })}
    onClick={() => actionManager.executeAction(actionToggleZenMode)}
  >
    {t("buttons.exitZenMode")}
  </button>
);

export const FinalizeAction = ({
  renderAction,
  className,
}: {
  renderAction: ActionManager["renderAction"];
  className?: string;
}) => (
  <div className={`finalize-button ${className}`}>
    {renderAction("finalize", { size: "small" })}
  </div>
);
