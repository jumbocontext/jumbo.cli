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
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalRemovedProjector
  implements IGoalRemovedProjector, IGoalRemoveReader
{
  private readonly mapper = new GoalRecordMapper();

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
      .get(goalId) as GoalRecord | undefined;
    return row ? this.mapper.toView(row) : null;
  }
}
