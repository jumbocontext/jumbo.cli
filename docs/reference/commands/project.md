---
title: Project Commands Reference
description: Complete reference for all project-related commands — init and update.
sidebar:
  order: 3
---

Complete reference for all project-related commands.

---

## jumbo project init

Initialize a new Jumbo project.

### Synopsis

```bash
> jumbo project init
jumbo project init --non-interactive --name <name> [options]
```

### Aliases

```bash
> jumbo init
```

### Options

| Option | Description |
|--------|-------------|
| `--name <name>` | Project name (required in non-interactive mode) |
| `--purpose <purpose>` | High-level project purpose |
| `--boundary <items...>` | What's out of scope (can specify multiple) |
| `--non-interactive` | Skip interactive prompts |

### Behavior

1. Creates `.jumbo/` directory with event store and projections
2. Configures Claude Code SessionStart hook (`.claude/settings.json`)
3. Creates Copilot instructions (`.github/copilot-instructions.md`)
4. Updates `AGENTS.md` for other AI agents

### Examples

Initialize interactively (recommended):

```bash
> jumbo project init
```

Initialize without prompts:

```bash
> jumbo project init --non-interactive --name "MyProject" --purpose "AI memory management"
```

Initialize with boundaries:

```bash
> jumbo project init --non-interactive --name "MyProject" --boundary "Mobile app" --boundary "Billing"
```

---

## jumbo project update

Update project metadata.

### Synopsis

```bash
> jumbo project update [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--purpose <purpose>` | Updated project purpose |
| `--boundary <items...>` | Updated project boundaries |

### Notes

At least one option must be provided. Partial updates are supported.

### Examples

Update purpose:

```bash
> jumbo project update --purpose "Updated purpose"
```

Update boundaries:

```bash
> jumbo project update --boundary "Does not replace git" --boundary "No cloud storage"
```

Update multiple fields:

```bash
> jumbo project update --purpose "Updated purpose" --boundary "New boundary"
```
