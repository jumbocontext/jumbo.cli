import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudienceAddedEvent } from "../../../../domain/audiences/add/AudienceAddedEvent.js";
import { IAudienceAddedProjector } from "./IAudienceAddedProjector.js";

/**
 * Event handler for AudienceAddedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a new audience is added. Subscribes to AudienceAddedEvent via event bus.
 */
export class AudienceAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceAddedEvent = event as AudienceAddedEvent;
    await this.projector.applyAudienceAdded(audienceAddedEvent);
  }
}
