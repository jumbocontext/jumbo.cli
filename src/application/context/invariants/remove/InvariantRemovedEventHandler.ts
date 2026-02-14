import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { InvariantRemovedEvent } from "../../../../domain/invariants/remove/InvariantRemovedEvent.js";
import { IInvariantRemovedProjector } from "./IInvariantRemovedProjector.js";

/**
 * Event handler for InvariantRemovedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when an invariant is removed. Subscribes to InvariantRemovedEvent via event bus.
 */
export class InvariantRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IInvariantRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const invariantRemovedEvent = event as InvariantRemovedEvent;
    await this.projector.applyInvariantRemoved(invariantRemovedEvent);
  }
}
