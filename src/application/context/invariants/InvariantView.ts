/**
 * InvariantView - Read model for invariant queries.
 *
 * This is the materialized view stored in SQLite for efficient querying.
 * Rebuilt from events when needed.
 */

import { UUID, ISO8601 } from "../../../domain/BaseEvent.js";

export interface InvariantView {
  invariantId: UUID;
  title: string;
  description: string;
  rationale: string | null;
  version: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
