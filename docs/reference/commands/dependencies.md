---
title: Dependency Commands Reference
description: Complete reference for managing dependency relationships between components.
sidebar:
  order: 9
---

# Dependency Commands Reference

Track dependency relationships between components — which components consume which providers.

---

## jumbo dependency add

Add a dependency relationship between two components.

### Synopsis

```bash
> jumbo dependency add --consumer-id <id> --provider-id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--consumer-id <id>` | Component that depends on another (required) |
| `--provider-id <id>` | Component being depended upon (required) |
| `--endpoint <text>` | Connection point, e.g. `/api/users`, `IUserRepository` |
| `--contract <text>` | Interface or contract specification |

### Examples

```bash
# Basic dependency
> jumbo dependency add --consumer-id comp_abc --provider-id comp_def

# With endpoint and contract
> jumbo dependency add \
  --consumer-id comp_abc \
  --provider-id comp_def \
  --endpoint "IUserRepository" \
  --contract "UserRepository interface"
```

---

## jumbo dependencies list

List all component dependencies.

### Synopsis

```bash
> jumbo dependencies list [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--consumer <componentId>` | Filter by consumer component ID |
| `--provider <componentId>` | Filter by provider component ID |

### Examples

```bash
> jumbo dependencies list
> jumbo dependencies list --consumer comp_abc123
> jumbo dependencies list --provider comp_def456
```

---

## jumbo dependency update

Update an existing dependency.

### Synopsis

```bash
> jumbo dependency update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the dependency to update (required) |
| `--endpoint <text>` | Updated endpoint or connection string |
| `--contract <text>` | Updated contract or interface definition |
| `-s, --status <status>` | Updated status: `active`, `deprecated`, `removed` |

### Examples

```bash
> jumbo dependency update --id dep_abc123 --endpoint "/api/v2/users"
> jumbo dependency update --id dep_abc123 --status deprecated
```

---

## jumbo dependency remove

Remove a dependency.

### Synopsis

```bash
> jumbo dependency remove --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the dependency to remove (required) |
| `-r, --reason <text>` | Reason for removing the dependency |

### Examples

```bash
> jumbo dependency remove --id dep_abc123
> jumbo dependency remove --id dep_abc123 --reason "Services merged"
```
