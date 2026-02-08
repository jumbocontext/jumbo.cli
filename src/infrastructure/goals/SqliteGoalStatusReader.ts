/**
 * SqliteGoalStatusReader - SQLite reader for goal status queries.
 *
 * Implements IGoalStatusReader for reading goals by status, and
 * IGoalReadForSessionSummary for session summary projections.
 */

import { Database } from "better-sqlite3";
import { IGoalStatusReader } from "../../application/goals/IGoalStatusReader.js";
import { IGoalReadForSessionSummary } from "../../application/sessions/get-context/IGoalReadForSessionSummary.js";
import { GoalView } from "../../application/goals/GoalView.js";

export class SqliteGoalStatusReader
  implements IGoalStatusReader, IGoalReadForSessionSummary
{
  constructor(private db: Database) {}

  async findByStatus(status: string): Promise<GoalView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM goal_views WHERE status = ? ORDER BY createdAt DESC"
      )
      .all(status);
    return rows.map((row) => this.mapRowToView(row as any));
  }

  async findAll(): Promise<GoalView[]> {
    const rows = this.db
      .prepare("SELECT * FROM goal_views ORDER BY createdAt DESC")
      .all();
    return rows.map((row) => this.mapRowToView(row as any));
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
