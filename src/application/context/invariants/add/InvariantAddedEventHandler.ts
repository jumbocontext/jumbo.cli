import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { InvariantAddedEvent } from "../../../../domain/invariants/add/InvariantAddedEvent.js";
import { IInvariantAddedProjector } from "./IInvariantAddedProjector.js";

/**
 * Event handler for InvariantAddedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when an invariant is added. Subscribes to InvariantAddedEvent via event bus.
 */
export class InvariantAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IInvariantAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const invariantAddedEvent = event as InvariantAddedEvent;
    await this.projector.applyInvariantAdded(invariantAddedEvent);
  }
}
