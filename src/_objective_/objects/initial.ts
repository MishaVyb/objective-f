import { CameraMeta, ObjectiveKinds, ObjectiveMeta } from '../types/types'

/** getDefaultMeta */
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
  basisIndex: 0,
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
