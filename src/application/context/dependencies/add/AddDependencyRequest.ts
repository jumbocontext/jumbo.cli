export interface AddDependencyRequest {
  readonly consumerId: string;
  readonly providerId: string;
  readonly endpoint?: string;
  readonly contract?: string;
}
