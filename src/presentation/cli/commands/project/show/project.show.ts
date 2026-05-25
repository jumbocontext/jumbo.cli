/**
 * CLI Command: jumbo project show
 *
 * Shows core project metadata or the project north-star packet.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { ProjectShowOutputBuilder } from "./ProjectShowOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Show project metadata",
  category: "project-knowledge",
  options: [
    {
      flags: "--northstar",
      description: "Return project alignment context for goal design",
    },
  ],
  examples: [
    {
      command: "jumbo project show",
      description: "Show core project fields",
    },
    {
      command: "jumbo project show --northstar --format json",
      description: "Show project alignment packet as JSON",
    },
  ],
  related: ["project update", "audiences list", "audiencePains list", "values list"],
  requiresProject: true,
};

export async function projectShow(
  options: { northstar?: boolean },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.showProjectController.handle({
      northstar: options.northstar === true,
    });

    const config = renderer.getConfig();
    const outputBuilder = new ProjectShowOutputBuilder();
    const output = options.northstar
      ? config.format === "text"
        ? outputBuilder.buildNorthStar(response.northStar)
        : outputBuilder.buildStructuredNorthStar(response.northStar)
      : config.format === "text"
        ? outputBuilder.build(response.project)
        : outputBuilder.buildStructuredProject(response.project);

    if (config.format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    const dataSection = output.getSections().find((s) => s.type === "data");
    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to show project", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
