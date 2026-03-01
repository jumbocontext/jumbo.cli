# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Repair command promoted to top-level**: `jumbo repair` is now the primary command path (previously `jumbo maintenance repair`). The command is more discoverable and ergonomic as a top-level command.

### Fixed

- **Repair command**: `jumbo repair` now correctly replaces the Jumbo section in AGENTS.md regardless of which version of section markers the file contains. Old installations using the legacy `## Instructions for Jumbo` heading are now detected and updated to the current format instead of appending a duplicate section.

### Added

- **Documentation**: Added reference pages for work commands (`work pause`, `work resume`), worker commands (`worker view`), and maintenance commands (`db rebuild`, `db upgrade`, `repair`). Updated session command reference with `sessions list` and `session compact`. Updated session management guide with paused state lifecycle, work pause/resume workflow, and context compaction.

## [2.0.0] - Unreleased

### BREAKING CHANGES

- **Session pause/resume removed**: The session pause and resume functionality has been completely removed from the CLI. Sessions now only support `session start` and `session end` commands. Any paused sessions will be automatically migrated to active status.
  - Removed commands: `jumbo session pause` and `jumbo session resume`
  - Goal pause/resume functionality remains unchanged

- **Goal completion workflow changed**: Goals must now go through a review and qualification process before completion. This ensures quality gates are met before marking work as done.
  - Goals must be submitted for review with `jumbo goal review` after work is done
  - After review, goals must be qualified with `jumbo goal qualify`
  - Only goals with `qualified` status can be completed with `jumbo goal complete`
  - **Migration**: If you have goals in `doing` status that you want to complete, you'll need to first run `jumbo goal review --id <id>` then `jumbo goal qualify --id <id>` before completing them

- **Command renamed**: The `jumbo goal updateProgress` command has been renamed to `jumbo goal update-progress` (kebab-case) for consistency with other multi-word commands.
  - Old command: `jumbo goal updateProgress` (no longer works)
  - New command: `jumbo goal update-progress`
  - **Migration**: Update any scripts or automation to use the new kebab-case command name

- **V2 namespace remodel (internal)**: Major internal restructuring of types, namespaces, and architectural boundaries. While these are internal changes, plugins or scripts that depend on internal module paths will break.
  - **Removed types**: `GoalContextView`, `SessionSummaryProjection` (+ handler, store), `RelatedComponent`, `RelatedDecision`, `RelatedDependency`, `RelatedGuideline`, `RelatedInvariant`
  - **Removed namespaces**: `list/` directories and `I*ListReader` interfaces replaced by `get/` and `I*ViewReader`; `get-context/` merged into `get/`
  - **Dropped table**: `session_summary_views` table removed via migration (was orphaned after `SessionSummaryProjection` removal)
  - **Migration**: Run `jumbo repair --yes` after upgrading to rebuild the database with V2 projections

### Added

- **Goal review workflow**: New two-step quality assurance workflow for goals before completion:
  - `jumbo goal review --id <id>` - Submit a goal for review (transitions from `doing` to `in-review`)
  - `jumbo goal qualify --id <id>` - Qualify a reviewed goal (transitions from `in-review` to `qualified`)
  - Goals in `in-review` or `qualified` status are included in session context

- **Goal pause/resume**: Goals can now be paused and resumed independently of sessions:
  - `jumbo goal pause --id <id>` - Pause work on a goal
  - `jumbo goal resume --id <id>` - Resume a paused goal
  - Paused goals are included in session context and goals list

- **Goal progress tracking**: Track progress notes on goals with `jumbo goal update-progress --id <id> --progress <text>`

- **Worker identification**: The system now tracks which worker (agent/user) is working on each goal, enabling proper claim management across sessions

- **Architecture view command**: New `jumbo architecture view` command to display the current architecture definition

- **Enhanced session context**: Paused and blocked goals are now included in session context output, providing complete visibility into all active work

- **Agent configuration improvements**:
  - Updated Claude and Gemini configurers to match current repository settings
  - Added GitHub hooks configurer for `.github/hooks/hooks.json`
  - Agent init now adds `jumbo --help` permission to Claude Code settings
  - Agent init now adds `jumbo --help` to Gemini CLI tools.allowed list

### Changed

- **Goal complete simplified**: The `jumbo goal complete` command no longer handles QA mode or commit logic. Goals must be pre-qualified through the review workflow. The `--commit` flag has been removed.

- **Internal architecture**: Implemented Host/HostBuilder pattern for cleaner infrastructure composition (no user-facing impact)

- **V2 namespace remodel (internal)**:
  - Introduced `*Record` types (`GoalRecord`, `SessionRecord`, `ComponentRecord`, `DecisionRecord`, `DependencyRecord`, `GuidelineRecord`, `InvariantRecord`, `RelationRecord`) with dedicated `*RecordMapper` services at the infrastructure/application boundary
  - Replaced five bespoke `Related*` types with generic `RelatedContext<T>` wrapper
  - Split `GoalContext` into pure relations container (`GoalContext`) and composed return type (`ContextualGoalView`)
  - Replaced event-sourced `SessionSummaryProjection` with query-time assembled `SessionContext`
  - Renamed `list/` directories to `get/` and `I*ListReader` interfaces to `I*ViewReader` across all entity namespaces

### Removed

- **Project boundaries**: Removed `boundaries` field from the Project domain model, commands, views, and CLI options. The `--boundary` flag has been removed from `jumbo project init` and `jumbo project update`. Existing databases will have the column dropped via migration.

- **QA mode from goal complete**: The `--commit` flag and interactive QA logic have been removed from `jumbo goal complete`. Use the new `jumbo goal review` and `jumbo goal qualify` commands instead for quality assurance.

- **Deprecated events**: Removed `GoalReviewedEvent` and `ReviewTurnTracker` which have been superseded by the new review workflow events

## [1.0.1] - 2026-01-10

### Changed

- **Documentation**: Removed beta designation from README.md, reflecting stable release status.

## [1.0.0] - 2026-01-10

### Added

- **List commands**: Added `list` subcommand to all entity commands for viewing stored data:
  - `jumbo audience list` - List all audiences
  - `jumbo audience-pain list` - List all audience pains
  - `jumbo value list` - List all value propositions
  - `jumbo relation list` - List all relations
  - `jumbo component list` - List all components
  - `jumbo decision list` - List all decisions
  - `jumbo dependency list` - List all dependencies
  - `jumbo guideline list` - List all guidelines
  - `jumbo invariant list` - List all invariants
  - `jumbo session list` - List all sessions

- **Agent configurer hook support**: Claude and Gemini configurers now support full hook configuration with intelligent merging that preserves existing user settings.

### Changed

- **Internal refactoring**: Migrated bootstrap composition from infrastructure to presentation layer for cleaner architecture.

### Removed

- **Cursor agent configurer**: Removed Cursor-specific agent configuration since Cursor now supports AGENTS.md natively.

## [1.0.0-beta.1] - 2026-01-05

### Added

- **Goal update extended**: 'goal update' extended with '--nextGoalId' for latent goal chaining.


## [1.0.0-beta.0] - 2026-01-01

### Changed

- **Package renamed**: Package renamed from `@jumbo-ctx/cli` to `jumbo-cli` (unscoped).
  Update your installation with `npm install -g jumbo-cli`.

- **Repository moved**: GitHub repository moved from `jumbo-ctx` to `jumbo-dot-tech`
  organization.

- **Animated banner**: Redesigned CLI banner with character-map-based animation frames
  for improved visual presentation.

- **Goal context format**: Improved goal context output format for better LLM clarity
  and parsing.

### Added

- **Goal chaining**: Goals can now be linked together in a chain. Use `--next-goal <goalId>`
  to set which goal should follow the new goal, or `--previous-goal <goalId>` to update
  an existing goal to point to the new goal as its successor.

- **Goal resume**: Resume work on a previously started goal with `jumbo goal resume`.

### Fixed

- **Help screen alignment**: Command descriptions now align at a fixed column position
  for consistent formatting across all command categories.

## [1.0.0-alpha.8] - 2025-12-18

### Fixed

- **Database rebuild now correctly projects all events**: Fixed a bug where historical
  events stored with short type names (e.g., `GoalCompleted`) were not being projected
  during `jumbo db rebuild`. Events are now properly matched to their handlers.

### Added

- **Event type migration script**: Added `scripts/migrations/001-normalize-event-types.js`
  to fix legacy events with missing `Event` suffix in their type field.

### Migration Required

If you used earlier alpha versions and have existing event data, run the migration
script before rebuilding your database:

```bash
# Preview changes (recommended first)
node scripts/migrations/001-normalize-event-types.js --dry-run

# Apply changes
node scripts/migrations/001-normalize-event-types.js

# Rebuild database
jumbo db rebuild --yes
```

## [1.0.0-alpha.7] - 2025-12-11

### Breaking Changes

- **Removed `tagline` from Project**: The `--tagline` option has been removed from
  `project init` and `project update` commands. Remove this option from any scripts
  or automation. The database column remains for backward compatibility but is no
  longer used.

- **Removed `dataFlow` from Architecture**: The `--data-flow` and `--clear-data-flow`
  options have been removed from `architecture define` and `architecture update` commands.
  Remove these options from any scripts or automation. Existing data migrates automatically.

### Removed

- `--tagline` option from `jumbo project init`
- `--tagline` option from `jumbo project update`
- `--data-flow` option from `jumbo architecture define`
- `--data-flow` and `--clear-data-flow` options from `jumbo architecture update`

## [1.0.0-alpha.6] - 2025-12-11

### Added

- Initial public release
- Context management for LLM coding agents
- Event-sourced architecture with CQRS
- Session and goal tracking
- Project knowledge capture (audiences, pains, value propositions)
- Solution documentation (architecture, components, decisions, invariants, guidelines)
- Relation mapping between entities
