import { TelemetryConsentStatusResolver } from "../TelemetryConsentStatusResolver.js";
import { GetTelemetryStatusRequest } from "./GetTelemetryStatusRequest.js";
import { GetTelemetryStatusResponse } from "./GetTelemetryStatusResponse.js";
import { IGetTelemetryStatusGateway } from "./IGetTelemetryStatusGateway.js";
import { ITelemetryEnvironmentReader } from "../../../telemetry/ITelemetryEnvironmentReader.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";

export class LocalGetTelemetryStatusGateway implements IGetTelemetryStatusGateway {
  constructor(
    private readonly settingsReader: ISettingsReader,
    private readonly telemetryEnvironmentReader: ITelemetryEnvironmentReader,
    private readonly telemetryConsentStatusResolver: TelemetryConsentStatusResolver
  ) {}

  async getTelemetryStatus(
    _request: GetTelemetryStatusRequest
  ): Promise<GetTelemetryStatusResponse> {
    const settings = await this.settingsReader.read();
    const configured = await this.settingsReader.hasTelemetryConfiguration();

    return this.telemetryConsentStatusResolver.resolve(settings, configured, {
      ciDetected: this.telemetryEnvironmentReader.isCiEnvironment(),
      environmentDisabled:
        this.telemetryEnvironmentReader.isTelemetryDisabledByEnvironment(),
    });
  }
}
