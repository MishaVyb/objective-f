import { CameraMeta, ObjectiveKinds, ObjectiveMeta } from '../types/types'

export const getBaseInitialMeta = <T extends ObjectiveKinds>(
  kind: T,
  overriddes: Omit<Partial<ObjectiveMeta<T>>, 'kind'> = {}
): ObjectiveMeta<T> => ({
  kind: kind,
  id: '',
  elementIds: [],
  elements: [],
  name: undefined,
  nameRepr: undefined,
  ...overriddes,
})

export const cameraInitialMeta: CameraMeta = {
  ...getBaseInitialMeta(ObjectiveKinds.CAMERA),

  isShot: undefined,
  shotNumber: undefined,
  shotVersion: undefined,
  focalLength: undefined,

  shotNumberRepr: undefined,

  relatedImages: [],
}
