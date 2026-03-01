import { WorkerIdentifiedEvent } from "../../../../domain/workers/identify/WorkerIdentifiedEvent.js";

/**
 * Port interface for projecting WorkerIdentifiedEvent to the read model.
 */
export interface IWorkerIdentifiedProjector {
  applyWorkerIdentified(event: WorkerIdentifiedEvent): Promise<void>;
}
