/**
 * FsGoalClaimStore - File-based goal claim persistence
 *
 * Stores goal claims in a JSON file for simple, file-based persistence.
 * Claims are keyed by goalId for O(1) lookup.
 */

import fs from "fs-extra";
import path from "path";
import { IGoalClaimStore } from "../../../../application/context/goals/claims/IGoalClaimStore.js";
import { GoalClaim } from "../../../../application/context/goals/claims/GoalClaim.js";

/**
 * Structure of the persisted claims file.
 */
type ClaimStoreData = {
  claims: Record<string, GoalClaim>;
};

export class FsGoalClaimStore implements IGoalClaimStore {
  private readonly claimsFilePath: string;

  constructor(rootDir: string) {
    this.claimsFilePath = path.join(rootDir, "claims.json");
  }

  /**
   * Retrieves the current claim for a goal.
   */
  getClaim(goalId: string): GoalClaim | null {
    const data = this.loadData();
    return data.claims[goalId] ?? null;
  }

  /**
   * Creates or updates a claim for a goal.
   */
  setClaim(claim: GoalClaim): void {
    const data = this.loadData();
    data.claims[claim.goalId] = claim;
    this.saveData(data);
  }

  /**
   * Removes the claim for a goal.
   */
  releaseClaim(goalId: string): void {
    const data = this.loadData();
    delete data.claims[goalId];
    this.saveData(data);
  }

  /**
   * Loads the claims data from disk.
   */
  private loadData(): ClaimStoreData {
    try {
      if (fs.existsSync(this.claimsFilePath)) {
        const content = fs.readFileSync(this.claimsFilePath, "utf-8");
        return JSON.parse(content) as ClaimStoreData;
      }
    } catch {
      // If file is corrupted, start fresh
    }

    return { claims: {} };
  }

  /**
   * Saves the claims data to disk.
   */
  private saveData(data: ClaimStoreData): void {
    fs.ensureFileSync(this.claimsFilePath);
    fs.writeFileSync(
      this.claimsFilePath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  }
}
