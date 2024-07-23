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
  isLinearElement,
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
  isWallToolOrWallDrawing,
} from "../../../objective-app/objective/meta/_types";
import { objectEntries } from "../../../objective-app/objective/utils/types";
import { Button, Flex, Separator } from "@radix-ui/themes";
import {
  ACCENT_COLOR,
  __DEBUG_EDITOR,
} from "../../../objective-app/objective-plus/constants";
import { getObjectiveMetas } from "../../../objective-app/objective/meta/_selectors";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";

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

  const buttonShowOrHideExcalidrawStyle = () => {
    return (
      <>
        <Separator mt={"2"} size={"4"} />
        <Button
          mb={!showOBJStyle ? "-4" : "1"}
          style={{ width: "100%" }}
          variant={"ghost"}
          color={showOBJStyle ? ACCENT_COLOR : "gray"}
          onClick={() => setShowOBJStyle(!showOBJStyle)}
        >
          <MixerHorizontalIcon />
          {"Style"}
        </Button>
      </>
    );
  };

  const [showOBJStyle, setShowOBJStyle] = useState(false);
  const isAllObjective = isAllElementsObjective(
    // HACK text with containerId is a part of Objective Label: filter it out
    targetElements.filter((e) => (isTextElement(e) ? !e.containerId : true)),
  );
  const metas = getObjectiveMetas(targetElements);
  const metasSet = new Set(metas.map((m) => m.kind));

  // many metas, but all metas the same kind
  const singleMetaKind = metasSet.size === 1 ? metas[0].kind : null;

  // strict only one meta
  const singleMeta = metas.length === 1 ? metas[0] : null;

  const isSomeObjective = !!metas.length;
  const isOnlyExcali = !isSomeObjective || __DEBUG_EDITOR;
  const isObjAndExcali = !isAllObjective && isSomeObjective;

  const isSingleImage =
    targetElements.length === 1 && isInitializedImageElement(targetElements[0]);

  const isObjectiveTool = isWallToolOrWallDrawing(
    appState.activeTool,
    targetElements,
  );

  const getActionsToRender = (showOBJStyle: boolean) => ({
    // Objective
    // common:
    metaHeader: isObjectiveTool || isAllObjective,
    metaName:
      isAllObjective &&
      singleMetaKind &&
      (metasSet.has(ObjectiveKinds.CAMERA) ||
        metasSet.has(ObjectiveKinds.LIGHT) ||
        metasSet.has(ObjectiveKinds.CHARACTER)),

    metaDescription:
      isAllObjective &&
      singleMeta &&
      (metasSet.has(ObjectiveKinds.CAMERA) ||
        metasSet.has(ObjectiveKinds.CHARACTER) ||
        metasSet.has(ObjectiveKinds.LIGHT)),

    buttonToShowOrHideExcalidrawStyle: isObjectiveTool ? false : isAllObjective,

    // when many cameras selected:
    metaCameraShot: isAllObjective && singleMetaKind === ObjectiveKinds.CAMERA,
    metaCameraDetails:
      isAllObjective && singleMetaKind === ObjectiveKinds.CAMERA,

    // wall and movement arrows
    metaToggleEditLine:
      isLinearElement(targetElements[0]) &&
      (singleMeta?.kind === ObjectiveKinds.WALL ||
        singleMeta?.subkind === "characterMovementPointer" ||
        singleMeta?.subkind === "cameraMovementPointer"),

    // when only one camera selected:
    metaActionStoryboard:
      isAllObjective && singleMeta && singleMetaKind === ObjectiveKinds.CAMERA,

    // when character selected:
    metaCharacterActions: singleMetaKind === ObjectiveKinds.CHARACTER,

    // when image selected:
    metaInitStoryboard: isSingleImage,

    // Excalidraw
    strokeColor: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali ||
        (metasSet.has(ObjectiveKinds.WALL) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    bgColor: isObjectiveTool ? showOBJStyle : isOnlyExcali || showOBJStyle,
    bgStyle: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali || (showOBJStyle && !metasSet.has(ObjectiveKinds.LABEL)),

    strokeWidth: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali ||
        // (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.WALL) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    /** solid / dashed / dottee */
    strokeStyle: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali ||
        // (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle) ||
        // (metasSet.has(ObjectiveKinds.WALL) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.LOCATION) && showOBJStyle) ||
        (metasSet.has(ObjectiveKinds.POINTER) && showOBJStyle),

    /** only(!) for pure excalidraw figures */
    strokeSloppiness:
      __DEBUG_EDITOR ||
      (!isSomeObjective &&
        !!targetElements.length &&
        targetElements.every(
          (e) =>
            e.type === "rectangle" ||
            e.type === "diamond" ||
            e.type === "ellipse",
        )),

    /** unknown and do nothing??? */
    strokeShape: isOnlyExcali,

    // only for movement arrows or images or pure Excal elements
    roundness: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali ||
        (metasSet.has(ObjectiveKinds.WALL) && showOBJStyle) ||
        metas.every(
          (m) =>
            m.subkind === "cameraMovementPointer" ||
            m.subkind === "characterMovementPointer",
        ),
    cropImage: true, // handled at action internally

    arrowheads: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali ||
        metas.every(
          (m) =>
            m.subkind === "cameraMovementPointer" ||
            m.subkind === "characterMovementPointer",
        ),

    textStyle: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali || (metasSet.has(ObjectiveKinds.LABEL) && showOBJStyle),

    opacity: isObjectiveTool
      ? showOBJStyle
      : isOnlyExcali || showOBJStyle || isObjAndExcali,

    layers: false, // TODO

    align:
      (metas.length === 0 || metas.length > 1) &&
      (isOnlyExcali || showOBJStyle || isObjAndExcali),

    /** duplicate group un-group hyper Link */
    actionsAll:
      isOnlyExcali ||
      isObjAndExcali ||
      (showOBJStyle && !metasSet.has(ObjectiveKinds.LABEL)),

    duplicate: isOnlyExcali || isObjAndExcali || showOBJStyle,

    flip:
      singleMeta &&
      (singleMeta.subkind === "doorOpen" ||
        singleMeta.subkind === "doorClosed" ||
        singleMeta.kind === ObjectiveKinds.LIGHT),

    scalable: isSomeObjective,
    delete: isOnlyExcali || isObjAndExcali || showOBJStyle,
    group: isOnlyExcali || isObjAndExcali || showOBJStyle,
    ungroup: isOnlyExcali || isObjAndExcali || showOBJStyle,

    hyperLink: isOnlyExcali, // only for Excalidraw els
  });

  let actionsToRender = getActionsToRender(showOBJStyle);
  const actionsToRenderTotal = objectEntries(actionsToRender).filter(([k, v]) =>
    k === "metaHeader" || !k.startsWith("meta") ? false : v,
  );
  // console.debug("Actions to Render", actionsToRenderTotal, {
  //   isObjectiveTool,
  //   tool: appState.activeTool,
  // });

  // NOTE
  // if no actions to render (except metaHeader), show Excalidraw actions
  if (!actionsToRenderTotal.length && !isObjectiveTool) {
    actionsToRender = getActionsToRender(true);
    actionsToRender.buttonToShowOrHideExcalidrawStyle = false;
  }

  return (
    <div
      className="panelColumn"
      style={{
        width:
          // everything that supports NAME editor
          singleMetaKind === ObjectiveKinds.CAMERA ||
          singleMetaKind === ObjectiveKinds.CHARACTER ||
          singleMetaKind === ObjectiveKinds.LIGHT
            ? 250
            : 187,
        maxHeight: "75vh",

        // HACK: right border
        overflowX: "clip",
        paddingRight: "5px",
        paddingLeft: "5px",
      }}
    >
      {actionsToRender.metaHeader && renderAction("actionDisplayMetaHeader")}
      {actionsToRender.metaName && renderAction("actionChangeMetaName")}

      {actionsToRender.metaToggleEditLine &&
        renderAction("actionToggleEditLine")}

      {actionsToRender.metaCameraShot &&
        renderAction("actionChangeMetaCameraShot")}
      {actionsToRender.metaCameraShot &&
        renderAction("actionChangeMetaCameraVersion")}
      {actionsToRender.metaCameraDetails &&
        renderAction("actionChangeCameraDetails")}

      {actionsToRender.metaCharacterActions &&
        renderAction("actionCharacterMovement")}

      {actionsToRender.metaActionStoryboard && renderAction("actionStoryboard")}

      {actionsToRender.metaDescription &&
        renderAction("actionChangeMetaDescription")}

      {actionsToRender.metaInitStoryboard &&
        renderAction("actionInitStoryboard")}
      {actionsToRender.buttonToShowOrHideExcalidrawStyle &&
        buttonShowOrHideExcalidrawStyle()}

      <div>
        {actionsToRender.strokeColor &&
          ((hasStrokeColor(appState.activeTool.type) &&
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

      {actionsToRender.cropImage && renderAction("cropImage")}

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
            {actionsToRender.flip && renderAction("flipHorizontal")}
            {actionsToRender.flip && renderAction("flipVertical")}
            {actionsToRender.scalable && renderAction("actionToggleScalable")}

            {actionsToRender.duplicate &&
              !device.editor.isMobile &&
              renderAction("duplicateSelection")}

            {actionsToRender.delete &&
              !device.editor.isMobile &&
              renderAction("deleteSelectedElements")}

            {actionsToRender.group && renderAction("group")}
            {actionsToRender.ungroup && renderAction("ungroup")}

            {actionsToRender.hyperLink &&
              showLinkIcon &&
              renderAction("hyperlink")}
          </div>
        </fieldset>
      )}

      {/* HACK empty space at island bottom */}
      <Flex>
        <Separator style={{ opacity: 0 }} />
      </Flex>
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
