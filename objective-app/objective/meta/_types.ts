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
import { Vector } from '../elements/_math'
import { enumKeyTypeGuardFactory, enumValueTypeGuardFactory } from '../utils/types'

// NAMING CONVENTSION
type Entity = {} // declare Entity itself
type TEntity = {} // define some TS helpers / alias / etc

/** latest ver */
export const META_VERSION = '1.0.0' as const

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
  /** internal: exists only at render context */
  CAMERA_LENS = 'cameraLens',
  /** internal: exists only at render context */
  PUSHPIN = 'pushpin',
}

export const isKindKey = enumKeyTypeGuardFactory(ObjectiveKinds)
export const isKindValue = enumValueTypeGuardFactory(ObjectiveKinds)

/** metas per kind */
export type ObjectiveMetasGroups = Omit<
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
  // label repr and pointers:
  | 'labelContainer'
  | 'labelPointer'
  | 'storyboardPointer'
  | 'cameraMovementPointer'
  | 'characterMovementPointer'

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

  // UI elements (only at render context)
  | 'pushpinLine'
  | 'pushpinArrow'
  | 'pushpinHead'
  | 'cameraLensAngle'

export type TObjectiveKind = `${ObjectiveKinds}`

export type MaybeExcalidrawElement<T extends ExcalidrawElement = ExcalidrawElement> =
  | T
  | undefined
  | null
export type MaybeMeta<T extends ObjectiveMeta = ObjectiveMeta> =
  | Record<string, any>
  | T
  | WeekMeta<T>
  | undefined
  | null

type _TIdentityFields<Kind extends ObjectiveKinds> = {
  kind: Kind
  subkind?: ObjectiveSubkinds
  version?: typeof META_VERSION
}

export type LibraryImage = {
  src: string
  title: string
  w: number
  h: number
}

type _MetaLib = {
  img?: Readonly<LibraryImage>
  groupTitle?: string // or meta.kind
  mainTitle?: string // or meta.name
  subTitle?: string
}

type _TLibraryFields = {
  /** Initialized once at building Library and attached to specific Objective Item */
  elementsRequiredLength?: number

  /** Initialized once at building Library and attached to specific Objective Item */
  lib?: Readonly<_MetaLib>
}

/** Relations. Autopopulated by internal selectors fields. */
type _TAutopopulatedFields = {
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
}

/** Changeable by usear's actions fields */
type _TAffectedFields = {
  /** Aka Title / Label. Populated by User from `actionProps` panel. */
  name?: string
  /** Relation to Meta representation `rectangle.id` that nested Text has as `containderId`*/
  nameRepr?: ExcalidrawElement['id']
  /** long object description */
  description?: string
  /** opposite to scalable flag */
  disableResize: boolean

  // HACK its affected by library actually...
  elementsRequiredLength?: number
}

type _MetaCore = {
  basisIndex: number // required! (default 0)
  /** is invisible bases that used only to make custom bounding borders */
  isInternalBasis: boolean
  /** How much elements represent Objective item. Set by library. */

  isSnappedToWalls?: boolean
  isBoundsTakenFromBasis?: boolean // UNUSED

  isPushpinRotation?: boolean
  pushpinRotationShiftAngle?: number
  pushpinRotationShiftFactor?: number // factor = default_basis_size / shift_in_points_if_size_is_default
  pushpinRotationCenterShiftFactor?: number

  disableResizeAlways?: boolean
  disableFlip?: boolean

  // render opts (could be changeable by User in future, but now it's static)
  arrowheadSize?: number
}

type _TKindSpecificationFields = {
  /**
   * coreOpts
   *
   * Core object CONSTANT options to determine deferent behavior on handleing actions, rendering, etc.
   * It's static and common between all instances of single Kind (and Version)
   * (like class attributes)
   * */
  core: Readonly<_MetaCore>
}

type _MetaBase<Kind extends ObjectiveKinds = ObjectiveKinds> = //
  _TIdentityFields<Kind> &
    _TKindSpecificationFields &
    _TAutopopulatedFields &
    _TAffectedFields &
    _TLibraryFields

export type ObjectiveMeta<Kind extends ObjectiveKinds = ObjectiveKinds> = Readonly<_MetaBase<Kind>>

/**
 * Meta without autopopulated fields. Only Identity & User changes.
 * NOTE: exactly this information is stored on backend.
 * */
export type WeekMeta<Meta extends ObjectiveMeta = ObjectiveMeta> = //
  Omit<Meta, keyof _TAutopopulatedFields | keyof _TKindSpecificationFields>
export type WeekMeta__KG<Kind extends ObjectiveKinds = ObjectiveKinds> = //
  WeekMeta<ObjectiveMeta<Kind>>

/**
 * As WeekMeta + core opts.
 * */
export type SimpleMeta<Meta extends ObjectiveMeta = ObjectiveMeta> = //
  Omit<Meta, keyof _TAutopopulatedFields>

export type MetasMap<TMeta extends ObjectiveMeta = ObjectiveMeta> = Map<
  ObjectiveMeta['id'],
  TMeta //
>
export type ReadonlyMetasMap<TMeta extends ObjectiveMeta = ObjectiveMeta> = ReadonlyMap<
  ObjectiveMeta['id'],
  TMeta
>

// export type WeekMeta<TMeta extends ObjectiveMeta = ObjectiveMeta> = Omit<
//   TMeta,
//   keyof _ObjectiveKindSpecificationFields | keyof _ObjectiveAutopopulatedFields
// >

export type SupportsTurnMeta = {
  /**
   * Is this meta a Child.
   *
   * - all child turn's related to one parent (initial object)
   * - turns order simple depends on elements order in Excalidraw scene (no custom order logic yet)
   * */
  turnParentId?: ObjectiveMeta['id']
}

export type LabelMeta = _MetaBase & {
  kind: ObjectiveKinds.LABEL
  /** back ref main Objective meta id that has this meta as represention */
  readonly labelOf: ObjectiveMeta['id']
  name?: never
  nameRepr?: never
  description?: never
}

export type PointerMeta = _MetaBase & {
  kind: ObjectiveKinds.POINTER
  subkind?:
    | 'labelPointer'
    | 'storyboardPointer'
    | 'cameraMovementPointer'
    | 'characterMovementPointer'
    | 'cameraLensAngle'

  // pointerOf: do not populate back ref as we take it from parent `element.boundElements`
  name?: never
  nameRepr?: never
  description?: never
}
/** It's always "arrow" ExcalidrawElement */
export type PointerElement = ObjectiveElement<PointerMeta>

export type LocationMeta = _MetaBase & {
  kind: ObjectiveKinds.LOCATION
  subkind: 'window' | 'doorClosed' | 'doorOpen'
}
// export type LocationMeta = Readonly<_LocationMeta>

export type WallMeta = ObjectiveMeta & { kind: ObjectiveKinds.WALL }

export type _CameraExtraMeta = {
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
  relatedImages: readonly ExcalidrawImageElement['id'][]
}
export type CameraMeta = ObjectiveMeta & Readonly<SupportsTurnMeta> & Readonly<_CameraExtraMeta>
export type ShotCameraMeta = CameraMeta & {
  isShot: true
  shotNumber: number // Cam A / Cam B
  shotVersion: number // Cam A-1 / Cam A-2
}

export type CharacterMeta = ObjectiveMeta &
  SupportsTurnMeta & {
    kind: ObjectiveKinds.CHARACTER
  }

export type _CameraFormat = {
  title: string
  description: string
  demensions: Vector
  isDefault?: boolean
}
export type CameraFormat = Readonly<_CameraFormat>

// TODO https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
export type TAnyMeta = ObjectiveMeta &
  Pick<LabelMeta, 'labelOf'> &
  Pick<SupportsTurnMeta, 'turnParentId'> &
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
export type TAnyWeekMeta = Omit<
  TAnyMeta,
  keyof _TAutopopulatedFields | keyof _TKindSpecificationFields
>
// UNUSED ???
// export type TMetaOverrides = Omit<Partial<AnyObjectiveMeta>, 'kind' | 'core'> & {
//   core?: Partial<AnyObjectiveMeta['core']>
// }
export type TWeekMetaOverrides = Omit<Partial<TAnyWeekMeta>, 'kind'>

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

export type _ObjectiveElement<TMeta extends ObjectiveMeta = ObjectiveMeta> =
  // HACK
  // Extend both ExcalidrawElement and ExcalidrawFrameElement, otherwise TS is confused about Frame,
  // and complains ObjectiveElement hos no `name` property.
  Omit<ExcalidrawElement, 'customData'> &
    Omit<ExcalidrawFrameElement, 'customData'> & { readonly customData: WeekMeta<TMeta> }

/** Readonly `ExcalidrawElement` with explicity meta (customData) type. */
export type ObjectiveElement<TMeta extends ObjectiveMeta = ObjectiveMeta> = _ObjectiveElement<TMeta>
export type ObjectiveWallElement = ExcalidrawLinearElement & { customData: WallMeta }

export const isMeta = (meta: MaybeMeta): meta is ObjectiveMeta =>
  meta ? 'kind' in meta && Boolean(meta.kind) : false
export const isObjective = (el: MaybeExcalidrawElement): el is ObjectiveElement =>
  isMeta(el?.customData)

/** is meta pure objective item that contains only ONE excalidraw element */
export const isPure = (m: ObjectiveMeta) => m.elements.length === 1

export const isObjectiveKind = <T extends ObjectiveKinds>(arg: any, kindToCheck: T): arg is T =>
  arg === kindToCheck

/** generic type guard function */
export const isKind = <T extends ObjectiveKinds>(
  arg: MaybeMeta,
  kind: T
): arg is T extends ObjectiveKinds.CAMERA
  ? CameraMeta
  : T extends ObjectiveKinds.CHARACTER
  ? CharacterMeta
  : T extends ObjectiveKinds.LABEL
  ? LabelMeta
  : ObjectiveMeta<T> => {
  return isMeta(arg) && arg.kind === kind
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
  isKind(meta, ObjectiveKinds.CAMERA)
export const isCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  isCameraMeta(el?.customData)
export const isSupportsTurn = (meta: MaybeMeta): meta is CameraMeta | CharacterMeta =>
  isKind(meta, ObjectiveKinds.CAMERA) || isKind(meta, ObjectiveKinds.CHARACTER)
export const isSupportsMoveToFrom = (meta: MaybeMeta): meta is CameraMeta | CharacterMeta =>
  isKind(meta, ObjectiveKinds.CAMERA) || isKind(meta, ObjectiveKinds.CHARACTER)
export const isChildTurn = (meta: MaybeMeta): meta is CameraMeta | CharacterMeta =>
  isSupportsTurn(meta) && Boolean(meta.turnParentId)

export const isWallElement = (
  el: MaybeExcalidrawElement | ObjectiveElement<LocationMeta>
): el is ObjectiveWallElement => isKindEl(el, ObjectiveKinds.WALL)

/** TMP solution when any simple line is Wall. */
export const isWall = (arg?: { type?: string }) => arg?.type === 'line'
export const isWallTool = (t: ActiveTool) => t.type === 'line'
export const isWallToolOrWallDrawing = (t: ActiveTool, selected: readonly ExcalidrawElement[]) =>
  (!selected.length || (selected.length === 1 && selected[0].type === 'line')) && isWallTool(t)

export const isLocationMeta = (meta: MaybeMeta): meta is LocationMeta =>
  isKind(meta, ObjectiveKinds.LOCATION)

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
  isKind(meta, ObjectiveKinds.POINTER)

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
  const metas = {} as ObjectiveMetasGroups
  const week = {} as WeekMeta
  const simple = {} as SimpleMeta
  const loc = {} as LocationMeta

  const typeGuard = (el: ExcalidrawElement): el is ObjectiveElement => {
    return true
  }
  // if (meta.libraryImg) meta.libraryImg.h = 123
  const func = (m: ObjectiveMeta['core']) => m

  func(simple.core)

  // isSupportsTurn(element)

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
