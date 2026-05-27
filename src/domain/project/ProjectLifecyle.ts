import { ProjectLifecycle as ProjectLifecycleValues } from "./Constants.js";

export const ProjectLifecycle = {
  Uninitialized: ProjectLifecycleValues.UNINITIALIZED,
  Unprimed: ProjectLifecycleValues.UNPRIMED,
  PrimedEmpty: ProjectLifecycleValues.PRIMED_EMPTY,
  Primed: ProjectLifecycleValues.PRIMED,
} as const;
