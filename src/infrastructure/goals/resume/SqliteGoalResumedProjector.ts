/**
 * SqliteGoalResumedProjector - SQLite projector for GoalResumedEvent.
 *
 * Implements IGoalResumedProjector for projecting goal resumed events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalResumedProjector } from "../../../application/goals/resume/IGoalResumedProjector.js";
import { IGoalReader } from "../../../application/goals/resume/IGoalReader.js";
import { GoalResumedEvent } from "../../../domain/goals/resume/GoalResumedEvent.js";
import { GoalView } from "../../../application/goals/GoalView.js";

export class SqliteGoalResumedProjector
  implements IGoalResumedProjector, IGoalReader
{
  constructor(private db: Database) {}

  async applyGoalResumed(event: GoalResumedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = ?,
          claimedBy = ?,
          claimedAt = ?,
          claimExpiresAt = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.note || null,
      event.payload.claimedBy || null,
      event.payload.claimedAt || null,
      event.payload.claimExpiresAt || null,
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
