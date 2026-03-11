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
| **Boundaries** | What's explicitly out of scope (optional) |

Press Enter to skip optional fields.

---

## Non-interactive initialization

For automation or scripting:

```bash
> jumbo init --non-interactive --name "MyProject" --purpose "AI memory management"
```

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
| **Gemini / Others** | `AGENTS.md` with manual setup instructions |

These hooks ensure your AI agent receives project state automatically when starting a session.

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

- [Create your first goal](goal-management.md)
- [Project command reference](../reference/commands/project.md)
