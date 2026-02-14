/**
 * CLI Command: jumbo guideline update
 *
 * Updates an existing guideline with new values.
 * Supports partial updates - only provided fields are changed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateGuidelineCommandHandler } from "../../../../../application/context/guidelines/update/UpdateGuidelineCommandHandler.js";
import { UpdateGuidelineCommand } from "../../../../../application/context/guidelines/update/UpdateGuidelineCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GuidelineCategoryValue } from "../../../../../domain/guidelines/Constants.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing guideline",
  category: "solution",
  requiredOptions: [
    {
      flags: "--guideline-id <guidelineId>",
      description: "ID of the guideline to update",
    },
  ],
  options: [
    {
      flags: "--category <category>",
      description:
        "Updated category (testing, codingStyle, process, communication, documentation, security, performance, other)",
    },
    {
      flags: "--title <title>",
      description: "Updated guideline title",
    },
    {
      flags: "--description <description>",
      description: "Updated guideline description",
    },
    {
      flags: "--rationale <rationale>",
      description: "Updated rationale for the guideline",
    },
    {
      flags: "--enforcement <enforcement>",
      description: "Updated enforcement details",
    },
    {
      flags: "--example <path...>",
      description: "Updated list of example paths",
    },
  ],
  examples: [
    {
      command:
        "jumbo guideline update --guideline-id guid_123 --title 'Updated Title'",
      description: "Update guideline title",
    },
    {
      command:
        "jumbo guideline update --guideline-id guid_123 --category testing --rationale 'Regulatory requirement'",
      description: "Update guideline category and rationale",
    },
  ],
  related: ["guideline add", "guideline remove"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineUpdate(options: {
  guidelineId: string;
  category?: GuidelineCategoryValue;
  title?: string;
  description?: string;
  rationale?: string;
  enforcement?: string;
  example?: string[];
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateGuidelineCommandHandler(
      container.guidelineUpdatedEventStore,
      container.guidelineUpdatedEventStore,
      container.guidelineUpdatedProjector,
      container.eventBus
    );

    // 2. Execute command - only include defined fields
    const command: UpdateGuidelineCommand = {
      id: options.guidelineId,
      ...(options.category !== undefined && { category: options.category }),
      ...(options.title !== undefined && { title: options.title }),
      ...(options.description !== undefined && {
        description: options.description,
      }),
      ...(options.rationale !== undefined && { rationale: options.rationale }),
      ...(options.enforcement !== undefined && {
        enforcement: options.enforcement,
      }),
      ...(options.example !== undefined && { examples: options.example }),
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.guidelineUpdatedProjector.findById(result.guidelineId);

    // Show which fields were updated
    const updated: string[] = [];
    if (options.category) updated.push("category");
    if (options.title) updated.push("title");
    if (options.description) updated.push("description");
    if (options.rationale) updated.push("rationale");
    if (options.enforcement) updated.push("enforcement");
    if (options.example) updated.push("examples");

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: result.guidelineId,
      updatedFields: updated.join(", "),
    };

    if (view) {
      data.category = view.category;
      data.title = view.title;
      data.version = view.version;
    }

    renderer.success(
      `Guideline '${options.guidelineId}' updated successfully`,
      data
    );
  } catch (error) {
    renderer.error("Failed to update guideline", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
