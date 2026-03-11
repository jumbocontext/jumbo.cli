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
> jumbo invariant add --title <text> --description <text> --enforcement <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Invariant title (required) |
| `-d, --description <text>` | Detailed description of the invariant (required) |
| `--enforcement <text>` | How this invariant is enforced (required) |
| `-r, --rationale <text>` | Why this invariant is non-negotiable |

### Examples

```bash
> jumbo invariant add \
  --title "No direct DB access" \
  --description "All database access must go through repository interfaces" \
  --enforcement "Code review and architecture tests" \
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
| `--enforcement <text>` | Updated enforcement method |

### Examples

```bash
> jumbo invariant update --id inv_abc123 --enforcement "Automated architecture fitness function"
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
