import { DependencyStatusType } from "../../../../domain/dependencies/Constants.js";

export interface UpdateDependencyRequest {
  readonly dependencyId: string;
  readonly endpoint?: string;
  readonly contract?: string;
  readonly status?: DependencyStatusType;
}
