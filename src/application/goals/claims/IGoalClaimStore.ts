/**
 * IGoalClaimStore - Port interface for goal claim persistence
 *
 * Stores and retrieves goal claims. Claims are used to prevent
 * multiple workers from working on the same goal concurrently.
 */

import { GoalClaim } from "./GoalClaim.js";

export interface IGoalClaimStore {
  /**
   * Retrieves the current claim for a goal, if one exists.
   *
   * @param goalId - The ID of the goal to check
   * @returns The current claim, or null if the goal is not claimed
   */
  getClaim(goalId: string): GoalClaim | null;

  /**
   * Creates or updates a claim for a goal.
   *
   * @param claim - The claim to store
   */
  setClaim(claim: GoalClaim): void;

  /**
   * Removes the claim for a goal.
   *
   * @param goalId - The ID of the goal to release
   */
  releaseClaim(goalId: string): void;
}
