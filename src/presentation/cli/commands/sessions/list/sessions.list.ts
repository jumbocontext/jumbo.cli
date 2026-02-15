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
import { GetSessionsQueryHandler } from "../../../../../application/context/sessions/get/GetSessionsQueryHandler.js";
import { SessionStatusFilter } from "../../../../../application/context/sessions/get/ISessionViewReader.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { SessionView } from "../../../../../application/context/sessions/SessionView.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List session history",
  category: "work",
  options: [
    {
      flags: "--status <status>",
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
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "[ACTIVE]",
    paused: "[PAUSED]",
    blocked: "[BLOCKED]",
    ended: "[ENDED]",
  };
  return statusMap[status] || `[${status.toUpperCase()}]`;
}

/**
 * Format session for text output
 */
function formatSessionText(session: SessionView): void {
  console.log(`${formatStatus(session.status)} ${session.sessionId}`);
  if (session.focus) {
    console.log(`  Focus: ${session.focus}`);
  }
  console.log(`  Started: ${session.startedAt}`);
  if (session.endedAt) {
    console.log(`  Ended: ${session.endedAt}`);
  }
  console.log("");
}

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

    // Create query handler using container dependencies
    const queryHandler = new GetSessionsQueryHandler(
      container.sessionViewReader
    );

    // Execute query
    const sessions = await queryHandler.execute(statusFilter);

    if (sessions.length === 0) {
      const filterMsg = statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(`No sessions found${filterMsg}. Use 'jumbo session start' to begin a session.`);
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    if (config.format === "text") {
      // Text format: human-readable output
      const filterLabel = statusFilter === "all" ? "" : ` (${statusFilter})`;
      console.log(`\nSession History${filterLabel} (${sessions.length}):\n`);
      for (const session of sessions) {
        formatSessionText(session);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: sessions.length,
        filter: statusFilter,
        sessions: sessions.map((s) => ({
          sessionId: s.sessionId,
          status: s.status,
          focus: s.focus,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list sessions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
