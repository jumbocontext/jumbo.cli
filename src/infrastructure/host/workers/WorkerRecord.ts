/**
 * WorkerRecord - Infrastructure-layer type representing a raw SQLite row
 * from the workers table.
 *
 * Use WorkerRecordMapper to convert to application-layer types.
 */

export interface WorkerRecord {
  readonly workerId: string;
  readonly hostSessionKey: string;
  readonly mode: string | null;
  readonly createdAt: string;
  readonly lastSeenAt: string;
}
