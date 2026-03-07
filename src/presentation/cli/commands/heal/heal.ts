import { IApplicationContainer } from "../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../rendering/Renderer.js";
import { CommandMetadata } from "../registry/CommandMetadata.js";
import { HealOutputBuilder } from "./HealOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Rebuild database projections from the event store",
  options: [
    {
      flags: "--yes",
      description: "Skip confirmation prompt",
    },
  ],
  examples: [
    {
      command: "jumbo heal",
      description: "Rebuild projections with confirmation prompt",
    },
    {
      command: "jumbo heal --yes",
      description: "Rebuild projections without confirmation",
    },
  ],
  related: ["repair", "db upgrade"],
};

interface HealOptions {
  yes?: boolean;
}

export async function heal(options: HealOptions, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new HealOutputBuilder();

  try {
    if (!options.yes) {
      const output = outputBuilder.buildConfirmationRequired();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    const response = await container.rebuildDatabaseController.handle({
      skipConfirmation: options.yes,
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
