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
- **Agent hooks** — Integration configuration for AI coding assistants

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
├── events.db       # Immutable event history
└── projections.db  # Read-optimized views
```

### Agent hooks

Jumbo configures hooks for popular AI coding assistants:

| Agent | Configuration |
|-------|---------------|
| **Claude Code** | `.claude/settings.json` with SessionStart hook |
| **GitHub Copilot** | `.github/copilot-instructions.md` |
| **Gemini CLI** | `GEMINI.md` and `.gemini/settings.json` |
| **GitHub Hooks** | `.github/hooks/hooks.json` |
| **All agents** | `JUMBO.md` and `AGENTS.md` |

Interactive init only creates the agent-specific files and managed skill directories for the agents you select. `JUMBO.md` and `AGENTS.md` are always created because they are shared across integrations.

---

## Update project settings

After initialization, update settings with:

```bash
> jumbo project update --purpose "New project purpose"
```

Update boundaries:

```bash
> jumbo project update --boundary "Does not replace git" --boundary "No cloud storage"
```

Update multiple fields:

```bash
> jumbo project update --purpose "Updated purpose" --boundary "New boundary"
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
