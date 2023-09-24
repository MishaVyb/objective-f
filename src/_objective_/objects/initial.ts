import { CameraMeta, ObjectiveKinds, ObjectiveMeta } from '../types/types'

export const getBaseInitialMeta = (kind: ObjectiveMeta['kind']): ObjectiveMeta => ({
  kind: kind,
  id: '',
  elementIds: [],
  elements: [],
  name: undefined,
  nameRepr: undefined,
})

export const cameraInitialMeta: CameraMeta = {
  kind: ObjectiveKinds.CAMERA,
  id: '',
  elementIds: [],
  elements: [],
  name: undefined,
  nameRepr: undefined,

  isShot: undefined,
  shotNumber: undefined,
  shotVersion: undefined,
  focalLength: undefined,

  shotNumberRepr: undefined,

  relatedImages: [],
}
