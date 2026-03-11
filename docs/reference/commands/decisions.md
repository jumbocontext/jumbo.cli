---
title: Decision Commands Reference
description: Complete reference for managing architectural decision records (ADRs).
sidebar:
  order: 8
---

Record, update, supersede, reverse, and restore architectural decisions (ADRs).

---

## jumbo decision add

Add a new architectural decision record.

### Synopsis

```bash
> jumbo decision add --title <text> --context <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Decision title (required) |
| `--context <text>` | Context and problem statement (required) |
| `--rationale <text>` | Rationale for the decision |
| `--alternative <items...>` | Alternatives considered |
| `--consequences <text>` | Consequences of this decision |

### Examples

```bash
# Minimal
> jumbo decision add --title "Use SQLite" --context "Need embedded database for CLI tool"

# Full
> jumbo decision add \
  --title "Use SQLite" \
  --context "Need embedded database for CLI tool" \
  --rationale "Zero config, single-file, fast for local workloads" \
  --alternative "PostgreSQL" "LevelDB" \
  --consequences "Limited concurrent write throughput"
```

---

## jumbo decisions list

List all architectural decisions.

### Synopsis

```bash
> jumbo decisions list [--status <status>]
```

### Options

| Option | Description |
|--------|-------------|
| `-s, --status <status>` | Filter by status: `active`, `superseded`, `reversed`, `all` (default: `all`) |

### Examples

```bash
> jumbo decisions list
> jumbo decisions list --status active
> jumbo decisions list --status superseded
```

---

## jumbo decision update

Update an existing decision.

### Synopsis

```bash
> jumbo decision update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Decision ID to update (required) |
| `-t, --title <text>` | Updated title |
| `--context <text>` | Updated context |
| `--rationale <text>` | Updated rationale |
| `--alternative <items...>` | Updated alternatives considered |
| `--consequences <text>` | Updated consequences |

### Examples

```bash
> jumbo decision update --id dec_abc123 --rationale "Updated reasoning after benchmarks"
```

---

## jumbo decision supersede

Mark a decision as superseded by a newer decision.

### Synopsis

```bash
> jumbo decision supersede --id <id> --superseded-by <id>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the decision to supersede (required) |
| `--superseded-by <id>` | ID of the superseding decision (required) |

### Examples

```bash
> jumbo decision supersede --id dec_abc123 --superseded-by dec_def456
```

---

## jumbo decision reverse

Reverse an architectural decision.

### Synopsis

```bash
> jumbo decision reverse --id <id> --reason <text>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Decision ID to reverse (required) |
| `-r, --reason <text>` | Reason for reversing the decision (required) |

### Examples

```bash
> jumbo decision reverse --id dec_abc123 --reason "Performance benchmarks showed unacceptable latency"
```

---

## jumbo decision restore

Restore a reversed or superseded architectural decision back to active status.

### Synopsis

```bash
> jumbo decision restore --id <id> --reason <text>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | Decision ID to restore (required) |
| `-r, --reason <text>` | Reason for restoring the decision (required) |

### Examples

```bash
> jumbo decision restore --id dec_abc123 --reason "The constraints that caused reversal are no longer present"
```
