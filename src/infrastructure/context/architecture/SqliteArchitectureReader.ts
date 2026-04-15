/**
 * SqliteArchitectureReader - SQLite reader for architecture context
 *
 * Used by GetGoalContextQueryHandler to retrieve global architecture.
 */

import { Database } from "better-sqlite3";
import { IArchitectureReader } from "../../../application/context/architecture/IArchitectureReader.js";
import { ArchitectureView } from "../../../application/context/architecture/ArchitectureView.js";

export class SqliteArchitectureReader implements IArchitectureReader {
  constructor(private readonly db: Database) {}

  async find(): Promise<ArchitectureView | null> {
    const row = this.db
      .prepare("SELECT * FROM architecture_views WHERE architectureId = ?")
      .get("architecture");

    if (!row) {
      return null;
    }

    const r = row as Record<string, unknown>;
    return {
      architectureId: r.architectureId as string,
      description: r.description as string,
      organization: r.organization as string,
      patterns: JSON.parse((r.patterns as string) || "[]"),
      principles: JSON.parse((r.principles as string) || "[]"),
      dataStores: JSON.parse((r.dataStores as string) || "[]"),
      stack: JSON.parse((r.stack as string) || "[]"),
      deprecated: (r.deprecated as number) === 1,
      version: r.version as number,
      createdAt: r.createdAt as string,
      updatedAt: r.updatedAt as string,
    };
  }
}
