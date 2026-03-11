---
title: What Jumbo Creates
description: Understand every file and directory Jumbo adds to your project after installation and initialization.
sidebar:
  order: 4
---

Understand every file and directory Jumbo adds to your project.

---

## The `.jumbo/` directory

The `.jumbo/` directory is Jumbo's local project memory. Everything Jumbo knows about your project lives here.

```
.jumbo/
├── events/                # Event store (source of truth)
│   ├── <aggregate-uuid>/  # One folder per aggregate
│   │   ├── 000001.ProjectInitialized.json
│   │   ├── 000002.ComponentAddedEvent.json
│   │   └── ...
│   └── ...
├── jumbo.db               # SQLite read projection
├── settings.jsonc         # Project-level configuration
└── logs/
    └── jumbo.log          # Runtime log
```

| File / Directory | Purpose |
|---|---|
| `events/` | Append-only event store organized by aggregate UUID |
| `jumbo.db` | SQLite database used as a CQRS read projection |
| `settings.jsonc` | User settings (QA turn limits, claim duration) |
| `logs/jumbo.log` | Runtime log output |

---

## Agent hook files

Jumbo creates or updates several files outside `.jumbo/` to integrate with AI coding agents. All writes are idempotent — if the file already exists, Jumbo appends its section without overwriting your content.

**Instruction files** (project root):

| File | Purpose |
|---|---|
| `AGENTS.md` | Primary Jumbo instructions for all agents |
| `CLAUDE.md` | Points Claude Code to AGENTS.md |
| `GEMINI.md` | Points Gemini CLI to AGENTS.md |
| `.github/copilot-instructions.md` | Jumbo instructions for GitHub Copilot |

**Settings and hooks:**

| File | Purpose |
|---|---|
| `.claude/settings.json` | Claude Code hooks for session start, compaction, and session end |
| `.gemini/settings.json` | Gemini CLI hooks for session start, compression, and session end |
| `.github/hooks/hooks.json` | GitHub Copilot hooks for session start |

These hooks allow Jumbo to automatically load context when an agent session begins and capture a summary when it ends.

---

## How the event store works

Jumbo uses **event sourcing** as its persistence model. Every state change — adding a goal, recording a decision, updating a component — is stored as an immutable JSON event file.

Events are organized under `.jumbo/events/` by aggregate UUID:

```
.jumbo/events/
  <uuid>/
    000001.ProjectInitialized.json
    000002.ComponentAddedEvent.json
    000003.ComponentUpdatedEvent.json
```

Each file is **append-only** and **sequentially numbered**. The event files are the single source of truth for all project data.

The SQLite database (`jumbo.db`) is a **CQRS read projection** — a denormalized view rebuilt from events. It exists purely for fast querying. If `jumbo.db` is deleted, it can be reconstructed from the event files.

---

## Version control guidance

The following entry will be added to your `.gitignore`.

```
.jumbo/
```

The `.jumbo/` directory is **local project memory**. It is not yet designed for sharing across team members.

---

## Configuration

Jumbo stores project-level settings in `.jumbo/settings.jsonc`. The file supports comments (JSONC format).

Default contents:

```jsonc
{
  // Quality Assurance settings for goal completion
  "qa": {
    // Default turn limit for QA iterations on goal completion
    // When this limit is reached, the goal is automatically completed
    "defaultTurnLimit": 3
  },

  // Claim settings for goal ownership and concurrency control
  "claims": {
    // Duration in minutes that a goal claim remains valid
    // After this duration, the claim expires and another worker can claim the goal
    "claimDurationMinutes": 30
  }
}
```

| Setting | Default | Description |
|---|---|---|
| `qa.defaultTurnLimit` | `3` | Maximum QA review iterations before auto-completing a goal |
| `claims.claimDurationMinutes` | `30` | How long a goal claim stays valid before expiring |

---

## What's next?

- [Core Concepts](concepts.md) — Understand sessions, goals, context packets, and project knowledge
- [Goal Management](../guides/goal-management.md) — Learn the full goal lifecycle
