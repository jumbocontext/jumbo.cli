---
title: Guideline Commands Reference
description: Complete reference for managing execution guidelines — testing, coding style, process, and more.
sidebar:
  order: 10
---

Define execution guidelines that govern how work is done — coding style, testing practices, process rules, and more.

---

## jumbo guideline add

Add an execution guideline.

### Synopsis

```bash
> jumbo guideline add --category <category> --title <text> --description <text> --rationale <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --category <category>` | Category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` (required) |
| `-t, --title <text>` | Guideline title (required) |
| `-d, --description <text>` | Detailed description (required) |
| `--rationale <text>` | Why this guideline is important (required) |
| `--example <paths...>` | Example file paths demonstrating the guideline |

### Examples

```bash
> jumbo guideline add \
  --category testing \
  --title "Unit test isolation" \
  --description "Each unit test must be independent" \
  --rationale "Prevents cascading failures"

# With examples
> jumbo guideline add \
  --category codingStyle \
  --title "Use relative imports" \
  --description "Always use relative paths for local imports" \
  --rationale "Ensures portability" \
  --example "./src/services/UserService.ts" "./src/api/routes.ts"
```

---

## jumbo guidelines list

List all execution guidelines.

### Synopsis

```bash
> jumbo guidelines list [--category <category>]
```

### Options

| Option | Description |
|--------|-------------|
| `-c, --category <category>` | Filter by category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` |

### Examples

```bash
> jumbo guidelines list
> jumbo guidelines list --category testing
> jumbo guidelines list --category codingStyle
```

---

## jumbo guideline update

Update an existing guideline.

### Synopsis

```bash
> jumbo guideline update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the guideline to update (required) |
| `-c, --category <category>` | Updated category: `testing`, `codingStyle`, `process`, `communication`, `documentation`, `security`, `performance`, `other` |
| `-t, --title <text>` | Updated title |
| `-d, --description <text>` | Updated description |
| `--rationale <text>` | Updated rationale |
| `--example <paths...>` | Updated example paths (replaces existing) |

### Examples

```bash
> jumbo guideline update --id guide_abc123 --rationale "Aligned with automated linting"
> jumbo guideline update --id guide_abc123 --category security --title "Input validation"
```

---

## jumbo guideline remove

Remove an execution guideline.

### Synopsis

```bash
> jumbo guideline remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the guideline to remove (required) |
| `-r, --reason <text>` | Reason for removal |

### Examples

```bash
> jumbo guideline remove --id guide_abc123
> jumbo guideline remove --id guide_abc123 --reason "Superseded by automated linting"
```
