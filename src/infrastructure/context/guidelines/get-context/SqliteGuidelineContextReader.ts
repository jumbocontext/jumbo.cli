/**
 * SqliteGuidelineContextReader - SQLite reader for guideline context queries.
 */

import { Database } from "better-sqlite3";
import { IGuidelineContextReader } from "../../../../application/context/goals/get-context/IGuidelineContextReader.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export class SqliteGuidelineContextReader implements IGuidelineContextReader {
  constructor(private db: Database) {}

  async findAll(): Promise<GuidelineView[]> {
    const rows = this.db
      .prepare("SELECT * FROM guideline_views ORDER BY createdAt DESC")
      .all();
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  async findAllActive(): Promise<GuidelineView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM guideline_views WHERE isRemoved = 0 ORDER BY createdAt DESC"
      )
      .all();
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  async findByIds(ids: string[]): Promise<GuidelineView[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM guideline_views WHERE guidelineId IN (${placeholders}) ORDER BY createdAt DESC`;
    const rows = this.db.prepare(query).all(...ids);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): GuidelineView {
    return {
      guidelineId: row.guidelineId as string,
      category: row.category as GuidelineCategoryValue,
      title: row.title as string,
      description: row.description as string,
      rationale: row.rationale as string,
      enforcement: row.enforcement as string,
      examples: JSON.parse((row.examples as string) || "[]"),
      isRemoved: (row.isRemoved as number) === 1,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
