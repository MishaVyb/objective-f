import React, { useEffect } from "react";
import App from "./components/App";
import { InitializeApp } from "./components/InitializeApp";
import { isShallowEqual } from "./utils";

import "../../public/fonts/fonts.css";
import "./css/app.scss";
import "./css/styles.scss";
import polyfill from "./polyfill";

import { Provider } from "jotai";
import Footer from "./components/footer/FooterCenter";
import LiveCollaborationTrigger from "./components/live-collaboration/LiveCollaborationTrigger";
import MainMenu from "./components/main-menu/MainMenu";
import WelcomeScreen from "./components/welcome-screen/WelcomeScreen";
import { DEFAULT_UI_OPTIONS } from "./constants";
import { defaultLang } from "./i18n";
import { jotaiScope, jotaiStore } from "./jotai";
import { AppProps, ExcalidrawProps } from "./types";

import { useSelector } from "../../objective-app/objective-plus/hooks/redux";
import { selectIsMyScene } from "../../objective-app/objective-plus/store/projects/selectors";

polyfill();

export type TObjectiveProps = {
  isMyScene: boolean;
};

const ExcalidrawBase = (props: ExcalidrawProps) => {
  const {
    onChange,
    initialData,
    excalidrawAPI,
    isCollaborating = false,
    onPointerUpdate,
    renderTopRightUI,
    langCode = defaultLang.code,
    viewModeEnabled,
    zenModeEnabled,
    gridModeEnabled,
    libraryReturnUrl,
    theme,
    name,
    renderCustomStats,
    onPaste,
    detectScroll = true,
    handleKeyboardGlobally = false,
    onLibraryChange,
    autoFocus = false,
    generateIdForFile,
    onLinkOpen,
    onPointerDown,
    onPointerUp,
    onScrollChange,
    children,
    validateEmbeddable,
    renderEmbeddable,
    aiEnabled,
  } = props;

  const canvasActions = props.UIOptions?.canvasActions;

  /**
   * VBRN
   * Can not call for any hooks needed in App component as it's `class` component
   * So call for hooks here and provide its values to App component.
   */
  const isMyScene = useSelector(selectIsMyScene);
  const objectiveProps: TObjectiveProps = { isMyScene };

  // FIXME normalize/set defaults in parent component so that the memo resolver
  // compares the same values
  const UIOptions: AppProps["UIOptions"] = {
    ...props.UIOptions,
    canvasActions: {
      ...DEFAULT_UI_OPTIONS.canvasActions,
      ...canvasActions,
    },
    tools: {
      image: props.UIOptions?.tools?.image ?? true,
    },
  };

  if (canvasActions?.export) {
    UIOptions.canvasActions.export.saveFileToDisk =
      canvasActions.export?.saveFileToDisk ??
      DEFAULT_UI_OPTIONS.canvasActions.export.saveFileToDisk;
  }

  if (
    UIOptions.canvasActions.toggleTheme === null &&
    typeof theme === "undefined"
  ) {
    UIOptions.canvasActions.toggleTheme = true;
  }

  useEffect(() => {
    const importPolyfill = async () => {
      //@ts-ignore
      await import("canvas-roundrect-polyfill");
    };

    importPolyfill();

    // Block pinch-zooming on iOS outside of the content area
    const handleTouchMove = (event: TouchEvent) => {
      // @ts-ignore
      if (typeof event.scale === "number" && event.scale !== 1) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <Provider unstable_createStore={() => jotaiStore} scope={jotaiScope}>
      <InitializeApp langCode={langCode} theme={theme}>
        <App
          objectiveProps={objectiveProps}
          onChange={onChange}
          initialData={initialData}
          excalidrawAPI={excalidrawAPI}
          isCollaborating={isCollaborating}
          onPointerUpdate={onPointerUpdate}
          renderTopRightUI={renderTopRightUI}
          langCode={langCode}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
          gridModeEnabled={gridModeEnabled}
          libraryReturnUrl={libraryReturnUrl}
          theme={theme}
          name={name}
          renderCustomStats={renderCustomStats}
          UIOptions={UIOptions}
          onPaste={onPaste}
          detectScroll={detectScroll}
          handleKeyboardGlobally={handleKeyboardGlobally}
          onLibraryChange={onLibraryChange}
          autoFocus={autoFocus}
          generateIdForFile={generateIdForFile}
          onLinkOpen={onLinkOpen}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onScrollChange={onScrollChange}
          validateEmbeddable={validateEmbeddable}
          renderEmbeddable={renderEmbeddable}
          aiEnabled={aiEnabled !== false}
        >
          {children}
        </App>
      </InitializeApp>
    </Provider>
  );
};

const areEqual = (prevProps: ExcalidrawProps, nextProps: ExcalidrawProps) => {
  // short-circuit early
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  const {
    initialData: prevInitialData,
    UIOptions: prevUIOptions = {},
    ...prev
  } = prevProps;
  const {
    initialData: nextInitialData,
    UIOptions: nextUIOptions = {},
    ...next
  } = nextProps;

  // comparing UIOptions
  const prevUIOptionsKeys = Object.keys(prevUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];
  const nextUIOptionsKeys = Object.keys(nextUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];

  if (prevUIOptionsKeys.length !== nextUIOptionsKeys.length) {
    return false;
  }

  const isUIOptionsSame = prevUIOptionsKeys.every((key) => {
    if (key === "canvasActions") {
      const canvasOptionKeys = Object.keys(
        prevUIOptions.canvasActions!,
      ) as (keyof Partial<typeof DEFAULT_UI_OPTIONS.canvasActions>)[];
      return canvasOptionKeys.every((key) => {
        if (
          key === "export" &&
          prevUIOptions?.canvasActions?.export &&
          nextUIOptions?.canvasActions?.export
        ) {
          return (
            prevUIOptions.canvasActions.export.saveFileToDisk ===
            nextUIOptions.canvasActions.export.saveFileToDisk
          );
        }
        return (
          prevUIOptions?.canvasActions?.[key] ===
          nextUIOptions?.canvasActions?.[key]
        );
      });
    }
    return prevUIOptions[key] === nextUIOptions[key];
  });

  return isUIOptionsSame && isShallowEqual(prev, next);
};

export const Excalidraw = React.memo(ExcalidrawBase, areEqual);
Excalidraw.displayName = "Excalidraw";

export {
  exportToBlob,
  exportToCanvas,
  exportToClipboard,
  exportToSvg,
  getFreeDrawSvgPath,
  loadFromBlob,
  loadLibraryFromBlob,
  loadSceneOrLibraryFromBlob,
  mergeLibraryItems,
  serializeAsJSON,
  serializeLibraryAsJSON,
} from "../utils/export";
export {
  restore,
  restoreAppState,
  restoreElements,
  restoreLibraryItems,
} from "./data/restore";
export {
  getNonDeletedElements,
  getSceneVersion,
  isInvisiblySmallElement,
} from "./element";
export { isLinearElement } from "./element/typeChecks";
export { defaultLang, languages, useI18n } from "./i18n";

export { FONT_FAMILY, MIME_TYPES, ROUNDNESS, THEME } from "./constants";

export {
  bumpVersion,
  mutateElement,
  newElementWith,
} from "./element/mutateElement";

export { parseLibraryTokensFromUrl, useHandleLibrary } from "./data/library";

export {
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
} from "./utils";

export { useDevice } from "./components/App";
export { Button } from "./components/Button";
export { Sidebar } from "./components/Sidebar/Sidebar";
export { Footer, LiveCollaborationTrigger, MainMenu, WelcomeScreen };

export { DefaultSidebar } from "./components/DefaultSidebar";
export { TTDDialog } from "./components/TTDDialog/TTDDialog";
export { TTDDialogTrigger } from "./components/TTDDialog/TTDDialogTrigger";

export { zoomToFitBounds } from "./actions/actionCanvas";
export { convertToExcalidrawElements } from "./data/transform";
export { normalizeLink } from "./data/url";
export { getCommonBounds, getVisibleSceneBounds } from "./element/bounds";

export {
  elementPartiallyOverlapsWithOrContainsBBox,
  elementsOverlappingBBox,
  isElementInsideBBox,
} from "../utils/export";
