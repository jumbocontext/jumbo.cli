export interface RemoveDependencyResponse {
  readonly dependencyId: string;
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly status: string;
  readonly reason?: string;
}
