export interface DaemonEventRow {
  readonly key: string;
  readonly source: string;
  readonly category: string;
  readonly timestampMs: number;
  readonly message: string;
  readonly color: string;
}
