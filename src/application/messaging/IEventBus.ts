/**
 * Interface for event bus that decouples event publishers from handlers.
 * Enables true event-driven architecture with pub/sub pattern.
 */

import { BaseEvent } from "../../domain/BaseEvent";
import { IEventHandler } from "./IEventHandler";

export interface IEventBus {
  /**
   * Registers a handler for a specific event type or wildcard.
   * @param eventType - The event type (e.g., "GoalAddedEvent") or "*" for all events
   * @param handler - The handler to invoke when matching events are published
   */
  subscribe(eventType: string, handler: IEventHandler): void;

  /**
   * Publishes a domain event to all registered handlers.
   * Executes handlers in parallel, logging errors without blocking other handlers.
   * @param event - The pure domain event (no infrastructure metadata like seq)
   */
  publish(event: BaseEvent): Promise<void>;
}
