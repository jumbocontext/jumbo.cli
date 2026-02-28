---
title: Core Concepts
description: Understand the key concepts that power Jumbo — sessions, goals, context packets, and project knowledge.
sidebar:
  order: 3
---

# Core Concepts

Understand the key concepts that power Jumbo.

---

## Sessions

A session represents a continuous period of work with your AI coding agent.

**Starting a session** loads orientation context:

- Project name and purpose
- Previous session summary
- Goals in progress
- Planned goals

**Ending a session** captures what was accomplished, creating continuity for the next session.

```bash
> jumbo session start
# ... work with your AI agent ...
jumbo session end --focus "Completed authentication module"
```

---

## Goals

Goals are discrete units of work that move through a 13-state lifecycle. Each goal has:

| Property | Description |
|----------|-------------|
| **Title** | Short label for the goal (max 60 characters) |
| **Objective** | What needs to be accomplished |
| **Criteria** | How to know when it's done |
| **Scope** | What's in and out of scope |
| **Status** | Current lifecycle state (see below) |

### Goal statuses

| Status | Phase | Description |
|--------|-------|-------------|
| `defined` | Definition | Goal created, not yet refined |
| `in-refinement` | Refinement | Relations to project entities being curated |
| `refined` | Refinement | Refinement complete, ready to start |
| `doing` | Execution | Currently being implemented |
| `paused` | Execution | Temporarily paused (context compressed, work paused, etc.) |
| `blocked` | Execution | Impeded by an external factor |
| `unblocked` | Execution | Blocker resolved, transitioning back to doing |
| `submitted` | Review | Implementation complete, awaiting QA review |
| `in-review` | Review | QA review in progress |
| `rejected` | Review | QA review failed, needs rework |
| `approved` | Review | QA review passed |
| `codifying` | Codification | Architectural reconciliation in progress |
| `done` | Complete | Goal closed after codification |

When you start a goal, Jumbo delivers a context packet containing everything your AI agent needs to work effectively.

```bash
> jumbo goal add --objective "Add dark mode" --criteria "Toggle works" "Persists preference"
jumbo goal refine --id <id>
jumbo goal commit --id <id>
jumbo goal start --id <id>
```

---

## Context packets

Context packets are optimized bundles of project knowledge delivered at workflow transitions.

**Session start packet** contains:

- Project overview
- Recent accomplishments
- Available goals

**Goal start packet** contains:

- Goal objective, criteria, and boundaries
- Relevant components and dependencies
- Applicable invariants and guidelines
- Recent decisions

Context packets are designed for minimal token usage while providing maximum relevance.

---

## Project knowledge

Jumbo captures several types of project knowledge:

| Type | Purpose |
|------|---------|
| **Components** | Parts of your system and their responsibilities |
| **Decisions** | Architectural decisions and their rationale |
| **Invariants** | Non-negotiable rules your code must follow |
| **Guidelines** | Coding standards and best practices |
| **Dependencies** | External systems and libraries |
| **Audiences** | Who uses your product and their priority |
| **Audience Pains** | Problems your audiences face |
| **Value Propositions** | How your product addresses audience pains |
| **Relations** | Connections between goals and knowledge entities |

This knowledge is delivered to your AI agent when relevant to the current goal.

---

## Event store

Jumbo stores all project knowledge as immutable events.

**Benefits:**

- Complete history is preserved
- Nothing is ever lost
- You can trace why decisions were made
- Context is always current

All data is stored locally in `.jumbo/` within your project directory.

---

## The Jumbo workflow

<!-- TODO: Add a workflow diagram showing the developer and agent interaction flow -->

---

## Next steps

- [Goal management guide](../guides/goal-management.md) — Master the goal lifecycle
- [Session management guide](../guides/session-management.md) — Work effectively across sessions
