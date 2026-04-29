/**
 * GuidelineRecord - Infrastructure-layer type representing a raw SQLite row
 * from the guideline_views table.
 *
 * Array fields are stored as JSON strings. The isRemoved field is stored
 * as a SQLite integer (0/1).
 * Use GuidelineRecordMapper to convert to the application-layer GuidelineView.
 */

export interface GuidelineRecord {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
  readonly examples: string; // JSON array
  readonly isRemoved: number; // SQLite integer (0/1)
  readonly removedAt: string | null;
  readonly removalReason: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
