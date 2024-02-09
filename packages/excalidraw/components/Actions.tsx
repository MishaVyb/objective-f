import clsx from "clsx";
import { useState } from "react";
import Button from "../../../src/_objective_/UI/Button";
import {
  isAllElementsObjective,
  isAnyElementsObjective,
} from "../../../src/_objective_/types/types";
import { actionToggleZenMode } from "../actions";
import { ActionManager } from "../actions/manager";
import { trackEvent } from "../analytics";
import { useTunnels } from "../context/tunnels";
import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign,
} from "../element/textElement";
import {
  hasBoundTextElement,
  isInitializedImageElement,
  isTextElement,
} from "../element/typeChecks";
import {
  ExcalidrawElementType,
  NonDeletedElementsMap,
  NonDeletedSceneElementsMap,
} from "../element/types";
import { t } from "../i18n";
import { KEYS } from "../keys";
import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
} from "../scene";
import { hasStrokeColor } from "../scene/comparisons";
import { SHAPES } from "../shapes";
import { AppClassProperties, AppProps, UIAppState, Zoom } from "../types";
import { capitalizeString, isTransparent } from "../utils";
import "./Actions.scss";
import { useDevice } from "./App";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { Tooltip } from "./Tooltip";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import {
  EmbedIcon,
  MagicIcon,
  OpenAIIcon,
  extraToolsIcon,
  frameToolIcon,
  laserPointerToolIcon,
  mermaidLogoIcon,
} from "./icons";

export const SelectedShapeActions = ({
  appState,
  elementsMap,
  renderAction,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
}) => {
  const [showOBJStyle, setShowOBJStyle] = useState(false);
  const targetElements = getTargetElements(elementsMap, appState);

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
    (hasBackground(appState.activeTool.type) &&
      !isTransparent(appState.currentItemBackgroundColor)) ||
    targetElements.some(
      (element) =>
        hasBackground(element.type) && !isTransparent(element.backgroundColor),
    );
  const showChangeBackgroundIcons =
    hasBackground(appState.activeTool.type) ||
    targetElements.some((element) => hasBackground(element.type));

  const showLinkIcon =
    targetElements.length === 1 || isSingleElementBoundContainer;

  let commonSelectedType: ExcalidrawElementType | null =
    targetElements[0]?.type || null;

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
  const isSingleImage =
    targetElements.length === 1 && isInitializedImageElement(targetElements[0]);

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
        {renderAction("actionStoryboard")}
      </>
    );
  }

  function objectiveStyleButton() {
    return (
      <Button onClick={() => setShowOBJStyle(!showOBJStyle)}>
        {showOBJStyle ? "hide style" : "show style"}
      </Button>
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

        {shouldAllowVerticalAlign(
          targetElements,
          new Map(), // VBRN CONFLICT: which map??? TMP pass empty map
        ) && renderAction("changeVerticalAlign")}
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
        {(hasBoundTextElement(appState.activeTool.type) ||
          targetElements.some((element) =>
            hasBoundTextElement(element.type),
          )) &&
          actionsToRender.textStyle && (
            <>
              {renderAction("changeFontSize")}

              {renderAction("changeFontFamily")}

              {suppportsHorizontalAlign(
                targetElements,
                new Map(), // VBRN CONFLICT: which map??? TMP pass empty map
              ) && renderAction("changeTextAlign")}
            </>
          )}
      </>
    );
  }
};

export const ShapesSwitcher = ({
  activeTool,
  appState,
  app,
  UIOptions,
}: {
  activeTool: UIAppState["activeTool"];
  appState: UIAppState;
  app: AppClassProperties;
  UIOptions: AppProps["UIOptions"];
}) => {
  const [isExtraToolsMenuOpen, setIsExtraToolsMenuOpen] = useState(false);

  const frameToolSelected = activeTool.type === "frame";
  const laserToolSelected = activeTool.type === "laser";
  const embeddableToolSelected = activeTool.type === "embeddable";

  const { TTDDialogTriggerTunnel } = useTunnels();

  return (
    <>
      {SHAPES.map(({ value, icon, key, numericKey, fillable }, index) => {
        if (
          UIOptions.tools?.[
            value as Extract<typeof value, keyof AppProps["UIOptions"]["tools"]>
          ] === false
        ) {
          return null;
        }

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
                app.togglePenMode(true);
              }
            }}
            onChange={({ pointerType }) => {
              if (appState.activeTool.type !== value) {
                trackEvent("toolbar", value, "ui");
              }
              if (value === "image") {
                app.setActiveTool({
                  type: value,
                  insertOnCanvasDirectly: pointerType !== "mouse",
                });
              } else {
                app.setActiveTool({ type: value });
              }
            }}
          />
        );
      })}
      <div className="App-toolbar__divider" />

      <DropdownMenu open={isExtraToolsMenuOpen}>
        <DropdownMenu.Trigger
          className={clsx("App-toolbar__extra-tools-trigger", {
            "App-toolbar__extra-tools-trigger--selected":
              frameToolSelected ||
              embeddableToolSelected ||
              // in collab we're already highlighting the laser button
              // outside toolbar, so let's not highlight extra-tools button
              // on top of it
              (laserToolSelected && !app.props.isCollaborating),
          })}
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
            onSelect={() => app.setActiveTool({ type: "frame" })}
            icon={frameToolIcon}
            shortcut={KEYS.F.toLocaleUpperCase()}
            data-testid="toolbar-frame"
            selected={frameToolSelected}
          >
            {t("toolBar.frame")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "embeddable" })}
            icon={EmbedIcon}
            data-testid="toolbar-embeddable"
            selected={embeddableToolSelected}
          >
            {t("toolBar.embeddable")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "laser" })}
            icon={laserPointerToolIcon}
            data-testid="toolbar-laser"
            selected={laserToolSelected}
            shortcut={KEYS.K.toLocaleUpperCase()}
          >
            {t("toolBar.laser")}
          </DropdownMenu.Item>
          <div style={{ margin: "6px 0", fontSize: 14, fontWeight: 600 }}>
            Generate
          </div>
          {app.props.aiEnabled !== false && <TTDDialogTriggerTunnel.Out />}
          <DropdownMenu.Item
            onSelect={() => app.setOpenDialog({ name: "ttd", tab: "mermaid" })}
            icon={mermaidLogoIcon}
            data-testid="toolbar-embeddable"
          >
            {t("toolBar.mermaidToExcalidraw")}
          </DropdownMenu.Item>
          {app.props.aiEnabled !== false && (
            <>
              <DropdownMenu.Item
                onSelect={() => app.onMagicframeToolSelect()}
                icon={MagicIcon}
                data-testid="toolbar-magicframe"
              >
                {t("toolBar.magicframe")}
                <DropdownMenu.Item.Badge>AI</DropdownMenu.Item.Badge>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => {
                  trackEvent("ai", "open-settings", "d2c");
                  app.setOpenDialog({
                    name: "settings",
                    source: "settings",
                    tab: "diagram-to-code",
                  });
                }}
                icon={OpenAIIcon}
                data-testid="toolbar-magicSettings"
              >
                {t("toolBar.magicSettings")}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
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
