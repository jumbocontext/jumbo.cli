/**
 * SqliteGoalCompletedProjector - SQLite projector for GoalCompletedEvent.
 *
 * Implements IGoalCompletedProjector for projecting goal completed events
 * to the SQLite read model, and IGoalCompleteReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalCompletedProjector } from "../../../../application/context/goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../../../../application/context/goals/complete/IGoalCompleteReader.js";
import { GoalCompletedEvent } from "../../../../domain/goals/complete/GoalCompletedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";

export class SqliteGoalCompletedProjector
  implements IGoalCompletedProjector, IGoalCompleteReader
{
  constructor(private db: Database) {}

  async applyGoalCompleted(event: GoalCompletedEvent): Promise<void> {
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
