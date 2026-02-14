import { ComponentUpdatedEvent } from "../../../../domain/components/update/ComponentUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IComponentUpdatedEventWriter {
  append(event: ComponentUpdatedEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
