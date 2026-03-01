/**
 * SqliteWorkerIdentityRegistry - Event-sourced worker identity persistence
 *
 * Maps host session keys to worker IDs using the event-sourcing pattern.
 * Appends WorkerIdentifiedEvent to the file-based event store and publishes
 * to the event bus, which triggers the projector to update the SQLite read model.
 * Reads from the workers table for resolution.
 *
 * Key Design:
 * - Resolves workerId lazily on first property access and caches it
 * - Uses IWorkerIdentifiedEventWriter for event persistence
 * - Uses IEventBus for event publication (triggers projection)
 * - Reads from SQLite workers table (populated by projector)
 * - Implements IWorkerIdentityReader for application layer consumption
 * - Implements IWorkerModeAccessor for reading/writing worker mode
 * - Uses UUID v4 for generating new worker IDs
 */

import { Database } from "better-sqlite3";
import { randomUUID } from "crypto";
import { IWorkerIdentityReader } from "../../../application/host/workers/IWorkerIdentityReader.js";
import { IWorkerModeAccessor } from "../../../application/host/workers/IWorkerModeAccessor.js";
import { IWorkerIdentifiedEventWriter } from "../../../application/host/workers/identify/IWorkerIdentifiedEventWriter.js";
import { IEventBus } from "../../../application/messaging/IEventBus.js";
import { WorkerId } from "../../../application/host/workers/WorkerId.js";
import { WorkerMode } from "../../../application/host/workers/WorkerMode.js";
import { WorkerIdentifiedEvent, WorkerEventType } from "../../../domain/workers/identify/WorkerIdentifiedEvent.js";
import { HostSessionKeyResolver } from "../session/HostSessionKeyResolver.js";
import { WorkerRecord } from "./WorkerRecord.js";
import { WorkerRecordMapper } from "./WorkerRecordMapper.js";

export class SqliteWorkerIdentityRegistry implements IWorkerIdentityReader, IWorkerModeAccessor {
  private readonly db: Database;
  private readonly sessionKeyResolver: HostSessionKeyResolver;
  private readonly eventWriter: IWorkerIdentifiedEventWriter;
  private readonly eventBus: IEventBus;
  private readonly mapper: WorkerRecordMapper;
  private resolvedWorkerId: WorkerId | null = null;

  constructor(
    db: Database,
    sessionKeyResolver: HostSessionKeyResolver,
    eventWriter: IWorkerIdentifiedEventWriter,
    eventBus: IEventBus
  ) {
    this.db = db;
    this.sessionKeyResolver = sessionKeyResolver;
    this.eventWriter = eventWriter;
    this.eventBus = eventBus;
    this.mapper = new WorkerRecordMapper();
  }

  /**
   * Gets the unique identifier for the current worker.
   *
   * Lazily resolves the workerId on first access and caches it.
   * Subsequent calls return the cached value.
   */
  get workerId(): WorkerId {
    if (this.resolvedWorkerId === null) {
      this.resolvedWorkerId = this.resolveWorkerId();
    }
    return this.resolvedWorkerId;
  }

  /**
   * Gets the current mode of the worker.
   */
  getMode(): WorkerMode {
    const { key: hostSessionKey } = this.sessionKeyResolver.resolve();
    const row = this.db
      .prepare("SELECT workerId, hostSessionKey, mode, createdAt, lastSeenAt FROM workers WHERE hostSessionKey = ?")
      .get(hostSessionKey) as WorkerRecord | undefined;

    if (!row) {
      return null;
    }

    return this.mapper.toWorkerMode(row);
  }

  /**
   * Sets the operating mode of the current worker.
   */
  setMode(mode: WorkerMode): void {
    // Ensure worker exists by accessing workerId (triggers lazy resolution)
    const _ = this.workerId;
    const { key: hostSessionKey } = this.sessionKeyResolver.resolve();

    this.db
      .prepare("UPDATE workers SET mode = ? WHERE hostSessionKey = ?")
      .run(mode, hostSessionKey);
  }

  /**
   * Resolves the workerId for the current host session.
   *
   * Looks up the existing mapping in the read model or creates a new one
   * by appending a WorkerIdentifiedEvent and publishing it via the event bus.
   * Updates the lastSeenAt timestamp on each access via event.
   */
  private resolveWorkerId(): WorkerId {
    const { key: hostSessionKey } = this.sessionKeyResolver.resolve();

    const existingRow = this.db
      .prepare("SELECT workerId, hostSessionKey, mode, createdAt, lastSeenAt FROM workers WHERE hostSessionKey = ?")
      .get(hostSessionKey) as WorkerRecord | undefined;

    if (existingRow) {
      // Re-identify: append event to update lastSeenAt
      const event: WorkerIdentifiedEvent = {
        type: WorkerEventType.IDENTIFIED,
        aggregateId: existingRow.workerId,
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          hostSessionKey,
          mode: this.mapper.toWorkerMode(existingRow),
        },
      };
      this.eventWriter.append(event);
      this.eventBus.publish(event);

      return this.mapper.toWorkerId(existingRow);
    }

    // Create new worker entry via event
    const newWorkerId = randomUUID();
    const now = new Date().toISOString();

    const event: WorkerIdentifiedEvent = {
      type: WorkerEventType.IDENTIFIED,
      aggregateId: newWorkerId,
      version: 1,
      timestamp: now,
      payload: {
        hostSessionKey,
        mode: null,
      },
    };
    this.eventWriter.append(event);
    this.eventBus.publish(event);

    return this.mapper.toWorkerId({ workerId: newWorkerId, hostSessionKey, mode: null, createdAt: now, lastSeenAt: now });
  }
}
