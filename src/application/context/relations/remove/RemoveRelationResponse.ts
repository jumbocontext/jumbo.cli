export interface RemoveRelationResponse {
  readonly relationId: string;
  readonly from?: string;
  readonly relationType?: string;
  readonly to?: string;
}
