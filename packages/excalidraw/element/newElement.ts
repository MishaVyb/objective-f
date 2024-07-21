import { getElementAbsoluteCoords } from ".";
import { __DEBUG_DISABLE_APPLY_DEFAULTS } from "../../../objective-app/objective-plus/constants";
import { duplicateObjectiveEventHandler } from "../../../objective-app/objective/elements/_duplicateElements";
import { buildWeekMeta } from "../../../objective-app/objective/meta/_initial";
import {
  ObjectiveKinds,
  isWall,
} from "../../../objective-app/objective/meta/_types";
import { COLOR_PALETTE } from "../colors";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  ROUGHNESS,
  VERTICAL_ALIGN,
} from "../constants";
import { getNewGroupIdsForDuplication } from "../groups";
import { adjustXYWithRotation } from "../math";
import { randomId, randomInteger } from "../random";
import { AppState } from "../types";
import { MarkOptional, Merge, Mutable } from "../utility-types";
import {
  arrayToMap,
  getFontString,
  getUpdatedTimestamp,
  isTestEnv,
} from "../utils";
import { getResizedElementAbsoluteCoords } from "./bounds";
import { bumpVersion, newElementWith } from "./mutateElement";
import {
  getBoundTextMaxWidth,
  getDefaultLineHeight,
  measureText,
  normalizeText,
  wrapText,
} from "./textElement";
import {
  Arrowhead,
  ExcalidrawElement,
  ExcalidrawEmbeddableElement,
  ExcalidrawFrameElement,
  ExcalidrawFreeDrawElement,
  ExcalidrawGenericElement,
  ExcalidrawIframeElement,
  ExcalidrawImageElement,
  ExcalidrawLinearElement,
  ExcalidrawMagicFrameElement,
  ExcalidrawTextContainer,
  ExcalidrawTextElement,
  FontFamilyValues,
  GroupId,
  NonDeleted,
  TextAlign,
  VerticalAlign,
} from "./types";

export type ElementConstructorOpts = MarkOptional<
  Omit<ExcalidrawGenericElement, "id" | "type" | "isDeleted" | "updated">,
  | "width"
  | "height"
  | "angle"
  | "groupIds"
  | "frameId"
  | "boundElements"
  | "seed"
  | "version"
  | "versionNonce"
  | "link"
  | "strokeStyle"
  | "fillStyle"
  | "strokeColor"
  | "backgroundColor"
  | "roughness"
  | "strokeWidth"
  | "roundness"
  | "locked"
  | "opacity"
>;

const _newElementBase = <T extends ExcalidrawElement>(
  type: T["type"],
  {
    x,
    y,
    strokeColor = DEFAULT_ELEMENT_PROPS.strokeColor,
    backgroundColor = DEFAULT_ELEMENT_PROPS.backgroundColor,
    fillStyle = DEFAULT_ELEMENT_PROPS.fillStyle,
    strokeWidth = DEFAULT_ELEMENT_PROPS.strokeWidth,
    strokeStyle = DEFAULT_ELEMENT_PROPS.strokeStyle,
    roughness = DEFAULT_ELEMENT_PROPS.roughness,
    opacity = DEFAULT_ELEMENT_PROPS.opacity,
    width = 0,
    height = 0,
    angle = 0,
    groupIds = [],
    frameId = null,
    roundness = null,
    boundElements = null,
    link = null,
    locked = DEFAULT_ELEMENT_PROPS.locked,
    ...rest
  }: ElementConstructorOpts & Omit<Partial<ExcalidrawGenericElement>, "type">,
) => {
  // assign type to guard against excess properties
  const element: Merge<ExcalidrawGenericElement, { type: T["type"] }> = {
    id: rest.id || randomId(),
    type,
    x,
    y,
    width,
    height,
    angle,
    strokeColor,
    backgroundColor,
    fillStyle,
    strokeWidth,
    strokeStyle,
    roughness,
    opacity,
    groupIds,
    frameId,
    roundness,
    seed: rest.seed ?? randomInteger(),
    version: rest.version || 1,
    versionNonce: rest.versionNonce ?? 0,
    isDeleted: false as false,
    boundElements,
    updated: getUpdatedTimestamp(),
    link,
    locked,
    customData: rest.customData, // VBRN
  };
  return element;
};

export const newElement = (
  opts: {
    type: ExcalidrawGenericElement["type"];
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawGenericElement> =>
  _newElementBase<ExcalidrawGenericElement>(opts.type, opts);

export const newEmbeddableElement = (
  opts: {
    type: "embeddable";
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawEmbeddableElement> => {
  return _newElementBase<ExcalidrawEmbeddableElement>("embeddable", opts);
};

export const newIframeElement = (
  opts: {
    type: "iframe";
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawIframeElement> => {
  return {
    ..._newElementBase<ExcalidrawIframeElement>("iframe", opts),
  };
};

export const newFrameElement = (
  opts: {
    name?: string;
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawFrameElement> => {
  const frameElement = newElementWith(
    {
      ..._newElementBase<ExcalidrawFrameElement>("frame", opts),
      type: "frame",
      name: opts?.name || null,
    },
    {},
  );

  return frameElement;
};

export const newMagicFrameElement = (
  opts: {
    name?: string;
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawMagicFrameElement> => {
  const frameElement = newElementWith(
    {
      ..._newElementBase<ExcalidrawMagicFrameElement>("magicframe", opts),
      type: "magicframe",
      name: opts?.name || null,
    },
    {},
  );

  return frameElement;
};

/** computes element x/y offset based on textAlign/verticalAlign */
const getTextElementPositionOffsets = (
  opts: {
    textAlign: ExcalidrawTextElement["textAlign"];
    verticalAlign: ExcalidrawTextElement["verticalAlign"];
  },
  metrics: {
    width: number;
    height: number;
  },
) => {
  return {
    x:
      opts.textAlign === "center"
        ? metrics.width / 2
        : opts.textAlign === "right"
        ? metrics.width
        : 0,
    y: opts.verticalAlign === "middle" ? metrics.height / 2 : 0,
  };
};

export const newTextElement = (
  opts: {
    text: string;
    fontSize?: number;
    fontFamily?: FontFamilyValues;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    containerId?: ExcalidrawTextContainer["id"] | null;
    lineHeight?: ExcalidrawTextElement["lineHeight"];
    strokeWidth?: ExcalidrawTextElement["strokeWidth"];
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawTextElement> => {
  const fontFamily = opts.fontFamily || DEFAULT_FONT_FAMILY;
  const fontSize = opts.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = opts.lineHeight || getDefaultLineHeight(fontFamily);
  const text = normalizeText(opts.text);
  const metrics = measureText(
    text,
    getFontString({ fontFamily, fontSize }),
    lineHeight,
  );
  metrics.width = opts.width || metrics.width;
  metrics.height = opts.height || metrics.height;

  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextElementPositionOffsets(
    { textAlign, verticalAlign },
    metrics,
  );

  const textElement = newElementWith(
    {
      ..._newElementBase<ExcalidrawTextElement>("text", opts),
      text,
      fontSize,
      fontFamily,
      textAlign,
      verticalAlign,
      x: opts.x - offsets.x,
      y: opts.y - offsets.y,
      width: metrics.width,
      height: metrics.height,
      baseline: metrics.baseline,
      containerId: opts.containerId || null,
      originalText: text,
      lineHeight,
    },
    {},
  );
  return textElement;
};

const getAdjustedDimensions = (
  element: ExcalidrawTextElement,
  nextText: string,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
} => {
  const {
    width: nextWidth,
    height: nextHeight,
    baseline: nextBaseline,
  } = measureText(nextText, getFontString(element), element.lineHeight);
  const { textAlign, verticalAlign } = element;
  let x: number;
  let y: number;
  if (
    textAlign === "center" &&
    verticalAlign === VERTICAL_ALIGN.MIDDLE &&
    !element.containerId
  ) {
    const prevMetrics = measureText(
      element.text,
      getFontString(element),
      element.lineHeight,
    );
    const offsets = getTextElementPositionOffsets(element, {
      width: nextWidth - prevMetrics.width,
      height: nextHeight - prevMetrics.height,
    });

    x = element.x - offsets.x;
    y = element.y - offsets.y;
  } else {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element);

    const [nextX1, nextY1, nextX2, nextY2] = getResizedElementAbsoluteCoords(
      element,
      nextWidth,
      nextHeight,
      false,
    );
    const deltaX1 = (x1 - nextX1) / 2;
    const deltaY1 = (y1 - nextY1) / 2;
    const deltaX2 = (x2 - nextX2) / 2;
    const deltaY2 = (y2 - nextY2) / 2;

    [x, y] = adjustXYWithRotation(
      {
        s: true,
        e: textAlign === "center" || textAlign === "left",
        w: textAlign === "center" || textAlign === "right",
      },
      element.x,
      element.y,
      element.angle,
      deltaX1,
      deltaY1,
      deltaX2,
      deltaY2,
    );
  }

  return {
    width: nextWidth,
    height: nextHeight,
    baseline: nextBaseline,
    x: Number.isFinite(x) ? x : element.x,
    y: Number.isFinite(y) ? y : element.y,
  };
};

export const refreshTextDimensions = (
  textElement: ExcalidrawTextElement,
  container: ExcalidrawTextContainer | null,
  text = textElement.text,
) => {
  if (textElement.isDeleted) {
    return;
  }
  if (container) {
    text = wrapText(
      text,
      getFontString(textElement),
      getBoundTextMaxWidth(container, textElement),
    );
  }
  const dimensions = getAdjustedDimensions(textElement, text);
  return { text, ...dimensions };
};

export const updateTextElement = (
  textElement: ExcalidrawTextElement,
  container: ExcalidrawTextContainer | null,
  {
    text,
    isDeleted,
    originalText,
  }: {
    text: string;
    isDeleted?: boolean;
    originalText: string;
  },
): ExcalidrawTextElement => {
  return newElementWith(textElement, {
    originalText,
    isDeleted: isDeleted ?? textElement.isDeleted,
    ...refreshTextDimensions(textElement, container, originalText),
  });
};

export const newFreeDrawElement = (
  opts: {
    type: "freedraw";
    points?: ExcalidrawFreeDrawElement["points"];
    simulatePressure: boolean;
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawFreeDrawElement> => {
  return {
    ..._newElementBase<ExcalidrawFreeDrawElement>(opts.type, opts),
    points: opts.points || [],
    pressures: [],
    simulatePressure: opts.simulatePressure,
    lastCommittedPoint: null,
  };
};

export const newLinearElement = (
  opts: {
    type: ExcalidrawLinearElement["type"];
    startArrowhead?: Arrowhead | null;
    endArrowhead?: Arrowhead | null;
    points?: ExcalidrawLinearElement["points"];
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawLinearElement> => {
  //
  // VBRN apply new element defaults TODO two deferent tool: line and wall
  const elementInitialOverrides =
    isWall(opts) && !__DEBUG_DISABLE_APPLY_DEFAULTS
      ? {
          strokeColor: COLOR_PALETTE.black,
          backgroundColor: COLOR_PALETTE.transparent,
          fillStyle: "solid" as const,
          strokeWidth: 2,
          strokeStyle: "solid" as const,
          roundness: null,
          roughness: ROUGHNESS.architect,
          opacity: 100,
        }
      : {};

  return {
    ..._newElementBase<ExcalidrawLinearElement>(opts.type, opts),
    points: opts.points || [],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: opts.startArrowhead || null,
    endArrowhead: opts.endArrowhead || null,

    // VBRN
    customData: isWall(opts)
      ? buildWeekMeta(ObjectiveKinds.WALL)
      : opts.customData,

    ...elementInitialOverrides,
  };
};

export const newImageElement = (
  opts: {
    type: ExcalidrawImageElement["type"];
    status?: ExcalidrawImageElement["status"];
    fileId?: ExcalidrawImageElement["fileId"];
    scale?: ExcalidrawImageElement["scale"];
  } & ElementConstructorOpts,
): NonDeleted<ExcalidrawImageElement> => {
  return {
    ..._newElementBase<ExcalidrawImageElement>("image", opts),
    // in the future we'll support changing stroke color for some SVG elements,
    // and `transparent` will likely mean "use original colors of the image"
    strokeColor: "transparent",
    status: opts.status ?? "pending",
    fileId: opts.fileId ?? null,
    scale: opts.scale ?? [1, 1],
    widthAtCreation: 0,
    heightAtCreation: 0,
    underlyingImageWidth: 0,
    underlyingImageHeight: 0,
    xToPullFromImage: 0,
    yToPullFromImage: 0,
    wToPullFromImage: 0,
    hToPullFromImage: 0,
    westCropAmount: 0,
    eastCropAmount: 0,
    northCropAmount: 0,
    southCropAmount: 0,
    rescaleX: 1,
    rescaleY: 1,
  };
};

// Simplified deep clone for the purpose of cloning ExcalidrawElement.
//
// Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
// Typed arrays and other non-null objects.
//
// Adapted from https://github.com/lukeed/klona
//
// The reason for `deepCopyElement()` wrapper is type safety (only allow
// passing ExcalidrawElement as the top-level argument).
const _deepCopyElement = (val: any, depth: number = 0) => {
  // only clone non-primitives
  if (val == null || typeof val !== "object") {
    return val;
  }

  const objectType = Object.prototype.toString.call(val);

  if (objectType === "[object Object]") {
    const tmp =
      typeof val.constructor === "function"
        ? Object.create(Object.getPrototypeOf(val))
        : {};
    for (const key in val) {
      if (val.hasOwnProperty(key)) {
        // don't copy non-serializable objects like these caches. They'll be
        // populated when the element is rendered.
        if (depth === 0 && (key === "shape" || key === "canvas")) {
          continue;
        }
        tmp[key] = _deepCopyElement(val[key], depth + 1);
      }
    }
    return tmp;
  }

  if (Array.isArray(val)) {
    let k = val.length;
    const arr = new Array(k);
    while (k--) {
      arr[k] = _deepCopyElement(val[k], depth + 1);
    }
    return arr;
  }

  // we're not cloning non-array & non-plain-object objects because we
  // don't support them on excalidraw elements yet. If we do, we need to make
  // sure we start cloning them, so let's warn about it.
  if (import.meta.env.DEV) {
    if (
      objectType !== "[object Object]" &&
      objectType !== "[object Array]" &&
      objectType.startsWith("[object ")
    ) {
      console.warn(
        `_deepCloneElement: unexpected object type ${objectType}. This value will not be cloned!`,
      );
    }
  }

  return val;
};

/**
 * Clones ExcalidrawElement data structure. Does not regenerate id, nonce, or
 * any value. The purpose is to to break object references for immutability
 * reasons, whenever we want to keep the original element, but ensure it's not
 * mutated.
 *
 * Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
 * Typed arrays and other non-null objects.
 */
export const deepCopyElement = <T extends ExcalidrawElement>(
  val: T,
): Mutable<T> => {
  return _deepCopyElement(val);
};

/**
 * utility wrapper to generate new id. In test env it reuses the old + postfix
 * for test assertions.
 */
export const regenerateId = (
  /** supply null if no previous id exists */
  previousId: string | null,
) => {
  if (isTestEnv() && previousId) {
    let nextId = `${previousId}_copy`;
    // `window.h` may not be defined in some unit tests
    if (
      window.h?.app
        ?.getSceneElementsIncludingDeleted()
        .find((el) => el.id === nextId)
    ) {
      nextId += "_copy";
    }
    return nextId;
  }
  return randomId();
};

/**
 * Duplicate an element, often used in the alt-drag operation.
 * Note that this method has gotten a bit complicated since the
 * introduction of gruoping/ungrouping elements.
 * @param editingGroupId The current group being edited. The new
 *                       element will inherit this group and its
 *                       parents.
 * @param groupIdMapForOperation A Map that maps old group IDs to
 *                               duplicated ones. If you are duplicating
 *                               multiple elements at once, share this map
 *                               amongst all of them
 * @param element Element to duplicate
 * @param overrides Any element properties to override
 */
export const duplicateElement = <TElement extends ExcalidrawElement>(
  editingGroupId: AppState["editingGroupId"],
  groupIdMapForOperation: Map<GroupId, GroupId>,
  element: TElement,
  overrides?: Partial<TElement>,
): Readonly<TElement> => {
  let copy = deepCopyElement(element);

  copy.id = regenerateId(copy.id);
  copy.boundElements = null;
  copy.updated = getUpdatedTimestamp();
  copy.seed = randomInteger();
  copy.groupIds = getNewGroupIdsForDuplication(
    copy.groupIds,
    editingGroupId,
    (groupId) => {
      if (!groupIdMapForOperation.has(groupId)) {
        groupIdMapForOperation.set(groupId, regenerateId(groupId));
      }
      return groupIdMapForOperation.get(groupId)!;
    },
  );
  if (overrides) {
    copy = Object.assign(copy, overrides);
  }

  // NOTE: do not duplicateMeta here, it is happining at `duplicateObjectiveEventHandler`
  // duplicateMeta(copy);
  return copy;
};

/**
 * Clones elements, regenerating their ids (including bindings) and group ids.
 *
 * If bindings don't exist in the elements array, they are removed. Therefore,
 * it's advised to supply the whole elements array, or sets of elements that
 * are encapsulated (such as library items), if the purpose is to retain
 * bindings to the cloned elements intact.
 *
 * NOTE by default does not randomize or regenerate anything except the id.
 */
export const duplicateElements = (
  elements: readonly ExcalidrawElement[],
  opts?: {
    /** NOTE also updates version flags and `updated` */
    randomizeSeed: boolean;
  },
) => {
  const clonedElements: ExcalidrawElement[] = [];

  const origElementsMap = arrayToMap(elements);

  // used for for migrating old ids to new ids
  const elementNewIdsMap = new Map<
    /* orig */ ExcalidrawElement["id"],
    /* new */ ExcalidrawElement["id"]
  >();

  const maybeGetNewId = (id: ExcalidrawElement["id"]) => {
    // if we've already migrated the element id, return the new one directly
    if (elementNewIdsMap.has(id)) {
      return elementNewIdsMap.get(id)!;
    }
    // if we haven't migrated the element id, but an old element with the same
    // id exists, generate a new id for it and return it
    if (origElementsMap.has(id)) {
      const newId = regenerateId(id);
      elementNewIdsMap.set(id, newId);
      return newId;
    }
    // if old element doesn't exist, return null to mark it for removal
    return null;
  };

  const groupNewIdsMap = new Map</* orig */ GroupId, /* new */ GroupId>();

  for (const element of elements) {
    const clonedElement: Mutable<ExcalidrawElement> = _deepCopyElement(element);

    clonedElement.id = maybeGetNewId(element.id)!;

    if (opts?.randomizeSeed) {
      clonedElement.seed = randomInteger();
      bumpVersion(clonedElement);
    }

    if (clonedElement.groupIds) {
      clonedElement.groupIds = clonedElement.groupIds.map((groupId) => {
        if (!groupNewIdsMap.has(groupId)) {
          groupNewIdsMap.set(groupId, regenerateId(groupId));
        }
        return groupNewIdsMap.get(groupId)!;
      });
    }

    if ("containerId" in clonedElement && clonedElement.containerId) {
      const newContainerId = maybeGetNewId(clonedElement.containerId);
      clonedElement.containerId = newContainerId;
    }

    if ("boundElements" in clonedElement && clonedElement.boundElements) {
      clonedElement.boundElements = clonedElement.boundElements.reduce(
        (
          acc: Mutable<NonNullable<ExcalidrawElement["boundElements"]>>,
          binding,
        ) => {
          const newBindingId = maybeGetNewId(binding.id);
          if (newBindingId) {
            acc.push({ ...binding, id: newBindingId });
          }
          return acc;
        },
        [],
      );
    }

    if ("endBinding" in clonedElement && clonedElement.endBinding) {
      const newEndBindingId = maybeGetNewId(clonedElement.endBinding.elementId);
      clonedElement.endBinding = newEndBindingId
        ? {
            ...clonedElement.endBinding,
            elementId: newEndBindingId,
          }
        : null;
    }
    if ("startBinding" in clonedElement && clonedElement.startBinding) {
      const newEndBindingId = maybeGetNewId(
        clonedElement.startBinding.elementId,
      );
      clonedElement.startBinding = newEndBindingId
        ? {
            ...clonedElement.startBinding,
            elementId: newEndBindingId,
          }
        : null;
    }

    if (clonedElement.frameId) {
      clonedElement.frameId = maybeGetNewId(clonedElement.frameId);
    }

    clonedElements.push(clonedElement);
  }

  // VBRN
  // NOTE: do not duplicateMeta here, it is happining at `duplicateObjectiveEventHandler` below
  const extraNewEls = duplicateObjectiveEventHandler(
    elements,
    clonedElements,
    {},
  );
  clonedElements.push(...extraNewEls);
  return clonedElements;
};
