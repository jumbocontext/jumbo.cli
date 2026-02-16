/**
 * TEMPORARY WORKAROUND - DO NOT USE IN PRODUCTION
 *
 * This event bus addresses a race condition during database rebuild where
 * cross-aggregate projection handlers
 * attempt to read from projections (e.g., goal_views) while primary handlers
 * are still writing to them.
 *
 * The root cause: InProcessEventBus executes handlers in parallel via Promise.all(),
 * which works fine during normal operations but causes issues during rebuild when
 * projections don't exist yet.
 *
 * This workaround forces sequential handler execution during rebuild only.
 * It does NOT fix the architectural issue that cross-aggregate projections
 * read from other projections instead of having events contain necessary data.
 *
 * REMOVAL PLAN:
 * This will be removed when Epic/Feature/Task redesign is complete, which will
 * address session continuity, goal continuity post-compaction, and portability
 * with a more robust event-driven architecture.
 *
 * @see LocalDatabaseRebuildService - Uses this during rebuild
 * @see InProcessEventBus - Normal parallel execution for regular operations
 */

import { IEventBus } from "../../application/messaging/IEventBus.js";
import { IEventHandler } from "../../application/messaging/IEventHandler.js";
import { BaseEvent } from "../../domain/BaseEvent.js";

/**
 * Event bus that executes handlers sequentially instead of in parallel.
 * Only use during database rebuild to avoid race conditions.
 */
export class TemporarySequentialRebuildEventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler[]>();

  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    // Get handlers for specific event type
    const specificHandlers = this.handlers.get(event.type) || [];

    // Get wildcard handlers (subscribe to all events)
    const wildcardHandlers = this.handlers.get("*") || [];

    // Combine all matching handlers
    const allHandlers = [...specificHandlers, ...wildcardHandlers];

    // Execute handlers SEQUENTIALLY instead of in parallel
    // This ensures handler N completes before handler N+1 starts,
    // preventing cross-aggregate projections from reading stale data
    for (const handler of allHandlers) {
      try {
        await handler.handle(event);
      } catch (err) {
        // Log error but don't throw - projections can be rebuilt
        console.error(`Handler error for event ${event.type}:`, err);
      }
    }
  }
}
