/**
 * SqliteGoalRefinedProjector - SQLite projector for GoalRefinedEvent.
 *
 * Implements IGoalRefinedProjector for projecting goal refined events
 * to the SQLite read model, and IGoalRefineReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalRefinedProjector } from "../../../../application/context/goals/refine/IGoalRefinedProjector.js";
import { IGoalRefineReader } from "../../../../application/context/goals/refine/IGoalRefineReader.js";
import { GoalRefinedEvent } from "../../../../domain/goals/refine/GoalRefinedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";

export class SqliteGoalRefinedProjector
  implements IGoalRefinedProjector, IGoalRefineReader
{
  constructor(private db: Database) {}

  async applyGoalRefined(event: GoalRefinedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
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
