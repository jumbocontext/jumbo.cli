---
name: decompose-architecture-aggregate
description: Use when a project has Architecture data that needs migrating to fine-grained entities (Decisions, Invariants, Components, Dependencies). Guides the agent through reading, mapping, confirming, and executing the migration with user oversight.
---

# Decompose Architecture Aggregate

Migrate Architecture entity data to fine-grained entities with user confirmation at each step.

The Architecture entity is deprecated. Its sections map to dedicated entity types as defined in `ARCHITECTURE_MIGRATION_MAPPING` (src/application/context/architecture/ArchitectureDeprecationConstants.ts):

| Architecture Section | Target Entity | Command |
|---|---|---|
| patterns | Decisions | `jumbo decision add` |
| principles | Invariants | `jumbo invariant add` |
| organization | Invariants | `jumbo invariant add` |
| dataStores | Components | `jumbo component add` |
| stack | Dependencies | `jumbo dependency add` |

## Protocol

### 1. Read Current Architecture

```bash
jumbo architecture view
```

Parse the output. If no Architecture data exists, inform the user and stop.

### 2. Build Proposed Mappings

For each non-empty section in the Architecture view, build a mapping proposal:

- **patterns** — Each pattern becomes a Decision. Draft: `--title`, `--context` (use the pattern description), `--rationale` (why this pattern was chosen, if stated).
- **principles** — Each principle becomes an Invariant. Draft: `--title`, `--description` (the principle text), `--enforcement` (how it is enforced — ask the user if not obvious from the data).
- **organization** — Each organization entry becomes an Invariant. Draft: `--title`, `--description` (the organizational rule), `--enforcement` (ask the user if not obvious).
- **dataStores** — Each data store becomes a Component. Draft: `--name`, `--type` (select from: service, db, queue, ui, lib, api, worker, cache, storage), `--description`, `--responsibility`, `--path` (ask the user if not derivable from the data).
- **stack** — Each stack entry becomes a Dependency. Draft: `--name`, `--ecosystem` (e.g., npm, pip, maven, service), `--package-name`, `--version-constraint` (if known).

### 3. Present Mappings for User Confirmation

Present all proposed mappings to the user in a single summary, grouped by target entity type. For each proposed mapping, show:

- The source section and original data
- The target entity type
- The drafted command with all flags

Ask the user to confirm, adjust, skip, or augment each mapping. Do not execute any commands until the user has reviewed the full set.

### 4. Execute Confirmed Mappings

Execute each confirmed mapping one at a time using the appropriate `jumbo` command:

- `jumbo decision add --title "..." --context "..." [--rationale "..."] [--alternative "..."]`
- `jumbo invariant add --title "..." --description "..." --enforcement "..." [--rationale "..."]`
- `jumbo component add --name "..." --type "..." --description "..." --responsibility "..." --path "..."`
- `jumbo dependency add --name "..." --ecosystem "..." --package-name "..." [--version-constraint "..."]`

Report the result of each command (success or failure) before proceeding to the next.

### 5. Present Summary

After all confirmed mappings are processed, present a summary:

- Count of entities created per type (Decisions, Invariants, Components, Dependencies)
- List of skipped items and the reason (user chose to skip, or data was insufficient)
- Any errors encountered during execution
