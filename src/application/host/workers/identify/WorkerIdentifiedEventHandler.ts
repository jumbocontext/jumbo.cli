import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { WorkerIdentifiedEvent } from "../../../../domain/workers/identify/WorkerIdentifiedEvent.js";
import { IWorkerIdentifiedProjector } from "./IWorkerIdentifiedProjector.js";

/**
 * Event handler for WorkerIdentifiedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a worker is identified. Subscribes to WorkerIdentifiedEvent via event bus.
 */
export class WorkerIdentifiedEventHandler implements IEventHandler {
  constructor(private readonly projector: IWorkerIdentifiedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const workerIdentifiedEvent = event as WorkerIdentifiedEvent;
    await this.projector.applyWorkerIdentified(workerIdentifiedEvent);
  }
}
