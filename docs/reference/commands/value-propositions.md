---
title: Value Proposition Commands Reference
description: Complete reference for managing the project's value propositions.
sidebar:
  order: 13
---

Define and manage the value propositions that articulate why the project matters.

---

## jumbo value add

Add a value proposition.

### Synopsis

```bash
> jumbo value add --title <text> --description <text> --benefit <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Short value description (required) |
| `-d, --description <text>` | Detailed explanation of the value (required) |
| `--benefit <text>` | How this improves the situation (required) |
| `--measurable-outcome <text>` | How success is measured |

### Examples

```bash
# Without measurable outcome
> jumbo value add \
  --title "Persistent context" \
  --description "Context survives across sessions and agents" \
  --benefit "Eliminates repeated context building"

# With measurable outcome
> jumbo value add \
  --title "Persistent context" \
  --description "Context survives across sessions and agents" \
  --benefit "Eliminates repeated context building" \
  --measurable-outcome "50% reduction in onboarding time per session"
```

---

## jumbo values list

List all value propositions.

### Synopsis

```bash
> jumbo values list
```

### Examples

```bash
> jumbo values list
```

---

## jumbo value update

Update an existing value proposition. At least one optional field must be provided.

### Synopsis

```bash
> jumbo value update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the value proposition to update (required) |
| `-t, --title <text>` | Updated title (max 100 characters) |
| `-d, --description <text>` | Updated description (max 1000 characters) |
| `--benefit <text>` | Updated benefit (max 500 characters) |
| `--measurable-outcome <text>` | Updated measurable outcome (max 500 characters) |
| `--clear-measurable-outcome` | Clear the measurable outcome field |

### Examples

```bash
> jumbo value update --id val_abc123 --benefit "Updated benefit statement"
> jumbo value update --id val_abc123 --clear-measurable-outcome
```

---

## jumbo value remove

Remove a value proposition.

### Synopsis

```bash
> jumbo value remove --id <id>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the value proposition to remove (required) |

### Examples

```bash
> jumbo value remove --id val_abc123
```
