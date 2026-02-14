import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudiencePainUpdatedEvent } from "../../../../domain/audience-pains/update/AudiencePainUpdatedEvent.js";
import { IAudiencePainUpdatedProjector } from "./IAudiencePainUpdatedProjector.js";

/**
 * Event handler for AudiencePainUpdatedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when an audience pain is updated. Subscribes to AudiencePainUpdatedEvent via event bus.
 */
export class AudiencePainUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudiencePainUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainUpdatedEvent = event as AudiencePainUpdatedEvent;
    await this.projector.applyAudiencePainUpdated(audiencePainUpdatedEvent);
  }
}
