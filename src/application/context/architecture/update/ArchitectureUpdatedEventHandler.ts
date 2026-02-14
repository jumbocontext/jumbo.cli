import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ArchitectureUpdatedEvent } from "../../../../domain/architecture/update/ArchitectureUpdatedEvent.js";
import { IArchitectureUpdatedProjector } from "./IArchitectureUpdatedProjector.js";

/**
 * Event handler for ArchitectureUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when architecture is updated. Subscribes to ArchitectureUpdatedEvent via event bus.
 */
export class ArchitectureUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IArchitectureUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const architectureUpdatedEvent = event as ArchitectureUpdatedEvent;
    await this.projector.applyArchitectureUpdated(architectureUpdatedEvent);
  }
}
