/**
 * SessionStartResponse - Result of starting a new session.
 *
 * Contains only the data needed to render the session-start workflow router.
 * Additional project and goal context is loaded by explicit follow-up commands.
 */
import { GoalBacklogPreviewItem } from "../../goals/query/GoalBacklogPreviewItem.js";

export interface SessionStartResponse {
  readonly sessionId: string;
  readonly status: "active";
  readonly isUnprimedBrownfield: boolean;
  readonly backlogPreview: GoalBacklogPreviewItem[];
}
