import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudienceRemovedEvent } from "../../../../domain/audiences/remove/AudienceRemovedEvent.js";
import { IAudienceRemovedProjector } from "./IAudienceRemovedProjector.js";

/**
 * Event handler for AudienceRemovedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience is removed. Subscribes to AudienceRemovedEvent via event bus.
 */
export class AudienceRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudienceRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audienceRemovedEvent = event as AudienceRemovedEvent;
    await this.projector.applyAudienceRemoved(audienceRemovedEvent);
  }
}
