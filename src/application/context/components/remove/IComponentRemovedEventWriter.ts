import { ComponentRemovedEvent } from "../../../../domain/components/remove/ComponentRemovedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IComponentRemovedEventWriter {
  append(event: ComponentRemovedEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
