/**
 * SqliteGuidelineListReader - SQLite reader for listing guidelines.
 *
 * Implements IGuidelineListReader for retrieving guideline list
 * from the SQLite read model with optional category filtering.
 */

import { Database } from "better-sqlite3";
import { IGuidelineListReader } from "../../../../application/context/guidelines/list/IGuidelineListReader.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export class SqliteGuidelineListReader implements IGuidelineListReader {
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
      isRemoved: Boolean(row.isRemoved),
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
