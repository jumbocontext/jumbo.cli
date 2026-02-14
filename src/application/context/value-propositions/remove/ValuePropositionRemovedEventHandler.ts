import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ValuePropositionRemovedEvent } from "../../../../domain/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { IValuePropositionRemovedProjector } from "./IValuePropositionRemovedProjector.js";

/**
 * Event handler for ValuePropositionRemovedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is removed. Subscribes to ValuePropositionRemovedEvent via event bus.
 */
export class ValuePropositionRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IValuePropositionRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionRemovedEvent = event as ValuePropositionRemovedEvent;
    await this.projector.applyValuePropositionRemoved(valuePropositionRemovedEvent);
  }
}
