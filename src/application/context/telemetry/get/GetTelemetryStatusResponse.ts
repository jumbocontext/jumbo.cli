export interface GetTelemetryStatusResponse {
  configured: boolean;
  enabled: boolean;
  effectiveEnabled: boolean;
  anonymousId: string | null;
  disabledByCi: boolean;
  disabledByEnvironment: boolean;
}
