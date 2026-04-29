/**
 * CLI Command: jumbo guideline update
 *
 * Updates an existing guideline with new values.
 * Supports partial updates - only provided fields are changed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
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
      flags: "-i, --id <id>",
      description: "ID of the guideline to update",
    },
  ],
  options: [
    {
      flags: "-c, --category <category>",
      description:
        "Updated category (testing, codingStyle, process, communication, documentation, security, performance, other)",
    },
    {
      flags: "-t, --title <title>",
      description: "Updated guideline title",
    },
    {
      flags: "-d, --description <description>",
      description: "Updated guideline description",
    },
    {
      flags: "--rationale <rationale>",
      description: "Updated rationale for the guideline",
    },
    {
      flags: "--example <path...>",
      description: "Updated list of example paths",
    },
  ],
  examples: [
    {
      command:
        "jumbo guideline update --id guid_123 --title 'Updated Title'",
      description: "Update guideline title",
    },
    {
      command:
        "jumbo guideline update --id guid_123 --category testing --rationale 'Regulatory requirement'",
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
  id: string;
  category?: GuidelineCategoryValue;
  title?: string;
  description?: string;
  rationale?: string;
  example?: string[];
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateGuidelineController.handle({
      id: options.id,
      ...(options.category !== undefined && { category: options.category }),
      ...(options.title !== undefined && { title: options.title }),
      ...(options.description !== undefined && {
        description: options.description,
      }),
      ...(options.rationale !== undefined && { rationale: options.rationale }),
      ...(options.example !== undefined && { examples: options.example }),
    });

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: response.guidelineId,
      updatedFields: response.updatedFields.join(", "),
    };

    if (response.category !== undefined) data.category = response.category;
    if (response.title !== undefined) data.title = response.title;
    if (response.version !== undefined) data.version = response.version;

    renderer.success(
      `Guideline '${options.id}' updated successfully`,
      data
    );
  } catch (error) {
    renderer.error("Failed to update guideline", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
