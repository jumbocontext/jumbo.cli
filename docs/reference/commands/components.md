---
title: Component Commands Reference
description: Complete reference for tracking software components — add, update, search, deprecate, undeprecate, and remove.
sidebar:
  order: 5
---

Track the software components in your system — services, libraries, APIs, databases, and more.

---

## jumbo component add

Add a component. If a component with the same name already exists, this performs an update.

### Synopsis

```bash
> jumbo component add --name <text> --type <type> --description <text> --responsibility <text> --path <path>
```

### Options

| Option | Description |
|--------|-------------|
| `-n, --name <text>` | Component name (required) |
| `-T, --type <type>` | Component type: `service`, `db`, `queue`, `ui`, `lib`, `api`, `worker`, `cache`, `storage` (required) |
| `-d, --description <text>` | What the component does (required) |
| `--responsibility <text>` | Single responsibility of the component (required) |
| `--path <path>` | File path to the component (required) |

### Examples

```bash
> jumbo component add \
  --name "UserService" \
  --type service \
  --description "Handles user lifecycle" \
  --responsibility "User CRUD operations" \
  --path "./src/services/UserService.ts"
```

---

## jumbo component show

Display component details and relations.

### Synopsis

```bash
> jumbo component show --id <id>
> jumbo component show --name <name>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to show |
| `-n, --name <name>` | Name of the component to show |

At least one of `--id` or `--name` must be provided.

### Examples

```bash
> jumbo component show --id comp_abc123
> jumbo component show --name "UserService"
```

---

## jumbo component update

Update an existing component's metadata. At least one optional field must be provided.

### Synopsis

```bash
> jumbo component update --id <id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to update (required) |
| `-d, --description <text>` | Updated description |
| `--responsibility <text>` | Updated responsibility |
| `--path <path>` | Updated file path |
| `-T, --type <type>` | Updated type: `api`, `service`, `db`, `queue`, `ui`, `lib`, `worker`, `cache`, `storage` |

### Examples

```bash
> jumbo component update --id comp_abc123 --description "Updated description"
> jumbo component update --id comp_abc123 --type api --path "./src/api/users.ts"
```

---

## jumbo component rename

Rename an existing component.

### Synopsis

```bash
> jumbo component rename --id <id> --name <name>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to rename (required) |
| `-n, --name <name>` | New name for the component (required) |

### Examples

```bash
> jumbo component rename --id comp_abc123 --name "AccountService"
```

---

## jumbo components search

Search components by name, type, status, or free-text query. Filters combine with AND logic.

### Synopsis

```bash
> jumbo components search [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Filter by name (substring match; supports `*` wildcards) |
| `-t, --type <type>` | Filter by type: `service`, `db`, `queue`, `ui`, `lib`, `api`, `worker`, `cache`, `storage` |
| `-s, --status <status>` | Filter by status: `active`, `deprecated`, `removed` (defaults to excluding deprecated) |
| `-q, --query <text>` | Free-text search across description and responsibility (supports `*` wildcards) |
| `-o, --output <level>` | Output detail: `default` or `compact` (id, name, type only) |

### Examples

```bash
# Search by name wildcard
> jumbo components search --name "Auth*"

# Search by type
> jumbo components search --type service

# Free-text search with compact output
> jumbo components search --query "authentication" --output compact

# Combined filters
> jumbo components search --type api --status active --name "*User*"
```

---

## jumbo components list

List all software components.

### Synopsis

```bash
> jumbo components list [--status <status>]
```

### Options

| Option | Description |
|--------|-------------|
| `-s, --status <status>` | Filter by status: `active`, `deprecated`, `removed`, `all` (default: `all`) |

### Examples

```bash
> jumbo components list
> jumbo components list --status active
> jumbo components list --status deprecated
```

---

## jumbo component deprecate

Mark a component as deprecated.

### Synopsis

```bash
> jumbo component deprecate --id <id> [--reason <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to deprecate (required) |
| `-r, --reason <text>` | Reason for deprecation (max 500 characters) |

### Examples

```bash
> jumbo component deprecate --id comp_abc123
> jumbo component deprecate --id comp_abc123 --reason "Replaced by AccountService"
```

---

## jumbo component undeprecate

Restore a deprecated component back to active status.

### Synopsis

```bash
> jumbo component undeprecate --id <id> --reason <text>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to undeprecate (required) |
| `-r, --reason <text>` | Reason for undeprecating the component (required) |

### Examples

```bash
> jumbo component undeprecate --id comp_abc123 --reason "Still required by active features"
```

---

## jumbo component remove

Mark a component as removed. The component must be deprecated before removal.

### Synopsis

```bash
> jumbo component remove --id <id>
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --id <id>` | ID of the component to remove (required) |

### Examples

```bash
> jumbo component remove --id comp_abc123
```
