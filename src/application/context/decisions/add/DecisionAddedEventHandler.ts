import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";
import { IDecisionAddedProjector } from "./IDecisionAddedProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionAdded events.
 * Subscribes to events via event bus.
 */
export class DecisionAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionAddedEvent = event as DecisionAddedEvent;
    await this.projector.applyDecisionAdded(decisionAddedEvent);
  }
}
