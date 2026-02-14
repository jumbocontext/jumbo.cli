import { DependencyStatusType } from "../../../../domain/dependencies/Constants.js";

export interface UpdateDependencyCommand {
  readonly id: string;
  readonly endpoint?: string | null;
  readonly contract?: string | null;
  readonly status?: DependencyStatusType;
}
