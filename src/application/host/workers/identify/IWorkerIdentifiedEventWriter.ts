import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

/**
 * Port interface for writing WorkerIdentifiedEvent to the event store.
 */
export interface IWorkerIdentifiedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
