export interface DeprecateComponentResponse {
  readonly componentId: string;
  readonly name: string;
  readonly status: string;
  readonly reason?: string;
}
