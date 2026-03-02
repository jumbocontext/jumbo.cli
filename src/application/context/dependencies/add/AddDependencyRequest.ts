export interface AddDependencyRequest {
  readonly name?: string;
  readonly ecosystem?: string;
  readonly packageName?: string;
  readonly versionConstraint?: string | null;
  readonly consumerId?: string;
  readonly providerId?: string;
  readonly endpoint?: string;
  readonly contract?: string;
}
