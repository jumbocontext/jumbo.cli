---
title: Relation Commands Reference
description: Complete reference for managing relationships between entities in the knowledge graph.
sidebar:
  order: 12
---

Add, list, and remove relationships between entities in the knowledge graph — linking goals, components, decisions, and other entities.

---

## jumbo relation add

Add a relationship between two entities.

### Synopsis

```bash
> jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --type <relationType> --description <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--from-type <type>` | Source entity type, e.g. `goal`, `component`, `decision` (required) |
| `--from-id <id>` | Source entity ID (required) |
| `--to-type <type>` | Target entity type (required) |
| `--to-id <id>` | Target entity ID (required) |
| `-T, --type <type>` | Relationship type, e.g. `involves`, `uses`, `depends-on` (required) |
| `-d, --description <text>` | Human-readable explanation of the relationship (required) |
| `--strength <level>` | Relationship strength: `strong`, `medium`, `weak` |

### Examples

```bash
# Link a goal to a component
> jumbo relation add \
  --from-type goal --from-id goal_abc123 \
  --to-type component --to-id comp_def456 \
  --type involves \
  --description "Goal modifies this component"

# With strength
> jumbo relation add \
  --from-type component --from-id comp_abc \
  --to-type decision --to-id dec_def \
  --type uses \
  --description "Component follows this decision" \
  --strength strong
```

---

## jumbo relations list

List all knowledge graph relations.

### Synopsis

```bash
> jumbo relations list [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--entity-type <type>` | Filter by entity type, e.g. `goal`, `decision`, `component` |
| `--entity-id <id>` | Filter by entity ID (requires `--entity-type`) |
| `-s, --status <status>` | Filter by status: `active`, `removed`, `all` (default: `active`) |

### Examples

```bash
> jumbo relations list
> jumbo relations list --entity-type goal
> jumbo relations list --entity-type component --entity-id comp_abc123
> jumbo relations list --status all
```

---

## jumbo relation remove

Remove a relation from the knowledge graph.

### Synopsis

```bash
> jumbo relation remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the relation to remove (required) |
| `-r, --reason <text>` | Reason for removing the relation |

### Examples

```bash
> jumbo relation remove --id rel_abc123
> jumbo relation remove --id rel_abc123 --reason "Relationship no longer relevant"
```
