import fs from "fs-extra";
import path from "path";
import { IEventStore, AppendResult } from "../../application/persistence/IEventStore";
import { BaseEvent } from "../../domain/BaseEvent";

/**
 * StoredEvent adds infrastructure metadata to domain events.
 * This type exists only in the infrastructure layer.
 */
type StoredEvent = BaseEvent & {
  seq: number; // sequence number within the stream (file system ordering)
};

export class FsEventStore implements IEventStore {
  constructor(private readonly rootDir: string) {}

  async append(e: BaseEvent & Record<string, any>): Promise<AppendResult> {
    const streamDir = this.streamDir(e.aggregateId);
    await fs.ensureDir(streamDir);

    const files = await fs.readdir(streamDir);
    const nextSeq = files.length + 1;

    const storedEvent: StoredEvent = { ...e, seq: nextSeq };
    const filename = `${String(nextSeq).padStart(6, "0")}.${e.type}.json`;
    const filepath = path.join(streamDir, filename);

    await fs.writeFile(filepath, JSON.stringify(storedEvent, null, 2));

    return { nextSeq };
  }

  async readStream(streamId: string): Promise<BaseEvent[]> {
    const streamDir = this.streamDir(streamId);

    if (!(await fs.pathExists(streamDir))) {
      return [];
    }

    const files = await fs.readdir(streamDir);
    const events: BaseEvent[] = [];

    for (const file of files.sort()) {
      const filepath = path.join(streamDir, file);
      const content = await fs.readFile(filepath, "utf-8");
      const storedEvent: StoredEvent = JSON.parse(content);
      // Strip infrastructure metadata before returning domain event
      const { seq: _seq, ...domainEvent } = storedEvent;
      events.push(domainEvent as BaseEvent);
    }

    return events;
  }

  async getAllEvents(): Promise<BaseEvent[]> {
    const eventsRoot = path.join(this.rootDir, "events");

    if (!(await fs.pathExists(eventsRoot))) {
      return [];
    }

    const aggregateDirs = await fs.readdir(eventsRoot);
    const allEvents: BaseEvent[] = [];

    for (const aggregateId of aggregateDirs) {
      const streamEvents = await this.readStream(aggregateId);
      allEvents.push(...streamEvents);
    }

    // readStream already strips seq, so these are pure domain events
    return allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private streamDir(streamId: string): string {
    return path.join(this.rootDir, "events", streamId);
  }
}
