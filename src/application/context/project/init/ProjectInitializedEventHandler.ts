import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { ProjectInitializedEvent } from "../../../../domain/project/init/ProjectInitializedEvent.js";
import { IProjectInitializedProjector } from "./IProjectInitializedProjector.js";

/**
 * Event handler for ProjectInitialized event.
 *
 * Application layer handler that orchestrates projection updates
 * when a project is initialized. Subscribes to ProjectInitialized via event bus.
 */
export class ProjectInitializedEventHandler implements IEventHandler {
  constructor(private readonly projector: IProjectInitializedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const projectInitializedEvent = event as ProjectInitializedEvent;
    await this.projector.applyProjectInitialized(projectInitializedEvent);
  }
}
