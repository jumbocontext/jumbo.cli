import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryEnableOutputBuilder } from "./TelemetryEnableOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Enable anonymous telemetry and generate an anonymous ID if needed",
  category: "host",
  examples: [
    {
      command: "jumbo telemetry enable",
      description: "Opt into anonymous telemetry",
    },
  ],
  related: ["telemetry status", "telemetry disable"],
};

export async function telemetryEnable(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryEnableOutputBuilder();

  try {
    const response = await container.updateTelemetryConsentController.handle({
      enabled: true,
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
