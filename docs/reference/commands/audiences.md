---
title: Audience Commands Reference
description: Complete reference for managing target audiences for the project.
sidebar:
  order: 10
---

Define and manage the target audiences for your project.

---

## jumbo audience add

Add a target audience.

### Synopsis

```bash
> jumbo audience add --name <text> --description <text> --priority <level>
```

### Options

| Option | Description |
|--------|-------------|
| `-n, --name <text>` | Audience name, e.g. `Software Developers` (required) |
| `-d, --description <text>` | Who they are and what they do (required) |
| `--priority <level>` | Priority level: `primary`, `secondary`, `tertiary` (required) |

### Examples

```bash
> jumbo audience add --name "Software Developers" --description "Developers using LLM agents" --priority primary
> jumbo audience add --name "DevOps Engineers" --description "Teams managing CI/CD" --priority secondary
```

---

## jumbo audiences list

List all target audiences.

### Synopsis

```bash
> jumbo audiences list
```

### Examples

```bash
> jumbo audiences list
```

---

## jumbo audience remove

Remove an audience from the project.

### Synopsis

```bash
> jumbo audience remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the audience to remove (required) |
| `-r, --reason <text>` | Reason for removing the audience |

### Examples

```bash
> jumbo audience remove --id aud_abc123
> jumbo audience remove --id aud_abc123 --reason "No longer a target market"
```

---

## jumbo audience update

Update an existing audience.

### Synopsis

```bash
> jumbo audience update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the audience to update (required) |
| `-n, --name <text>` | Updated audience name |
| `-d, --description <text>` | Updated description |
| `--priority <level>` | Updated priority: `primary`, `secondary`, `tertiary` |

### Examples

```bash
> jumbo audience update --id aud_abc123 --priority primary
> jumbo audience update --id aud_abc123 --name "Platform Engineers" --description "Engineers building internal platforms"
```
