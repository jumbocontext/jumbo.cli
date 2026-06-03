---
title: Project Commands Reference
description: Complete reference for all project-related commands — init, show, and update.
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
| `--non-interactive` | Skip interactive prompts |

### Behavior

1. Creates `.jumbo/` directory with event store and projections
2. In interactive mode, prompts for supported agent integrations before confirmation
3. Filters planned changes and agent-specific file creation to the selected agents
4. Always creates bootstrap-only `JUMBO.md` and reference-only `AGENTS.md`
5. In non-interactive mode, configures all supported agents

Managed agent markdown and JSON hook/settings fragments are loaded from `assets/agent-files`. Managed skills are copied from `assets/skills` to the selected agents' skill directories.

### Examples

Initialize interactively (recommended):

```bash
> jumbo project init
```

Initialize without prompts:

```bash
> jumbo project init --non-interactive --name "MyProject" --purpose "AI memory management"
```

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

---

## jumbo project show

Show project metadata.

### Synopsis

```bash
> jumbo project show [--northstar]
```

### Options

| Option | Description |
|--------|-------------|
| `--northstar` | Return the project alignment packet for goal design and definition |

### Behavior

Without `--northstar`, returns only the core project fields.

With `--northstar`, returns:
- Project metadata
- Audiences
- Audience pains
- Value propositions

Use the north-star packet when designing or defining goals. Other workflows should load their goal-specific context instead.

### Examples

Show core project fields:

```bash
> jumbo project show
```

Show the project north-star packet as JSON:

```bash
> jumbo project show --northstar --format json
```
