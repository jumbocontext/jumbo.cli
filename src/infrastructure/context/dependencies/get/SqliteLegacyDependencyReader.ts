import { Database } from "better-sqlite3";
import { ILegacyDependencyReader } from "../../../../application/maintenance/migrate-dependencies/ILegacyDependencyReader.js";
import { LegacyDependencyCandidate } from "../../../../application/maintenance/migrate-dependencies/LegacyDependencyCandidate.js";

/**
 * SQLite reader for legacy component-coupling dependency records.
 * Queries dependency_views for rows that have consumerId and providerId set,
 * indicating they are legacy component-coupling records rather than external dependencies.
 */
export class SqliteLegacyDependencyReader implements ILegacyDependencyReader {
  constructor(private readonly db: Database) {}

  async findLegacyCouplings(): Promise<LegacyDependencyCandidate[]> {
    const query = `
      SELECT dependencyId, consumerId, providerId, endpoint, contract, status
      FROM dependency_views
      WHERE consumerId IS NOT NULL AND providerId IS NOT NULL
      ORDER BY createdAt ASC
    `;

    const rows = this.db.prepare(query).all() as Array<{
      dependencyId: string;
      consumerId: string;
      providerId: string;
      endpoint: string | null;
      contract: string | null;
      status: string;
    }>;

    return rows.map((row) => ({
      dependencyId: row.dependencyId,
      consumerId: row.consumerId,
      providerId: row.providerId,
      endpoint: row.endpoint,
      contract: row.contract,
      status: row.status,
    }));
  }
}
