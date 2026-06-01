export interface SearchIndexRecord {
  readonly sourceType: string;
  readonly sourceId: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string | null;
  readonly content: string;
  readonly facets: string;
  readonly metadata: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
