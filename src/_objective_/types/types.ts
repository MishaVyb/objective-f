import { ObjectiveKinds } from '../../types'

export interface ObjectiveBaseMeta {
  kind: ObjectiveKinds
  title?: string
  description: string
  comment?: string
}

export interface ObjectiveCameraMeta extends ObjectiveBaseMeta {
  focalLength?: number
}
