# RFC: Extend `work` for Autonomous Operation

## 1. Summary
This RFC defines a clearer autonomous workflow for Jumbo using explicit goal transition commands, deterministic worker loops, and claim lifecycle rules.

The design keeps the current "exception path" commands (`pause`, `block`, `resume`, `unblock`) while establishing a primary happy-path flow for autonomous operation.

## 2. Motivation
Jumbo needs mode-based autonomous operation that is:
- explicit in state changes
- safe under worker crashes and restarts
- auditable from event history
- compatible with existing manual operations

## 3. Scope
In scope:
- goal lifecycle transitions for plan, implement, review, codify
- claim acquisition/release semantics per transition
- work mode loop contracts (`work --plan|--implement|--review|--codify`)
- primary flow vs exceptional flow command model

Out of scope:
- detailed PR automation implementation
- UI copy details
- migration script details for existing historical events

## 4. Prerequisites
1. `Goal.dependantOn -> Goal.id` exists and is enforced where needed.
2. Claim storage supports ownership and lease expiry.
3. Goal list query can filter by state and claim availability.

## 5. Goals and Non-Goals
Goals:
1. Keep transitions explicit (no lifecycle-changing flags on unrelated commands).
2. Ensure claims are acquired and released predictably.
3. Allow autonomous workers to recover from crashes without manual intervention.

Non-goals:
1. Remove exceptional commands (`pause`, `block`, `resume`, `unblock`).
2. Replace all existing CLI commands in one release.

## 6. Canonical Goal States
`DEFINED -> IN_REFINEMENT -> REFINED -> DOING -> COMPLETED -> IN_REVIEW -> REVIEWED -> CODIFYING -> DONE`

Exceptional states:
- `PAUSED`
- `BLOCKED`

## 7. Transition Model (Primary Flow)

| Phase | Command | From State | To State | Claim Effect |
|---|---|---|---|---|
| Plan | `jumbo goal add` | n/a | `DEFINED` | none |
| Plan | `jumbo goal refine` | `DEFINED` | `IN_REFINEMENT` | acquire |
| Plan | `jumbo goal mark-refined` | `IN_REFINEMENT` | `REFINED` | release |
| Implement | `jumbo goal start` | `REFINED` | `DOING` | acquire |
| Implement | `jumbo goal complete` | `DOING` | `COMPLETED` | release |
| Review | `jumbo goal review` | `COMPLETED` | `IN_REVIEW` | acquire |
| Review | `jumbo goal approve` | `IN_REVIEW` | `REVIEWED` | release |
| Codify | `jumbo goal codify` | `REVIEWED` | `CODIFYING` | acquire |
| Codify | `jumbo goal finalize` | `CODIFYING` | `DONE` | release |

Notes:
1. Lifecycle transitions are explicit commands.
2. Flags are reserved for behavior modifiers only (example: `--interactive`, `--dry-run`).

## 8. Exceptional Flow Commands
These remain supported and are intentionally outside the primary autonomous flow.

| Command | Allowed From | Result | Claim Effect |
|---|---|---|---|
| `jumbo goal pause` | `DOING` | `PAUSED` | release |
| `jumbo goal block` | `DOING`, `IN_REVIEW`, `CODIFYING` | `BLOCKED` | release |
| `jumbo goal resume` | `PAUSED`, `BLOCKED` | previous in-progress state | acquire |
| `jumbo goal unblock` | `BLOCKED` | previous in-progress state | none |
| `jumbo goal reset` | configurable | `DEFINED` or configured target | release |

## 9. Claim Model
Claims indicate active ownership of in-progress work.

Minimum claim metadata:
1. `goalId`
2. `ownerId` (agent/session identity)
3. `claimedAt`
4. `leaseExpiresAt`
5. `claimToken` (for optimistic release/update)

Rules:
1. In-progress states should have an active claim.
2. Terminal or waiting states should not have a claim.
3. If lease expires, another worker may acquire the claim.

## 10. Work Mode Protocols

### `work --plan`
1. Select next `DEFINED` goal with no active claim and dependencies satisfied.
2. Acquire claim and run `jumbo goal refine --goal-id <id>`.
3. During refinement, update progress/events as needed.
4. On completion, run `jumbo goal mark-refined --goal-id <id>` to release claim.

### `work --implement`
1. Select next `REFINED` goal with no active claim and dependencies satisfied.
2. Acquire claim with `jumbo goal start --goal-id <id>`.
3. Implement and emit progress updates.
4. On completion, run `jumbo goal complete --goal-id <id>` to release claim.

### `work --review`
1. Select next `COMPLETED` goal with no active claim.
2. Acquire claim with `jumbo goal review --goal-id <id>`.
3. Audit implementation against criteria/scope/invariants.
4. If qualified, run `jumbo goal approve --goal-id <id>` to release claim.
5. If not qualified, record findings and return goal to implement flow via explicit transition policy (TBD).

### `work --codify`
1. Select next `REVIEWED` goal with no active claim.
2. Acquire claim with `jumbo goal codify --goal-id <id>`.
3. Produce codified artifacts (TBD exact definition).
4. Run `jumbo goal finalize --goal-id <id>` to release claim.

## 11. Crash Recovery and Idempotency
1. Worker crash during an in-progress phase leaves goal in current in-progress state.
2. New workers may take over after claim lease expiry.
3. Transition commands must be idempotent:
   - same command retried with same claim token should succeed safely or no-op
   - invalid-state transitions should return deterministic errors
4. Progress updates should support append-only logs to preserve auditability.

## 12. Compatibility Matrix

| Area | Current | Proposed |
|---|---|---|
| Refinement completion | `goal refine --approve` | `goal mark-refined` |
| Implementation completion | `goal complete` | `goal complete` (unchanged) |
| Review approval | `goal qualify` or review path variants | `goal approve` |
| Codify completion | flag-based variants | `goal finalize` |
| Exceptional flow | supported | supported (explicitly non-primary) |

Migration policy (proposed):
1. Introduce new explicit commands first.
2. Keep old flag-based transitions as temporary aliases.
3. Emit deprecation warnings for aliases.
4. Remove aliases in a major version.

## 13. Open Questions (Interview Next Session)
1. Should `resume` reacquire claim directly or only mark goal claimable?
2. What is the exact "not qualified" transition from review?
3. What are mandatory artifacts for `codify`?
4. Should dependency satisfaction be strict in every mode or mode-specific?
5. What lease TTL and heartbeat interval should be default?
6. Should claim ownership be session-scoped, agent-scoped, or both?

## 14. Acceptance Criteria
1. Every transition has one explicit command and documented claim effect.
2. Autonomous loops can recover from crashes using lease expiry.
3. Primary and exceptional flows are both documented and testable.
4. Alias/deprecation strategy is documented before implementation begins.
