/**
 * Port interface for writing ProjectInitialized events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ProjectInitializedEvent } from "../../../../domain/project/init/ProjectInitializedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IProjectInitializedEventWriter {
  /**
   * Appends a ProjectInitialized event to the event store.
   */
  append(event: ProjectInitializedEvent): Promise<AppendResult>;

  /**
   * Reads all events for a project aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
