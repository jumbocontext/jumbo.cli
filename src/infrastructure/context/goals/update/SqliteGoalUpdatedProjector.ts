/**
 * SqliteGoalUpdatedProjector - SQLite projector for GoalUpdatedEvent.
 *
 * Implements IGoalUpdatedProjector for projecting goal updated events
 * to the SQLite read model, and IGoalUpdateReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalUpdatedProjector } from "../../../../application/context/goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../../../../application/context/goals/update/IGoalUpdateReader.js";
import { GoalUpdatedEvent } from "../../../../domain/goals/update/GoalUpdatedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";

export class SqliteGoalUpdatedProjector
  implements IGoalUpdatedProjector, IGoalUpdateReader
{
  constructor(private db: Database) {}

  async applyGoalUpdated(event: GoalUpdatedEvent): Promise<void> {
    // Build dynamic UPDATE statement based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (event.payload.objective !== undefined) {
      updates.push("objective = ?");
      values.push(event.payload.objective);
    }
    if (event.payload.successCriteria !== undefined) {
      updates.push("successCriteria = ?");
      values.push(JSON.stringify(event.payload.successCriteria));
    }
    if (event.payload.scopeIn !== undefined) {
      updates.push("scopeIn = ?");
      values.push(JSON.stringify(event.payload.scopeIn));
    }
    if (event.payload.scopeOut !== undefined) {
      updates.push("scopeOut = ?");
      values.push(JSON.stringify(event.payload.scopeOut));
    }
    if (event.payload.nextGoalId !== undefined) {
      updates.push("nextGoalId = ?");
      values.push(event.payload.nextGoalId);
    }

    // Always update version and updatedAt
    updates.push("version = ?", "updatedAt = ?");
    values.push(event.version, event.timestamp);

    // Add WHERE clause parameter
    values.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET ${updates.join(", ")}
      WHERE goalId = ?
    `);

    stmt.run(...values);
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
