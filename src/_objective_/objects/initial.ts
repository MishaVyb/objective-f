import { CameraMeta, ObjectiveKinds } from '../types/types'

export const cameraInitialMeta: CameraMeta = {
  kind: ObjectiveKinds.CAMERA,
  id: '',
  elementIds: [],
  elements: [],
  name: undefined,
  focalLength: undefined,
  relatedImages: [],
}
