import { useState } from "react";
import { ActionManager } from "../actions/manager";
import {
  ExcalidrawElementType,
  NonDeletedElementsMap,
  NonDeletedSceneElementsMap,
} from "../element/types";
import { t } from "../i18n";
import { useDevice } from "./App";
import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetElements,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
} from "../scene";
import { MORE_SHAPES, SHAPES, TShape } from "../shapes";
import { AppClassProperties, AppProps, UIAppState, Zoom } from "../types";
import { capitalizeString, isTransparent } from "../utils";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { hasStrokeColor } from "../scene/comparisons";
import { trackEvent } from "../analytics";
import {
  hasBoundTextElement,
  isInitializedImageElement,
  isTextElement,
} from "../element/typeChecks";
import clsx from "clsx";
import { actionToggleZenMode } from "../actions";
import { Tooltip } from "./Tooltip";
import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign,
} from "../element/textElement";

import "./Actions.scss";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import { extraToolsIcon, frameToolIcon } from "./icons";
import { KEYS } from "../keys";
import { useTunnels } from "../context/tunnels";
import {
  ObjectiveKinds,
  isAllElementsObjective,
} from "../../../objective-app/objective/meta/types";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { Separator } from "@radix-ui/themes";
import { __DEBUG_EDITOR } from "../../../objective-app/objective-plus/constants";
import { getObjectiveMetas } from "../../../objective-app/objective/meta/selectors";

export const SelectedShapeActions = ({
  appState,
  elementsMap,
  renderAction,
}: {
  appState: UIAppState;
  elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
  renderAction: ActionManager["renderAction"];
}) => {
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

  const objectiveItemShowExcalidrawActions = () => {
    return (
      <ToolButton
        type="button"
        icon={showOBJStyle ? <CaretDownIcon /> : <CaretRightIcon />}
        onClick={() => setShowOBJStyle(!showOBJStyle)}
        title={showOBJStyle ? "More options" : "Less options"}
        aria-label={"undefined"}
      />
    );
  };

  const [showOBJStyle, setShowOBJStyle] = useState(false);
  const isAllObjective = isAllElementsObjective(targetElements);
  const metas = getObjectiveMetas(targetElements);
  const metasSet = new Set(metas.map((m) => m.kind));

  const isSingleMeta = metas.length === 1;
  const isSingleMetaKind = metasSet.size === 1;

  const isAnyObjective = !!metas.length;
  const isAllExcali = !isAnyObjective || __DEBUG_EDITOR;
  const isObjAndExcali = !isAllObjective && isAnyObjective;

  const isSingleImage =
    targetElements.length === 1 && isInitializedImageElement(targetElements[0]);

  const actionsToRender = {
    // Objective
    // common:
    metaKind: isAllObjective,
    metaName:
      isAllObjective &&
      isSingleMetaKind &&
      !metasSet.has(ObjectiveKinds.POINTER) &&
      !metasSet.has(ObjectiveKinds.LABEL),

    metaDescription: isSingleMeta,

    showExcalidrawStyle: isAllObjective,

    // when camera selected:
    metaCameraShot: isAllObjective,
    metaActionStoryboard: isAllObjective,

    // when image selected:
    metaInitStoryboard: isSingleImage,

    // Excalidraw
    strokeColor:
      isAllExcali ||
      (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
      (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    bgColor: isAllExcali || showOBJStyle,
    bgStyle: isAllExcali || showOBJStyle,

    strokeWidth:
      isAllExcali ||
      (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle) ||
      (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
      (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    /** solid / dashed / dottee */
    strokeStyle:
      isAllExcali ||
      (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle) ||
      (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
      (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    /** only(!) for pure excalidraw figures */
    strokeSloppiness:
      !isAnyObjective &&
      !!targetElements.length &&
      targetElements.every(
        (e) =>
          e.type === "rectangle" ||
          e.type === "diamond" ||
          e.type === "ellipse",
      ),

    /** unknown and do nothing??? */
    strokeShape: isAllExcali,

    roundness:
      isAllExcali || (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle),
    arrowheads: isAllExcali,
    textStyle:
      isAllExcali || (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle),
    opacity: isAllExcali || showOBJStyle || isObjAndExcali,
    layers: false, // TODO
    align:
      (metas.length === 0 || metas.length > 1) &&
      (isAllExcali || showOBJStyle || isObjAndExcali),

    /** duplicate group un-group hyper Link */
    actionsAll: isAllExcali || showOBJStyle || isObjAndExcali,
    duplicate: isAllExcali || showOBJStyle || isObjAndExcali,
    delete: isAllExcali || showOBJStyle || isObjAndExcali,
    group: isAllExcali || showOBJStyle || isObjAndExcali,
    hyperLink: isAllExcali || showOBJStyle || isObjAndExcali,
  };

  return (
    <div className="panelColumn">
      {actionsToRender.metaKind && renderAction("actionDisplayMeta")}
      {actionsToRender.metaName && renderAction("actionChangeMetaName")}
      {actionsToRender.metaCameraShot &&
        renderAction("actionChangeMetaCameraShot")}
      {actionsToRender.metaActionStoryboard && renderAction("actionStoryboard")}

      {actionsToRender.metaDescription &&
        renderAction("actionChangeMetaDescription")}

      {actionsToRender.metaInitStoryboard &&
        renderAction("actionInitStoryboard")}
      {actionsToRender.showExcalidrawStyle &&
        objectiveItemShowExcalidrawActions()}

      <div>
        {actionsToRender.strokeColor &&
          ((hasStrokeColor(appState.activeTool.type) &&
            appState.activeTool.type !== "image" &&
            commonSelectedType !== "image" &&
            commonSelectedType !== "frame" &&
            commonSelectedType !== "magicframe") ||
            targetElements.some((element) => hasStrokeColor(element.type))) &&
          renderAction("changeStrokeColor")}
      </div>
      {actionsToRender.bgColor && showChangeBackgroundIcons && (
        <div>{renderAction("changeBackgroundColor")}</div>
      )}
      {actionsToRender.bgStyle &&
        showFillIcons &&
        renderAction("changeFillStyle")}

      {actionsToRender.strokeWidth &&
        (hasStrokeWidth(appState.activeTool.type) ||
          targetElements.some((element) => hasStrokeWidth(element.type))) &&
        renderAction("changeStrokeWidth")}

      {actionsToRender.strokeShape &&
        (appState.activeTool.type === "freedraw" ||
          targetElements.some((element) => element.type === "freedraw")) &&
        renderAction("changeStrokeShape")}

      {actionsToRender.strokeStyle &&
        (hasStrokeStyle(appState.activeTool.type) ||
          targetElements.some((element) => hasStrokeStyle(element.type))) && (
          <>{renderAction("changeStrokeStyle")}</>
        )}
      {actionsToRender.strokeSloppiness &&
        (hasStrokeStyle(appState.activeTool.type) ||
          targetElements.some((element) => hasStrokeStyle(element.type))) && (
          <>{renderAction("changeSloppiness")}</>
        )}

      {actionsToRender.roundness &&
        (canChangeRoundness(appState.activeTool.type) ||
          targetElements.some((element) =>
            canChangeRoundness(element.type),
          )) && <>{renderAction("changeRoundness")}</>}

      {actionsToRender.textStyle &&
        (appState.activeTool.type === "text" ||
          targetElements.some(isTextElement)) && (
          <>
            {renderAction("changeFontSize")}

            {renderAction("changeFontFamily")}

            {(appState.activeTool.type === "text" ||
              suppportsHorizontalAlign(targetElements, elementsMap)) &&
              renderAction("changeTextAlign")}
          </>
        )}

      {actionsToRender.align &&
        shouldAllowVerticalAlign(targetElements, elementsMap) &&
        renderAction("changeVerticalAlign")}
      {actionsToRender.arrowheads &&
        (canHaveArrowheads(appState.activeTool.type) ||
          targetElements.some((element) =>
            canHaveArrowheads(element.type),
          )) && <>{renderAction("changeArrowhead")}</>}

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

      {actionsToRender.align &&
        targetElements.length > 1 &&
        !isSingleElementBoundContainer && (
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
      {actionsToRender.actionsAll && !isEditing && targetElements.length > 0 && (
        <fieldset>
          <legend>{t("labels.actions")}</legend>
          <div className="buttonList">
            {actionsToRender.duplicate &&
              !device.editor.isMobile &&
              renderAction("duplicateSelection")}
            {actionsToRender.delete &&
              !device.editor.isMobile &&
              renderAction("deleteSelectedElements")}
            {actionsToRender.group && renderAction("group")}
            {actionsToRender.group && renderAction("ungroup")}
            {actionsToRender.hyperLink &&
              showLinkIcon &&
              renderAction("hyperlink")}
          </div>
        </fieldset>
      )}
    </div>
  );
};

export const getShapeButton = (
  app: AppClassProperties,
  appState: UIAppState,
  activeTool: UIAppState["activeTool"],
  UIOptions: AppProps["UIOptions"],
  { value, icon, key, numericKey, fillable, label }: TShape,
) => {
  if (
    UIOptions.tools?.[
      value as Extract<typeof value, keyof AppProps["UIOptions"]["tools"]>
    ] === false
  ) {
    return null;
  }

  label = label || t(`toolBar.${value}`);
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
      {SHAPES.map((shape) =>
        getShapeButton(app, appState, activeTool, UIOptions, shape),
      )}
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
          {MORE_SHAPES.map((shape) =>
            getShapeButton(app, appState, activeTool, UIOptions, shape),
          )}
          <Separator style={{ width: "100%" }} mt={"2"} />
          <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "frame" })}
            icon={frameToolIcon}
            shortcut={KEYS.F.toLocaleUpperCase()}
            data-testid="toolbar-frame"
            selected={frameToolSelected}
          >
            {t("toolBar.frame")}
          </DropdownMenu.Item>
          {/* <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "embeddable" })}
            icon={EmbedIcon}
            data-testid="toolbar-embeddable"
            selected={embeddableToolSelected}
          >
            {t("toolBar.embeddable")}
          </DropdownMenu.Item> */}
          {/* <DropdownMenu.Item
            onSelect={() => app.setActiveTool({ type: "laser" })}
            icon={laserPointerToolIcon}
            data-testid="toolbar-laser"
            selected={laserToolSelected}
            shortcut={KEYS.K.toLocaleUpperCase()}
          >
            {t("toolBar.laser")}
          </DropdownMenu.Item> */}
          {/* <div style={{ margin: "6px 0", fontSize: 14, fontWeight: 600 }}>
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
          )} */}
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
