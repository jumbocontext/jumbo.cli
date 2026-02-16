/**
 * SqliteGoalStatusReader - SQLite reader for goal status queries.
 *
 * Implements IGoalStatusReader for reading goals by status.
 */

import { Database } from "better-sqlite3";
import { GoalStatusType } from "../../../domain/goals/Constants.js";
import { IGoalStatusReader } from "../../../application/context/goals/IGoalStatusReader.js";
import { GoalView } from "../../../application/context/goals/GoalView.js";
import { GoalRecord } from "./GoalRecord.js";
import { GoalRecordMapper } from "./GoalRecordMapper.js";

export class SqliteGoalStatusReader
  implements IGoalStatusReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async findByStatus(status: GoalStatusType): Promise<GoalView[]> {
    const rows = this.db
      .prepare(
        "SELECT *, goalId AS id FROM goal_views WHERE status = ? ORDER BY createdAt DESC"
      )
      .all(status) as GoalRecord[];
    return rows.map((row) => this.mapper.toView(row));
  }

  async findAll(): Promise<GoalView[]> {
    const rows = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views ORDER BY createdAt DESC")
      .all() as GoalRecord[];
    return rows.map((row) => this.mapper.toView(row));
  }

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views WHERE goalId = ?")
      .get(goalId) as GoalRecord | undefined;
    return row ? this.mapper.toView(row) : null;
  }
}
