import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ValuePropositionAddedEvent } from "../../../../domain/value-propositions/add/ValuePropositionAddedEvent.js";
import { IValuePropositionAddedProjector } from "./IValuePropositionAddedProjector.js";

/**
 * Event handler for ValuePropositionAddedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is added. Subscribes to ValuePropositionAddedEvent via event bus.
 */
export class ValuePropositionAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IValuePropositionAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionAddedEvent = event as ValuePropositionAddedEvent;
    await this.projector.applyValuePropositionAdded(valuePropositionAddedEvent);
  }
}
