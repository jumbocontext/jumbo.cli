import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ComponentUndeprecatedEvent } from "../../../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IComponentUndeprecatedEventWriter {
  append(event: ComponentUndeprecatedEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
