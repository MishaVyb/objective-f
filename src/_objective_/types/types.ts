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

export interface OBJCameraMeta extends ObjectiveMeta {
  focalLength?: number
}

// FIXME Omit
// export type ObjectiveElement = Omit<ExcalidrawElement, 'customData'> & { customData: ObjectiveMeta }
export type ObjectiveElement = ExcalidrawElement & { customData: ObjectiveMeta }

export const isMeta = (customData: any): customData is ObjectiveMeta => !!customData?.kind
export const isObjective = (el: ExcalidrawElement): el is ObjectiveElement => isMeta(el.customData)
export const isAllElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.every((e) => isObjective(e))
export const isAnyElementsObjective = (elements: readonly ExcalidrawElement[]) =>
  elements.some((e) => isObjective(e))
