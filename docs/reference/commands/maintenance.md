---
title: Maintenance Commands Reference
description: Complete reference for database and repair maintenance commands.
sidebar:
  order: 8
---

# Maintenance Commands Reference

Complete reference for database rebuild, upgrade, and repair commands.

---

## jumbo db rebuild

Rebuild the database from the event store.

### Synopsis

```bash
> jumbo db rebuild [--yes]
```

### Options

| Option | Description |
|--------|-------------|
| `--yes` | Skip confirmation prompt |

### Behavior

Replays all events from the event store through the event bus, allowing registered projection handlers to reconstruct materialized read model views. Use this when read models have become inconsistent with the underlying event store.

A confirmation prompt is shown unless `--yes` is provided.

### Examples

Rebuild with confirmation prompt:

```bash
> jumbo db rebuild
```

Rebuild without confirmation:

```bash
> jumbo db rebuild --yes
```

---

## jumbo db upgrade

Upgrade the event store schema between versions.

### Synopsis

```bash
> jumbo db upgrade --from <version> --to <version>
```

### Options

| Option | Description |
|--------|-------------|
| `--from <version>` | Source version, e.g., `v1` (required) |
| `--to <version>` | Target version, e.g., `v2` (required) |

### Behavior

Migrates event store data between schema versions. The v1-to-v2 upgrade migrates legacy goal statuses (`to-do`, `doing`) to v2 naming (`defined`, `doing`). The upgrade is idempotent — running it again after a successful migration produces no changes.

### Examples

Migrate goal statuses from v1 to v2:

```bash
> jumbo db upgrade --from v1 --to v2
```

---

## jumbo maintenance repair

Repair agent configuration files and optionally rebuild the database.

### Synopsis

```bash
> jumbo maintenance repair [--yes] [--no-agents] [--no-settings] [--no-db]
```

### Options

| Option | Description |
|--------|-------------|
| `--yes` | Skip confirmation prompt |
| `--no-agents` | Skip agent file repair (AGENTS.md, CLAUDE.md, GEMINI.md, etc.) |
| `--no-settings` | Skip settings file repair |
| `--no-db` | Skip database rebuild |

### Behavior

Performs a full repair of the Jumbo project environment:

1. **Agent files** — Regenerates agent instruction files (AGENTS.md, CLAUDE.md, GEMINI.md, etc.)
2. **Settings files** — Repairs agent-specific settings and configuration
3. **Database** — Rebuilds read models from the event store

Each step can be skipped with its corresponding `--no-*` flag. A confirmation prompt is shown unless `--yes` is provided.

### Examples

Repair everything:

```bash
> jumbo maintenance repair --yes
```

Repair configuration files only (skip database):

```bash
> jumbo maintenance repair --yes --no-db
```

Only rebuild the database:

```bash
> jumbo maintenance repair --yes --no-agents --no-settings
```
