import clsx from "clsx";
import { FC, memo, useEffect, useRef, useState } from "react";
import { SvgCache, useLibraryItemSvg } from "../hooks/useLibraryItemSvg";
import { LibraryItem } from "../types";
import { useDevice } from "./App";
import "./LibraryUnit.scss";
import { PlusIcon } from "./icons";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import { getMetaSimple } from "../../../objective-app/objective/meta/selectors";
import {
  ObjectiveElement,
  ObjectiveMeta,
} from "../../../objective-app/objective/meta/types";

//@ts-ignore
export const LibraryUnitAsImage: FC<{
  libraryImg: ObjectiveMeta["libraryImg"];
}> = ({ libraryImg }) => {
  if (!libraryImg) return;

  return (
    <Flex direction={"column"} justify={"center"}>
      <Text align={"center"} size={"1"} weight={"light"}>
        {libraryImg.title}
      </Text>
      <img
        src={libraryImg.src}
        alt=""
        width={libraryImg.w}
        height={libraryImg.h}
        draggable={false}
      />
    </Flex>
  );
};

export const LibraryUnit = memo(
  ({
    id,
    elements,
    isPending,
    onClick,
    selected,
    onToggle,
    onDrag,
    svgCache,
  }: {
    id: LibraryItem["id"] | /** for pending item */ null;
    elements?: LibraryItem["elements"];
    isPending?: boolean;
    onClick: (id: LibraryItem["id"] | null) => void;
    selected: boolean;
    onToggle: (id: string, event: React.MouseEvent) => void;
    onDrag: (id: string, event: React.DragEvent) => void;
    svgCache: SvgCache;
  }) => {
    const element = elements![0] as ObjectiveElement;
    const meta = getMetaSimple(element);
    const asImage = meta.libraryImg;
    const toolTip = (!meta.libraryImg?.title && meta.name) || "";

    const ref = useRef<HTMLDivElement | null>(null);
    const svg = useLibraryItemSvg(id, elements, svgCache);

    useEffect(() => {
      const node = ref.current;

      if (asImage) return;
      if (!node) {
        return;
      }

      if (svg) {
        node.innerHTML = svg.outerHTML;
      }

      return () => {
        node.innerHTML = "";
      };
    }, [asImage, svg]);

    const [isHovered, setIsHovered] = useState(false);
    const isMobile = useDevice().editor.isMobile;
    const adder = isPending && (
      <div className="library-unit__adder">{PlusIcon}</div>
    );

    if (asImage)
      return (
        <Tooltip content={toolTip} style={toolTip ? {} : { display: "none" }}>
          <div
            className={clsx("library-unit", {
              "library-unit__active": elements,
              "library-unit--hover": elements && isHovered,
            })}
            style={{ overflow: "hidden" }} // hide overflow img
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={!!elements}
            onClick={
              !!elements || !!isPending
                ? (event) => {
                    if (id && event.shiftKey) {
                      onToggle(id, event);
                    } else {
                      onClick(id);
                    }
                  }
                : undefined
            }
            onDragStart={(event) => {
              if (!id) {
                event.preventDefault();
                return;
              }
              setIsHovered(false);
              onDrag(id, event);
            }}
          >
            <LibraryUnitAsImage libraryImg={meta.libraryImg} />
          </div>
        </Tooltip>
      );

    return (
      <Tooltip content={toolTip} style={toolTip ? {} : { display: "none" }}>
        <div
          className={clsx("library-unit", {
            "library-unit__active": elements,
            "library-unit--hover": elements && isHovered,
            "library-unit--selected": selected,
            "library-unit--skeleton": !svg,
          })}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={clsx("library-unit__dragger", {
              "library-unit__pulse": !!isPending,
            })}
            ref={ref}
            draggable={!!elements}
            onClick={
              !!elements || !!isPending
                ? (event) => {
                    if (id && event.shiftKey) {
                      onToggle(id, event);
                    } else {
                      onClick(id);
                    }
                  }
                : undefined
            }
            onDragStart={(event) => {
              if (!id) {
                event.preventDefault();
                return;
              }
              setIsHovered(false);
              onDrag(id, event);
            }}
          />
          {adder}
        </div>
      </Tooltip>
    );
  },
);

export const EmptyLibraryUnit = () => (
  <div className="library-unit library-unit--skeleton" />
);
