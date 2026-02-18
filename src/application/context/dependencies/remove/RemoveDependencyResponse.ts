export interface RemoveDependencyResponse {
  readonly dependencyId: string;
  readonly consumer: string;
  readonly provider: string;
  readonly status: string;
  readonly reason?: string;
}
