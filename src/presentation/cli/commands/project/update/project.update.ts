/**
 * CLI Command: jumbo project update
 *
 * Updates project metadata (purpose).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateProjectRequest } from "../../../../../application/context/project/update/UpdateProjectRequest.js";
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
    // Check if any fields provided
    if (options.purpose === undefined) {
      renderer.error("No fields provided. Specify --purpose");
      process.exit(1);
    }

    const request: UpdateProjectRequest = {
      purpose: options.purpose,
    };

    const response = await container.updateProjectController.handle(request);

    if (!response.updated) {
      renderer.info("No changes detected (values already match)");
    } else {
      const data: Record<string, string> = {
        updated: response.changedFields.join(", "),
        name: response.name,
      };
      if (response.purpose) {
        data.purpose = response.purpose;
      }

      renderer.success("Project updated successfully", data);
    }
  } catch (error) {
    renderer.error("Failed to update project", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
