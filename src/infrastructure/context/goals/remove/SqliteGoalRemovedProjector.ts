/**
 * SqliteGoalRemovedProjector - SQLite projector for GoalRemovedEvent.
 *
 * Implements IGoalRemovedProjector for projecting goal removed events
 * to the SQLite read model, and IGoalRemoveReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalRemovedProjector } from "../../../../application/context/goals/remove/IGoalRemovedProjector.js";
import { IGoalRemoveReader } from "../../../../application/context/goals/remove/IGoalRemoveReader.js";
import { GoalRemovedEvent } from "../../../../domain/goals/remove/GoalRemovedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";

export class SqliteGoalRemovedProjector
  implements IGoalRemovedProjector, IGoalRemoveReader
{
  constructor(private db: Database) {}

  async applyGoalRemoved(event: GoalRemovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM goal_views
      WHERE goalId = ?
    `);

    stmt.run(event.aggregateId);
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
