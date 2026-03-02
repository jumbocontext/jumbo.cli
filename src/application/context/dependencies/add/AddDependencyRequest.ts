export interface AddDependencyRequest {
  readonly name?: string;
  readonly ecosystem?: string;
  readonly packageName?: string;
  readonly versionConstraint?: string | null;
  readonly endpoint?: string;
  readonly contract?: string;
}
