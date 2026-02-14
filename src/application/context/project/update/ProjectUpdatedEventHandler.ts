import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ProjectUpdatedEvent } from "../../../../domain/project/update/ProjectUpdatedEvent.js";
import { IProjectUpdatedProjector } from "./IProjectUpdatedProjector.js";

/**
 * Event handler for ProjectUpdated event.
 *
 * Application layer handler that orchestrates projection updates
 * when a project is updated. Subscribes to ProjectUpdated via event bus.
 */
export class ProjectUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IProjectUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const projectUpdatedEvent = event as ProjectUpdatedEvent;
    await this.projector.applyProjectUpdated(projectUpdatedEvent);
  }
}
