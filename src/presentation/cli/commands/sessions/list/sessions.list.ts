/**
 * CLI Command: jumbo sessions list
 *
 * Lists session history with optional status filtering.
 *
 * Usage:
 *   jumbo sessions list
 *   jumbo sessions list --status active
 *   jumbo sessions list --status ended --format json
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { SessionStatusFilter } from "../../../../../application/context/sessions/get/ISessionViewReader.js";
import { GetSessionsRequest } from "../../../../../application/context/sessions/get/GetSessionsRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { SessionListOutputBuilder } from './SessionListOutputBuilder.js';

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List session history",
  category: "work",
  options: [
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active, paused, ended, or all (default: all)",
    },
  ],
  examples: [
    {
      command: "jumbo sessions list",
      description: "List all sessions",
    },
    {
      command: "jumbo sessions list --status active",
      description: "List only active sessions",
    },
    {
      command: "jumbo sessions list --status ended --format json",
      description: "List ended sessions as JSON",
    },
  ],
  related: ["session start", "session end"],
};

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is SessionStatusFilter {
  return ["active", "paused", "ended", "all"].includes(status);
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionsList(
  options: { status?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(`Invalid status: ${statusFilter}. Must be one of: active, paused, ended, all`);
      process.exit(1);
    }

    const request: GetSessionsRequest = { status: statusFilter };
    const { sessions } = await container.getSessionsController.handle(request);

    if (sessions.length === 0) {
      const filterMsg = statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(`No sessions found${filterMsg}. Use 'jumbo session start' to begin a session.`);
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new SessionListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(sessions, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(sessions, statusFilter);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list sessions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
