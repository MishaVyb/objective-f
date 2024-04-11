import React, { memo, ReactNode, useEffect, useState } from "react";
import { EmptyLibraryUnit, LibraryUnit } from "./LibraryUnit";
import { LibraryItem } from "../types";
import { ExcalidrawElement, NonDeleted } from "../element/types";
import { SvgCache } from "../hooks/useLibraryItemSvg";
import { useTransition } from "../hooks/useTransition";
import {
  groupBy,
  groupByV2,
} from "../../../objective-app/objective/utils/helpers";
import { getObjectiveSingleMeta } from "../../../objective-app/objective/meta/selectors";
import { Button, Flex, Separator } from "@radix-ui/themes";
import * as Popover from "@radix-ui/react-popover";
import { Cross2Icon } from "@radix-ui/react-icons";

type LibraryOrPendingItem = (
  | LibraryItem
  | /* pending library item */ {
      id: null;
      elements: readonly NonDeleted<ExcalidrawElement>[];
    }
)[];

interface Props {
  items: LibraryOrPendingItem;
  onClick: (id: LibraryItem["id"] | null) => void;
  onItemSelectToggle: (id: LibraryItem["id"], event: React.MouseEvent) => void;
  onItemDrag: (id: LibraryItem["id"], event: React.DragEvent) => void;
  isItemSelected: (id: LibraryItem["id"] | null) => boolean;
  svgCache: SvgCache;
  itemsRenderedPerBatch: number;
  splitBySubkind?: boolean;
}

export const LibraryMenuSectionGrid = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <div className="library-menu-items-container__grid">{children}</div>;
};

export const LibraryMenuSection = memo(
  ({
    items,
    onItemSelectToggle,
    onItemDrag,
    isItemSelected,
    onClick,
    svgCache,
    itemsRenderedPerBatch,
    splitBySubkind,
  }: Props) => {
    const [, startTransition] = useTransition();
    const [index, setIndex] = useState(0);
    // const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
      if (index < items.length) {
        startTransition(() => {
          setIndex(index + itemsRenderedPerBatch);
        });
      }
    }, [index, items.length, startTransition, itemsRenderedPerBatch]);

    if (splitBySubkind) {
      const grouped = groupByV2(items, (item) => {
        const itemMeta = getObjectiveSingleMeta(item.elements);
        return itemMeta?.subkind || "";
      });
      const groupList = [...grouped.entries()];

      return groupList.map(([subkind, objectiveItems], i) => {
        if (!objectiveItems.length) return null;
        const item = objectiveItems[0];

        if (objectiveItems.length === 1)
          return (
            <LibraryUnit
              elements={item?.elements}
              isPending={!item?.id && !!item?.elements}
              onClick={onClick}
              svgCache={svgCache}
              id={item?.id}
              selected={isItemSelected(item.id)}
              onToggle={onItemSelectToggle}
              onDrag={onItemDrag}
              key={subkind + item?.id ?? i}
            />
          );

        return (
          <Popover.Root
            key={subkind + item?.id ?? i}

            // open={popoverOpen}
            // onOpenChange={setPopoverOpen}
          >
            <Popover.Trigger asChild>
              <div>
                <LibraryUnit
                  elements={item?.elements}
                  isPending={!item?.id && !!item?.elements}
                  onClick={() => {}}
                  svgCache={svgCache}
                  id={item?.id}
                  selected={isItemSelected(item.id)}
                  onToggle={onItemSelectToggle}
                  onDrag={onItemDrag}
                  key={item?.id ?? i}
                />
              </div>
            </Popover.Trigger>

            <Popover.Content className="PopoverContent">
              <Flex gap={"1"} p={"1"} ml="1" mr="5" mb="1" align={"center"}>
                <LibraryUnit
                  elements={item?.elements}
                  isPending={!item?.id && !!item?.elements}
                  onClick={onClick}
                  svgCache={svgCache}
                  id={item?.id}
                  selected={isItemSelected(item.id)}
                  onToggle={onItemSelectToggle}
                  onDrag={onItemDrag}
                  key={item?.id ?? i}
                />
                <Separator orientation={"vertical"} size={"2"} />
                {objectiveItems.map((item, i) => (
                  <div
                    style={{ width: 50, height: 50 }}
                    key={subkind + item?.id ?? i}
                  >
                    <LibraryUnit
                      elements={item?.elements}
                      isPending={!item?.id && !!item?.elements}
                      onClick={onClick}
                      svgCache={svgCache}
                      id={item?.id}
                      selected={isItemSelected(item.id)}
                      onToggle={onItemSelectToggle}
                      onDrag={onItemDrag}
                    />
                  </div>
                ))}
              </Flex>
              <Popover.Close className="PopoverClose" aria-label="Close">
                <Cross2Icon />
              </Popover.Close>
            </Popover.Content>
          </Popover.Root>
        );
      });
    }

    return items.map((item, i) => {
      return i < index ? (
        <LibraryUnit
          elements={item?.elements}
          isPending={!item?.id && !!item?.elements}
          onClick={onClick}
          svgCache={svgCache}
          id={item?.id}
          selected={isItemSelected(item.id)}
          onToggle={onItemSelectToggle}
          onDrag={onItemDrag}
          key={item?.id ?? i}
        />
      ) : (
        <EmptyLibraryUnit key={i} />
      );
    });
  },
);
