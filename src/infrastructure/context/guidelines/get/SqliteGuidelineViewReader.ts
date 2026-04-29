/**
 * SqliteGuidelineViewReader - SQLite reader for listing guidelines.
 *
 * Implements IGuidelineViewReader for retrieving guideline list
 * from the SQLite read model with optional category filtering.
 */

import { Database } from "better-sqlite3";
import { IGuidelineViewReader } from "../../../../application/context/guidelines/get/IGuidelineViewReader.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { GuidelineRecord } from "../GuidelineRecord.js";
import { GuidelineRecordMapper } from "../GuidelineRecordMapper.js";

export class SqliteGuidelineViewReader implements IGuidelineViewReader {
  private readonly mapper = new GuidelineRecordMapper();

  constructor(private db: Database) {}

  async findAll(category?: string): Promise<GuidelineView[]> {
    let query = "SELECT * FROM guideline_views WHERE isRemoved = 0";
    const params: string[] = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY category, createdAt ASC";

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  async findByIds(ids: string[]): Promise<GuidelineView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM guideline_views WHERE guidelineId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) => this.mapper.toView(this.mapRowToRecord(row as Record<string, unknown>)));
  }

  private mapRowToRecord(row: Record<string, unknown>): GuidelineRecord {
    return {
      id: row.guidelineId as string,
      category: row.category as string,
      title: row.title as string,
      description: row.description as string,
      rationale: row.rationale as string,
      examples: (row.examples as string) || "[]",
      isRemoved: row.isRemoved as number,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
