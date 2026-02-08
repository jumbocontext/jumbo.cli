/**
 * SqliteGoalAddedProjector - SQLite projector for GoalAddedEvent.
 *
 * Implements IGoalAddedProjector for projecting goal addition events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalAddedProjector } from "../../../application/goals/add/IGoalAddedProjector.js";
import { GoalAddedEvent } from "../../../domain/goals/add/GoalAddedEvent.js";

export class SqliteGoalAddedProjector implements IGoalAddedProjector {
  constructor(private db: Database) {}

  async applyGoalAdded(event: GoalAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goal_views (
        goalId, objective, successCriteria, scopeIn, scopeOut,
        boundaries, status, version, createdAt, updatedAt,
        claimedBy, claimedAt, claimExpiresAt,
        relevantInvariants, relevantGuidelines, relevantDependencies,
        relevantComponents, architecture, filesToBeCreated, filesToBeChanged,
        nextGoalId, progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.objective,
      JSON.stringify(event.payload.successCriteria),
      JSON.stringify(event.payload.scopeIn),
      JSON.stringify(event.payload.scopeOut),
      JSON.stringify(event.payload.boundaries),
      event.payload.status,
      event.version,
      event.timestamp,
      event.timestamp,
      null, // claimedBy - goals are not claimed when added
      null, // claimedAt
      null, // claimExpiresAt
      event.payload.relevantInvariants ? JSON.stringify(event.payload.relevantInvariants) : null,
      event.payload.relevantGuidelines ? JSON.stringify(event.payload.relevantGuidelines) : null,
      event.payload.relevantDependencies ? JSON.stringify(event.payload.relevantDependencies) : null,
      event.payload.relevantComponents ? JSON.stringify(event.payload.relevantComponents) : null,
      event.payload.architecture ? JSON.stringify(event.payload.architecture) : null,
      event.payload.filesToBeCreated ? JSON.stringify(event.payload.filesToBeCreated) : null,
      event.payload.filesToBeChanged ? JSON.stringify(event.payload.filesToBeChanged) : null,
      event.payload.nextGoalId ?? null,
      JSON.stringify([]) // progress - initialized as empty array
    );
  }
}
