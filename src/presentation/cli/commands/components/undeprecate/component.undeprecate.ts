import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ComponentUndeprecateOutputBuilder } from "./ComponentUndeprecateOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Restore a deprecated component to active status",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the component to undeprecate"
    },
    {
      flags: "-r, --reason <reason>",
      description: "Reason for undeprecating the component"
    }
  ],
  examples: [
    {
      command: "jumbo component undeprecate --id comp_123 --reason \"Still required by active features\"",
      description: "Undeprecate a previously deprecated component"
    }
  ],
  related: ["component deprecate", "component remove", "component update"]
};

export async function componentUndeprecate(
  options: {
    id: string;
    reason: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new ComponentUndeprecateOutputBuilder();

  try {
    const response = await container.undeprecateComponentController.handle({
      componentId: options.id,
      reason: options.reason,
    });

    const output = outputBuilder.buildSuccess(response.componentId, response.name, response.reason);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
