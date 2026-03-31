---
title: Audience Pain Commands Reference
description: Complete reference for managing audience pain points that the project addresses.
sidebar:
  order: 11
---

Track the pain points your target audiences experience that the project aims to solve.

---

## jumbo audience-pain add

Add an audience pain point.

### Synopsis

```bash
> jumbo audience-pain add --title <text> --description <text>
```

### Options

| Option | Description |
|--------|-------------|
| `-t, --title <text>` | Brief title of the pain point (required) |
| `-d, --description <text>` | Detailed description of the problem (required) |

### Examples

```bash
> jumbo audience-pain add --title "Context loss" --description "LLMs lose all context between sessions"
```

---

## jumbo audience-pains list

List all active audience pain points.

### Synopsis

```bash
> jumbo audience-pains list
```

### Examples

```bash
> jumbo audience-pains list
```

---

## jumbo audience-pain update

Update an existing audience pain point. At least one of `--title` or `--description` must be provided.

### Synopsis

```bash
> jumbo audience-pain update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the audience pain to update (required) |
| `-t, --title <text>` | Updated title |
| `-d, --description <text>` | Updated description |

### Examples

```bash
> jumbo audience-pain update --id pain_abc123 --title "Context evaporation"
> jumbo audience-pain update --id pain_abc123 --description "Updated problem description"
```
