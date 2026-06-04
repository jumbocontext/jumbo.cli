import { ProjectLifecycle } from "../../../domain/project/Constants.js";

export type CockpitState =
  (typeof ProjectLifecycle)[keyof typeof ProjectLifecycle];

export const CockpitPlaceholderState: CockpitState =
  ProjectLifecycle.UNINITIALIZED;
