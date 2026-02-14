import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudienceUpdatedEvent } from "../../../../domain/audiences/update/AudienceUpdatedEvent.js";
import { IAudienceUpdatedProjector } from "./IAudienceUpdatedProjector.js";

/**
 * Event handler for AudienceUpdatedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience is updated. Subscribes to AudienceUpdatedEvent via event bus.
 */
export class AudienceUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceUpdatedEvent = event as AudienceUpdatedEvent;
    await this.projector.applyAudienceUpdated(audienceUpdatedEvent);
  }
}
