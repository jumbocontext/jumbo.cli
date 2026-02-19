export interface UpdateInvariantResponse {
  readonly invariantId: string;
  readonly updatedFields: string[];
  readonly title?: string;
  readonly version?: number;
}
