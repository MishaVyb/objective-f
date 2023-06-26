import { ObjecitveKinds } from "../types";

export interface ObjectiveBaseMeta {
  kind: ObjecitveKinds;
  title?: string;
  description: string;
  comment?: string;
}

export interface ObjectiveCameraMeta extends ObjectiveBaseMeta {
  focalLength?: number;
}
