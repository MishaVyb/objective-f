import { Point } from "points-on-curve";
import { centerPoint, rotate, rotatePoint } from "../math";
import { updateBoundElements } from "./binding";
import { mutateElement } from "./mutateElement";
import { TransformHandleType } from "./transformHandles";
import { ExcalidrawElement, ExcalidrawImageElement, NonDeleted } from "./types";
import { getResizedElementAbsoluteCoords } from "./bounds";
import {
  ensureVector,
  getElementCenter,
  Vector,
} from "../../../objective-app/objective/elements/_math";
import { deepCopyElement } from "./newElement";

// i split out these 'internal' functions so that this functionality can be easily unit tested
export function cropElementInternal(
  element: ExcalidrawImageElement,
  transformHandle: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
  pointerX: number,
  pointerY: number,
) {
  const maxWidth = element.widthAtCreation * element.rescaleX;
  const maxHeight = element.heightAtCreation * element.rescaleY;
  const eastCropAmount = element.eastCropAmount * element.rescaleX;
  const westCropAmount = element.westCropAmount * element.rescaleX;
  const northCropAmount = element.northCropAmount * element.rescaleY;
  const southCropAmount = element.southCropAmount * element.rescaleY;

  const availableSpaceToCropNorth =
    maxHeight - southCropAmount - stateAtCropStart.height;
  const availableSpaceToCropWest =
    maxWidth - eastCropAmount - stateAtCropStart.width;

  const rotatedPointer = rotatePoint(
    [pointerX, pointerY],
    [
      stateAtCropStart.x + stateAtCropStart.width / 2,
      stateAtCropStart.y + stateAtCropStart.height / 2,
    ],
    -stateAtCropStart.angle,
  );

  pointerX = rotatedPointer[0];
  pointerY = rotatedPointer[1];

  let mutatedWidth = element.width;
  let mutatedHeight = element.height;
  let xToPullFromImage = element.xToPullFromImage;
  let yToPullFromImage = element.yToPullFromImage;
  let wToPullFromImage = element.wToPullFromImage;
  let hToPullFromImage = element.hToPullFromImage;

  if (transformHandle.includes("n")) {
    const northBound = stateAtCropStart.y - availableSpaceToCropNorth;
    const southBound = stateAtCropStart.y + stateAtCropStart.height;

    pointerY = clamp(pointerY, northBound, southBound);

    const verticalMouseMovement = pointerY - stateAtCropStart.y;
    mutatedHeight = stateAtCropStart.height - verticalMouseMovement;
    const portionOfTopSideCropped =
      (verticalMouseMovement + northCropAmount) / maxHeight;

    yToPullFromImage = portionOfTopSideCropped * element.underlyingImageHeight;
    hToPullFromImage =
      (mutatedHeight / maxHeight) * element.underlyingImageHeight;
  }

  if (transformHandle.includes("s")) {
    const northBound = stateAtCropStart.y;
    const southBound = stateAtCropStart.y + (maxHeight - northCropAmount);

    pointerY = clamp(pointerY, northBound, southBound);

    mutatedHeight = pointerY - stateAtCropStart.y;
    hToPullFromImage =
      (mutatedHeight / maxHeight) * element.underlyingImageHeight;
  }

  if (transformHandle.includes("w")) {
    const eastBound = stateAtCropStart.x + stateAtCropStart.width;
    const westBound = stateAtCropStart.x - availableSpaceToCropWest;

    pointerX = clamp(pointerX, westBound, eastBound);

    const horizontalMouseMovement = pointerX - stateAtCropStart.x;
    mutatedWidth = stateAtCropStart.width - horizontalMouseMovement;
    const portionOfLeftSideCropped =
      (horizontalMouseMovement + westCropAmount) / maxWidth;
    xToPullFromImage = portionOfLeftSideCropped * element.underlyingImageWidth;
    wToPullFromImage = (mutatedWidth / maxWidth) * element.underlyingImageWidth;
  }

  if (transformHandle.includes("e")) {
    const eastBound = stateAtCropStart.x + (maxWidth - westCropAmount);
    const westBound = stateAtCropStart.x;

    pointerX = clamp(pointerX, westBound, eastBound);

    mutatedWidth = pointerX - stateAtCropStart.x;
    wToPullFromImage = (mutatedWidth / maxWidth) * element.underlyingImageWidth;
  }

  const newOrigin = recomputeOrigin(
    stateAtCropStart,
    transformHandle,
    mutatedWidth,
    mutatedHeight,
  );

  return {
    x: newOrigin[0],
    y: newOrigin[1],
    width: mutatedWidth,
    height: mutatedHeight,
    xToPullFromImage,
    yToPullFromImage,
    wToPullFromImage,
    hToPullFromImage,
  };
}

export function cropElement(
  element: ExcalidrawImageElement,
  transformHandle: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
  pointerX: number,
  pointerY: number,
) {
  // VBRN
  const elementStateToRevert = deepCopyElement(element);
  let elementVersion;
  let doesCropApplied;
  elementVersion = element.version;

  // FIXME tranform by corner handle does not work good enough...
  if (element.holdAspectRatio && transformHandle.length === 2)
    throw new Error("Not Implemented");

  const mutation = cropElementInternal(
    element,
    transformHandle,
    stateAtCropStart,
    pointerX,
    pointerY,
  );

  mutateElement(element, mutation);

  if (element.holdAspectRatio) {
    // VBRN
    // if we do not reach the border by user's crop above (if crop has been applied),
    // crop another border in order to hold aspect ration
    doesCropApplied = elementVersion !== element.version;
    if (doesCropApplied) {
      elementVersion = element.version;
      cropElementInternalHoldAspectRatio(
        element,
        transformHandle,
        stateAtCropStart,
        pointerX,
        pointerY,
      );

      // revert user crop changes in case we reach the border by mutation above
      // (if aspect ration shift crop has not been applied)
      doesCropApplied = elementVersion !== element.version;
      if (!doesCropApplied) mutateElement(element, elementStateToRevert);
    }
  }

  updateBoundElements(element, {
    newSize: { width: element.width, height: element.height },
  });
}

function recomputeOrigin(
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
  transformHandle: TransformHandleType,
  width: number,
  height: number,
) {
  const [x1, y1, x2, y2] = getResizedElementAbsoluteCoords(
    stateAtCropStart,
    stateAtCropStart.width,
    stateAtCropStart.height,
    true,
  );
  const startTopLeft: Point = [x1, y1];
  const startBottomRight: Point = [x2, y2];
  const startCenter: any = centerPoint(startTopLeft, startBottomRight);

  const [newBoundsX1, newBoundsY1, newBoundsX2, newBoundsY2] =
    getResizedElementAbsoluteCoords(stateAtCropStart, width, height, true);
  const newBoundsWidth = newBoundsX2 - newBoundsX1;
  const newBoundsHeight = newBoundsY2 - newBoundsY1;

  // Calculate new topLeft based on fixed corner during resize
  let newTopLeft = [...startTopLeft] as [number, number];

  if (["n", "w", "nw"].includes(transformHandle)) {
    newTopLeft = [
      startBottomRight[0] - Math.abs(newBoundsWidth),
      startBottomRight[1] - Math.abs(newBoundsHeight),
    ];
  }
  if (transformHandle === "ne") {
    const bottomLeft = [startTopLeft[0], startBottomRight[1]];
    newTopLeft = [bottomLeft[0], bottomLeft[1] - Math.abs(newBoundsHeight)];
  }
  if (transformHandle === "sw") {
    const topRight = [startBottomRight[0], startTopLeft[1]];
    newTopLeft = [topRight[0] - Math.abs(newBoundsWidth), topRight[1]];
  }

  // adjust topLeft to new rotation point
  const angle = stateAtCropStart.angle;
  const rotatedTopLeft = rotatePoint(newTopLeft, startCenter, angle);
  const newCenter: Point = [
    newTopLeft[0] + Math.abs(newBoundsWidth) / 2,
    newTopLeft[1] + Math.abs(newBoundsHeight) / 2,
  ];
  const rotatedNewCenter = rotatePoint(newCenter, startCenter, angle);
  newTopLeft = rotatePoint(rotatedTopLeft, rotatedNewCenter, -angle);

  const newOrigin = [...newTopLeft];
  newOrigin[0] += stateAtCropStart.x - newBoundsX1;
  newOrigin[1] += stateAtCropStart.y - newBoundsY1;

  return newOrigin;
}

function clamp(numberToClamp: number, minBound: number, maxBound: number) {
  if (numberToClamp < minBound) {
    return minBound;
  }

  if (numberToClamp > maxBound) {
    return maxBound;
  }

  return numberToClamp;
}

export function onElementCroppedInternal(
  element: ExcalidrawImageElement,
  handleType: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
) {
  const unscaledWidth = element.width / element.rescaleX;
  const unscaledHeight = element.height / element.rescaleY;

  let topCropAmount = element.northCropAmount;
  let botCropAmount = element.southCropAmount;
  let leftCropAmount = element.westCropAmount;
  let rightCropAmount = element.eastCropAmount;

  if (handleType.includes("n")) {
    topCropAmount =
      element.heightAtCreation - unscaledHeight - element.southCropAmount;
  }

  if (handleType.includes("s")) {
    botCropAmount =
      element.heightAtCreation - unscaledHeight - element.northCropAmount;
  }

  if (handleType.includes("w")) {
    leftCropAmount =
      element.widthAtCreation - unscaledWidth - element.eastCropAmount;
  }

  if (handleType.includes("e")) {
    rightCropAmount =
      element.widthAtCreation - unscaledWidth - element.westCropAmount;
  }

  return {
    northCropAmount: topCropAmount,
    southCropAmount: botCropAmount,
    westCropAmount: leftCropAmount,
    eastCropAmount: rightCropAmount,
  };
}

export function onElementCropped(
  element: ExcalidrawImageElement,
  handleType: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
) {
  let mutation = onElementCroppedInternal(
    element,
    handleType,
    stateAtCropStart,
  );
  mutateElement(element, mutation);

  // VBRN
  if (element.holdAspectRatio) {
    if (handleType.includes("n"))
      mutation = onElementCroppedInternal(element, "w", stateAtCropStart);
    if (handleType.includes("s"))
      mutation = onElementCroppedInternal(element, "e", stateAtCropStart);
    if (handleType.includes("w"))
      mutation = onElementCroppedInternal(element, "n", stateAtCropStart);
    if (handleType.includes("e"))
      mutation = onElementCroppedInternal(element, "s", stateAtCropStart);
    mutateElement(element, mutation);
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// VBRN
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Unfortunately, original cropElement implementation does not support mutation
 * for both West/East or North/South at the same time. Because there are no such
 * transform handles as 'ns' (North/South) and 'we' (West/East).
 *
 * Therefore we impl aspect ration shift crop only for one border change. And mimic these
 * behavior:
 *
 * n --> w (like 'nw')
 * w --> n (like 'nw')
 * s --> e (like 'se')
 * e --> s (like 'se')
 *
 */
const cropElementInternalHoldAspectRatio = (
  element: ExcalidrawImageElement,
  transformHandle: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
  pointerX: number,
  pointerY: number,
) => {
  const aspectRatio = stateAtCropStart.width / stateAtCropStart.height;
  let mutation;

  if (transformHandle.includes("n")) {
    const mouseMovementY = pointerY - stateAtCropStart.y;
    const shiftX = mouseMovementY * aspectRatio;
    mutation = cropElementInternal(
      element,
      "w",
      stateAtCropStart,
      stateAtCropStart.x + shiftX,
      pointerY, // does not matter
    );
  }
  if (transformHandle.includes("s")) {
    const mouseMovementY =
      stateAtCropStart.y + stateAtCropStart.height - pointerY;
    const shiftX = mouseMovementY * aspectRatio;
    mutation = cropElementInternal(
      element,
      "e",
      stateAtCropStart,
      stateAtCropStart.x + stateAtCropStart.width - shiftX,
      pointerY, // does not matter
    );
  }
  if (transformHandle.includes("w")) {
    const mouseMovementX = pointerX - stateAtCropStart.x;
    const shiftY = mouseMovementX / aspectRatio;
    mutation = cropElementInternal(
      element,
      "n",
      stateAtCropStart,
      pointerX, // does not matter
      stateAtCropStart.y + shiftY,
    );
  }
  if (transformHandle.includes("e")) {
    const mouseMovementX =
      stateAtCropStart.x + stateAtCropStart.width - pointerX;
    const shiftY = mouseMovementX / aspectRatio;
    mutation = cropElementInternal(
      element,
      "s",
      stateAtCropStart,
      pointerX, // does not matter
      stateAtCropStart.y + stateAtCropStart.height - shiftY,
    );
  }

  mutateElement(element, mutation!);
};

export const cropElementProgramatecly = (
  el: ExcalidrawImageElement,
  cropOnValue: Vector,
  mode: "nw" | "se",
) => {
  const cropPointer =
    mode === "nw"
      ? {
          // from top-left
          x: el.x + cropOnValue.x,
          y: el.y + cropOnValue.y,
        }
      : {
          // from bottom-right
          x: el.x + el.width - cropOnValue.x,
          y: el.y + el.height - cropOnValue.y,
        };

  const rotateCenter = getElementCenter(el);
  const cropPointerRotated = ensureVector(
    rotate(
      cropPointer.x,
      cropPointer.y,
      rotateCenter.x,
      rotateCenter.y,
      el.angle,
    ),
  );
  const mutation = cropElementInternal(
    el,
    mode,
    el,
    cropPointerRotated.x,
    cropPointerRotated.y,
  );
  mutateElement(el, mutation);
  const mutation_ = onElementCroppedInternal(el, mode, el);
  mutateElement(el, mutation_);
};

export const cropElementRestore = (el: ExcalidrawImageElement) => {
  cropElementProgramatecly(
    el,
    { x: -el.westCropAmount, y: -el.northCropAmount },
    "nw",
  );
  cropElementProgramatecly(
    el,
    { x: -el.eastCropAmount, y: -el.southCropAmount },
    "se",
  );
  mutateElement(el, {
    eastCropAmount: 0,
    westCropAmount: 0,
    northCropAmount: 0,
    southCropAmount: 0,
  });
};
