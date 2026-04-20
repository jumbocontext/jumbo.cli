/**
 * Interface for event handlers that subscribe to domain events via the event bus.
 * Handlers can subscribe to specific event types or use wildcard '*' for all events.
 */

import { BaseEvent } from "../../domain/BaseEvent.js";

export interface IEventHandler {
  /**
   * Handles a domain event.
   * @param event - The domain event to handle
   * @throws Error if handler fails (will be caught and logged by event bus)
   */
  handle(event: BaseEvent): Promise<void>;
}
