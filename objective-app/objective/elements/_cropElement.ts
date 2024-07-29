import { mutateElement } from '../../../packages/excalidraw'
import {
  cropElementInternal,
  onElementCroppedInternal,
} from '../../../packages/excalidraw/element/cropElement'
import { TransformHandleType } from '../../../packages/excalidraw/element/transformHandles'
import {
  isImageElement,
  isInitializedImageElement,
} from '../../../packages/excalidraw/element/typeChecks'
import {
  ExcalidrawElement,
  ExcalidrawImageElement,
  NonDeleted,
} from '../../../packages/excalidraw/element/types'
import { rotate } from '../../../packages/excalidraw/math'
import { getCoreSafe } from '../meta/_selectors'
import { ensureVector, getElementCenter, Vector } from './_math'

/**
 * // TMP
 * for backwards copability (old images does not have required props)
 * @deprecated
 * */
export const isInitializedDemensionsImage = (el: ExcalidrawImageElement) =>
  Boolean(el.underlyingImageHeight)

export const isSupportChangeAspectRatio = (
  selectedElements: ExcalidrawElement[]
): selectedElements is ExcalidrawImageElement[] =>
  !!selectedElements.length && selectedElements.every((e) => isImageElement(e))

export const reInitializeImageDemensions = async () => {
  const { app } = getCoreSafe()
  if (!app) {
    console.error('App required for re-initializeing image demensions. ')
    return
  }
  const els = app.scene
    .getNonDeletedElements()
    .filter(isInitializedImageElement)
    .filter((el) => !isInitializedDemensionsImage(el))

  for (const imageElement of els) {
    let image = app.imageCache.get(imageElement.fileId)?.image
    if (!image) {
      // 'addNewImagesToImageCache' should be called before
      console.warn('No image cache. ', imageElement)
      return
    }
    if (image instanceof Promise) image = await image

    // app.initializeImageDimensions(el, true)

    // const height = image.naturalHeight
    // const width = image.naturalWidth

    // add current imageElement width/height to account for previous centering
    // of the placeholder image
    // const x = imageElement.x + imageElement.width / 2 - width / 2
    // const y = imageElement.y + imageElement.height / 2 - height / 2

    console.debug('Re-initialize image demensions: ', imageElement)
    mutateElement(imageElement, {
      // width,
      // height,
      widthAtCreation: image.naturalWidth,
      heightAtCreation: image.naturalHeight,
      underlyingImageWidth: image.naturalWidth,
      underlyingImageHeight: image.naturalHeight,
      //
      xToPullFromImage: 0,
      yToPullFromImage: 0,
      wToPullFromImage: image.naturalWidth,
      hToPullFromImage: image.naturalHeight,
      //
      rescaleX: imageElement.width / image.naturalWidth,
      rescaleY: imageElement.height / image.naturalHeight,
      //
      westCropAmount: 0,
      eastCropAmount: 0,
      northCropAmount: 0,
      southCropAmount: 0,
    })
  }
}

export const hasBeenCropped = (el: ExcalidrawImageElement) =>
  // HACK
  // it relays on fact, that after 'original' buttom click those value is really really small,
  // but not null.
  // therefore we could show the original aspect ration at selection placeholder
  // (aspect ration wasn't visible changed, but it was changed for 0.00001... value)
  Boolean(
    el.holdAspectRatio ||
      el.eastCropAmount ||
      el.westCropAmount ||
      el.northCropAmount ||
      el.southCropAmount
  )

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
export const cropElementInternalHoldAspectRatio = (
  element: ExcalidrawImageElement,
  transformHandle: TransformHandleType,
  stateAtCropStart: NonDeleted<ExcalidrawElement>,
  pointerX: number,
  pointerY: number
) => {
  const aspectRatio = stateAtCropStart.width / stateAtCropStart.height
  let mutation: ReturnType<typeof cropElementInternal>

  if (transformHandle.includes('n')) {
    const mouseMovementY = pointerY - stateAtCropStart.y
    const shiftX = mouseMovementY * aspectRatio
    mutation = cropElementInternal(
      element,
      'w',
      stateAtCropStart,
      stateAtCropStart.x + shiftX,
      pointerY // does not matter
    )
  }
  if (transformHandle.includes('s')) {
    const mouseMovementY = stateAtCropStart.y + stateAtCropStart.height - pointerY
    const shiftX = mouseMovementY * aspectRatio
    mutation = cropElementInternal(
      element,
      'e',
      stateAtCropStart,
      stateAtCropStart.x + stateAtCropStart.width - shiftX,
      pointerY // does not matter
    )
  }
  if (transformHandle.includes('w')) {
    const mouseMovementX = pointerX - stateAtCropStart.x
    const shiftY = mouseMovementX / aspectRatio
    mutation = cropElementInternal(
      element,
      'n',
      stateAtCropStart,
      pointerX, // does not matter
      stateAtCropStart.y + shiftY
    )
  }
  if (transformHandle.includes('e')) {
    const mouseMovementX = stateAtCropStart.x + stateAtCropStart.width - pointerX
    const shiftY = mouseMovementX / aspectRatio
    mutation = cropElementInternal(
      element,
      's',
      stateAtCropStart,
      pointerX, // does not matter
      stateAtCropStart.y + stateAtCropStart.height - shiftY
    )
  }

  mutateElement(element, mutation!)
}

export const cropElementProgramatecly = (
  el: ExcalidrawImageElement,
  cropOnValue: Vector,
  mode: 'nw' | 'se'
) => {
  const cropPointer =
    mode === 'nw'
      ? {
          // from top-left
          x: el.x + cropOnValue.x,
          y: el.y + cropOnValue.y,
        }
      : {
          // from bottom-right
          x: el.x + el.width - cropOnValue.x,
          y: el.y + el.height - cropOnValue.y,
        }

  const rotateCenter = getElementCenter(el)
  const cropPointerRotated = ensureVector(
    rotate(cropPointer.x, cropPointer.y, rotateCenter.x, rotateCenter.y, el.angle)
  )
  const mutation = cropElementInternal(el, mode, el, cropPointerRotated.x, cropPointerRotated.y)
  mutateElement(el, mutation)
  const mutation_ = onElementCroppedInternal(el, mode, el)
  mutateElement(el, mutation_)
}

export const cropElementRestore = (el: ExcalidrawImageElement) => {
  cropElementProgramatecly(el, { x: -el.westCropAmount, y: -el.northCropAmount }, 'nw')
  cropElementProgramatecly(el, { x: -el.eastCropAmount, y: -el.southCropAmount }, 'se')
  mutateElement(el, {
    eastCropAmount: 0,
    westCropAmount: 0,
    northCropAmount: 0,
    southCropAmount: 0,
  })
}
