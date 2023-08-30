import {
  ExcalidrawElement,
  ExcalidrawFrameElement,
  ExcalidrawImageElement,
  InitializedExcalidrawImageElement,
} from '../../element/types'
import { BinaryFileData } from '../../types'

export enum ObjectiveKinds {
  CAMERA = 'obj:camera',
  CHARACTER = 'obj:character',
  POINTER = 'obj:pointer',
}

// ---------------------------------------------------------------------- Base

export type MaybeExcalidrawElement = Record<string, any> | undefined | null
export type MaybeMeta = Record<string, any> | undefined | null

export interface ObjectiveMeta {
  id: string // excalidraw group id for all primitives of this Objective element
  elementIds: string[] // excalidraw element ids

  kind: ObjectiveKinds
  name?: string // aka title / label
  description?: string
}

/**
 * Special interface to represent `ExcalidrawImage` with prepopulated `BinaryFile`properties.
 * NOTE: Property `id` are taken from `ExcalidrawImage.id` (not `fileId`).
 */
export interface ObjectiveImageElement
  extends InitializedExcalidrawImageElement,
    Omit<BinaryFileData, 'id'> {}

// HACK
// Extend both ExcalidrawElement and ExcalidrawFrameElement, otherwise TS is confused about Frame,
// and complains ObjectiveElement hos no `name` property.
export type _ObjectiveElement<TMeta extends ObjectiveMeta = ObjectiveMeta> = Omit<
  ExcalidrawElement,
  'customData'
> &
  Omit<ExcalidrawFrameElement, 'customData'> & { customData: TMeta }
/**
 * Readonly `ExcalidrawElement` with explicity meta (customData) type.
 */
export type ObjectiveElement<TMeta extends ObjectiveMeta = ObjectiveMeta> = Readonly<
  _ObjectiveElement<TMeta>
>

export const isMeta = (meta: MaybeMeta): meta is ObjectiveMeta => !!meta?.kind
export const isObjective = (el: MaybeExcalidrawElement): el is ObjectiveElement =>
  isMeta(el?.customData)
export const isAllElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  !!elements.length && elements.every((e) => isObjective(e))
export const isAnyElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.some((e) => isObjective(e))
export const isElementRelatedToMeta = <TMeta extends ObjectiveMeta>(
  el: ExcalidrawElement,
  relatedMeta: TMeta
): el is ObjectiveElement<TMeta> => relatedMeta.elementIds.includes(el.id)

/**
 * Simple element ids checking. But also providing convent TS type guard.
 */
export const isElementTarget = <TElement extends ExcalidrawElement>(
  el: ExcalidrawElement,
  target: TElement
): el is TElement => el.id === target.id
// ---------------------------------------------------------------------- Camera

export interface CameraMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.CAMERA

  isShot?: boolean // is camera in shot list
  shotNumber?: number // Cam A / Cam B
  shotVersion?: number // Cam A-1 / Cam A-2
  focalLength?: number

  /**
   * Storyboard images. Source `ExcalidrawImage.id` (not `fileId`).
   */
  relatedImages: readonly string[] // images id
}
export type CameraElement = ObjectiveElement<CameraMeta>
export type ShotCameraElement = ObjectiveElement<ShotCameraMeta>

// TODO move to another module
export const cameraInitialMeta: CameraMeta = {
  // Type guard (constant)
  kind: ObjectiveKinds.CAMERA,

  // Mock defaults. Will be overridden by `getMeta`
  id: '',
  elementIds: [],

  // Optional props
  name: undefined,
  description: undefined,
  focalLength: undefined,

  // Relationships.
  relatedImages: [],
}

export interface ShotCameraMeta extends CameraMeta {
  isShot: true
  shotNumber: number // Cam A / Cam B
  shotVersion: number // Cam A-1 / Cam A-2
}

export const isCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  meta?.kind === ObjectiveKinds.CAMERA
export const isCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  isCameraMeta(el?.customData)

/**
 * Is element a camera and is it `shot` camera (camera added to shot list).
 */
export const isShotCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  (isCameraMeta(el?.customData) && el?.customData.isShot) || false

export const isAllElementsCameras = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isCameraElement(e))

export const isImageRelatedToCamera = (camera: CameraMeta, image: ExcalidrawImageElement) =>
  camera.relatedImages.includes(image.id)
// ---------------------------------------------------------------------- Pointer

/**
 * customData for "arrow" ExcalidrawElement.
 */
export interface PointerMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.CAMERA
}
/**
 * It's always "arrow" ExcalidrawElement.
 */
export type PointerElement = ObjectiveElement<PointerMeta>
export const isPointerMeta = (meta: MaybeMeta): meta is PointerMeta =>
  meta?.kind === ObjectiveKinds.POINTER
export const isPointerElement = (el: MaybeExcalidrawElement): el is PointerElement =>
  isPointerMeta(el?.customData)

// ---------------------------------------------------------------------- helper functions

export const isDisplayed = (el: ExcalidrawElement) => (el.opacity > 5 ? true : false)

//--------------------- TS tests ------------------------ //

const __test = () => {
  const element = {} as ExcalidrawElement
  const maybe = {} as MaybeExcalidrawElement
  const obj = {} as ObjectiveElement

  const typeGuard = (el: ExcalidrawElement): el is ObjectiveElement => {
    return true
  }
}
