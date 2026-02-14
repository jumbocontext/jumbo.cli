/**
 * Port interface for projecting ProjectUpdated events.
 * Infrastructure layer will implement this.
 */

import { ProjectUpdatedEvent } from "../../../../domain/project/update/ProjectUpdatedEvent.js";

export interface IProjectUpdatedProjector {
  /**
   * Applies a ProjectUpdated event to update the materialized view.
   */
  applyProjectUpdated(event: ProjectUpdatedEvent): Promise<void>;
}
