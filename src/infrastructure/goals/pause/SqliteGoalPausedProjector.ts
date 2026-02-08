/**
 * SqliteGoalPausedProjector - SQLite projector for GoalPausedEvent.
 *
 * Implements IGoalPausedProjector for projecting goal paused events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalPausedProjector } from "../../../application/goals/pause/IGoalPausedProjector.js";
import { IGoalReader } from "../../../application/goals/pause/IGoalReader.js";
import { GoalPausedEvent } from "../../../domain/goals/pause/GoalPausedEvent.js";
import { GoalView } from "../../../application/goals/GoalView.js";

export class SqliteGoalPausedProjector
  implements IGoalPausedProjector, IGoalReader
{
  constructor(private db: Database) {}

  async applyGoalPaused(event: GoalPausedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.note || null,
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
