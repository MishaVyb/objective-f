import React, {
  FC,
  memo,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { EmptyLibraryUnit, LibraryUnit } from "./LibraryUnit";
import { LibraryItem } from "../types";
import { ExcalidrawElement, NonDeleted } from "../element/types";
import { SvgCache } from "../hooks/useLibraryItemSvg";
import { useTransition } from "../hooks/useTransition";
import { groupByV2 } from "../../../objective-app/objective/utils/helpers";
import { getObjectiveSingleMeta } from "../../../objective-app/objective/meta/selectors";
import { Flex, Separator } from "@radix-ui/themes";
import * as HoverCard from "@radix-ui/react-hover-card";

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
  }: Props): ReactElement<any, any> => {
    const [, startTransition] = useTransition();
    const [index, setIndex] = useState(0);

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

      //@ts-ignore
      return groupList.map(([subkind, objectiveItems], i) => {
        if (!objectiveItems.length) return null;
        const item = objectiveItems.at(-1); // TODO configurable?
        if (!item) return null;

        const meta = getObjectiveSingleMeta(item.elements);

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
              key={subkind + item.id}
              title={meta?.library?.mainTitle}
            />
          );

        return (
          <HoverCard.Root key={item?.id ?? i} openDelay={500}>
            <HoverCard.Trigger asChild>
              <div>
                <LibraryUnit
                  elements={item?.elements}
                  isPending={!item?.id && !!item?.elements}
                  svgCache={svgCache}
                  id={item?.id}
                  selected={isItemSelected(item.id)}
                  onToggle={onItemSelectToggle}
                  onDrag={onItemDrag}
                  title={meta?.library?.mainTitle}
                />
              </div>
            </HoverCard.Trigger>
            {/* <HoverCard.Portal> ??? */}
            <HoverCard.Content className="HoverCardContent">
              <Flex gap={"1"} p={"1"} m="1" align={"baseline"}>
                <LibraryUnit
                  elements={item?.elements}
                  isPending={!item?.id && !!item?.elements}
                  onClick={onClick}
                  svgCache={svgCache}
                  id={item?.id}
                  selected={isItemSelected(item.id)}
                  onToggle={onItemSelectToggle}
                  onDrag={onItemDrag}
                  title={meta?.library?.mainTitle}
                />
                <Separator orientation={"vertical"} size={"2"} />
                {objectiveItems.map((item, i) => {
                  const meta = getObjectiveSingleMeta(item.elements);
                  return (
                    <div
                      style={{ width: 50, height: 50 }}
                      key={subkind + item.id}
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
                        title={meta?.library?.subTitle}
                      />
                    </div>
                  );
                })}
              </Flex>

              <HoverCard.Arrow
                height={10}
                width={15}
                className="HoverCardArrow"
              />
            </HoverCard.Content>
            {/* </HoverCard.Portal> */}
          </HoverCard.Root>
        );
      });
    }

    //@ts-ignore
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
