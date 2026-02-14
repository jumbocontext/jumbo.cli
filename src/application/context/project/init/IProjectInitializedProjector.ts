/**
 * Port interface for projecting ProjectInitialized events.
 * Infrastructure layer will implement this.
 */

import { ProjectInitializedEvent } from "../../../../domain/project/init/ProjectInitializedEvent.js";

export interface IProjectInitializedProjector {
  /**
   * Applies a ProjectInitialized event to update the materialized view.
   */
  applyProjectInitialized(event: ProjectInitializedEvent): Promise<void>;
}
