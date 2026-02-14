import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionReversedEvent } from "../../../../domain/decisions/reverse/DecisionReversedEvent.js";
import { IDecisionReversedProjector } from "./IDecisionReversedProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionReversed events.
 * Subscribes to events via event bus.
 */
export class DecisionReversedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionReversedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionReversedEvent = event as DecisionReversedEvent;
    await this.projector.applyDecisionReversed(decisionReversedEvent);
  }
}
