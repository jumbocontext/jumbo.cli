import { BaseEvent } from "../../../../domain/BaseEvent.js";

export interface IRelationReactivatedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
