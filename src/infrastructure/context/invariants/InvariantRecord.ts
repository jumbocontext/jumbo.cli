/**
 * InvariantRecord - Infrastructure-layer type representing a raw SQLite row
 * from the invariant_views table.
 *
 * All fields map directly to SQLite column types.
 * Use InvariantRecordMapper to convert to the application-layer InvariantView.
 */

export interface InvariantRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly rationale: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
