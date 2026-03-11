---
title: Dependency Commands Reference
description: Complete reference for registering third-party package and service dependencies.
sidebar:
  order: 9
---

Register third-party dependencies your project relies on, such as packages (`better-sqlite3`) and external services (for example Stripe API).

Component-to-component coupling is tracked with `jumbo relation add --type depends_on`, not dependency commands.

---

## jumbo dependency add

Add a third-party dependency.

### Synopsis

```bash
> jumbo dependency add [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--name <name>` | Dependency display name |
| `--ecosystem <ecosystem>` | Ecosystem or provider, e.g. `npm`, `service` |
| `--package-name <packageName>` | Package/service identifier |
| `--version-constraint <constraint>` | Optional version constraint, e.g. `^4.18.0` |
| `--endpoint <text>` | Optional endpoint/integration point |
| `--contract <text>` | Optional interface/contract notes |
| `--consumer-id <id>` | Legacy compatibility flag (deprecated, removed in `v3.0.0`) |
| `--provider-id <id>` | Legacy compatibility flag (deprecated, removed in `v3.0.0`) |

### Examples

```bash
# Register better-sqlite3 (database package)
> jumbo dependency add --name better-sqlite3 --ecosystem npm --package-name better-sqlite3 --version-constraint ^9.4.3

# Register a non-database external dependency (Stripe API)
> jumbo dependency add --name StripeAPI --ecosystem service --package-name stripe-api --version-constraint 2023-10-16 --endpoint https://api.stripe.com --contract "Payment API v1"

# Legacy compatibility path (deprecated, removed in v3.0.0)
> jumbo dependency add --consumer-id comp_abc --provider-id comp_def --endpoint "IUserRepository" --contract "UserRepository interface"
```

Legacy flags emit a deprecation warning and are mapped to a component relation (`depends_on`). For migration details, see [Upgrading to v2](../../upgrading/v2.md).

---

## jumbo dependencies list

List third-party dependencies.

### Synopsis

```bash
> jumbo dependencies list [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--name <name>` | Filter by dependency display name |
| `--ecosystem <ecosystem>` | Filter by ecosystem/provider |
| `--package-name <packageName>` | Filter by package/service identifier |
| `--consumer <componentId>` | Filter by consumer component ID |
| `--provider <componentId>` | Filter by provider component ID |

### Examples

```bash
> jumbo dependencies list
> jumbo dependencies list --ecosystem npm
> jumbo dependencies list --package-name better-sqlite3
> jumbo dependencies list --consumer comp_abc123 --provider comp_def456
```

---

## jumbo dependency update

Update an existing third-party dependency.

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

Remove a third-party dependency.

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

---

## Migration Notes

- `--consumer-id` / `--provider-id` are compatibility flags only.
- Planned removal window: these legacy flags are supported during `v2.x` and removed in `v3.0.0`.
- Use `jumbo evolve --yes` to migrate legacy coupling-style dependency records into relations during installation updates.
- For component coupling, use relation commands:

```bash
> jumbo relation add --from-type component --from-id comp_abc --to-type component --to-id comp_def --type depends_on --description "comp_abc depends on comp_def"
```
