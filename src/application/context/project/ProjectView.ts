/**
 * ProjectView - Read model for project queries.
 *
 * This is the materialized view stored in SQLite for efficient querying.
 * Rebuilt from events when needed.
 */

import { UUID, ISO8601 } from "../../../domain/BaseEvent.js";

export interface ProjectView {
  projectId: UUID;
  name: string;
  purpose: string | null;
  version: number; // For event sourcing
  createdAt: ISO8601; // From first event timestamp
  updatedAt: ISO8601; // From latest event timestamp
}
