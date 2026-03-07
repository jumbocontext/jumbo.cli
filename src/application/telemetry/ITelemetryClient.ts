export interface ITelemetryClient {
  track(event: string, properties?: Record<string, unknown>): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}
