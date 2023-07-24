import { ExcalidrawElement } from '../../element/types'

export enum ObjectiveKinds {
  CAMERA = 'obj:camera',
  CHARACTER = 'obj:character',
}

export interface ObjectiveMeta {
  kind: ObjectiveKinds
  name?: string
  description?: string
}

export interface CameraMeta extends ObjectiveMeta {
  kind: ObjectiveKinds.CAMERA

  isShot?: boolean // is camera in shot list
  shotNumber?: number // Cam A / Cam B
  shotVersion?: number // Cam A-1 / Cam A-2
  focalLength?: number
}

// FIXME Omit
// export type ObjectiveElement = Omit<ExcalidrawElement, 'customData'> & { customData: ObjectiveMeta }
export type ObjectiveElement = ExcalidrawElement & { customData: ObjectiveMeta }
export type CameraElement = ExcalidrawElement & { customData: CameraMeta }

export const isMeta = (customData: any): customData is ObjectiveMeta => !!customData?.kind
export const isObjective = (el: ExcalidrawElement): el is ObjectiveElement => isMeta(el.customData)
export const isAllElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isObjective(e))
export const isAnyElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.some((e) => isObjective(e))

export const isCameraMeta = (customData: any): customData is CameraMeta =>
  customData?.kind === ObjectiveKinds.CAMERA
export const isCameraElement = (el: ExcalidrawElement): el is CameraElement =>
  isCameraMeta(el.customData)

export const getMeta = (el: ObjectiveElement) => el.customData
