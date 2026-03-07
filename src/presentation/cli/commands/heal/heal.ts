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
  related: ["evolve"],
};

interface HealOptions {
  yes?: boolean;
}

export async function heal(options: HealOptions, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new HealOutputBuilder();
  const logger = container.logger;
  const tag = "[heal]";

  try {
    if (!options.yes) {
      const output = outputBuilder.buildConfirmationRequired();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    logger.info(`${tag} Starting heal command`);
    const response = await container.rebuildDatabaseController.handle({
      skipConfirmation: options.yes,
    });
    logger.info(`${tag} Heal command completed`, { eventsReplayed: response.eventsReplayed, success: response.success });

    const output = outputBuilder.buildSuccess(response);
    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    logger.error(`${tag} Heal command failed`, error instanceof Error ? error : undefined, {
      errorValue: error instanceof Error ? undefined : String(error),
    });
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error)
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
