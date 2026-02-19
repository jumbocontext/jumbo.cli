export interface UpdateProjectResponse {
  readonly updated: boolean;
  readonly changedFields: string[];
  readonly name: string;
  readonly purpose: string | null;
}
