export interface AddComponentResponse {
  readonly componentId: string;
  readonly name: string;
  readonly type: string;
  readonly path: string;
  readonly status: string;
  readonly isUpdate: boolean;
}
