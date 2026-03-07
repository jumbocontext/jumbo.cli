export interface ITelemetryEnvironmentReader {
  isCiEnvironment(): boolean;
  isTelemetryDisabledByEnvironment(): boolean;
}
