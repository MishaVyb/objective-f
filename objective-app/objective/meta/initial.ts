import { CameraMeta, ObjectiveKinds, ObjectiveMeta } from './types'

/** getDefaultMeta */
export const getInitialMeta = <T extends ObjectiveKinds>(
  kind: T,
  overriddes = {}
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
  ...getInitialMeta(ObjectiveKinds.CAMERA),

  isShot: undefined,
  shotNumber: undefined,
  shotVersion: undefined,
  focalLength: undefined,

  relatedImages: [],
}
