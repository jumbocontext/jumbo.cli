export interface UpdateGuidelineResponse {
  readonly guidelineId: string;
  readonly updatedFields: string[];
  readonly category?: string;
  readonly title?: string;
  readonly version?: number;
}
