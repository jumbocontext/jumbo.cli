---
title: Project Initialization
description: Configure Jumbo for your project with interactive or scripted initialization.
sidebar:
  order: 1
---

Configure Jumbo for your project.

---

## Overview

`jumbo init` creates a `.jumbo/` directory in your project containing:

- **Event store** — Append-only log of all project knowledge
- **Projections** — Read-optimized views for fast queries
- **Project settings** — Stable project identity and local Jumbo preferences
- **Agent files** — Bootstrap instructions, lifecycle hooks, settings fragments, and managed skills for selected AI coding assistants

---

## Interactive initialization

Run in your project directory:

```bash
> jumbo init
```

You'll be prompted for:

| Field | Description |
|-------|-------------|
| **Project name** | Short, memorable identifier (required) |
| **Purpose** | High-level goal or problem the project solves (optional) |
| **Target audiences** | Who the project serves, with priority level (optional, multiple) |
| **Audience pain points** | Problems the project solves (optional, multiple) |
| **Value propositions** | Value the project delivers, with benefit and measurable outcome (optional, multiple) |

Each optional section is gated by a confirm prompt (default: Yes). Decline to skip. After each entry, you can add more of the same type.

Before confirmation, Jumbo also shows a checkbox prompt listing the available agent integrations derived from the registered configurers. Your selections determine which agent-specific files, hooks, and managed skill directories are included in the plan and written during initialization.

---

## Non-interactive initialization

For automation or scripting:

```bash
> jumbo init --non-interactive --name "MyProject" --purpose "AI memory management"
```

You can also provide audience, pain, and value proposition data via flags:

```bash
> jumbo init --non-interactive --name "MyProject" \
    --audience-name "Developers" --audience-description "Software developers" --audience-priority primary \
    --pain-title "Context loss" --pain-description "LLMs lose context between sessions" \
    --value-title "Persistent context" --value-description "Maintain context across sessions" --value-benefit "No repeated context building"
```

Primitive flags require all mandatory fields for their type to take effect. Partial sets are silently ignored.

Non-interactive mode skips the agent checkbox and preserves the existing behavior of configuring all supported agents.

---

## What gets created

### .jumbo/ directory

Contains the event store and projection databases:

```
.jumbo/
├── events/         # Immutable event history
├── jumbo.db        # Read-optimized SQLite projection
└── settings.jsonc  # Stable project identity and local settings
```

### Agent hooks

Jumbo configures hooks for popular AI coding assistants:

| Agent | Configuration |
|-------|---------------|
| **Claude Code** | `CLAUDE.md`, `.claude/settings.json`, and `.claude/skills` |
| **Codex** | `.codex/hooks.json` and `.codex/skills` |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/hooks/hooks.json`, and `.agents/skills` |
| **Gemini CLI** | `GEMINI.md`, `.gemini/settings.json`, and `.gemini/skills` |
| **Cursor** | `.cursor/rules/jumbo.mdc` and `.cursor/hooks.json` |
| **Vibe** | `.vibe/skills` |
| **All agents** | `JUMBO.md` and `AGENTS.md` |

Interactive init only creates the agent-specific files and managed skill directories for the agents you select. `JUMBO.md` and `AGENTS.md` are always created because they are shared across integrations.

Managed instruction files are bootstrap-only. `JUMBO.md` tells agents to follow Jumbo command prompts and to run `jumbo session start` only when a Jumbo command has not already routed the task. Reference files point to `JUMBO.md`; command discovery, workflow details, context maintenance, and correction capture live in managed skills and Jumbo command output.

Jumbo-owned markdown files and JSON hook/settings fragments are loaded from `assets/agent-files`. Managed skills are copied from `assets/skills`, with additive initialization preserving existing user-created skills and repair refreshing Jumbo-managed skill directories.

---

## Update project settings

After initialization, update settings with:

```bash
> jumbo project update --purpose "New project purpose"
```

---

## Version control

Add `.jumbo/` to your `.gitignore` (if working in a team):

```
# Jumbo project memory (local only)
.jumbo/
```

> **Note:** The `.jumbo/` directory contains your local project memory. Sharing it across team members is not yet supported and may cause issues with event ordering.

---

## Reinitializing

If you need to start fresh:

1. Delete the `.jumbo/` directory
2. Run `jumbo project init` again

All previous project memory will be lost.

---

## Next steps

- [Create your first goal](../guides/goal-management.md)
- [Project command reference](../reference/commands/project.md)
