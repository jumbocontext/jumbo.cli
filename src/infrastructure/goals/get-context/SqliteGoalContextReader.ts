/**
 * SqliteGoalContextReader - SQLite reader for goal context queries.
 *
 * Implements IGoalContextReader for reading goal data
 * used by GetGoalContextQueryHandler.
 */

import { Database } from "better-sqlite3";
import { IGoalContextReader } from "../../../application/goals/get-context/IGoalContextReader.js";
import { GoalView } from "../../../application/goals/GoalView.js";

export class SqliteGoalContextReader implements IGoalContextReader {
  constructor(private db: Database) {}

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
      // Embedded context fields
      relevantInvariants: row.relevantInvariants ? JSON.parse(row.relevantInvariants) : undefined,
      relevantGuidelines: row.relevantGuidelines ? JSON.parse(row.relevantGuidelines) : undefined,
      relevantDependencies: row.relevantDependencies ? JSON.parse(row.relevantDependencies) : undefined,
      relevantComponents: row.relevantComponents ? JSON.parse(row.relevantComponents) : undefined,
      architecture: row.architecture ? JSON.parse(row.architecture) : undefined,
      filesToBeCreated: row.filesToBeCreated ? JSON.parse(row.filesToBeCreated) : undefined,
      filesToBeChanged: row.filesToBeChanged ? JSON.parse(row.filesToBeChanged) : undefined,
      nextGoalId: row.nextGoalId || undefined,
    };
  }
}
