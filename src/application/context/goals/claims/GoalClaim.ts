/**
 * GoalClaim - Represents a claim/lease on a goal
 *
 * When a worker starts or resumes a goal, they claim it.
 * The claim prevents other workers from working on the same goal
 * until the claim expires or is released.
 */

import { WorkerId } from "../../../host/workers/WorkerId.js";

export type GoalClaim = {
  /**
   * The ID of the goal that is claimed
   */
  goalId: string;

  /**
   * The ID of the worker that holds the claim
   */
  claimedBy: WorkerId;

  /**
   * When the claim was created (ISO 8601)
   */
  claimedAt: string;

  /**
   * When the claim expires (ISO 8601)
   */
  claimExpiresAt: string;
};
