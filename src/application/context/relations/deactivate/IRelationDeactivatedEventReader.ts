import { BaseEvent } from "../../../../domain/BaseEvent.js";

export interface IRelationDeactivatedEventReader {
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
