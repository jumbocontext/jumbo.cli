/**
 * AudiencePainView - Materialized view for audience pain projections.
 *
 * Represents the current state of an AudiencePain aggregate as a queryable view.
 * Used for read operations without rehydrating from event history.
 */

import { UUID, ISO8601 } from "../../../domain/BaseEvent.js";
import { AudiencePainStatusType } from "../../../domain/audience-pains/Constants.js";

export interface AudiencePainView {
  painId: UUID;
  title: string;
  description: string;
  status: AudiencePainStatusType;
  resolvedAt: ISO8601 | null;
  version: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
