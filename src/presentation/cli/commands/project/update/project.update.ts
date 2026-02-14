/**
 * CLI Command: jumbo project update
 *
 * Updates project metadata (purpose).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateProjectCommandHandler } from "../../../../../application/context/project/update/UpdateProjectCommandHandler.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update project metadata",
  category: "project-knowledge",
  options: [
    {
      flags: "--purpose <purpose>",
      description: "Updated project purpose"
    }
  ],
  examples: [
    {
      command: "jumbo project update --purpose 'Updated purpose'",
      description: "Update project purpose"
    }
  ],
  related: ["project init"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function projectUpdate(options: {
  purpose?: string | null;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateProjectCommandHandler(
      container.projectUpdatedEventStore,
      container.eventBus,
      container.projectUpdatedProjector
    );

    // 2. Build command (convert CLI options)
    const command: any = {};
    if (options.purpose !== undefined) command.purpose = options.purpose;

    // Check if any fields provided
    if (Object.keys(command).length === 0) {
      renderer.error("No fields provided. Specify --purpose");
      process.exit(1);
    }

    // 3. Execute command
    const result = await commandHandler.execute(command);

    // 4. Fetch updated view for display
    const view = await container.projectUpdatedProjector.getProject();

    // Success output
    if (!result.updated) {
      renderer.info("No changes detected (values already match)");
    } else {
      const data: Record<string, string> = {
        updated: result.changedFields.join(", "),
        name: view?.name || "N/A",
      };
      if (view?.purpose) {
        data.purpose = view.purpose;
      }

      renderer.success("Project updated successfully", data);
    }
  } catch (error) {
    renderer.error("Failed to update project", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
