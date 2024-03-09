import { MagicCacheData } from '../../../packages/excalidraw/data/magic'
import {
  ElementsMapOrArray,
  ExcalidrawElement,
  ExcalidrawFrameElement,
  ExcalidrawImageElement,
  ExcalidrawLinearElement,
  GroupId,
  InitializedExcalidrawImageElement,
} from '../../../packages/excalidraw/element/types'
import { ActiveTool, BinaryFileData } from '../../../packages/excalidraw/types'

export enum ObjectiveKinds {
  CAMERA = 'Camera',
  CHARACTER = 'Character',
  LIGHT = 'Light',

  /** window or door (not wall!) ... */
  LOCATION = 'Location',
  // WALL = 'Wall' // TODO

  /** furniture (big items) */
  SET = 'Set',
  /** small items */
  PROP = 'Prop',
  OUTDOR = 'Outdor',

  /** internal */
  POINTER = 'Pointer',
  /** internal: container or nested text */
  LABEL = 'Label',
}

export type TObjectiveKind = `${ObjectiveKinds}`

// ---------------------------------------------------------------------- Base

type AnyExceptMeta<T> = T extends ObjectiveMeta ? never : T //FIXME

export type MaybeExcalidrawElement<T extends ExcalidrawElement = ExcalidrawElement> =
  | T
  | undefined
  | null
export type MaybeMeta<T extends ObjectiveMeta = ObjectiveMeta> = T | undefined | null

export interface ObjectiveMeta<Kind extends ObjectiveKinds = ObjectiveKinds> {
  /** Constant. Populated by lib from initial. */
  readonly kind: Kind

  /** Aka Title / Label. Populated by User from `actionProps` panel. */
  name?: string
  /** Relation to Meta representation `rectangle.id` that nested Text has as `containderId`*/
  nameRepr?: ExcalidrawElement['id']

  /** long object description */
  description?: string

  /** Excalidraw group id for all primitives of this Objective element. Populated by `getMetas`. */
  id: GroupId
  /**
   * @deprecated use `elements`
   * Excalidraw primetime element ids. Populated by `getMetas`
   */
  elementIds: readonly ObjectiveElement['id'][]
  /** Excalidraw primetime elements. Populated by `getMetas` */
  elements: readonly ObjectiveElement[]

  /** base element index at elements Array
   *
   * basis could be used as main Excalidraw primitive element inside Objective object (elements group)
   * it could be used for
   * - binding arrows to it
   * - getting commont bounds
   * - rotation center
   * etc.
   *
   */
  basisIndex: number

  libraryImg?: {
    src: string
    title: string
    w: number
    h: number
  }

  //
  //
  /** HACK: as TS support for internal Excalidraw properties for IFrames. Objective do not use that. */
  generationData?: MagicCacheData
}

export interface LabelMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.LABEL
  /** back ref main Objective meta id that has this meta as represention */
  labelOf: ObjectiveMeta['id']

  name: never
  nameRepr: never
  description: never
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

/** as `isMeta` or `isObjective` but when we asking for specific Objective kind */
export const isKind = <T extends ObjectiveKinds>(
  arg: MaybeMeta,
  kind: T
): arg is T extends ObjectiveKinds.CAMERA
  ? CameraMeta
  : T extends ObjectiveKinds.LABEL
  ? LabelMeta
  : ObjectiveMeta<T> => {
  return arg?.kind === kind
}

export const isKindEl = <T extends ObjectiveKinds>(
  arg: MaybeExcalidrawElement,
  kind: T
): arg is T extends ObjectiveKinds.CAMERA
  ? ObjectiveElement<CameraMeta>
  : T extends ObjectiveKinds.LABEL
  ? ObjectiveElement<LabelMeta>
  : ObjectiveElement<ObjectiveMeta<T>> => {
  return isKind(arg?.customData, kind)
}

// ): arg is ObjectiveElement<ObjectiveMeta<T>> | ObjectiveMeta<T> =>
//   arg && 'type' in arg ? arg?.customData?.kind === kind : arg?.kind === kind

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
  target: TElement | TElement['id']
): el is TElement => el.id === (typeof target === 'string' ? target : target.id)
// ---------------------------------------------------------------------- Camera

export interface CameraMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.CAMERA

  isShot?: boolean // is camera in shot list
  shotNumber?: number // Cam 1 / Cam 2
  shotVersion?: number // Cam 1-A / Cam 1-B
  focalLength?: number

  /**
   * Storyboard images. Source `ExcalidrawImage.id` (not `fileId`).
   */
  relatedImages: readonly string[] // images id
}
export interface LocationMeta extends ObjectiveMeta {}

export type CameraElement = ObjectiveElement<CameraMeta>
export type ShotCameraElement = ObjectiveElement<ShotCameraMeta>
export type LocationElement = ObjectiveElement<LocationMeta>

export interface ShotCameraMeta extends CameraMeta {
  isShot: true
  shotNumber: number // Cam A / Cam B
  shotVersion: number // Cam A-1 / Cam A-2
}

export const isCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  meta?.kind === ObjectiveKinds.CAMERA
export const isCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  isCameraMeta(el?.customData)

/** TMP solution when any simple lien is Wall. */
export const isWallElement = (el: MaybeExcalidrawElement): el is ExcalidrawLinearElement =>
  !!(el && el.type === 'line' && !el.customData)

/** TMP solution when any simple lien is Wall. */
export const isWallTool = (t: ActiveTool) => t.type === 'line'

export const isLocationMeta = (meta: MaybeMeta): meta is LocationMeta =>
  meta?.kind === ObjectiveKinds.LOCATION
export const isLocationElement = (el: MaybeExcalidrawElement): el is LocationElement =>
  isLocationMeta(el?.customData)
/**
 * Is element a camera and is it `shot` camera (camera added to shot list).
 */
export const isShotCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  (isCameraMeta(el?.customData) && el?.customData.isShot) || false
export const isShotCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  (isCameraMeta(meta) && meta?.isShot) || false

export const isAllElementsCameras = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isCameraElement(e))

export const isAllElementsLocation = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isLocationElement(e))

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
export const ensureArray = (els: ElementsMapOrArray) => ('values' in els ? [...els.values()] : els)

//--------------------- TS tests ------------------------ //

const __test = () => {
  const element = {} as ExcalidrawElement
  const meta = {} as ObjectiveMeta
  const maybe = {} as MaybeExcalidrawElement
  const obj = {} as ObjectiveElement

  const typeGuard = (el: ExcalidrawElement): el is ObjectiveElement => {
    return true
  }

  const myFoo = (el: AnyExceptMeta<Record<string, any>>) => 123
  myFoo(meta)
  // @ts-ignore
  isMeta(element)

  if (isKind(meta, ObjectiveKinds.LOCATION)) {
    const location = meta
  }
  if (isKind(meta, ObjectiveKinds.CAMERA)) {
    const cam = meta
  }
  if (isKind(meta, ObjectiveKinds.LABEL)) {
    const label = meta
  }
}