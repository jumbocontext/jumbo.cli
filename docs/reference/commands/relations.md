---
title: Relation Commands Reference
description: Complete reference for managing relationships between entities in the knowledge graph.
sidebar:
  order: 12
---

Add, list, traverse, and remove relationships between entities in the knowledge graph — linking goals, components, decisions, and other entities.

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
| `--entity-id <id>` | Filter by entity ID |
| `-d, --direction <direction>` | Filter relative to the entity: `in`, `out`, or `both` (default: `both`) |
| `--relation-type <type>` | Filter by relation type |
| `--related-entity-type <type>` | Filter by the type at the opposite endpoint |
| `--strength <strength>` | Filter by strength: `strong`, `medium`, or `weak` |
| `-s, --status <status>` | Filter by status: `active`, `deactivated`, `removed`, or `all` (default: `active`) |

### Examples

```bash
> jumbo relations list
> jumbo relations list --entity-type goal
> jumbo relations list --entity-type component --entity-id comp_abc123
> jumbo relations list --entity-id comp_abc123 --direction out --relation-type requires
> jumbo relations list --related-entity-type decision --strength strong
> jumbo relations list --status all
```

---

## jumbo relations traverse

Traverse a bounded portion of the relation graph from one entity. Traversal uses deterministic breadth-first search and preserves every relation's original direction.

### Synopsis

```bash
> jumbo relations traverse --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Entity ID at the traversal root (required) |
| `--entity-type <type>` | Root entity type; inferred when the ID identifies one endpoint type |
| `--depth <depth>` | Traversal depth from `1` through `5` (default: `1`) |
| `-d, --direction <direction>` | Traversal direction: `in`, `out`, or `both` (default: `both`) |
| `--relation-type <type>` | Filter by relation type |
| `--related-entity-type <type>` | Filter each expansion by the opposite endpoint type |
| `--strength <strength>` | Filter by strength: `strong`, `medium`, or `weak` |
| `-s, --status <status>` | Filter by status: `active`, `deactivated`, `removed`, or `all` (default: `active`) |
| `--limit <limit>` | Maximum distinct edges from `1` through `1000` (default: `100`) |

If an ID appears under multiple entity types, specify `--entity-type`. Results include the resolved root, distinct nodes with their minimum hop distance, directed edges, reached depth, limit, and truncation state. Text output groups results by hop; `--format json` returns the stable structured graph result.

### Examples

```bash
> jumbo relations traverse --id goal_abc123
> jumbo relations traverse --id goal_abc123 --entity-type goal --depth 3
> jumbo relations traverse --id comp_abc123 --direction out --relation-type requires --limit 250
> jumbo relations traverse --id comp_abc123 --depth 2 --format json
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
