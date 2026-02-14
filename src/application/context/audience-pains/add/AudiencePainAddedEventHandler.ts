import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { AudiencePainAddedEvent } from "../../../../domain/audience-pains/add/AudiencePainAddedEvent.js";
import { IAudiencePainAddedProjector } from "./IAudiencePainAddedProjector.js";

/**
 * Event handler for AudiencePainAddedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a new audience pain is added. Subscribes to AudiencePainAddedEvent via event bus.
 */
export class AudiencePainAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IAudiencePainAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const audiencePainAddedEvent = event as AudiencePainAddedEvent;
    await this.projector.applyAudiencePainAdded(audiencePainAddedEvent);
  }
}
