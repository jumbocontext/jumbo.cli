/**
 * Banner Orchestrator
 *
 * Displays the animated banner for bare 'jumbo' command.
 * Content varies based on whether a project is initialized.
 */

import { IApplicationContainer } from "../../../application/host/IApplicationContainer.js";
import { GetProjectSummaryQueryHandler } from "../../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import { GetWorkSummaryQueryHandler } from "../../../application/context/work/query/GetWorkSummaryQueryHandler.js";
import {
  BannerDisplayContext,
  generateBannerContent,
} from "./BannerContentGenerator.js";
import { showAnimatedBanner } from "./AnimatedBanner.js";

/**
 * Checks if this is a bare 'jumbo' command (no subcommand or arguments).
 */
export function isBareCommand(argv: string[]): boolean {
  return argv.length === 2;
}

/**
 * Gathers display context for banner content generation.
 * Uses application layer queries for clean separation.
 *
 * @param container - Application container (null if project not initialized)
 * @returns Banner display context
 */
async function gatherDisplayContext(
  container: IApplicationContainer | null
): Promise<BannerDisplayContext> {
  if (!container) {
    return {
      project: null,
      work: {
        session: null,
        goals: { planned: 0, active: 0, blocked: 0, completed: 0 },
        blockers: [],
      },
    };
  }

  const projectQuery = new GetProjectSummaryQueryHandler(
    container.projectContextReader
  );
  const workQuery = new GetWorkSummaryQueryHandler(
    container.activeSessionReader,
    container.goalStatusReader
  );

  const [project, work] = await Promise.all([
    projectQuery.execute(),
    workQuery.execute(),
  ]);

  return { project, work };
}

/**
 * Shows the animated banner with context-appropriate content.
 * Called by AppRunner when bare 'jumbo' command is detected.
 *
 * @param version - CLI version string for display
 * @param container - Application container (null if project not initialized)
 */
export async function showBannerWithContainer(
  version: string,
  container: IApplicationContainer | null
): Promise<void> {
  const displayContext = await gatherDisplayContext(container);
  const projectName = displayContext.project?.name ?? null;
  const content = generateBannerContent(displayContext);

  await showAnimatedBanner(content, projectName, version);

  // No explicit cleanup needed - Host handles resource disposal
  // via process signal handlers when process.exit fires
  process.exit(0);
}
