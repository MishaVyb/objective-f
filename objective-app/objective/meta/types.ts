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
import { arrayToMap } from '../../../packages/excalidraw/utils'
import { Vector } from '../elements/math'
import { enumKeyTypeGuardFactory, enumValueTypeGuardFactory } from '../utils/types'

export enum ObjectiveKinds {
  CAMERA = 'camera',
  CHARACTER = 'character',
  LIGHT = 'light',

  /** LAYOUT: window or door (not wall!) */
  LOCATION = 'location',
  /** LAYOUT: wall (Excalidraw Line) */
  WALL = 'wall',

  /** furniture (big items) */
  SET = 'set',
  /** small items */
  PROP = 'prop',
  OTHER = 'other',

  /** internal */
  POINTER = 'pointer',
  /** internal: container with bound text */
  LABEL = 'label',
  /** internal: text that bound to label container*/
  LABEL_TEXT = 'labelText',
}

export const isKindKey = enumKeyTypeGuardFactory(ObjectiveKinds)
export const isKindValue = enumValueTypeGuardFactory(ObjectiveKinds)

export type ObjectiveMetas = Omit<
  Record<ObjectiveKinds, readonly ObjectiveMeta[]>,
  'camera' | 'wall' | 'pointer' | 'label'
> & {
  camera: readonly CameraMeta[]
  wall: readonly WallMeta[]
  pointer: readonly PointerMeta[]
  label: readonly LabelMeta[]
}

/** Subkind is ONLY for declare different on canvas item style, not any special logic or behavior */
export type ObjectiveSubkinds =
  // pointer:
  | 'labelPointer'
  | 'storyboardPointer'
  | 'cameraMovementPointer'
  | 'characterMovementPointer'
  | 'cameraLensAngle'

  // location:
  | 'window'
  | 'doorClosed'
  | 'doorOpen'
  | 'Stairs'

  // light
  | 'Led Panel'
  | 'Kinoflo'
  | 'Jambo'
  | 'Astera'
  | 'Pipe'
  | 'Arri'
  | 'Aputure'
  | 'Open Face'
  | 'Par'
  | 'Etc'
  | 'Bulb'
  | 'Frame'
  | 'Farm'
  | 'Apple Box'
  | 'Sun'

export type TObjectiveKind = `${ObjectiveKinds}`

export type MaybeExcalidrawElement<T extends ExcalidrawElement = ExcalidrawElement> =
  | T
  | undefined
  | null
export type MaybeMeta<T extends ObjectiveMeta = ObjectiveMeta> = T | WeekMeta<T> | undefined | null

export type ObjectiveMeta<Kind extends ObjectiveKinds = ObjectiveKinds> = Readonly<{
  //
  // CONSTANT (INITIAL) FIELDS

  kind: Kind
  subkind?: ObjectiveSubkinds
  basisIndex: number
  libraryImg?: Readonly<{
    src: string
    title: string
    w: number
    h: number
  }>

  library?: Readonly<{
    groupTitle?: string // or meta.kind
    mainTitle?: string // or meta.name
    subTitle?: string
    // ... TODO refactor other fields
  }>

  // TODO move all core opts from root level into `meta.coreOpts` field
  /**
   * Core object options to determine deferent behavior on handleing actions, rendering, etc.
   * It's static and always equals for any instance of specific meta kind.
   * (like class attributes)
   * @see {@link _METAS_CORE_DEFINITION}
   * */
  coreOpts?: Readonly<{
    isSnappedToWalls?: boolean
    isBoundsTakenFromBasis?: boolean

    isPushpinRotation?: boolean
    pushpinRotationShiftAngle?: number
    pushpinRotationShiftFactor?: number
    pushpinRotationCenterShiftFactor?: number
  }>

  // TODO do not depends on Meta.kind -- it's too generic...
  // other configuration, like
  // - doSnapToWall
  // - renderActions: string[...]
  // - ...

  /** How much elements represent Objective item. NOTE: for some dynamic Object that property could not be defined */
  elementsRequiredLength?: number
  /** is invisible bases that used only to make custom bounding borders */
  isInternalBasis?: boolean

  // CHANGEABLE BY USEAR'S ACTIONS FIELDS

  /** Aka Title / Label. Populated by User from `actionProps` panel. */
  name?: string
  /** Relation to Meta representation `rectangle.id` that nested Text has as `containderId`*/
  nameRepr?: ExcalidrawElement['id']
  /** long object description */
  description?: string
  /** opposite to scalable flag */
  disableResize: boolean

  // AUTO POPULATED FIELDS:

  /** Excalidraw group id for all primitives of this Objective element. Populated by `getMetas`. */
  id: GroupId
  /**
   * @deprecated use `elements`
   * Excalidraw primitive element ids. Populated by `getMetas`
   */
  elementIds: readonly ObjectiveElement['id'][]
  /** Excalidraw primitive elements. Populated by `getMetas` */
  elements: readonly ObjectiveElement[]
  /** Excalidraw primitive element. Populated by `getMetas` regarding to `basisIndex` */
  basis: ExcalidrawElement | undefined

  //
  //
  /** HACK: as TS support for internal Excalidraw properties for IFrames. Objective do not use that. */
  generationData?: MagicCacheData
}>

/** simple meta without autopopulated fields */
export type WeekMeta<TMeta extends ObjectiveMeta = ObjectiveMeta> = Omit<
  TMeta,
  'elements' | 'elementIds' | 'basis' | 'id'
>

type _SupportsTurnMetaMixin = {
  turnParentId?: ObjectiveMeta['id']
}

export type LabelMeta = ObjectiveMeta &
  Readonly<{
    kind: ObjectiveKinds.LABEL
    /** back ref main Objective meta id that has this meta as represention */
    labelOf: ObjectiveMeta['id']

    name: never
    nameRepr: never
    description: never
  }>

export type PointerMeta = ObjectiveMeta &
  Readonly<{
    kind: ObjectiveKinds.POINTER
    subkind?:
      | 'labelPointer'
      | 'storyboardPointer'
      | 'cameraMovementPointer'
      | 'characterMovementPointer'
      | 'cameraLensAngle'

    // pointerOf: do not populate back ref as we take it from parent `element.boundElements`
    name: never
    nameRepr: never
    description: never
  }>

/** It's always "arrow" ExcalidrawElement */
export type PointerElement = ObjectiveElement<PointerMeta>

export type LocationMeta = ObjectiveMeta &
  Readonly<{
    kind: ObjectiveKinds.LOCATION
    subkind: 'window' | 'doorClosed' | 'doorOpen'
  }>

export type WallMeta = ObjectiveMeta & Readonly<{ kind: ObjectiveKinds.WALL }>

export type CameraMeta = ObjectiveMeta &
  _SupportsTurnMetaMixin & {
    kind: ObjectiveKinds.CAMERA

    isShot?: boolean // is camera in shot list
    shotNumber?: number // Cam 1 / Cam 2
    shotVersion?: number // Cam 1-A / Cam 1-B
    focalLength?: number // mm
    focusDistance?: number // cm
    cameraFormat?: CameraFormat // width (mm)
    aspectRatio?: number // w/h
    lensAngleRepr?: boolean

    /**
     * Storyboard images. Source `ExcalidrawImage.id` (not `fileId`).
     */
    relatedImages: readonly string[] // images id
  }

export type CharacterMeta = ObjectiveMeta &
  _SupportsTurnMetaMixin & {
    kind: ObjectiveKinds.CHARACTER
  }

export type CameraFormat = {
  title: string
  description: string
  demensions: Vector
  isDefault?: boolean
}

export type ShotCameraMeta = CameraMeta & {
  isShot: true
  shotNumber: number // Cam A / Cam B
  shotVersion: number // Cam A-1 / Cam A-2
}

// TODO https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
export type AnyObjectiveMeta = ObjectiveMeta &
  Pick<LabelMeta, 'labelOf'> &
  Pick<_SupportsTurnMetaMixin, 'turnParentId'> &
  Pick<
    CameraMeta,
    | 'isShot'
    | 'shotNumber'
    | 'shotVersion'
    | 'focalLength'
    | 'focusDistance'
    | 'cameraFormat'
    | 'aspectRatio'
    | 'relatedImages'
    | 'lensAngleRepr'
  >

export type CameraElement = ObjectiveElement<CameraMeta>
export type ShotCameraElement = ObjectiveElement<ShotCameraMeta>
export type LocationElement = ObjectiveElement<LocationMeta>

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

/** Readonly `ExcalidrawElement` with explicity meta (customData) type. */
export type ObjectiveElement<TMeta extends ObjectiveMeta = ObjectiveMeta> = Readonly<
  _ObjectiveElement<TMeta>
>
export type ObjectiveWallElement = ExcalidrawLinearElement & { customData: WallMeta }

export const isMeta = (meta: MaybeMeta): meta is ObjectiveMeta => !!meta?.kind
export const isObjective = (el: MaybeExcalidrawElement): el is ObjectiveElement =>
  isMeta(el?.customData)

/** is meta pure objective item that contains only ONE excalidraw element */
export const isPure = (m: ObjectiveMeta) => m.elements.length === 1

/** generic type guard function */
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

export const isSubkindEl = <T extends ObjectiveKinds>(
  arg: MaybeExcalidrawElement,
  subkind: ObjectiveSubkinds
): arg is T extends ObjectiveKinds.CAMERA
  ? ObjectiveElement<CameraMeta>
  : T extends ObjectiveKinds.LABEL
  ? ObjectiveElement<LabelMeta>
  : ObjectiveElement<ObjectiveMeta<T>> => {
  return isObjective(arg) && arg.customData.subkind === subkind
}

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

export const isCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  meta?.kind === ObjectiveKinds.CAMERA
export const isCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  isCameraMeta(el?.customData)
export const isSupportsTurn = (meta: MaybeMeta): meta is CameraMeta | CharacterMeta =>
  isKind(meta, ObjectiveKinds.CAMERA) || isKind(meta, ObjectiveKinds.CHARACTER)

export const isWallElement = (
  el: MaybeExcalidrawElement | ObjectiveElement<LocationMeta>
): el is ObjectiveWallElement => isKindEl(el, ObjectiveKinds.WALL)

/** TMP solution when any simple line is Wall. */
export const isWall = (arg?: { type?: string }) => arg?.type === 'line'
export const isWallTool = (t: ActiveTool) => t.type === 'line'
export const isWallToolOrWallDrawing = (t: ActiveTool, selected: readonly ExcalidrawElement[]) =>
  (!selected.length || (selected.length === 1 && selected[0].type === 'line')) && isWallTool(t)

export const isLocationMeta = (meta: MaybeMeta): meta is LocationMeta =>
  meta?.kind === ObjectiveKinds.LOCATION

/**
 * Is element a camera and is it `shot` camera (camera added to shot list).
 */
export const isShotCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  (isCameraMeta(el?.customData) && el?.customData.isShot) || false
export const isShotCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  (isCameraMeta(meta) && meta?.isShot) || false

export const isAllElementsCameras = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isCameraElement(e))

export const isImageRelatedToCamera = (camera: CameraMeta, image: ExcalidrawImageElement) =>
  camera.relatedImages.includes(image.id)

export const isPointerMeta = (meta: MaybeMeta): meta is PointerMeta =>
  meta?.kind === ObjectiveKinds.POINTER

export const isPointerElement = (el: MaybeExcalidrawElement): el is PointerElement =>
  isPointerMeta(el?.customData)

export const isDisplayed = (el: ExcalidrawElement) => (el.opacity > 5 ? true : false)

/**
 * NOTE:
 * Should be used in pair with `getInvisibleBasisFromMetas`,
 * because `invisibleBasis` is not Objective hidden.
 * */
export const isObjectiveHidden = (el: ExcalidrawElement) =>
  //isObjective(el) && // FIXME storyboard image are not marked as Objective, so skip that condition
  el.opacity === 0 && el.locked

export const isNotSelectableOnGroupSelection = (el: ExcalidrawElement) =>
  // || isWallElement(el) // ???
  isKindEl(el, ObjectiveKinds.LABEL) || isKindEl(el, ObjectiveKinds.POINTER)

// ---------------------------------------------------------------------- helper functions

export const ensureArray = (els: ElementsMapOrArray) => ('values' in els ? [...els.values()] : els)
export const ensureMap = arrayToMap // alias

//--------------------- TS tests ------------------------ //

const __test = () => {
  const element = {} as ExcalidrawElement
  const meta = {} as ObjectiveMeta
  const maybe = {} as MaybeExcalidrawElement
  const obj = {} as ObjectiveElement
  const wall = {} as ObjectiveWallElement
  const metas = {} as ObjectiveMetas
  const week = {} as WeekMeta

  const typeGuard = (el: ExcalidrawElement): el is ObjectiveElement => {
    return true
  }

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
