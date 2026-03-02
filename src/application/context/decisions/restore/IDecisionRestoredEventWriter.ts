import { DecisionRestoredEvent } from "../../../../domain/decisions/restore/DecisionRestoredEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AppendResult } from "../../../persistence/IEventStore.js";

export interface IDecisionRestoredEventWriter {
  append(event: DecisionRestoredEvent): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
