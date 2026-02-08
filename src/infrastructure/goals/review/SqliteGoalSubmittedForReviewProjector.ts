/**
 * SqliteGoalSubmittedForReviewProjector - SQLite projector for GoalSubmittedForReviewEvent.
 *
 * Implements IGoalSubmittedForReviewProjector for projecting goal submitted for review events
 * to the SQLite read model, and IGoalSubmitForReviewReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalSubmittedForReviewProjector } from "../../../application/goals/review/IGoalSubmittedForReviewProjector.js";
import { IGoalSubmitForReviewReader } from "../../../application/goals/review/IGoalSubmitForReviewReader.js";
import { GoalSubmittedForReviewEvent } from "../../../domain/goals/review/GoalSubmittedForReviewEvent.js";
import { GoalView } from "../../../application/goals/GoalView.js";

export class SqliteGoalSubmittedForReviewProjector
  implements IGoalSubmittedForReviewProjector, IGoalSubmitForReviewReader
{
  constructor(private db: Database) {}

  async applyGoalSubmittedForReview(event: GoalSubmittedForReviewEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          claimedBy = NULL,
          claimedAt = NULL,
          claimExpiresAt = NULL,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.version,
      event.timestamp,
      event.aggregateId
    );
  }

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT * FROM goal_views WHERE goalId = ?")
      .get(goalId);
    return row ? this.mapRowToView(row as any) : null;
  }

  private mapRowToView(row: any): GoalView {
    return {
      goalId: row.goalId,
      objective: row.objective,
      successCriteria: JSON.parse(row.successCriteria || "[]"),
      scopeIn: JSON.parse(row.scopeIn || "[]"),
      scopeOut: JSON.parse(row.scopeOut || "[]"),
      boundaries: JSON.parse(row.boundaries || "[]"),
      status: row.status,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      note: row.note || undefined,
      progress: JSON.parse(row.progress || "[]"),
      claimedBy: row.claimedBy || undefined,
      claimedAt: row.claimedAt || undefined,
      claimExpiresAt: row.claimExpiresAt || undefined,
      nextGoalId: row.nextGoalId || undefined,
    };
  }
}
