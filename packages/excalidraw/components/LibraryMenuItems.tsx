import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MIME_TYPES } from "../constants";
import { serializeLibraryAsJSON } from "../data/json";
import { duplicateElements } from "../element/newElement";
import { SvgCache, useLibraryCache } from "../hooks/useLibraryItemSvg";
import { useScrollPosition } from "../hooks/useScrollPosition";
import { t } from "../i18n";
import {
  ExcalidrawProps,
  LibraryItem,
  LibraryItems,
  UIAppState,
} from "../types";
import { arrayToMap } from "../utils";
import { LibraryMenuControlButtons } from "./LibraryMenuControlButtons";
import { LibraryDropdownMenu } from "./LibraryMenuHeaderContent";
import {
  LibraryMenuSection,
  LibraryMenuSectionGrid,
} from "./LibraryMenuSection";
import Stack from "./Stack";

import "./LibraryMenuItems.scss";
import Spinner from "./Spinner";
import { ObjectiveKinds } from "../../../objective-app/objective/meta/types";
import { WALL_IMAGE } from "../../../objective-app/objective/lib/location.library";

import { useApp } from "./App";
import { LibraryUnitAsImage } from "./LibraryUnit";
import { Flex, Popover } from "@radix-ui/themes";

// using an odd number of items per batch so the rendering creates an irregular
// pattern which looks more organic
const ITEMS_RENDERED_PER_BATCH = 17;
// when render outputs cached we can render many more items per batch to
// speed it up
const CACHED_ITEMS_RENDERED_PER_BATCH = 64;

export default function LibraryMenuItems({
  isLoading,
  libraryItems,
  onAddToLibrary,
  onInsertLibraryItems,
  pendingElements,
  theme,
  id,
  libraryReturnUrl,
  onSelectItems,
  selectedItems,
}: {
  isLoading: boolean;
  libraryItems: LibraryItems;
  pendingElements: LibraryItem["elements"];
  onInsertLibraryItems: (libraryItems: LibraryItems) => void;
  onAddToLibrary: (elements: LibraryItem["elements"]) => void;
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  theme: UIAppState["theme"];
  id: string;
  selectedItems: LibraryItem["id"][];
  onSelectItems: (id: LibraryItem["id"][]) => void;
}) {
  const libraryContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useScrollPosition<HTMLDivElement>(libraryContainerRef);

  // This effect has to be called only on first render, therefore  `scrollPosition` isn't in the dependency array
  useEffect(() => {
    if (scrollPosition > 0) {
      libraryContainerRef.current?.scrollTo(0, scrollPosition);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { svgCache } = useLibraryCache();

  // VBRN objects as lib items
  const locationLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.LOCATION),
    [libraryItems],
  );
  const camerasLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.CAMERA),
    [libraryItems],
  );
  const charactersLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.CHARACTER),
    [libraryItems],
  );
  const lightLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.LIGHT),
    [libraryItems],
  );
  const propsLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.PROP),
    [libraryItems],
  );
  const setLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.SET),
    [libraryItems],
  );
  const otherLibItems = useMemo(
    () => libraryItems.filter((item) => item.kind === ObjectiveKinds.OTHER),
    [libraryItems],
  );

  // UNUSED
  const publishedItems = useMemo(
    () => libraryItems.filter((item) => item.status === "published"),
    [libraryItems],
  );

  const showBtn = !libraryItems.length && !pendingElements.length;

  const [lastSelectedItem, setLastSelectedItem] = useState<
    LibraryItem["id"] | null
  >(null);

  const onItemSelectToggle = useCallback(
    (id: LibraryItem["id"], event: React.MouseEvent) => {
      const shouldSelect = !selectedItems.includes(id);

      const orderedItems = [...publishedItems];

      if (shouldSelect) {
        if (event.shiftKey && lastSelectedItem) {
          const rangeStart = orderedItems.findIndex(
            (item) => item.id === lastSelectedItem,
          );
          const rangeEnd = orderedItems.findIndex((item) => item.id === id);

          if (rangeStart === -1 || rangeEnd === -1) {
            onSelectItems([...selectedItems, id]);
            return;
          }

          const selectedItemsMap = arrayToMap(selectedItems);
          const nextSelectedIds = orderedItems.reduce(
            (acc: LibraryItem["id"][], item, idx) => {
              if (
                (idx >= rangeStart && idx <= rangeEnd) ||
                selectedItemsMap.has(item.id)
              ) {
                acc.push(item.id);
              }
              return acc;
            },
            [],
          );

          onSelectItems(nextSelectedIds);
        } else {
          onSelectItems([...selectedItems, id]);
        }
        setLastSelectedItem(id);
      } else {
        setLastSelectedItem(null);
        onSelectItems(selectedItems.filter((_id) => _id !== id));
      }
    },
    [lastSelectedItem, onSelectItems, publishedItems, selectedItems],
  );

  const getInsertedElements = useCallback(
    (id: string) => {
      let targetElements;
      if (selectedItems.includes(id)) {
        targetElements = libraryItems.filter((item) =>
          selectedItems.includes(item.id),
        );
      } else {
        targetElements = libraryItems.filter((item) => item.id === id);
      }
      return targetElements.map((item) => {
        return {
          ...item,
          // duplicate each library item before inserting on canvas to confine
          // ids and bindings to each library item. See #6465
          elements: duplicateElements(item.elements, {
            randomizeSeed: true,
          }),
        };
      });
    },
    [libraryItems, selectedItems],
  );

  const onItemDrag = useCallback(
    (id: LibraryItem["id"], event: React.DragEvent) => {
      event.dataTransfer.setData(
        MIME_TYPES.excalidrawlib,
        serializeLibraryAsJSON(getInsertedElements(id)),
      );
    },
    [getInsertedElements],
  );

  const isItemSelected = useCallback(
    (id: LibraryItem["id"] | null) => {
      if (!id) {
        return false;
      }

      return selectedItems.includes(id);
    },
    [selectedItems],
  );

  const onItemClick = useCallback(
    (id: LibraryItem["id"] | null) => {
      if (id) {
        onInsertLibraryItems(getInsertedElements(id));
      }
    },
    [getInsertedElements, onInsertLibraryItems],
  );

  const itemsRenderedPerBatch =
    svgCache.size >= libraryItems.length
      ? CACHED_ITEMS_RENDERED_PER_BATCH
      : ITEMS_RENDERED_PER_BATCH;

  const commonProps = {
    isLoading,
    itemsRenderedPerBatch,
    onItemClick,
    onItemSelectToggle,
    onItemDrag,
    isItemSelected,
    svgCache,
  };

  return (
    <div
      className="library-menu-items-container"
      style={
        pendingElements.length || publishedItems.length
          ? { justifyContent: "flex-start" }
          : { borderBottom: 0 }
      }
    >
      <Stack.Col
        className="library-menu-items-container__items"
        align="start"
        gap={1}
        style={{
          flex: publishedItems.length > 0 ? 1 : "0 1 auto",
          marginBottom: 0,
        }}
        ref={libraryContainerRef}
      >
        <ObjectiveLibraryItems
          items={locationLibItems}
          title={t("labels.libLocation", null, "Layout")}
          {...commonProps}
          extraItem={<WallToolLibraryItem />}
        />

        <ObjectiveLibraryItems
          items={camerasLibItems}
          title={t("labels.libCameras", null, "Camera")}
          {...commonProps}
        />

        <ObjectiveLibraryItems
          items={charactersLibItems}
          title={t("labels.libCharacters", null, "Character")}
          {...commonProps}
        />

        <ObjectiveLibraryItems
          items={lightLibItems}
          title={t("labels.libLight", null, "Light")}
          splitBySubkind
          {...commonProps}
        />

        <ObjectiveLibraryItems
          items={setLibItems}
          title={t("labels.libSet", null, "Set")}
          {...commonProps}
        />

        <ObjectiveLibraryItems
          items={propsLibItems}
          title={t("labels.libProps", null, "Props")}
          {...commonProps}
        />

        <ObjectiveLibraryItems
          items={otherLibItems}
          title={"Other"}
          {...commonProps}
        />

        {showBtn && (
          <LibraryMenuControlButtons
            style={{ padding: "16px 0", width: "100%" }}
            id={id}
            libraryReturnUrl={libraryReturnUrl}
            theme={theme}
          >
            <LibraryDropdownMenu
              selectedItems={selectedItems}
              onSelectItems={onSelectItems}
            />
          </LibraryMenuControlButtons>
        )}
      </Stack.Col>
    </div>
  );
}

const ObjectiveLibraryItems: FC<{
  items: LibraryItem[];
  title: string;
  isLoading: boolean;
  itemsRenderedPerBatch: number;
  onItemClick: (id: LibraryItem["id"] | null) => void;
  onItemSelectToggle: (id: LibraryItem["id"], event: React.MouseEvent) => void;
  onItemDrag: (id: LibraryItem["id"], event: React.DragEvent) => void;
  isItemSelected: (id: LibraryItem["id"] | null) => boolean;
  svgCache: SvgCache;
  extraItem?: ReactNode;
  splitBySubkind?: boolean;
}> = (props) => {
  return (
    <div className="objective-lib">
      <div className="library-menu-items-container__header">{props.title}</div>
      {props.isLoading ? (
        <LibSpinner />
      ) : (
        <LibraryMenuSectionGrid>
          {props.extraItem}
          <LibraryMenuSection
            itemsRenderedPerBatch={props.itemsRenderedPerBatch}
            items={props.items}
            onItemSelectToggle={props.onItemSelectToggle}
            onItemDrag={props.onItemDrag}
            onClick={props.onItemClick}
            isItemSelected={props.isItemSelected}
            svgCache={props.svgCache}
            splitBySubkind={props.splitBySubkind}
          />
        </LibraryMenuSectionGrid>
      )}
    </div>
  );
};

const WallToolLibraryItem = () => {
  const app = useApp();

  const onClick = () => {
    // close sidebar if it's not docked?
    app.setActiveTool({ type: "line" });
  };
  return (
    <div className="objective-library-unit" onClick={onClick} draggable={false}>
      <LibraryUnitAsImage libraryImg={WALL_IMAGE} />
    </div>
  );
};

const LibSpinner = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "var(--container-padding-y)",
        right: "var(--container-padding-x)",
        transform: "translateY(50%)",
      }}
    >
      <Spinner />
    </div>
  );
};
