---
title: Core Concepts
description: Understand the key concepts that power Jumbo — sessions, goals, context packets, and project knowledge.
sidebar:
  order: 3
---

Understand the key concepts that power Jumbo.

---

## Sessions

Sessions provide agents with the highest level of project context, and managed meta data about project state.

**Starting a session** renders orientation context:

- Project name and purpose
- Recent changes
- Goals in progress
- Goals ready for refinement
- Planned goals

**Ending a session** captures what was accomplished, creating a book of record for the project history.

```bash
jumbo session start
# ... work with your AI agent ...
jumbo session end --focus "Completed authentication module"
```

:::note
Session commands are designed for agents to use, but it's perfectly safe to run them yourself to explore what gets rendered. You won't break anything.
:::

---

## Goals

Goals are discrete units of work that move through a four phased lifecycle. Each goal has:

| Property | Description |
|----------|-------------|
| **Title** | Short label for the goal (max 60 characters) |
| **Objective** | What needs to be accomplished |
| **Criteria** | Success criteria that must be satisfied for approval |
| **Scope in** | Components, files, or namespaces in scope for the goal |
| **Scope out** | Components, files, or namespaces explicitly out of scope |
| **Next goal** | Goal to chain to after this one completes |
| **Previous goal** | Goal that chains into this one |
| **Prerequisite goals** | Goals that must be completed before this goal can start |
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
jumbo goal add --objective "Add dark mode" --criteria "Toggle works" "Persists preference"
jumbo goal refine --id <id>
jumbo goal commit --id <id>
jumbo goal start --id <id>
```

---

## Context packets

Context packets are optimized bundles of project knowledge delivered at workflow transitions.

**Session start packet** contains:

- Project overview
- Recent changes
- Available goals

**Goal start packet** contains:

- Goal objective, criteria, and boundaries
- Relevant components and dependencies
- Applicable invariants and guidelines
- Related decisions

Context packets are designed for minimal token usage while providing maximum relevance.

---

## Memory types

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

## What's next?

- [Goal management guide](../guides/goal-management.md) — Master the goal lifecycle
