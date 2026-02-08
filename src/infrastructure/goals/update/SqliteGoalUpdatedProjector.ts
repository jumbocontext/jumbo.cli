/**
 * SqliteGoalUpdatedProjector - SQLite projector for GoalUpdatedEvent.
 *
 * Implements IGoalUpdatedProjector for projecting goal updated events
 * to the SQLite read model, and IGoalUpdateReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalUpdatedProjector } from "../../../application/goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../../../application/goals/update/IGoalUpdateReader.js";
import { GoalUpdatedEvent } from "../../../domain/goals/update/GoalUpdatedEvent.js";
import { GoalView } from "../../../application/goals/GoalView.js";

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
    if (event.payload.boundaries !== undefined) {
      updates.push("boundaries = ?");
      values.push(JSON.stringify(event.payload.boundaries));
    }
    // Embedded context fields (partial update support)
    if (event.payload.relevantInvariants !== undefined) {
      updates.push("relevantInvariants = ?");
      values.push(JSON.stringify(event.payload.relevantInvariants));
    }
    if (event.payload.relevantGuidelines !== undefined) {
      updates.push("relevantGuidelines = ?");
      values.push(JSON.stringify(event.payload.relevantGuidelines));
    }
    if (event.payload.relevantDependencies !== undefined) {
      updates.push("relevantDependencies = ?");
      values.push(JSON.stringify(event.payload.relevantDependencies));
    }
    if (event.payload.relevantComponents !== undefined) {
      updates.push("relevantComponents = ?");
      values.push(JSON.stringify(event.payload.relevantComponents));
    }
    if (event.payload.architecture !== undefined) {
      updates.push("architecture = ?");
      values.push(JSON.stringify(event.payload.architecture));
    }
    if (event.payload.filesToBeCreated !== undefined) {
      updates.push("filesToBeCreated = ?");
      values.push(JSON.stringify(event.payload.filesToBeCreated));
    }
    if (event.payload.filesToBeChanged !== undefined) {
      updates.push("filesToBeChanged = ?");
      values.push(JSON.stringify(event.payload.filesToBeChanged));
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
