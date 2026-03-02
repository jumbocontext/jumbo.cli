import { DecisionRestoredEvent } from "../../../../domain/decisions/restore/DecisionRestoredEvent.js";

export interface IDecisionRestoredProjector {
  applyDecisionRestored(event: DecisionRestoredEvent): Promise<void>;
}
