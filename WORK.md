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
- design for eventual PR automation implementation

Out of scope:
- UI copy details
- migration script details for existing historical events

## 4. Prerequisites
1. `Goal.dependantOn -> Goal.id` exists and is enforced where needed.
2. Goal is  extended with gitBranch for interoperability between workers.
3. Claim storage supports ownership and lease expiry.
4. Goal list query can filter by state and claim availability.

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
3. Creates and checks out the specified git branch.
4. Implement and emit progress updates.
5. On completion, run `jumbo goal complete --goal-id <id>` to release claim.

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





  Appendix: Design Notes for Hybrid/Distributed Operation


  1. The Gateway as the "Context Switch"
    To support both single-user (Local) and team (Hosted) modes, every transition command (Section 7) must delegate to an IGateway
    implementation.
   * `LocalGateway`: Interacts with the local SQLite database. Ideal for solo developers. Memory is machine-bound.
   * `RemoteGateway`: Interacts with the Jumbo Cloud API. Facilitates GitHub Action integration, cross-agent coordination, and
     team-wide persistent memory.
   * Invariant: CLI Controllers only see the IGateway interface, ensuring the "Autonomous Work Mode" (Section 10) code is identical
     across environments.


  2. The "Double-Audit" Review Loop
    The Review phase (Section 10.3) is reimagined as a cooperative loop between Audit Workers and Humans:
   1. Agent Audit: Triggered by goal complete (PR push). A worker runs jumbo goal review. It pulls "Success Criteria" from the
      Gateway, performs an automated audit, and registers AuditFindings (positive/negative) to the goal's event log.
   2. Human Feedback: The human reviews the PR (and the Agent's Audit Report). Comments made in GitHub (via Webhook) or the CLI are
      registered as FeedbackEvents.
   3. Iteration: If FeedbackEvents exist and the goal is not APPROVED, a resume command moves the goal back to DOING. The next work
      --implement session begins by synthesizing the AuditFindings and FeedbackEvents into a "Correction Plan."


  3. Claim Portability & Heartbeats
    Since .jumbo is not committed to Git (to avoid team conflicts), Claims (Section 9) must be managed by the storage provider:
   * Local: Claims are rows in the local SQLite DB.
   * Hosted: Claims are records in the Jumbo Cloud DB with a mandatory leaseExpiresAt (TTL).
   * Heartbeat: In-progress workers (DOING, IN_REVIEW) must send a periodic "Heartbeat" to the Gateway. If a GitHub Action or local
     shell crashes, the lease expires, allowing another worker (or the human) to resume and take over the claim.


  4. Memory Synchronization (The "No-Git" Policy)
    Persistent memory (Invariants, Decisions, Relations) stays out of the Git tree:
   * Local: Stays in the local SQLite file.
   * Hosted/Team: The CLI transparently "pushes" and "pulls" memory segments to the Hosted Gateway during goal refine and goal
     codify.
   * GitHub Actions: The work --review worker in CI initializes its context by fetching the "Refined Goal Map" from the Remote
     Gateway using the PR's branch name as the lookup key.


  5. Transition Policy: "Not Qualified"
    When a review (Agent or Human) fails:
   * Command: jumbo goal reject --reason <text>
   * State: IN_REVIEW -> REFINED (or DOING if an active claim is immediately re-acquired).
   * Claim: Release current review claim; mark goal as "Ready for Implementation" with attached feedback.
