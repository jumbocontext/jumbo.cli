import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryDisableOutputBuilder } from "./TelemetryDisableOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Disable anonymous telemetry",
  category: "host",
  examples: [
    {
      command: "jumbo telemetry disable",
      description: "Opt out of anonymous telemetry",
    },
  ],
  related: ["telemetry status", "telemetry enable"],
  // Telemetry consent settings live in the project-scoped settings store
  requiresProject: true
};

export async function telemetryDisable(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryDisableOutputBuilder();

  try {
    const response = await container.updateTelemetryConsentController.handle({
      enabled: false,
    });
    const output = outputBuilder.buildSuccess(response);

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error)
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
