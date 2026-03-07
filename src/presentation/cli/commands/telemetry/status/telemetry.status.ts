import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { TelemetryStatusOutputBuilder } from "./TelemetryStatusOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Show telemetry consent and effective runtime status",
  category: "host",
  examples: [
    {
      command: "jumbo telemetry status",
      description: "Show current telemetry consent and anonymous ID",
    },
  ],
  related: ["telemetry enable", "telemetry disable", "session start"],
};

export async function telemetryStatus(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new TelemetryStatusOutputBuilder();

  try {
    const response = await container.getTelemetryStatusController.handle({});
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
