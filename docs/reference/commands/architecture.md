---
title: Architecture Commands Reference
description: Complete reference for defining, updating, and viewing the project's architectural overview.
sidebar:
  order: 4
---

Manage the project's architectural definition — organization style, patterns, principles, data stores, and technology stack.

---

## jumbo architecture define

Define the project architecture.

### Synopsis

```bash
> jumbo architecture define --description <text> --organization <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-d, --description <text>` | High-level architectural overview (required) |
| `--organization <text>` | Architectural organization, e.g. `Clean Architecture`, `Hexagonal` (required) |
| `--pattern <patterns...>` | Architectural patterns used |
| `--principle <principles...>` | Design principles followed |
| `--data-store <items...>` | Data stores in `name:type:purpose` format |
| `--stack <items...>` | Technology stack items |

### Examples

```bash
# Minimal definition
> jumbo architecture define --description "Modular monolith" --organization "Clean Architecture"

# Full definition
> jumbo architecture define \
  --description "Event-driven microservices" \
  --organization "Hexagonal" \
  --pattern "CQRS" "Event Sourcing" \
  --principle "Single Responsibility" "Dependency Inversion" \
  --data-store "postgres:relational:primary store" "redis:cache:session cache" \
  --stack "Node.js" "TypeScript" "PostgreSQL"
```

---

## jumbo architecture update

Update the project architecture. Partial updates — only specified fields change.

### Synopsis

```bash
> jumbo architecture update [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-d, --description <text>` | Updated architectural overview |
| `--organization <text>` | Updated organization style |
| `--pattern <patterns...>` | Updated architectural patterns |
| `--principle <principles...>` | Updated design principles |
| `--data-store <items...>` | Updated data stores (`name:type:purpose`) |
| `--stack <items...>` | Updated technology stack |

### Examples

```bash
> jumbo architecture update --stack "Node.js" "TypeScript" "SQLite"
> jumbo architecture update --pattern "CQRS" "Event Sourcing" --principle "SOLID"
```

---

## jumbo architecture view

Display the current project architecture.

### Synopsis

```bash
> jumbo architecture view
```

### Examples

```bash
> jumbo architecture view
```
