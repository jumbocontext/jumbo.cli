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

## Agent files

Jumbo creates or updates several files outside `.jumbo/` to integrate with AI coding agents. Writes are idempotent: Jumbo preserves user content, merges JSON hook/settings fragments, dedupes existing Jumbo entries, and refreshes managed skills during repair.

**Instruction files** (project root):

| File | Purpose |
|---|---|
| `JUMBO.md` | Bootstrap-only Jumbo instruction file |
| `AGENTS.md` | Points agents to `JUMBO.md` |
| `CLAUDE.md` | Points Claude Code to `JUMBO.md` |
| `GEMINI.md` | Points Gemini CLI to `JUMBO.md` |
| `.github/copilot-instructions.md` | Points GitHub Copilot to `../JUMBO.md` |
| `.cursor/rules/jumbo.mdc` | Points Cursor to `JUMBO.md` with always-apply rules frontmatter |

`JUMBO.md` tells agents to follow Jumbo command prompts and run `jumbo session start` only when a Jumbo command has not already routed the current task. It does not contain a command catalog, workflow guide, or context-maintenance playbook.

**Settings and hooks:**

| File | Purpose |
|---|---|
| `.claude/settings.json` | Claude Code hooks for session start and compaction |
| `.codex/hooks.json` | Codex hooks for session start and compaction using text-mode Jumbo output |
| `.gemini/settings.json` | Gemini CLI hooks for session start and compression |
| `.github/hooks/hooks.json` | GitHub Copilot hooks for session start |
| `.cursor/hooks.json` | Cursor hook for session start |

These hooks load the session router when an agent session begins and preserve work state before compaction or compression.

**Managed skills:**

Jumbo copies workflow and maintenance skills from `assets/skills` into the selected agents' skill directories, including bootstrap/session use, lifecycle hooks, command discovery, context maintenance, and correction capture. Additive initialization does not overwrite existing managed skill directories; repair refreshes Jumbo-managed skills from assets while preserving user-created skills.

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
