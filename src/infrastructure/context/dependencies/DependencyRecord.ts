/**
 * DependencyRecord - Infrastructure-layer type representing a raw SQLite row
 * from the dependency_views table.
 *
 * All fields map directly to SQLite column types.
 * Use DependencyRecordMapper to convert to the application-layer DependencyView.
 */

export interface DependencyRecord {
  readonly id: string;
  readonly name: string | null;
  readonly ecosystem: string | null;
  readonly packageName: string | null;
  readonly versionConstraint: string | null;
  readonly consumerId: string | null;
  readonly providerId: string | null;
  readonly endpoint: string | null;
  readonly contract: string | null;
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly removedAt: string | null;
  readonly removalReason: string | null;
}
