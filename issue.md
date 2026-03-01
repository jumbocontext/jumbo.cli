# Bug: Worker Identity Lost During Database Rebuild

## Summary

After migrating worker identity persistence from filesystem (`workers.json`) to SQLite (`workers` table), database rebuilds silently wipe worker identity, causing claim validation failures ("Goal is claimed by another worker").

## Observed Symptom

Running `jumbo goal refine` followed by `jumbo goal commit` (or any claim-protected command pair) fails with:

```
Goal is claimed by another worker. Claim expires at <timestamp>.
```

Both commands run from the same terminal/agent session, so they should share the same worker identity.

## Root Cause

The `TemporarySequentialDatabaseRebuildService` deletes the entire SQLite database and replays all events — but it does **NOT subscribe to `WorkerIdentifiedEvent`**. After a rebuild:

- The `workers` table is empty (worker identity lost)
- The `goal_views` table is rebuilt from events, and `GoalRefinementStartedEvent` contains `claimedBy` with the **old** worker UUID
- The next CLI invocation resolves the same session key but creates a **new** worker UUID (since the old mapping is gone)
- Claim validation compares old UUID (in claim) vs new UUID (current worker) → mismatch

### Why it worked when file-based

The old `FsWorkerIdentityRegistry` stored worker identity in `workers.json` — a file that **survives database rebuilds**. The old `FsGoalClaimStore` stored claims in `claims.json` — also rebuild-safe. Neither was affected by `jumbo db rebuild` or migration-triggered rebuilds.

Now both live in SQLite. Workers get wiped but claims survive (because they're embedded in `goal_views` which are rebuilt from goal events). This creates an inconsistency: claims reference worker IDs that no longer exist in the workers table.

## Evidence

**workers.json** (old file, still on disk):
- Worker `b4d6e44e` with session key `83c365d6...` — created 20:13 UTC, last seen 22:20 UTC (time of the claim)

**SQLite workers table** (current):
- Worker `7b566f7c` with the **same** session key `83c365d6...` — created 22:26 UTC (after rebuild)
- Worker `b4d6e44e` is **absent** (lost during rebuild)

**goal_views claim columns**:
- `claimedBy = b4d6e44e` (from replayed `GoalRefinementStartedEvent`)

Same session key → two different worker UUIDs → claim mismatch.

## Fix 1 (Primary): Add WorkerIdentifiedEvent to rebuild service

The `TemporarySequentialDatabaseRebuildService` must subscribe to `WorkerIdentifiedEvent` so the workers table is rebuilt alongside everything else.

In `TemporarySequentialDatabaseRebuildService.rebuild()`:

```typescript
// Add import
import { SqliteWorkerIdentifiedProjector } from "../host/workers/identify/SqliteWorkerIdentifiedProjector.js";
import { WorkerIdentifiedEventHandler } from "../../application/host/workers/identify/WorkerIdentifiedEventHandler.js";

// In Step 5: Create projector
const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(newDb);

// In Step 6: Create handler
const workerIdentifiedEventHandler = new WorkerIdentifiedEventHandler(workerIdentifiedProjector);

// In Step 7: Subscribe
sequentialEventBus.subscribe("WorkerIdentifiedEvent", workerIdentifiedEventHandler);
```

This ensures worker identity mappings survive rebuilds, keeping claims valid.

## Fix 2 (Secondary): Async write race in SqliteWorkerIdentityRegistry

`SqliteWorkerIdentityRegistry.resolveWorkerId()` is a synchronous method that calls async operations without awaiting them:

```typescript
private resolveWorkerId(): WorkerId {
    // ...
    this.eventWriter.append(event);  // Returns Promise — NOT AWAITED
    this.eventBus.publish(event);    // Returns Promise — NOT AWAITED
    return this.mapper.toWorkerId({ ... });  // Returns immediately
}
```

The old `FsWorkerIdentityRegistry` used `fs.writeFileSync()` and `fs.readFileSync()` — fully synchronous. The worker was guaranteed to be persisted before the method returned.

The new version appends a `WorkerIdentifiedEvent` to the file-based event store (`FsEventStore.append()` is async) and publishes to the event bus (which triggers the SQLite projector asynchronously). If the CLI process exits before these Promises resolve, the worker is never persisted.

**Recommendation**: Make the write path synchronous to match the old behavior. Options:
- Use `better-sqlite3` direct INSERT (synchronous) for the workers table as a primary write, and append the event asynchronously as a secondary concern
- Or make `resolveWorkerId()` async and propagate the change up through `IWorkerIdentityReader`

## Affected Files

| File | Role |
|------|------|
| `src/infrastructure/local/TemporarySequentialDatabaseRebuildService.ts` | Missing `WorkerIdentifiedEvent` subscription |
| `src/infrastructure/host/workers/SqliteWorkerIdentityRegistry.ts` | Async write race in `resolveWorkerId()` |
| `src/infrastructure/host/HostBuilder.ts` | Wiring (may need changes if `resolveWorkerId` becomes async) |

## How to Reproduce

1. Run `jumbo goal refine --id <goal-id>` (creates claim with worker X)
2. Trigger a database rebuild (`jumbo db rebuild` or migration change on startup)
3. Run `jumbo goal commit --id <goal-id>` (resolves as worker Y)
4. Observe: "Goal is claimed by another worker"
