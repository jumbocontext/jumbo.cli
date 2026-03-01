/**
 * Tests for SqliteWorkerIdentityRegistry
 */

import Database from "better-sqlite3";
import { SqliteWorkerIdentityRegistry } from "../../../../src/infrastructure/host/workers/SqliteWorkerIdentityRegistry";
import { HostSessionKeyResolver, HostSessionKeyResult } from "../../../../src/infrastructure/host/session/HostSessionKeyResolver";
import { IWorkerIdentifiedEventWriter } from "../../../../src/application/host/workers/identify/IWorkerIdentifiedEventWriter";
import { IEventBus } from "../../../../src/application/messaging/IEventBus";

// Mock HostSessionKeyResolver for controlled testing
class MockHostSessionKeyResolver extends HostSessionKeyResolver {
  private mockKey: string;

  constructor(mockKey: string) {
    super();
    this.mockKey = mockKey;
  }

  override resolve(): HostSessionKeyResult {
    return {
      key: this.mockKey,
      parts: [{ source: "MOCK", value: this.mockKey }],
    };
  }
}

function createWorkersTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      workerId TEXT PRIMARY KEY,
      hostSessionKey TEXT NOT NULL UNIQUE,
      mode TEXT,
      createdAt TEXT NOT NULL,
      lastSeenAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_workers_host_session_key ON workers(hostSessionKey);
  `);
}

function createMockEventWriter(): jest.Mocked<IWorkerIdentifiedEventWriter> {
  return {
    append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
  };
}

function createMockEventBus(): jest.Mocked<IEventBus> {
  return {
    subscribe: jest.fn(),
    publish: jest.fn().mockResolvedValue(undefined),
  };
}

describe("SqliteWorkerIdentityRegistry", () => {
  let db: Database.Database;
  let eventWriter: jest.Mocked<IWorkerIdentifiedEventWriter>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    db = new Database(":memory:");
    createWorkersTable(db);
    eventWriter = createMockEventWriter();
    eventBus = createMockEventBus();
  });

  afterEach(() => {
    db.close();
  });

  describe("workerId property", () => {
    it("returns a valid UUID workerId", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-key-1");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      const workerId = registry.workerId;

      // UUID v4 format
      expect(workerId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("returns same workerId on multiple accesses", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-key-2");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      const workerId1 = registry.workerId;
      const workerId2 = registry.workerId;
      const workerId3 = registry.workerId;

      expect(workerId1).toBe(workerId2);
      expect(workerId2).toBe(workerId3);
    });

    it("returns same workerId for same hostSessionKey across instances when row exists", () => {
      const sessionKey = "persistent-session-key";
      // Seed existing worker (simulates projector having run after first identification)
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_persistent", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver1 = new MockHostSessionKeyResolver(sessionKey);
      const resolver2 = new MockHostSessionKeyResolver(sessionKey);

      const registry1 = new SqliteWorkerIdentityRegistry(db, resolver1, eventWriter, eventBus);
      const workerId1 = registry1.workerId;

      const registry2 = new SqliteWorkerIdentityRegistry(db, resolver2, eventWriter, eventBus);
      const workerId2 = registry2.workerId;

      expect(workerId1).toBe(workerId2);
      expect(workerId1).toBe("worker_persistent");
    });

    it("returns different workerIds for different hostSessionKeys", () => {
      const resolver1 = new MockHostSessionKeyResolver("session-key-a");
      const resolver2 = new MockHostSessionKeyResolver("session-key-b");

      const registry1 = new SqliteWorkerIdentityRegistry(db, resolver1, eventWriter, eventBus);
      const registry2 = new SqliteWorkerIdentityRegistry(db, resolver2, eventWriter, eventBus);

      const workerId1 = registry1.workerId;
      const workerId2 = registry2.workerId;

      expect(workerId1).not.toBe(workerId2);
    });

    it("appends WorkerIdentifiedEvent when creating new worker", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-event");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.workerId;

      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      expect(eventWriter.append).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "WorkerIdentifiedEvent",
          payload: expect.objectContaining({
            hostSessionKey: "test-session-event",
            mode: null,
          }),
        })
      );
    });

    it("publishes WorkerIdentifiedEvent to event bus when creating new worker", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-publish");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.workerId;

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "WorkerIdentifiedEvent",
          payload: expect.objectContaining({
            hostSessionKey: "test-session-publish",
          }),
        })
      );
    });

    it("appends WorkerIdentifiedEvent when re-identifying existing worker", () => {
      const sessionKey = "test-session-re-identify";
      // Seed existing worker
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_existing", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.workerId;

      expect(eventWriter.append).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe("persistence", () => {
    it("persists worker entry to SQLite via event", () => {
      const sessionKey = "test-session-for-persistence";
      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      const workerId = registry.workerId;

      // The event is fired-and-forgotten (async), but the registry also seeds the read model
      // for new workers via the projector triggered by event bus publish.
      // However, since we mock the event bus, the row won't exist via projection.
      // The registry reads from DB first and only creates via event for new workers.
      // With mocked event bus, the projector never runs, so verify the event was published.
      expect(eventWriter.append).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: workerId,
          type: "WorkerIdentifiedEvent",
        })
      );
    });

    it("updates lastSeenAt on subsequent accesses via event", async () => {
      const sessionKey = "test-session-for-lastseen";
      // Seed existing worker
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_lastseen", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.workerId;

      // Verify event was appended for the re-identification
      expect(eventWriter.append).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: "worker_lastseen",
          type: "WorkerIdentifiedEvent",
        })
      );
    });

    it("handles multiple workers in same database", () => {
      // Seed workers into DB so they exist for resolution
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_1", "worker-1-key", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_2", "worker-2-key", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_3", "worker-3-key", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver1 = new MockHostSessionKeyResolver("worker-1-key");
      const resolver2 = new MockHostSessionKeyResolver("worker-2-key");
      const resolver3 = new MockHostSessionKeyResolver("worker-3-key");

      const registry1 = new SqliteWorkerIdentityRegistry(db, resolver1, eventWriter, eventBus);
      const registry2 = new SqliteWorkerIdentityRegistry(db, resolver2, eventWriter, eventBus);
      const registry3 = new SqliteWorkerIdentityRegistry(db, resolver3, eventWriter, eventBus);

      const workerId1 = registry1.workerId;
      const workerId2 = registry2.workerId;
      const workerId3 = registry3.workerId;

      expect(workerId1).not.toBe(workerId2);
      expect(workerId2).not.toBe(workerId3);
      expect(workerId1).not.toBe(workerId3);
    });
  });

  describe("worker mode", () => {
    it("returns null mode for new worker", () => {
      const resolver = new MockHostSessionKeyResolver("test-session-mode");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      // We need the worker in the DB for getMode to find it
      // Since event bus is mocked, manually seed
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_mode", "test-session-mode", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      expect(registry.getMode()).toBeNull();
    });

    it("returns null mode when worker does not exist", () => {
      const resolver = new MockHostSessionKeyResolver("nonexistent-session");
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      expect(registry.getMode()).toBeNull();
    });

    it("sets and gets worker mode", () => {
      const sessionKey = "test-session-setmode";
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_setmode", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.setMode("implement");

      expect(registry.getMode()).toBe("implement");
    });

    it("updates mode between values", () => {
      const sessionKey = "test-session-update-mode";
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_update_mode", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.setMode("plan");
      expect(registry.getMode()).toBe("plan");

      registry.setMode("implement");
      expect(registry.getMode()).toBe("implement");

      registry.setMode("review");
      expect(registry.getMode()).toBe("review");

      registry.setMode("codify");
      expect(registry.getMode()).toBe("codify");
    });

    it("clears mode when set to null", () => {
      const sessionKey = "test-session-clear-mode";
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_clear_mode", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.setMode("implement");
      expect(registry.getMode()).toBe("implement");

      registry.setMode(null);
      expect(registry.getMode()).toBeNull();
    });

    it("persists mode in SQLite", () => {
      const sessionKey = "test-session-persist-mode";
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_persist_mode", sessionKey, null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver = new MockHostSessionKeyResolver(sessionKey);
      const registry = new SqliteWorkerIdentityRegistry(db, resolver, eventWriter, eventBus);

      registry.setMode("review");

      const row = db
        .prepare("SELECT mode FROM workers WHERE hostSessionKey = ?")
        .get(sessionKey) as { mode: string | null };

      expect(row.mode).toBe("review");
    });

    it("mode is independent per worker", () => {
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_mode_1", "worker-mode-1", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");
      db.prepare(
        "INSERT INTO workers (workerId, hostSessionKey, mode, createdAt, lastSeenAt) VALUES (?, ?, ?, ?, ?)"
      ).run("worker_mode_2", "worker-mode-2", null, "2026-03-01T08:00:00.000Z", "2026-03-01T08:00:00.000Z");

      const resolver1 = new MockHostSessionKeyResolver("worker-mode-1");
      const resolver2 = new MockHostSessionKeyResolver("worker-mode-2");

      const registry1 = new SqliteWorkerIdentityRegistry(db, resolver1, eventWriter, eventBus);
      const registry2 = new SqliteWorkerIdentityRegistry(db, resolver2, eventWriter, eventBus);

      registry1.setMode("plan");
      registry2.setMode("implement");

      expect(registry1.getMode()).toBe("plan");
      expect(registry2.getMode()).toBe("implement");
    });
  });
});
