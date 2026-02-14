/**
 * SqliteProjectContextReader - SQLite reader for project context queries.
 */

import { Database } from "better-sqlite3";
import { IProjectContextReader } from "../../../../application/context/project/query/IProjectContextReader.js";
import { ProjectView } from "../../../../application/context/project/ProjectView.js";

export class SqliteProjectContextReader implements IProjectContextReader {
  constructor(private db: Database) {}

  async getProject(): Promise<ProjectView | null> {
    const row = this.db
      .prepare("SELECT * FROM project_views LIMIT 1")
      .get();
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ProjectView {
    return {
      projectId: row.projectId as string,
      name: row.name as string,
      purpose: (row.purpose as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
