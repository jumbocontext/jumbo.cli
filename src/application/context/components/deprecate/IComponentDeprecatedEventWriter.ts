import { ComponentDeprecatedEvent } from "../../../../domain/components/deprecate/ComponentDeprecatedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IComponentDeprecatedEventWriter {
  append(event: ComponentDeprecatedEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
