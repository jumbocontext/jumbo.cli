import { UUID, ISO8601 } from "../../../domain/BaseEvent.js";

/**
 * Read model for value proposition queries
 * Materialized view stored in SQLite
 */
export interface ValuePropositionView {
  readonly valuePropositionId: UUID;
  readonly title: string;
  readonly description: string;
  readonly benefit: string;
  readonly measurableOutcome: string | null;
  readonly version: number;
  readonly createdAt: ISO8601;
  readonly updatedAt: ISO8601;
}
