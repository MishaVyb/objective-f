import { ExcalidrawElement, ExcalidrawFrameElement } from '../../element/types'

export enum ObjectiveKinds {
  CAMERA = 'obj:camera',
  CHARACTER = 'obj:character',
}

export type MaybeExcalidrawElement = Record<string, any> | undefined | null
export type MaybeMeta = Record<string, any> | undefined | null

export interface ObjectiveMeta {
  id: string // excalidraw group id for all primitives of this Objective element
  elementIds: string[] // excalidraw element ids

  kind: ObjectiveKinds
  name?: string // aka title / label
  description?: string
}

export interface CameraMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.CAMERA

  isShot?: boolean // is camera in shot list
  shotNumber?: number // Cam A / Cam B
  shotVersion?: number // Cam A-1 / Cam A-2
  focalLength?: number

  // relationships
  relatedImages?: readonly string[] // images id
}

export interface ShotCameraMeta extends CameraMeta {
  isShot: true
  shotNumber: number // Cam A / Cam B
  shotVersion: number // Cam A-1 / Cam A-2
}

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

export type CameraElement = ObjectiveElement<CameraMeta>
export type ShotCameraElement = ObjectiveElement<ShotCameraMeta>

export const isMeta = (meta: MaybeMeta): meta is ObjectiveMeta => !!meta?.kind
export const isObjective = (el: MaybeExcalidrawElement): el is ObjectiveElement =>
  isMeta(el?.customData)
export const isAllElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  !!elements.length && elements.every((e) => isObjective(e))
export const isAnyElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.some((e) => isObjective(e))

export const isCameraMeta = (meta: MaybeMeta): meta is CameraMeta =>
  meta?.kind === ObjectiveKinds.CAMERA
export const isCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  isCameraMeta(el?.customData)

/**
 * Is element a camera ans is it `shot` camera (camera added to shot list).
 */
export const isShotCameraElement = (el: MaybeExcalidrawElement): el is CameraElement =>
  (isCameraMeta(el?.customData) && el?.customData.isShot) || false

export const isAllElementsCameras = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isCameraElement(e))

export const isElementRelatedToMeta = <TMeta extends ObjectiveMeta>(
  el: ExcalidrawElement,
  relatedMeta: TMeta
): el is ObjectiveElement<TMeta> => relatedMeta.elementIds.includes(el.id)


//--------------------- TS tests ------------------------ //

const __test = () => {
  const element = {} as ExcalidrawElement
  const maybe = {} as MaybeExcalidrawElement
  const obj = {} as ObjectiveElement

  const typeGuard = (el: ExcalidrawElement): el is ObjectiveElement => {
    return true
  }
}
