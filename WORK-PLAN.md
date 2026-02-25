# WORK.md Implementation Plan

## Overview

This plan decomposes the WORK.md RFC into atomic goals that can be executed sequentially.
Each goal leaves Jumbo in an operational state when completed.

## Current State → Target State

```
Current:  to-do → refined → doing → in-review → qualified → completed
Target:   defined → in_refinement → refined → doing → submitted → in_review → approved → codifying → done
```

New states: `IN_REFINEMENT`, `SUBMITTED`, `REJECTED`, `UNBLOCKED`, `CODIFYING`, `DONE`
Renames: `TODO` → `DEFINED`, `QUALIFIED` → `APPROVED`, `COMPLETED` → `DONE`
Removed: `goal complete` command (deferred to Goal 6 when its replacement `goal close` is introduced)
New commands: `goal submit`, `goal approve`, `goal commit`, `goal reject`, `goal codify`, `goal close`

Note: Goals 1–6 operate against the current TODO/to-do and QUALIFIED/qualified state names. Goal 7 performs all renames and the migration patch as a single atomic step.

## Execution Order & Dependencies

```
Phase 1 – State Model Extensions (no breaking changes, each independently deployable)
  Goal 1: IN_REFINEMENT + commit
  Goal 2: REJECTED + reject command
  Goal 3: UNBLOCKED state

Phase 2 – Flow Resequencing (each independently deployable)
  Goal 4: SUBMITTED + goal submit command (DOING→SUBMITTED→IN_REVIEW)
           Retains goal complete — removal deferred to Goal 6
  Goal 5: goal approve command (over qualify, no status value rename)  [depends: Goal 4]
  Goal 6: CODIFYING + DONE + codify/close commands                    [depends: Goal 5]
           Removes goal complete — replacement (goal close) now exists

Phase 3 – Cleanup & Infrastructure
  Goal 7: All renames + GoalStatusMigratedEvent migration patch       [depends: Goal 6]
           Renames: to-do→defined, qualified→approved, completed→done
  Goal 8: Migrate claims from filesystem to SQLite
  Goal 9: Idempotent re-entry for expired claims                      [depends: Goals 1,6,8]
  Goal 15: Update goal reset for new states                           [depends: Goal 7]

Phase 4 – Autonomous Work Modes
  Goal 10: work --plan mode                                           [depends: Goals 1,9]
  Goal 11: work --implement mode                                      [depends: Goals 2,3,9]
  Goal 12: work --review mode                                         [depends: Goals 2,9]
  Goal 13: work --codify mode                                         [depends: Goals 6,9]
  Goal 14: Prerequisite enforcement per work mode                     [depends: Goals 10-13]
```

---

## Open Questions

**Git isolation strategy for file-writing workers.** `work --implement` and `work --codify` both write to repo files. The RFC's `gitBranch` field is insufficient to address: (a) concurrent workers on the same machine needing filesystem isolation (worktrees?), (b) concurrent workers on different machines needing coordination. This must be resolved in the RFC before Goals 11 and 13 can be implemented.

---

## Goals

**Cross-cutting requirements:**
- All transition commands introduced or modified in Goals 1–7 must return deterministic machine-readable errors for invalid source states (RFC §7 note 4). This is not deferred to Goal 9 — each goal is responsible for its own error responses.
- All goals that introduce a new state must add it to `DEFAULT_STATUSES` in `LocalGetGoalsGateway` (unless terminal). Without this, goals in the new state are invisible to `goal list`.
- All goals that add or remove CLI commands must run `npm run generate:commands` to update the command registry.

### Goal 1: Add IN_REFINEMENT state and commit command

**Objective:** Introduce the IN_REFINEMENT state and a new `goal commit` command so that refinement becomes a two-phase claimed workflow (refine acquires claim → commit releases claim). The existing `refine --approve` flag is removed — refinement completion is now exclusively via `goal commit` (RFC §13).

**Scope:**
- Add `IN_REFINEMENT` to GoalStatus enum
- Add `IN_REFINEMENT` to `DEFAULT_STATUSES` in `LocalGetGoalsGateway`
- Create `GoalRefinementStartedEvent` (to-do → in_refinement, acquires claim)
- Create `GoalCommittedEvent` (in_refinement → refined, releases claim)
- Add `CanCommitRule` domain rule
- Update `refine` command handler to transition to IN_REFINEMENT and acquire claim (remove `--approve` flag)
- Create `commit` command (full vertical: domain event → command handler → controller → CLI command)
- Remove `refine --approve` convenience alias — `goal commit` is the explicit completion command
- Run `npm run generate:commands`
- Update existing refine tests, add commit tests

**Prompt/Output:** Interview user for output copy before implementation. Audit existing `refine` output for continuity under the new two-phase flow. Design new `commit` output from scratch. Incomplete or broken command output is a failure.

**Criteria:**
- `jumbo goal refine --id X` transitions a TODO goal to IN_REFINEMENT and acquires a claim
- `jumbo goal commit --id X` transitions an IN_REFINEMENT goal to REFINED and releases the claim
- `refine --approve` flag is removed
- IN_REFINEMENT goals appear in `goal list` default output
- All existing tests pass

---

### Goal 2: Add REJECTED state and goal reject command

**Objective:** Introduce the REJECTED state and `goal reject` command so that review has two explicit outcomes: approve or reject. Rejected goals re-enter the implement phase alongside REFINED goals.

**Scope:**
- Add `REJECTED` to GoalStatus enum
- Add `REJECTED` to `DEFAULT_STATUSES` in `LocalGetGoalsGateway`
- Create `GoalRejectedEvent` (in-review → rejected, releases claim)
- Add `CanRejectRule` domain rule
- Create `goal reject` command with `--audit-findings` flag (full vertical)
- Update `CanStartRule` to accept REJECTED as a valid source state
- Store audit findings on the goal for the implementing agent to reference
- Run `npm run generate:commands`

**Prompt/Output:** Interview user for output copy before implementation. Design new `reject` output from scratch — must convey audit findings clearly for the implementing agent. Incomplete or broken command output is a failure.

**Criteria:**
- `jumbo goal reject --id X --audit-findings "..."` transitions IN_REVIEW → REJECTED and releases claim
- `jumbo goal start --id X` works on a REJECTED goal
- Audit findings are persisted and visible via `goal show`
- REJECTED goals appear in `goal list` default output

---

### Goal 3: Add UNBLOCKED state and update unblock transition

**Objective:** Introduce the UNBLOCKED waiting state so that unblocked goals are explicitly distinguishable from goals that were never blocked, enabling precise work mode selection queries.

**Scope:**
- Add `UNBLOCKED` to GoalStatus enum
- Add `UNBLOCKED` to `DEFAULT_STATUSES` in `LocalGetGoalsGateway`
- Create `GoalUnblockedEvent` (blocked → unblocked, replaces current blocked → doing)
- Update unblock command to transition to UNBLOCKED instead of DOING
- Update `CanStartRule` to accept UNBLOCKED as a valid source state
- Update `CanBlockRule` to accept IN_REVIEW as a valid source state (RFC §8: block is allowed from DOING, IN_REVIEW, and CODIFYING — CODIFYING is deferred to Goal 6 when that state is introduced)

**Criteria:**
- `jumbo goal unblock --id X` transitions BLOCKED → UNBLOCKED (not directly to DOING)
- `jumbo goal start --id X` works on an UNBLOCKED goal
- `jumbo goal block --id X` works from IN_REVIEW (in addition to existing DOING)
- UNBLOCKED goals appear in `goal list` default output
- Existing block/unblock tests updated

---

### Goal 4: Add SUBMITTED state and goal submit command (DOING → SUBMITTED → IN_REVIEW)

**Objective:** Introduce the SUBMITTED waiting state and `goal submit` command so that implementation submission is explicit (DOING → SUBMITTED) and review begins after submission (SUBMITTED → IN_REVIEW), aligning with the RFC's separation of implement and review phases. `goal complete` is **retained** in this goal — its removal is deferred to Goal 6 when the replacement terminal path (`goal close`) is introduced.

**Scope:**
- Add `SUBMITTED` to GoalStatus enum
- Add `SUBMITTED` to `DEFAULT_STATUSES` in `LocalGetGoalsGateway`
- Create `GoalSubmittedEvent` (doing → submitted, releases claim)
- Add `CanSubmitRule` domain rule (source state: DOING)
- Create `goal submit` command (full vertical: domain event → command handler → controller → CLI command)
- Update `CanReviewRule`: require SUBMITTED (not DOING) as source state; drop BLOCKED as a source state (blocked goals now follow the UNBLOCKED → DOING → SUBMITTED path)
- Update `GoalReviewStartedEvent` to transition SUBMITTED → IN_REVIEW and acquire claim
- Retain `goal complete` command — QUALIFIED goals still use it as their terminal transition
- Run `npm run generate:commands`
- Update all affected domain rules, handlers, controllers, and tests

**Prompt/Output:** Interview user for output copy before implementation. Design new `submit` output from scratch — must instruct memory capture and next step (review). Audit existing `review` output for continuity under the resequenced flow. Incomplete or broken command output is a failure.

**Criteria:**
- `jumbo goal submit --id X` transitions DOING → SUBMITTED and releases claim
- `jumbo goal review --id X` transitions SUBMITTED → IN_REVIEW and acquires claim
- `goal complete` command still works for QUALIFIED goals
- SUBMITTED goals appear in `goal list` default output
- All tests updated and passing

---

### Goal 5: Add goal approve command (alias over qualify, no status value rename)

**Objective:** Introduce `goal approve` as the primary command for the review→approved transition, deprecating `goal qualify`. The internal status value remains `'qualified'` — the rename to `'approved'` is deferred to Goal 7 where all renames happen atomically with the migration patch.

**Scope:**
- Create `goal approve` command (full vertical) that produces `GoalQualifiedEvent` with `status: 'qualified'`
- Keep `goal qualify` as deprecated alias emitting a warning
- Add `CanApproveRule` as alias/replacement for `CanQualifyRule`
- Note: CanApproveRule inherits the resequenced flow from Goal 4 (source state is IN_REVIEW, which now follows SUBMITTED)
- Run `npm run generate:commands`
- Update tests

**Prompt/Output:** Interview user for output copy before implementation. Design new `approve` output from scratch. Audit existing `qualify` output for continuity and ensure deprecation warning is clear. Incomplete or broken command output is a failure.

**Criteria:**
- `jumbo goal approve --id X` transitions IN_REVIEW → QUALIFIED and releases claim
- `jumbo goal qualify --id X` still works but emits deprecation warning
- Internal status value remains `'qualified'` (rename deferred to Goal 7)
- All tests updated

---

### Goal 6: Add CODIFYING and DONE states with codify and close commands; remove goal complete

**Objective:** Introduce the codify phase as the final lifecycle phase where architectural reconciliation, changelog updates, and documentation happen. DONE becomes the terminal state. Now that `goal close` exists as the replacement terminal command, `goal complete` is removed.

**Scope:**
- Add `CODIFYING` to GoalStatus enum
- Add `DONE` to GoalStatus enum
- Add `CODIFYING` to `DEFAULT_STATUSES` in `LocalGetGoalsGateway` (DONE is terminal — exclude it like COMPLETED)
- Create `GoalCodifyStartedEvent` (qualified → codifying, acquires claim)
- Create `GoalClosedEvent` (codifying → done, releases claim)
- Add `CanCodifyRule` and `CanCloseRule` domain rules
- Create `goal codify` command (full vertical)
- Create `goal close` command (full vertical)
- Remove `goal complete` command and `CompleteGoalCommand` — `goal close` is the replacement
- Retain `GoalCompletedEvent` in event type union and `Goal.apply()` for backward-compatible replay of pre-migration events (RFC §12)
- Update `CanBlockRule` to accept CODIFYING as a valid source state (completing RFC §8: block allowed from DOING, IN_REVIEW, and CODIFYING — DOING was original, IN_REVIEW was added in Goal 3)
- Update goal list queries / filters: DONE joins COMPLETED as a terminal/excluded state
- Run `npm run generate:commands`

**Prompt/Output:** Interview user for output copy before implementation. Design new `codify` and `close` outputs from scratch. `codify` must convey reconciliation responsibilities. `close` must convey terminal state. Incomplete or broken command output is a failure.

**Criteria:**
- `jumbo goal codify --id X` transitions QUALIFIED → CODIFYING and acquires claim
- `jumbo goal close --id X` transitions CODIFYING → DONE and releases claim
- `goal complete` command is removed
- `GoalCompletedEvent` retained for backward-compatible replay only
- DONE goals are treated as terminal in all queries
- Codify command output instructs agent on reconciliation responsibilities

---

### Goal 7: Rename all legacy status values and run migration patch

**Objective:** Rename all legacy status values to match RFC terminology and run the idempotent migration patch function (RFC §12) that migrates all legacy state values via `GoalStatusMigratedEvent`. All renames are consolidated here to use a single migration mechanism and require a single `db rebuild`.

**Scope:**
- Rename GoalStatus.TODO value from `'to-do'` to `'defined'`
- Rename GoalStatus.QUALIFIED value from `'qualified'` to `'approved'`
- Rename GoalStatus.COMPLETED value from `'completed'` to `'done'` (legacy replay-only state, same terminal semantics as DONE)
- Create `GoalStatusMigratedEvent` event type handled in `Goal.apply()`
- Implement idempotent patch function that appends `GoalStatusMigratedEvent` for each affected goal:
  - `'to-do'` → `'defined'`
  - `'qualified'` → `'approved'`
  - `'completed'` → `'done'`
- Patch function queries `goal_views` for old values, appends migration events to event streams
- On replay, migration events produce correct final state (RFC §12)
- Update `goal approve` command to produce `GoalApprovedEvent` with `status: 'approved'` (replacing the temporary `GoalQualifiedEvent` usage from Goal 5)
- Rename `GoalQualifiedEvent` → `GoalApprovedEvent` (retain `GoalQualifiedEvent` in event type union and `Goal.apply()` for backward replay)
- Update `goal codify` source state from `'qualified'` to `'approved'` in `CanCodifyRule`
- Update all references in domain rules, handlers, tests, and output copy
- Update `goal add` output to reference DEFINED state
- Update `DEFAULT_STATUSES` to use new values

**Prompt/Output:** Interview user for output copy before implementation. Audit all command outputs that reference TODO/to-do or QUALIFIED/qualified for continuity under the renames. Incomplete or broken command output is a failure.

**Criteria:**
- New goals are created in DEFINED state
- Existing `'to-do'` goals are migrated to `'defined'` via GoalStatusMigratedEvent
- Existing `'qualified'` goals are migrated to `'approved'` via GoalStatusMigratedEvent
- Existing `'completed'` goals are migrated to `'done'` via GoalStatusMigratedEvent
- Patch function is idempotent (second run is a no-op)
- Event replay produces correct state for both pre- and post-migration goals
- All references updated, all tests pass

---

### Goal 8: Migrate claim storage from filesystem to SQLite

**Objective:** Move claim persistence from the filesystem-based FsGoalClaimStore to SQLite, satisfying the RFC requirement that claims are managed by the storage provider (not file-based). Goals 1–6 introduced new claim-acquiring commands using the existing `IGoalClaimStore` interface; this goal swaps the implementation behind that interface.

**Scope:**
- Create SqliteGoalClaimStore implementing IGoalClaimStore
- Ensure claim columns in goal_views table (from migration 004) are the authoritative source
- Wire SqliteGoalClaimStore into the DI container, replacing FsGoalClaimStore
- Remove FsGoalClaimStore and claims.json dependency
- Verify claim acquire/release/expiry flows work end-to-end for all claim-acquiring commands (refine, start, review, codify)
- Implement implicit lease renewal: any write operation on a claimed goal renews the lease TTL
- Implement claim token validation: mutating commands on in-progress states must validate token ownership

**Criteria:**
- Claims are read from and written to SQLite
- FsGoalClaimStore is removed
- No file-based claim artifacts remain
- Write operations on claimed goals implicitly renew the lease
- Mutating commands on in-progress states reject operations from non-owners
- All claim-related tests pass

---

### Goal 9: Add idempotent re-entry for in-progress states with expired claims

**Objective:** Enable crash recovery by making entry commands idempotent: if a goal is already in the target in-progress state with an expired claim, the command re-acquires the claim instead of failing.

**Scope:**
- `goal refine` on IN_REFINEMENT with expired claim → reacquire claim
- `goal start` on DOING with expired claim → reacquire claim
- `goal review` on IN_REVIEW with expired claim → reacquire claim
- `goal codify` on CODIFYING with expired claim → reacquire claim
- Update CanXxxRules to allow self-transitions when claim is expired
- Return deterministic machine-readable errors for invalid state transitions

**Criteria:**
- Each entry command is idempotent for its target in-progress state when claim is expired
- Active (non-expired) claims by another worker are still rejected
- Deterministic error codes returned for invalid transitions

**Prerequisites:** Goals 1, 6, 8

---

### Goal 10: Implement work --plan mode

**Objective:** Create the autonomous plan worker loop that selects DEFINED or stale IN_REFINEMENT goals, refines them, and marks them refined.

**Scope:**
- Add `--plan` flag to `work` command namespace
- Implement goal selection: DEFINED or IN_REFINEMENT (expired claim), prerequisite goals at least REFINED, ordered by priority then created time
- Worker loop: select → refine → apply refine-jumbo-goal skill → commit
- Handle empty queue (no eligible goals) gracefully

**Criteria:**
- `jumbo work --plan` selects and refines the next eligible goal
- Prerequisite goals must be at least REFINED
- Stale IN_REFINEMENT goals (expired claims) are picked up
- Empty queue produces clean exit

**Prerequisites:** Goals 1, 9

---

### Goal 11: Implement work --implement mode

**Objective:** Create the autonomous implement worker loop that selects REFINED, REJECTED, UNBLOCKED, or stale DOING goals, implements them, and submits them for review.

**Scope:**
- Add `--implement` flag to `work` command namespace
- Implement goal selection: REFINED, REJECTED, UNBLOCKED, or DOING (expired claim), prerequisite goals at least SUBMITTED, ordered by priority then created time
- Worker loop: select → start → create/checkout git branch → apply implement skill → submit
- Handle blocker discovery (block goal, create unblocking goal)

**Criteria:**
- `jumbo work --implement` selects and implements the next eligible goal
- Prerequisite goals must be at least SUBMITTED
- REJECTED and UNBLOCKED goals are eligible alongside REFINED
- Git branch creation/checkout is handled

**Prerequisites:** Goals 2, 3, 9

---

### Goal 12: Implement work --review mode

**Objective:** Create the autonomous review worker loop that selects SUBMITTED or stale IN_REVIEW goals, reviews them, and either approves or rejects.

**Scope:**
- Add `--review` flag to `work` command namespace
- Implement goal selection: SUBMITTED or IN_REVIEW (expired claim), ordered by submission time then created time
- Worker loop: select → review → apply review-jumbo-goal skill → approve or reject
- If approved and goal has `unblocksGoalId`, run `goal unblock` on the blocked goal

**Criteria:**
- `jumbo work --review` selects and reviews the next eligible goal
- Review produces either approve (→ APPROVED) or reject (→ REJECTED with audit findings)
- Approved goals with `unblocksGoalId` trigger automatic unblock

**Prerequisites:** Goals 2, 9

---

### Goal 13: Implement work --codify mode

**Objective:** Create the autonomous codify worker loop that selects APPROVED or stale CODIFYING goals and performs architectural reconciliation.

**Scope:**
- Add `--codify` flag to `work` command namespace
- Implement goal selection: APPROVED or CODIFYING (expired claim), ordered by approval time then created time
- Worker loop: select → codify → reconcile architecture → update CHANGELOG → update docs → close

**Criteria:**
- `jumbo work --codify` selects and codifies the next eligible goal
- Produces reconciled architectural model, updated CHANGELOG, updated documentation
- Close transitions goal to DONE

**Prerequisites:** Goals 6, 9

---

### Goal 14: Prerequisite enforcement per work mode

**Objective:** Implement mode-specific prerequisite satisfaction rules as defined in the RFC: plan requires prereqs at REFINED+, implement requires prereqs at SUBMITTED+, review and codify have no prerequisite checks.

**Scope:**
- Create prerequisite satisfaction query that checks goal states
- Integrate into goal selection in work --plan (prereqs ≥ REFINED)
- Integrate into goal selection in work --implement (prereqs ≥ SUBMITTED)
- work --review and --codify skip prerequisite checks
- Define state ordering for "at least" comparisons

**Criteria:**
- Plan mode skips goals whose prerequisites are not yet REFINED
- Implement mode skips goals whose prerequisites are not yet SUBMITTED
- Review and codify modes ignore prerequisites
- State ordering is explicit and testable

**Prerequisites:** Goals 10, 11, 12, 13

---

### Goal 15: Update goal reset for new states

**Objective:** Extend `goal reset` to handle the full set of new states, with the constraint that goals can only be reset to their last waiting state — resetting to an in-progress state is not permitted.

**Scope:**
- Update reset logic to support all new states (IN_REFINEMENT, REJECTED, UNBLOCKED, CODIFYING, DONE, DEFINED)
- Restrict reset target to waiting states only (DEFINED, REFINED, REJECTED, UNBLOCKED, SUBMITTED, APPROVED, PAUSED, BLOCKED) — reject resets to in-progress states (IN_REFINEMENT, DOING, IN_REVIEW, CODIFYING)
- Release any active claim when resetting
- Update tests

**Criteria:**
- `goal reset` works for goals in any of the new states
- Reset target is restricted to the goal's last waiting state
- Resetting to an in-progress state is rejected with a deterministic error
- Active claims are released on reset

**Prerequisites:** Goal 7

---

## Commands

Below are the `jumbo goal add` commands to register each goal. Execute in order.

```bash
# Goal 1
jumbo goal add --title "G1: Add IN_REFINEMENT state and commit command" --objective "Introduce the IN_REFINEMENT state and a new 'jumbo goal commit' command so that refinement becomes a two-phase claimed workflow (refine acquires claim, commit releases claim). Remove refine --approve flag." --criteria "'jumbo goal refine' transitions TODO goal to IN_REFINEMENT and acquires claim" --criteria "'jumbo goal commit' transitions IN_REFINEMENT to REFINED and releases claim" --criteria "'jumbo goal commit' implements the same logic and outcome as 'jumbo goal refine --approve'" --criteria "refine --approve flag is removed" --criteria "IN_REFINEMENT goals appear in goal list default output" --criteria "All existing tests pass"

# Goal 2
jumbo goal add --title "G2: Add REJECTED state and 'jumbo goal reject' command" --objective "Introduce the REJECTED state and 'jumbo goal reject' command so that review has two explicit outcomes (approve or reject). Rejected goals re-enter the implement phase alongside REFINED goals." --criteria "'jumbo goal reject --audit-findings' transitions IN_REVIEW to REJECTED and releases claim" --criteria "'jumbo goal start' permitted for a REJECTED goal" --criteria "Audit findings are for the purpose of recording implementation problems that need fixing, are persisted and visible via goal show" --criteria "REJECTED goals appear in goal list default output" --previous-goal goal_694a93a4-29a3-41e2-b82f-a65704623cb5

# Goal 3
jumbo goal add --title "G3: Add UNBLOCKED state and update unblock transition" --objective "Introduce the UNBLOCKED waiting state so that unblocked goals are explicitly distinguishable from never-blocked goals, enabling precise work mode selection queries." --criteria "'jumbo goal unblock' transitions BLOCKED to UNBLOCKED (not directly to DOING)" --criteria "'jumbo goal start' permitted for an UNBLOCKED goal" --criteria "UNBLOCKED goals appear in goal list default output" --criteria "Existing block/unblock tests updated" --previous-goal goal_ff0f9051-6aff-4d0a-920b-1852398e0156

# Goal 4
jumbo goal add --title "G4: Add SUBMITTED state and 'jumbo goal submit' command" --objective "Introduce the SUBMITTED waiting state and 'jumbo goal submit' command (DOING to SUBMITTED). Retain goal complete for QUALIFIED goals. Update 'jumbo goal review' to transition from SUBMITTED to IN_REVIEW." --criteria "'jumbo goal submit' transitions DOING to SUBMITTED and releases claim" --criteria "'jumbo goal review' transitions SUBMITTED to IN_REVIEW and acquires claim" --criteria "'jumbo goal complete' still works for QUALIFIED goals" --criteria "SUBMITTED goals appear in goal list default output" --criteria "All tests updated and passing" --previous-goal goal_fc43f7f3-6daa-4711-82fb-f31bf6061c79

# Goal 5
jumbo goal add --title "G5: Add goal approve command (alias over qualify)" --objective "Introduce 'jumbo goal approve' as the primary command for review approval, deprecating goal qualify. Internal status value remains qualified — rename deferred to Goal 7." --criteria "'jumbo goal approve' transitions IN_REVIEW to QUALIFIED and releases claim" --criteria "'jumbo goal qualify' still works but emits deprecation warning" --criteria "Internal status value remains qualified" --criteria "All tests updated" --prerequisite-goals goal_f1211540-d722-4135-b0d8-02a71b47195e --previous-goal goal_f1211540-d722-4135-b0d8-02a71b47195e

# Goal 6
jumbo goal add --title "G6: Add CODIFYING and DONE" --objective "Introduce the codify phase as the final lifecycle phase for architectural reconciliation. DONE becomes the terminal state. Remove 'jumbo goal complete' now that 'jumbo goal close' exists as its replacement." --criteria "'jumbo goal codify' transitions QUALIFIED to CODIFYING and acquires claim" --criteria "'jumbo goal close' transitions CODIFYING to DONE and releases claim" --criteria "'jumbo goal complete' command is removed" --criteria "GoalCompletedEvent retained for backward-compatible replay only" --criteria "DONE goals are treated as terminal in all queries" --criteria "Codify command output instructs agent on reconciliation responsibilities" --prerequisite-goals goal_2f0fc8af-7cb1-4680-b14a-c206468f0742 --previous-goal goal_2f0fc8af-7cb1-4680-b14a-c206468f0742

# Goal 7
jumbo goal add --title "G7: Rename all legacy status values and run migration patch" --objective "Rename 'to-do' to 'defined', 'qualified' to 'approved', 'completed' to 'done'. Implement idempotent migration patch command 'jumbo upgrade --from v1 --to v2' (RFC §12) that appends GoalStatusMigratedEvent for all legacy state renames. Single db rebuild." --criteria "New goals are created in DEFINED state" --criteria "Existing 'to-do' goals migrated to 'defined' via GoalStatusMigratedEvent" --criteria "Existing qualified goals migrated to approved via GoalStatusMigratedEvent" --criteria "Existing completed goals migrated to done via GoalStatusMigratedEvent" --criteria "'jumbo goal approve' produces GoalApprovedEvent with status approved" --criteria "'jumbo goal codify' source state updated from qualified to approved" --criteria "Patch command is idempotent and hidden --help" --criteria "Event replay produces correct state for pre- and post-migration goals" --criteria "All references updated, all tests pass" --prerequisite-goals goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d --previous-goal goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d


# Goal 8
jumbo goal add --title "G8: Migrate claim storage from filesystem to SQLite" --objective "Move claim persistence from FsGoalClaimStore to SQLite, satisfying the RFC requirement that claims are managed by the storage provider, not file-based." --criteria "Claims are read from SQLiteClaimsReader via IClaimsReader" --criteria "Claims are written to SQLiteClaimsStore via IClaimsStore" --criteria "FsGoalClaimStore is removed" --criteria "No file-based claim artifacts remain" --criteria "All claim-related tests pass" --previous-goal goal_39ea9943-371b-4078-a92b-dab5590cf1b1

# Goal 9
jumbo goal add --title "G9: Add idempotent re-entry for expired claims" --objective "Enable crash recovery by making entry commands idempotent: if a goal is already in the target in-progress state with an expired claim, the command re-acquires the claim instead of failing." --criteria "Each entry command is idempotent for its target in-progress state when claim is expired" --criteria "Active non-expired claims by another worker are still rejected" --criteria "Deterministic error codes returned for invalid transitions" --prerequisite-goals goal_694a93a4-29a3-41e2-b82f-a65704623cb5 goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d --prerequisite-goals goal_694a93a4-29a3-41e2-b82f-a65704623cb5 goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d goal_a040ee1e-9e5b-4c28-a40b-5df84ceb14c6 --previous-goal goal_a040ee1e-9e5b-4c28-a40b-5df84ceb14c6

# Goal 10
jumbo goal add
  --title "G10: Implement work --plan mode"
  --objective "Create the autonomous plan worker loop that selects DEFINED or stale IN_REFINEMENT goals, refines them, and marks them refined."
  --criteria "work --plan selects and refines the next eligible goal"
  --criteria "Prerequisite goals must be at least REFINED"
  --criteria "Stale IN_REFINEMENT goals with expired claims are picked up"
  --criteria "Empty queue produces clean exit"
  --prerequisite-goals goal_694a93a4-29a3-41e2-b82f-a65704623cb5 goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a

# Goal 11
jumbo goal add
  --title "G11: Implement work --implement mode"
  --objective "Create the autonomous implement worker loop that selects REFINED, REJECTED, UNBLOCKED, or stale DOING goals, implements them, and submits them for review."
  --criteria "work --implement selects and implements the next eligible goal"
  --criteria "Prerequisite goals must be at least SUBMITTED"
  --criteria "REJECTED and UNBLOCKED goals are eligible alongside REFINED"
  --criteria "Git branch creation and checkout is handled"
  --prerequisite-goals goal_ff0f9051-6aff-4d0a-920b-1852398e0156 goal_fc43f7f3-6daa-4711-82fb-f31bf6061c79 goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a

# Goal 12
jumbo goal add
  --title "G12: Implement work --review mode"
  --objective "Create the autonomous review worker loop that selects SUBMITTED or stale IN_REVIEW goals, reviews them, and either approves or rejects."
  --criteria "work --review selects and reviews the next eligible goal"
  --criteria "Review produces either approve or reject with audit findings"
  --criteria "Approved goals with unblocksGoalId trigger automatic unblock"
  --prerequisite-goals goal_ff0f9051-6aff-4d0a-920b-1852398e0156 goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a

# Goal 13
jumbo goal add
  --title "G13: Implement work --codify mode"
  --objective "Create the autonomous codify worker loop that selects APPROVED or stale CODIFYING goals and performs architectural reconciliation."
  --criteria "work --codify selects and codifies the next eligible goal"
  --criteria "Produces reconciled architectural model, updated CHANGELOG, updated documentation"
  --criteria "Close transitions goal to DONE"
  --prerequisite-goals goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d  --prerequisite-goals goal_a9e7d914-b55e-4dc5-b929-68cdeb0f2d1d goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a
 goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a

# Goal 14
jumbo goal add
  --title "G14: Prerequisite enforcement per work mode"
  --objective "Implement mode-specific prerequisite satisfaction rules: plan requires prereqs at REFINED+, implement requires prereqs at SUBMITTED+, review and codify have no prerequisite checks."
  --criteria "Plan mode skips goals whose prerequisites are not yet REFINED"
  --criteria "Implement mode skips goals whose prerequisites are not yet SUBMITTED"
  --criteria "Review and codify modes ignore prerequisites"
  --criteria "State ordering is explicit and testable"
  --prerequisite-goals GOAL_10_ID GOAL_11_ID GOAL_12_ID GOAL_13_ID

# Goal 15
jumbo goal add --title "G15: Update goal reset for new states" --objective "Extend 'jumbo goal reset' to handle all new states, restricting reset target to the goal's last waiting state — resetting to an in-progress state is not permitted." --criteria "'jumbo goal reset' works for goals in any of the new states" --criteria "Reset target is restricted to the goal's last waiting state" --criteria "Resetting to an in-progress state is rejected with a deterministic error" --criteria "Active claims are released on reset" --prerequisite-goals goal_39ea9943-371b-4078-a92b-dab5590cf1b1 --previous-goal goal_5860f626-a3a9-4791-9b10-a81c9bb4eb2a
```

**Note:** Replace `GOAL_X_ID` placeholders with actual goal IDs returned by each `jumbo goal add` command. Goals must be added sequentially so prerequisite IDs are available.

---

## Deployment Protocol

Manual steps to run at phase boundaries and after specific goals. Each goal's implementing agent is responsible for `npm test` and `npx tsc --noEmit` as part of their criteria — this protocol covers steps that fall outside goal scope.

### After every goal

```
[X] npm test                          — all tests pass
[X] npx tsc --noEmit                  — type check passes
[X] npm run generate:commands          — if CLI commands were added or removed
[X] jumbo goal list                   — verify new states appear in default output
```

### After Goal 3 (end of Phase 1)

```
[X] Smoke test: create a goal, refine it, commit, start, block, unblock
    Verify: unblock lands in UNBLOCKED (not DOING), start works from UNBLOCKED
[X] Smoke test: start a goal, submit for review, reject with audit findings
    Verify: rejected goal is startable, audit findings visible in goal show
```

### Before Goal 4 (Phase 2 gate)

```
[X] Inventory all goals currently in DOING state:
    jumbo goal list --status doing
[X] Document which DOING goals need manual intervention after Goal 4:
    - Goals mid-implementation: will need `goal submit` before `goal review`
    - Goals with active claims: submit releases claims (acceptable?)
```

### After Goal 4

```
[X] For each previously-DOING goal that needs review:
    jumbo goal submit --id <goalId>
[X] Verify: goal review now requires SUBMITTED source state
[X] Verify: goal complete still works for QUALIFIED goals
```

### After Goal 6 (end of Phase 2)

```
[ ] Verify: goal complete command is removed (should error)
[ ] Verify: full new lifecycle works end-to-end:
    add → refine → commit → start → submit → review → approve → codify → close
[ ] Verify: DONE goals excluded from goal list default output
```

### After Goal 7 (migration)

```
[ ] Run migration patch function (implementation-specific — see Goal 7 code)
[ ] jumbo db rebuild
[ ] Verify no goals with legacy status values remain:
    jumbo goal list --status to-do       — should return empty
    jumbo goal list --status qualified    — should return empty
    jumbo goal list --status completed    — should return empty
[ ] Verify new goals created in DEFINED state:
    jumbo goal add --title "test" --objective "test"
    jumbo goal show --id <newId>          — status should be 'defined'
[ ] Delete test goal
```

### After Goal 8

```
[ ] jumbo db rebuild
[ ] Verify claims.json is no longer created or referenced:
    ls .jumbo/claims.json                 — should not exist (or path equivalent)
[ ] Verify claim lifecycle end-to-end:
    jumbo goal start --id <goalId>        — acquires claim in SQLite
    jumbo goal submit --id <goalId>       — releases claim in SQLite
[ ] Delete claims.json if it still exists on disk (artifact of old system)
```

### After Goal 9

```
[ ] Test expired claim re-entry for each in-progress state:
    1. Start a goal (acquires claim)
    2. Manually expire the claim (set claimExpiresAt to past in DB)
    3. Re-run the same entry command
    4. Verify: claim is reacquired, no error
[ ] Test active claim rejection:
    1. Start a goal with worker A
    2. Attempt start with worker B
    3. Verify: deterministic error, claim not stolen
```

### After Goal 15 (end of Phase 3)

```
[ ] Full regression: run the complete lifecycle on a fresh goal
[ ] Verify reset from every new state lands on correct waiting state
```

### After Goal 14 (end of Phase 4)

```
[ ] End-to-end autonomous mode test:
    1. Add 2 goals where goal B has goal A as prerequisite
    2. jumbo work --plan          — should pick goal A (B blocked by prereq)
    3. jumbo work --implement     — should pick goal A
    4. jumbo work --review        — should pick goal A
    5. jumbo work --codify        — should pick goal A
    6. Repeat: goal B should now be eligible in each mode
```
