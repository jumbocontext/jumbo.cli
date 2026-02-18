export interface UpdateDependencyResponse {
  readonly dependencyId: string;
  readonly consumerId?: string;
  readonly providerId?: string;
  readonly endpoint?: string | null;
  readonly contract?: string | null;
  readonly status?: string;
}
