/**
 * Read model for Decision aggregate.
 * Represents the materialized view stored in SQLite.
 */
export interface DecisionView {
  readonly decisionId: string;
  readonly title: string;
  readonly context: string;
  readonly rationale: string | null;
  readonly alternatives: string[];
  readonly consequences: string | null;
  readonly status: 'active' | 'reversed' | 'superseded';
  readonly supersededBy: string | null;
  readonly reversalReason: string | null;
  readonly reversedAt: string | null;  // ISO8601 timestamp when decision was reversed
  readonly version: number;
  readonly createdAt: string;     // ISO8601
  readonly updatedAt: string;     // ISO8601
}
