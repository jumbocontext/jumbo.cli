import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { RelationRemovedEvent } from "../../../../domain/relations/remove/RelationRemovedEvent.js";
import { IRelationRemovedProjector } from "./IRelationRemovedProjector.js";

/**
 * Event handler for RelationRemovedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a relation is removed. Subscribes to RelationRemovedEvent via event bus.
 */
export class RelationRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationRemovedEvent = event as RelationRemovedEvent;
    await this.projector.applyRelationRemoved(relationRemovedEvent);
  }
}
