---
title: Dependency Migration Guide
description: Migrate legacy component-coupling dependency usage to third-party dependency registration and relations.
sidebar:
  order: 6
---

# Dependency Migration Guide

Use this guide when upgrading projects that previously used dependency commands to model component-to-component coupling.

---

## What changed

- `jumbo dependency *` now models third-party software/services only.
- Component coupling now belongs to `jumbo relation *` with relation type `depends_on`.
- Legacy `--consumer-id` / `--provider-id` flags on `jumbo dependency add` remain as compatibility shims in `v2.x`.
- Planned removal window: legacy flags are removed in `v3.0.0`.

---

## Legacy flag behavior

When `--consumer-id` and `--provider-id` are passed to `jumbo dependency add`:

- Jumbo prints a deprecation warning to stderr.
- Jumbo creates a component relation (`depends_on`) instead of a third-party dependency record.
- Mixing legacy flags with external dependency identity flags (`--name`, `--ecosystem`, `--package-name`) is rejected.

---

## Migration checklist

1. Run the installation evolution workflow:

```bash
> jumbo evolve --yes
```

2. Identify automation/scripts still using legacy dependency coupling flags:

```bash
> jumbo dependency add --consumer-id <componentId> --provider-id <componentId>
```

3. Replace coupling registration with relation commands:

```bash
> jumbo relation add --from-type component --from-id <componentId> --to-type component --to-id <componentId> --type depends_on --description "<component A> depends on <component B>"
```

4. Keep `jumbo dependency add` for third-party dependencies only:

```bash
# Database package example
> jumbo dependency add --name better-sqlite3 --ecosystem npm --package-name better-sqlite3 --version-constraint ^9.4.3

# Non-database external dependency example
> jumbo dependency add --name StripeAPI --ecosystem service --package-name stripe-api --version-constraint 2023-10-16 --endpoint https://api.stripe.com --contract "Payment API v1"
```

---

## Idempotency expectations

- `jumbo evolve --yes` is idempotent for the embedded goal-status and legacy dependency migration steps. Re-running after a successful evolve does not create duplicate migration events or duplicate relations.
- Legacy compatibility mapping should be treated as transitional behavior only; move scripts to relation commands to avoid ambiguity and future breakage.
- Third-party dependency registration is intended to be stable and repeat-safe under the application handler contract.

---

## Rollback and safety notes

- Before migration, create a backup copy of your `.jumbo/` directory.
- If a migration run is interrupted, restore `.jumbo/` from backup, then re-run `jumbo evolve --yes`.
- Use `jumbo heal --yes` only when projections need rehydration without the full evolve workflow.

---

## Compatibility timeline

- `v2.x`: Legacy `--consumer-id` / `--provider-id` remains supported with warnings.
- `v3.0.0`: Legacy flags removed.
- Forward path: relations model component coupling, dependencies model third-party software/services.
