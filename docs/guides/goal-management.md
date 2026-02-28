---
title: Goal Management
description: Master Jumbo's 13-state goal lifecycle — from definition and refinement through execution, review, codification, and completion.
sidebar:
  order: 2
---

# Goal Management

Track work effectively with Jumbo's goal system.

---

## Overview

Goals are the heart of Jumbo's context management. Each goal moves through four phases: **refinement**, **execution**, **review**, and **codification**. At each transition, Jumbo delivers optimized context packets to your AI agent containing:

- The goal's objective, criteria, and scope
- Relevant components and dependencies
- Applicable invariants and guidelines
- Recent architectural decisions

---

## Goal lifecycle

```
                          ┌──────────────────────────────────────┐
                          │           REFINEMENT                 │
                          │                                      │
                          │  DEFINED ──► IN_REFINEMENT ──► REFINED
                          │                                  │   │
                          └──────────────────────────────────│───┘
                                                             │
                                            start            │
                                                             ▼
┌────────────────────────────────────────────────────────────────┐
│                        EXECUTION                               │
│                                                                │
│          ┌──────── PAUSED                                      │
│          │ resume     ▲ pause                                  │
│          ▼            │                                        │
│        DOING ────► BLOCKED                                     │
│          │         unblock ──► UNBLOCKED ──► DOING             │
│          │ submit                                              │
│          ▼                                                     │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                        REVIEW                                  │
│                                                                │
│        SUBMITTED ──► IN_REVIEW ──┬──► APPROVED                 │
│            ▲                     │                              │
│            └──── REJECTED ◄──────┘                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                     CODIFICATION                               │
│                                                                │
│               APPROVED ──► CODIFYING ──► DONE                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

| Status | Description |
|--------|-------------|
| `defined` | Goal created, not yet refined |
| `in-refinement` | Relations to project entities being curated |
| `refined` | Refinement complete, ready to start |
| `doing` | Currently being implemented |
| `paused` | Temporarily paused |
| `blocked` | Impeded by an external factor |
| `unblocked` | Blocker resolved, transitioning back to doing |
| `submitted` | Implementation complete, awaiting QA review |
| `in-review` | QA review in progress |
| `rejected` | QA review failed, needs rework |
| `approved` | QA review passed |
| `codifying` | Architectural reconciliation in progress |
| `done` | Goal closed after codification |

---

## Phase 1: Definition and refinement

### Create a goal

#### Interactive mode
<sub>#for-devs</sub>

Use the guided wizard for complex goals:

```bash
> jumbo goal add --interactive
```

#### Command-line mode
<sub>#for-devs-and-agents</sub>

Create a goal directly:

```bash
> jumbo goal add --title "JWT Auth" --objective "Implement JWT authentication" --criteria "Token generation works" "Token validation works"
```

#### Options

| Option | Description |
|--------|-------------|
| `--title <text>` | Short title for the goal (max 60 characters) |
| `--objective <text>` | What needs to be accomplished (required unless `--interactive`) |
| `--criteria <items...>` | Success criteria (can specify multiple) |
| `--scope-in <items...>` | Components in scope |
| `--scope-out <items...>` | Components explicitly out of scope |
| `--interactive` | Use guided wizard |
| `--next-goal <goalId>` | Chain to another goal after completion |
| `--previous-goal <goalId>` | Chain from another goal to this one |
| `--prerequisite-goals <goalIds...>` | Goals that must reach submitted+ status before this goal can start |

### Refine a goal
<sub>#for-devs-and-agents</sub>

Refinement curates relations between the goal and project entities (components, decisions, invariants, guidelines, dependencies). This ensures the agent receives optimal architectural context when the goal is started.

```bash
> jumbo goal refine --id goal_abc123
```

Use `--interactive` for guided prompts to register relations:

```bash
> jumbo goal refine --id goal_abc123 --interactive
```

### Commit refinement

Lock the refinement and transition to `refined`:

```bash
> jumbo goal commit --id goal_abc123
```

---

## Phase 2: Execution

### Start a goal
<sub>#for-agents #manual-option</sub>

When ready to work on a refined goal:

```bash
> jumbo goal start --id goal_abc123
```

This:

1. Validates prerequisite goals are at `submitted` or later status
2. Transitions the goal to `doing`
3. Delivers the goal's context packet to your AI agent

### Track progress

Record completed sub-tasks during implementation:

```bash
> jumbo goal update-progress --id goal_abc123 --task-description "Implemented user login form"
```

### Pause a goal

Temporarily suspend work:

```bash
> jumbo goal pause --id goal_abc123 --reason ContextCompressed
```

| Reason | When to use |
|--------|-------------|
| `ContextCompressed` | Agent context window was compressed |
| `WorkPaused` | Switching to other work |
| `Other` | Any other reason (use `--note` for details) |

Add context with `--note`:

```bash
> jumbo goal pause --id goal_abc123 --reason Other --note "Need to switch priorities"
```

### Resume a goal

Return to a paused goal or reload context for an active goal:

```bash
> jumbo goal resume --id goal_abc123
```

Add a note when resuming from paused:

```bash
> jumbo goal resume --id goal_abc123 --note "Ready to continue"
```

### Block a goal

When progress is impeded by an external factor:

```bash
> jumbo goal block --id goal_abc123 --note "Waiting for API credentials"
```

### Unblock a goal

When the blocker is resolved:

```bash
> jumbo goal unblock --id goal_abc123 --note "Credentials received from DevOps"
```

---

## Phase 3: Review

### Submit for review

After implementation is complete:

```bash
> jumbo goal submit --id goal_abc123
```

### Start QA review

Begin the review process:

```bash
> jumbo goal review --id goal_abc123
```

This delivers the goal's full context (objective, criteria, scope, related entities) as a QA verification prompt.

### Approve or reject

If all criteria are met:

```bash
> jumbo goal approve --id goal_abc123
```

If issues are found:

```bash
> jumbo goal reject --id goal_abc123 --audit-findings "Missing error handling in API endpoint"
```

Rejection transitions the goal back to `doing` so the agent can address the findings, then re-submit.

---

## Phase 4: Codification

### Codify

After approval, reconcile architectural learnings:

```bash
> jumbo goal codify --id goal_abc123
```

This prompts the agent to reflect on whether the implementation surfaced new invariants, guidelines, decisions, or components that should be registered.

### Close

After codification is complete:

```bash
> jumbo goal close --id goal_abc123
```

The goal transitions to `done`. If chained to another goal, Jumbo suggests the next goal to start.

---

## Reset a goal

Reset dynamically computes a target state based on where the goal currently is:

```bash
> jumbo goal reset --id goal_abc123
```

| Current status | Resets to |
|---------------|-----------|
| `in-refinement` | `defined` |
| `in-review` | `submitted` |
| `codifying` | `approved` |
| `doing` | `lastWaitingStatus` or `refined` |

For goals in `doing`, the reset target is the last "waiting" status the goal was in before entering execution. If the goal was paused and resumed, it resets to where it was before the pause/resume cycle. If no waiting status was recorded, it resets to `refined`.

---

## Prerequisite goals

Goals can declare prerequisites that must be met before starting:

```bash
> jumbo goal add --objective "Deploy to production" --prerequisite-goals goal_abc123 goal_def456
```

Prerequisites can also be set via update:

```bash
> jumbo goal update --id goal_xyz789 --prerequisite-goals goal_abc123
```

The prerequisite policy enforces that all prerequisite goals must be at `submitted` or later status (submitted, in-review, approved, codifying, or done) before the dependent goal can start.

---

## Goal chaining

Link goals in a sequence for multi-step work:

Create a goal that follows another:

```bash
> jumbo goal add --objective "Goal B" --previous-goal goal_abc123
```

When `goal_abc123` completes, Jumbo suggests starting Goal B.

Create a goal that precedes another:

```bash
> jumbo goal add --objective "Goal A" --next-goal goal_xyz789
```

---

## Other commands

### View goal details

```bash
> jumbo goal show --id goal_abc123
```

### Update a goal

Modify goal properties (partial updates supported):

```bash
> jumbo goal update --id goal_abc123 --title "New Title" --objective "Updated objective"
```

### Complete a goal (shortcut)

Skip the review/codification phases:

```bash
> jumbo goal complete --id goal_abc123
```

### Remove a goal

```bash
> jumbo goal remove --id goal_abc123
```

Event history is preserved; only the active view is removed.

### List goals

```bash
> jumbo goals list
> jumbo goals list --status doing
> jumbo goals list --status doing,blocked
```

Valid status filters: `defined`, `doing`, `blocked`, `paused`, `refined`, `in-refinement`, `in-review`, `approved`, `done`.

---

## Best practices

1. **Keep objectives specific**
   "Implement JWT auth" not "Work on authentication"

2. **Define measurable criteria**
   "Tests pass" not "It works"

3. **Refine before starting**
   Curating relations ensures your agent gets precise context

4. **Use interactive mode for complex goals**
   The wizard helps you select relevant context

5. **Block rather than abandon**
   Preserves blocker context for future sessions

6. **Always review and codify**
   The review phase catches deviations; codification captures learnings

---

## Next steps

- [Session management guide](session-management.md) — Manage work sessions
- [Goal command reference](../reference/commands/goal.md) — Complete command details
