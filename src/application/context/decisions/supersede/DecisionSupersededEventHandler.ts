import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionSupersededEvent } from "../../../../domain/decisions/supersede/DecisionSupersededEvent.js";
import { IDecisionSupersededProjector } from "./IDecisionSupersededProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionSuperseded events.
 * Subscribes to events via event bus.
 */
export class DecisionSupersededEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionSupersededProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionSupersededEvent = event as DecisionSupersededEvent;
    await this.projector.applyDecisionSuperseded(decisionSupersededEvent);
  }
}
