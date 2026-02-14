import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { RelationAddedEvent } from "../../../../domain/relations/add/RelationAddedEvent.js";
import { IRelationAddedProjector } from "./IRelationAddedProjector.js";

/**
 * Event handler for RelationAddedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a relation is added. Subscribes to RelationAddedEvent via event bus.
 */
export class RelationAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationAddedEvent = event as RelationAddedEvent;
    await this.projector.applyRelationAdded(relationAddedEvent);
  }
}
