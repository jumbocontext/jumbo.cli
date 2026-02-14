import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DependencyAddedEvent } from "../../../../domain/dependencies/add/DependencyAddedEvent.js";
import { IDependencyAddedProjector } from "./IDependencyAddedProjector.js";

/**
 * Event handler for DependencyAddedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a new dependency is added. Subscribes to DependencyAddedEvent via event bus.
 */
export class DependencyAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDependencyAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const dependencyAddedEvent = event as DependencyAddedEvent;
    await this.projector.applyDependencyAdded(dependencyAddedEvent);
  }
}
