export interface UpdateTelemetryConsentResponse {
  enabled: boolean;
  effectiveEnabled: boolean;
  anonymousId: string | null;
  disabledByCi: boolean;
  disabledByEnvironment: boolean;
  generatedAnonymousId: boolean;
}
