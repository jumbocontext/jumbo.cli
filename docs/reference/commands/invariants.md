---
title: Invariant Commands Reference
description: Complete reference for managing project invariants — non-negotiable requirements that must always hold.
sidebar:
  order: 11
---

Define non-negotiable requirements that must always hold true across the project.

---

## jumbo invariant add

Add a project invariant.

### Synopsis

```bash
> jumbo invariant add --title <text> --description <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Invariant title (required) |
| `-d, --description <text>` | Detailed description of the invariant (required) |
| `-r, --rationale <text>` | Why this invariant is non-negotiable |

### Examples

```bash
> jumbo invariant add \
  --title "No direct DB access" \
  --description "All database access must go through repository interfaces" \
  --rationale "Maintains clean architecture boundaries"
```

---

## jumbo invariants list

List all project invariants.

### Synopsis

```bash
> jumbo invariants list
```

### Examples

```bash
> jumbo invariants list
```

---

## jumbo invariants search

Search invariants by title or free-text query. Filters combine with AND logic.

### Synopsis

```bash
> jumbo invariants search [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <title>` | Filter by title (substring match; supports `*` wildcards) |
| `-q, --query <text>` | Free-text search across title, description, and rationale (supports `*` wildcards) |
| `-o, --output <level>` | Output detail: `default` or `compact` (id and title only) |

### Examples

```bash
# Search by title wildcard
> jumbo invariants search --title "Clean*"

# Free-text search with compact output
> jumbo invariants search --query "stdout" --output compact
```

---

## jumbo invariant update

Update an existing invariant.

### Synopsis

```bash
> jumbo invariant update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the invariant to update (required) |
| `-t, --title <text>` | Updated title |
| `-d, --description <text>` | Updated description |
| `-r, --rationale <text>` | Updated rationale |

### Examples

```bash
> jumbo invariant update --id inv_abc123 --title "Repository pattern required" --description "Updated invariant"
```

---

## jumbo invariant remove

Remove an invariant from project knowledge.

### Synopsis

```bash
> jumbo invariant remove --id <id>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Invariant ID to remove (required) |

### Examples

```bash
> jumbo invariant remove --id inv_abc123
```
