import { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";

export class NoOpTelemetryClient implements ITelemetryClient {
  track(_event: string, _properties?: Record<string, unknown>): void {
    // Intentionally empty.
  }

  async flush(): Promise<void> {
    return Promise.resolve();
  }

  async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
