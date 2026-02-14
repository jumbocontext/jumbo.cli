import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { SessionEndedEvent } from "../../../../domain/sessions/end/SessionEndedEvent.js";
import { ISessionEndedProjector } from "./ISessionEndedProjector.js";

/**
 * Event handler for SessionEndedEvent event.
 *
 * Application layer handler that orchestrates projection updates
 * when a session is ended. Subscribes to SessionEndedEvent via event bus.
 */
export class SessionEndedEventHandler implements IEventHandler {
  constructor(private readonly projector: ISessionEndedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const sessionEndedEvent = event as SessionEndedEvent;
    await this.projector.applySessionEnded(sessionEndedEvent);
  }
}
