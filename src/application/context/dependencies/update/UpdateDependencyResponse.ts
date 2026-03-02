export interface UpdateDependencyResponse {
  readonly dependencyId: string;
  readonly name?: string;
  readonly ecosystem?: string;
  readonly packageName?: string;
  readonly versionConstraint?: string | null;
  readonly endpoint?: string | null;
  readonly contract?: string | null;
  readonly status?: string;
}
