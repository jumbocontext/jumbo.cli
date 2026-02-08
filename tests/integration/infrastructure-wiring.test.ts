import * as fs from "fs-extra";
import * as path from "path";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { BaseEvent } from "../../src/domain/BaseEvent.js";

describe("Infrastructure Wiring Integration", () => {
  let tmpDir: string;
  let host: Host;
  let container: IApplicationContainer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-integration-"));
    host = new Host(tmpDir);
    const builder = host.createBuilder();
    container = await builder.build();
  });

  afterEach(async () => {
    // Dispose of host resources for testing (production uses signal handlers)
    host.dispose();
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  it("Host creates all components", () => {
    expect(container.eventBus).toBeDefined();
    expect(container.eventStore).toBeDefined();
    expect(container.clock).toBeDefined();
  });

  it("appending to event store persists to file system", async () => {
    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event);

    // Verify event file created (seq added by FsEventStore)
    const filePath = path.join(
      tmpDir,
      "events",
      "test-1",
      "000001.TestEvent.json"
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("event persisted and readable from store", async () => {
    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event);

    // Read back from store (seq is stripped - pure domain event returned)
    const storedEvents = await container.eventStore.readStream("test-1");
    expect(storedEvents).toHaveLength(1);
    expect(storedEvents[0]).not.toHaveProperty("seq"); // Infrastructure metadata stripped
    expect(storedEvents[0].type).toBe("TestEvent");

    // But file on disk contains seq for ordering (infrastructure concern)
    const filePath = path.join(
      tmpDir,
      "events",
      "test-1",
      "000001.TestEvent.json"
    );
    const fileContent = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(fileContent.seq).toBe(1);
  });

  it("can read back multiple stored events", async () => {
    const event1: BaseEvent = {
      type: "Event1",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    const event2: BaseEvent = {
      type: "Event2",
      aggregateId: "test-1",
      version: 2,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event1);
    await container.eventStore.append(event2);

    // Events returned without seq (pure domain events)
    const storedEvents = await container.eventStore.readStream("test-1");
    expect(storedEvents).toHaveLength(2);
    expect(storedEvents[0].type).toBe("Event1");
    expect(storedEvents[1].type).toBe("Event2");
    expect(storedEvents[0]).not.toHaveProperty("seq");
    expect(storedEvents[1]).not.toHaveProperty("seq");
  });

  it("clock returns ISO8601 timestamps", () => {
    const timestamp = container.clock.nowIso();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("events from different aggregates are isolated", async () => {
    // Explicit append (command handler pattern)
    await container.eventStore.append({
      type: "Event1",
      aggregateId: "aggregate-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    });

    await container.eventStore.append({
      type: "Event2",
      aggregateId: "aggregate-2",
      version: 1,
      timestamp: container.clock.nowIso(),
    });

    const stream1 = await container.eventStore.readStream("aggregate-1");
    const stream2 = await container.eventStore.readStream("aggregate-2");

    expect(stream1).toHaveLength(1);
    expect(stream2).toHaveLength(1);
    expect(stream1[0].aggregateId).toBe("aggregate-1");
    expect(stream2[0].aggregateId).toBe("aggregate-2");
  });

  it("getAllEvents returns events from all streams", async () => {
    // Explicit append (command handler pattern)
    await container.eventStore.append({
      type: "Event1",
      aggregateId: "aggregate-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    await container.eventStore.append({
      type: "Event2",
      aggregateId: "aggregate-2",
      version: 1,
      timestamp: "2025-01-01T01:00:00.000Z",
    });

    const allEvents = await container.eventStore.getAllEvents();
    expect(allEvents).toHaveLength(2);
    // Should be sorted by timestamp
    expect(allEvents[0].timestamp).toBe("2025-01-01T00:00:00.000Z");
    expect(allEvents[1].timestamp).toBe("2025-01-01T01:00:00.000Z");
  });
});
