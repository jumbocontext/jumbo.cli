/**
 * AudienceView - Materialized view for audience projections.
 *
 * Represents the current state of an Audience aggregate as a queryable view.
 * Used for read operations without rehydrating from event history.
 */

import { UUID, ISO8601 } from "../../../domain/BaseEvent.js";
import { AudiencePriorityType } from "../../../domain/audiences/Constants.js";

export interface AudienceView {
  audienceId: UUID;
  name: string;
  description: string;
  priority: AudiencePriorityType;
  isRemoved: boolean;
  version: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
