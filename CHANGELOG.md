# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`work review` daemon**: Long-running daemon that polls for goals in `submitted` status and delegates QA review to an agent subprocess. Supports `--agent`, `--poll-interval`, and `--max-retries` options. Both `approved` and `rejected` are valid review outcomes.

## [2.13.0] - 2026-04-19

### Added

- **Automatic relation-discovery goals**: When an entity is created, a goal to discover its relations is now automatically registered for a future session. Prevents new entities from remaining isolated in the context graph.
- **Documentation**: Added `work refine` command reference and advanced workflow guide for the refinery daemon.

### Changed

- **CLI output alignment**: Extracted shared `OutputLayout` rendering module and introduced dedicated `*ListOutputBuilder` classes for all entity list commands (audiences, audience pains, components, decisions, dependencies, guidelines, invariants, relations, sessions, values). All output builders now use consistent layout primitives from the design library.
- **Legacy ID syntax removed**: Cleaned up residual references to the deprecated prefixed ID syntax across all goal commands.

## [2.12.0] - 2026-04-15

### Added

- **`decompose-architecture-aggregate` skill**: New template-managed skill that guides agents through migrating Architecture entity data to fine-grained entities (Decisions, Invariants, Components, Dependencies) with user confirmation at each step.

### Deprecated

- **Architecture entity**: `architecture define` and `architecture update` now reject with migration guidance directing users to register individual Decisions, Invariants, Components, and Dependencies. `architecture view` remains functional with a deprecation notice and migration mapping table. `session start` shows a conditional deprecation notice when architecture data exists. The Architecture entity will be removed in v3.

### Changed

- **Goal context**: Architecture data removed from goal context output across all goal lifecycle commands (`goal show`, `goal start`, `goal resume`, `goal codify`, `goal refine`, `goal review`). Architecture context is no longer included in the `GoalContext` interface — use Invariants and Decisions instead.

## [2.11.1] - 2026-04-11

### Changed

- **`goal show` output**: Refined output rendering to align with the design library — updated layout, styling, and symbol usage in `GoalShowOutputBuilder` and `StyleConfig`.
- **README**: Added reference to the Shared Jumbo Memories repository.

## [2.11.0] - 2026-04-05

### Added

- **`--continue` flag for cross-phase commands**: `goal commit`, `goal submit`, `goal approve`, `goal reject`, and `goal close` now accept `-c, --continue`. Without the flag, next-step output is informational guidance; with it, output is an imperative directive. This makes phase boundaries explicit handoff points for multi-agent harnesses.

## [2.10.0] - 2026-04-05

### Added

- **Refinery command**: New `jumbo work refine --agent <agent>` long-running daemon that continuously polls for goals in 'defined' state and delegates their refinement to an agent subprocess. Features graceful shutdown (Q key / Ctrl+C), configurable poll interval and retry count.
- **CLI design library**: Shared animation primitives for interactive CLI output:
  - `GradientPalette` — 10 color gradient definitions with smooth interpolation, bar animation
  - `GlimmerEffect` — sweep-highlight animation with flash pop for text elements
  - `BrailleSpinner` — braille character spinner with per-character gradient shimmer
- **RefineryDisplay**: Dedicated display module implementing the refinery mockup design with accent bars, glimmer title, compact config line, dividers, and "Foraging..." / "Refining..." braille animations.
- **BrandColors**: Added `BrandColors.jumboBlue` (#66b4f4) and raw RGB tuple to `StyleConfig.ts`.
- **New Symbols**: Added `accentBar` (│), `dot` (·), and `filledCircle` (●) to `StyleConfig.ts` with TTY/ASCII fallbacks.
- **Design mockup**: `refinery-mockup.svg` documenting the target UX for the refinery command across idle, active, and completion states.

## [2.9.0] - 2026-03-31

### Added

- **Design goal skill**: New `jumbo-design-goal` skill for collaborative pre-definition discovery — aligns proposed goals with project audience, pains, and value propositions before handing off to `define-jumbo-goals`.

### Changed

- **Internal**: Replaced sequential rebuild (`TemporarySequentialDatabaseRebuildService`) with projection-only rebuild via `ProjectionBusFactory`, eliminating the duplicate composition root and enabling parallel projection execution during `heal`/`evolve`.
- **Define goal skill**: Added execution order instruction for goal definition flow.
- **Documentation**: Minor docs refinements across reference pages.

### Fixed

- **Cascade deactivation during evolve**: Fixed double-deactivation error by checking rehydrated aggregate status before deactivating relations.

## [2.8.0] - 2026-03-31

### Added

- **Cursor agent configurer**: `jumbo init` now configures Cursor with `.cursor/rules/jumbo.mdc` (YAML frontmatter referencing JUMBO.md) and `.cursor/hooks.json` (sessionStart hook). Replaces the previously removed Cursor configurer with full rules and hooks support.
- **Vibe agent configurer**: `jumbo init` now configures Mistral Vibe with skill distribution to `.vibe/skills`. Vibe reads AGENTS.md natively.
- **Codex agent configurer**: `jumbo init` now configures OpenAI Codex with skill distribution to `.codex/skills`. Codex reads AGENTS.md natively.
- **Entity registration skills**: Five new template-managed skills for proactive context capture during agent sessions: `jumbo-add-component`, `jumbo-add-decision`, `jumbo-add-dependency`, `jumbo-add-guideline`, `jumbo-add-invariant`.

### Changed

- **Agent selection expanded**: Interactive agent selection in `jumbo init` now includes Cursor, Vibe, and Codex alongside Claude, Gemini, and Copilot.

### Removed

- **GitHub Hooks configurer**: Removed standalone `GitHubHooksConfigurer`; GitHub Hooks configuration is now handled by the Copilot configurer.

### Fixed

- **Erroneous agent option**: Removed an invalid option from agent configuration.

## [2.7.2] - 2026-03-28

### Changed

- **Internal**: Centralized all entity ID generation through `IdGenerator` utility using `crypto.randomUUID()`, replacing scattered direct calls and unsafe `Date.now()+Math.random()` patterns across 10 command handlers.

### Removed

- **Internal**: Removed unused `ulid` dependency.

## [2.7.1] - 2026-03-28

### Fixed

- **Node.js v22 compatibility**: Replaced `uuid` (pure ESM) with Node.js built-in `crypto.randomUUID()` to resolve `ERR_REQUIRE_ESM` errors when running on Node.js v22.

### Removed

- **uuid dependency**: Removed `uuid` and `@types/uuid` packages — no longer needed.

## [2.7.0] - 2026-03-28

### Added

- **Goal workspace fields**: `goal add` and `goal update` now accept `--branch` and `--worktree` options to assign git workspace context for multi-agent collaboration. `goal start` and `goal codify` output includes workspace instructions when these fields are set.

## [2.6.0] - 2026-03-27

### Added

- **Interactive agent selection in init**: `jumbo init` now presents a checkbox prompt for Claude, Gemini, Copilot, and GitHub Hooks before confirmation. Planned changes, agent-specific files, and template-managed skills are filtered to the selected agents, while non-interactive mode still configures all agents.

### Changed

- **Internal**: Logging now writes daily log files (`yyyyddmm.log`) instead of a single unbounded `jumbo.log` file.
- **Internal**: Disconnected ActivityMirror from session start output to eliminate a full event store scan (~12,500 file reads) that was causing sluggish `session start` performance. Backend assembler preserved for future use.

## [2.5.0] - 2026-03-26

### Added

- **Extended init flow**: `jumbo init` now prompts for target audiences, audience pain points, and value propositions after collecting project name and purpose. Each section is gated by a confirm prompt and supports multiple entries via an "Add another?" loop. Non-interactive mode supports new CLI flags: `--audience-name`, `--audience-description`, `--audience-priority`, `--pain-title`, `--pain-description`, `--value-title`, `--value-description`, `--value-benefit`, `--value-measurable-outcome`.
- **Session context primitive gaps nudge**: `session start` now detects when project context is missing audiences, audience pains, or value propositions and emits an `@LLM` instruction listing the gaps with relevant `add` commands.
- **Value propositions in session context**: `session start` now includes value propositions in the project context output alongside audiences and audience pains.

### Changed

- **Internal**: Extracted session instruction signal names (`brownfield-onboarding`, `paused-goals-resume`, `goal-selection-prompt`, `primitive-gaps-detected`) into shared `SessionInstructionSignal` constants, eliminating magic string coupling between application and presentation layers.
- **Internal**: Split refinement relation strategy into entity-category-specific strategies for more targeted relation curation during goal refinement.

## [2.4.0] - 2026-03-22

### Added

- **Activity mirror**: `session start` now surfaces a brief summary of proactive context maintenance actions from recent sessions (entities registered, decisions recorded, relations added, goals added), reinforcing productive LLM behavior.

### Changed

- **Context maintenance instructions**: Replaced generic "be proactive" guidance in JUMBO.md and JumboMdContent with specific, actionable instructions for when and how to register entities during refinement, implementation, and user corrections.
- **Prerequisite discovery during refinement**: Goal refine output now prompts agents to register prerequisite goals immediately when discovered, rather than deferring.
- **Real-time context capture during implementation**: Goal start output now includes specific commands for registering decisions, components, relations, and corrections as they happen.
- **Skills updated**: Define, refine, and start goal skills updated with context maintenance instructions aligned to the new approach.
- **Brownfield onboarding copy**: Improved clarity of brownfield onboarding and paused goals resume prompts in session start output.

## [2.3.1] - 2026-03-21

### Changed

- **Internal**: Replaced orphaned `SolutionContext` cluster (`ISolutionContextReader`, `SolutionContextView`, `UnprimedBrownfieldQualifier`, `SqliteSolutionContextReader`) with focused `IBrownfieldStatusReader` and `SqliteBrownfieldStatusReader`.
- **Internal**: Removed tracked files that should have been gitignored (`.claude/settings.json`, `.vscode/settings.json`, `.codex/rules/`, agent instruction stubs).

### Fixed

- **Broken test**: Fixed failing test in `SessionContextQueryHandler`.
- **README**: Documentation refinements and fixes.

## [2.3.0] - 2026-03-20

### Changed

- **Goals grouped by state**: `goal list` and `session start` now display goals grouped by lifecycle state with bracket-style headings (e.g., `[DOING]`, `[APPROVED]`) and contextual hints describing available actions for each state.
- **Session start output refactored**: Session start rendering decomposed into composable output builders (`SessionContextOutputBuilder`, `SessionGoalsOutputBuilder`, `SessionStartOutputBuilder`) for maintainability.
- **Recent decisions limit reduced**: Session context now includes the 3 most recent decisions (previously 10) to keep context concise.

### Fixed

- **Deprecated command reference in refine skill**: Updated `refine-jumbo-goals` skill to use `jumbo goal commit` instead of the removed `jumbo goal refine --approve`.

## [2.2.0] - 2026-03-18

### Changed

- **Centralized agent instructions in JUMBO.md**: `jumbo init` and `jumbo evolve` now produce a centralized JUMBO.md containing all agent onboarding instructions. AGENTS.md, CLAUDE.md, GEMINI.md, and .github/copilot-instructions.md become thin reference files pointing to JUMBO.md, eliminating content duplication across agent instruction files.

## [2.1.0] - 2026-03-16

### Added

- **Automatic relation maintenance goals**: When an entity with active relations is changed (updated, removed, deprecated, superseded, restored, or undeprecated), a maintenance goal is now automatically registered to review and restore symmetry between the entity and its relations.

### Fixed

- **Required flag validation**: Covered gaps in required flag demarcation across CLI commands.

## [2.0.3] - 2026-03-15

### Changed

- **Internal**: Telemetry configuration externalized from source code to build-time injection.
- **Internal**: Publish workflow and test reliability improvements.

## [2.0.2] - 2026-03-14

### Changed

- **Initialization guidance**: Improved post-init copy to guide users toward creating their first goal instead of starting a session directly. Includes example `goal add` command with all key flags.
- **README**: Fixed npm install command syntax in Quick Start section.

### Added

- **Automated npm publishing**: Added GitHub Actions workflow (`publish.yml`) that publishes to npm via OIDC trusted publisher when a GitHub release is created.

## [2.0.1] - 2026-03-13

### Changed

- **Telemetry opt-out by default**: `jumbo init` now prompts for telemetry consent during interactive initialization with opt-out framing (default: enabled). Non-interactive mode enables telemetry automatically. Users can opt out during init, or later via `jumbo telemetry disable` or `JUMBO_TELEMETRY_DISABLED=1`. Default telemetry setting changed from `false` to `true`.

### Fixed

- **Telemetry consent prompt was dead code**: The `promptForTelemetryConsentIfNeeded` function during `jumbo init` never fired because `FsSettingsReader.read()` auto-created the settings file before `hasTelemetryConfiguration()` was checked, causing it to always return `true`.

## [2.0.0] - 2026-03-11

### BREAKING CHANGES

- **Session pause/resume removed**: The session pause and resume functionality has been completely removed from the CLI. Sessions now only support `session start` and `session end` commands. Any paused sessions will be automatically migrated to active status.
  - Removed commands: `jumbo session pause` and `jumbo session resume`
  - Goal pause/resume functionality remains unchanged
  - Migration docs: [`docs/guides/session-management.md`](docs/guides/session-management.md), [`docs/reference/commands/session.md`](docs/reference/commands/session.md)

- **Goal lifecycle overhauled**: The goal lifecycle has been significantly expanded with new states, commands, and a renamed status vocabulary. The full lifecycle is now: `defined` → `in-refinement` → `refined` → `doing` → `submitted` → `in-review` → `approved` → `codifying` → `done`. Goals can also be `paused`, `blocked`, or `rejected` at various stages.
  - **Status values renamed**: `to-do` → `defined`, `qualified` → `approved`, `completed` → `done`. Legacy values are migrated automatically via `jumbo evolve --yes`.
  - **`goal complete` removed**: Replaced by `jumbo goal codify` (acquires claim for architectural reconciliation) and `jumbo goal close` (releases claim, transitions to `done`).
  - **`goal qualify` deprecated**: Replaced by `jumbo goal approve`. `goal qualify` still works but emits a deprecation warning.
  - **New commands**: `jumbo goal submit` (doing → submitted), `jumbo goal reject` (in-review → rejected), `jumbo goal approve` (in-review → approved), `jumbo goal commit` (in-refinement → refined), `jumbo goal codify` (approved → codifying), `jumbo goal close` (codifying → done)
  - **New states**: `submitted`, `in-refinement`, `rejected`, `codifying`, `done` (replacing `completed`)
  - **Refinement split into two phases**: `jumbo goal refine` now transitions to `in-refinement` and acquires a claim; `jumbo goal commit` transitions to `refined` and releases the claim. The `--approve` flag has been removed from `goal refine`.
  - **Migration**: Run `jumbo evolve --yes` to migrate legacy status values. Update scripts that reference old status names or use `goal complete`/`goal qualify`.
  - Migration docs: [`docs/guides/goal-management.md`](docs/guides/goal-management.md), [`docs/reference/commands/goal.md`](docs/reference/commands/goal.md)

- **`--goal-id` flag renamed to `--id`**: All goal commands now use `--id` instead of `--goal-id`. The goal namespace already provides context, making the prefix redundant.
  - Old flag: `jumbo goal start --goal-id <id>` (no longer works)
  - New flag: `jumbo goal start --id <id>`
  - **Migration**: Update any scripts or automation to use `--id`

- **Command renamed**: The `jumbo goal updateProgress` command has been renamed to `jumbo goal update-progress` (kebab-case) for consistency with other multi-word commands.
  - Old command: `jumbo goal updateProgress` (no longer works)
  - New command: `jumbo goal update-progress`
  - **Migration**: Update any scripts or automation to use the new kebab-case command name
  - Migration docs: [`docs/reference/commands/goal.md`](docs/reference/commands/goal.md)

- **V2 namespace remodel (internal)**: Major internal restructuring of types, namespaces, and architectural boundaries. While these are internal changes, plugins or scripts that depend on internal module paths will break.
  - **Removed types**: `GoalContextView`, `SessionSummaryProjection` (+ handler, store), `RelatedComponent`, `RelatedDecision`, `RelatedDependency`, `RelatedGuideline`, `RelatedInvariant`
  - **Removed namespaces**: `list/` directories and `I*ListReader` interfaces replaced by `get/` and `I*ViewReader`; `get-context/` merged into `get/`
  - **Dropped table**: `session_summary_views` table removed via migration (was orphaned after `SessionSummaryProjection` removal)
  - **Migration**: Run `jumbo evolve --yes` after upgrading to migrate data and rebuild the database with V2 projections
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

- **Command replaced**: `jumbo db rebuild` has been replaced by `jumbo heal --yes`. The heal command replays all events from the event store to reconstruct materialized view projections. The underlying `RebuildDatabaseCommandHandler` is preserved as internal infrastructure.
  - Old command: `jumbo db rebuild --yes` (no longer available)
  - New command: `jumbo heal --yes`
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

- **Maintenance commands consolidated**: `jumbo repair`, `jumbo db upgrade`, and `jumbo dependency migrate` have been replaced by `jumbo evolve --yes`. The new command applies schema migrations, runs idempotent data migrations, refreshes managed configuration, and rebuilds projections as one installation update workflow.
  - Old commands: `jumbo repair`, `jumbo db upgrade --from v1 --to v2`, `jumbo dependency migrate`
  - New command: `jumbo evolve --yes`
  - Migration docs: [`docs/reference/commands/maintenance.md`](docs/reference/commands/maintenance.md)

### Added

- **Heal command**: `jumbo heal --yes` rebuilds database projections by replaying all events from the event store. Replaces `jumbo db rebuild` as the user-facing corruption recovery command.

- **Goal review workflow**: New two-step quality assurance workflow for goals before completion:
  - `jumbo goal review --id <id>` - Submit a goal for review (transitions from `submitted` to `in-review`)
  - `jumbo goal approve --id <id>` - Approve a reviewed goal (transitions from `in-review` to `approved`)
  - Goals in `in-review` or `approved` status are included in session context

- **Goal submit command**: `jumbo goal submit --id <id>` transitions a goal from `doing` to `submitted` and releases the implementer's claim, signaling work is ready for review.

- **Goal reject command**: `jumbo goal reject --id <id>` returns a reviewed goal from `in-review` to `rejected` status with review issues recorded as a dedicated goal state property.

- **Goal codify/close commands**: Final lifecycle phase for architectural reconciliation:
  - `jumbo goal codify --id <id>` - Transition from `approved` to `codifying` (acquires claim)
  - `jumbo goal close --id <id>` - Transition from `codifying` to `done` (releases claim)

- **Goal commit command**: `jumbo goal commit --id <id>` transitions a goal from `in-refinement` to `refined` and releases the refinement claim. Part of the two-phase refinement workflow.

- **Goal title field**: Goals now support a `title` field for human-readable naming.

- **Goal prerequisite goals**: Goals can declare prerequisite goals via the `prerequisiteGoals` property, enabling dependency ordering between goals.

- **Goal pause/resume**: Goals can now be paused and resumed independently of sessions:
  - `jumbo goal pause --id <id>` - Pause work on a goal
  - `jumbo goal resume --id <id>` - Resume a paused goal
  - Paused goals are included in session context and goals list

- **Goal progress tracking**: Track progress notes on goals with `jumbo goal update-progress --id <id> --progress <text>`

- **Goal reset with dynamic target**: `jumbo goal reset` now computes the target state dynamically from the state machine rather than hardcoding a reset destination.

- **Component rename command**: `jumbo component rename` renames an existing component.

- **Component show command**: `jumbo component show` displays component details and its relations.

- **Relation deactivation/reactivation lifecycle**: Relations now support deactivation and reactivation with automatic cascade when a related entity reaches a terminal state.

- **CLI telemetry instrumentation**: Every CLI command invocation is automatically tracked with command name, CLI version, Node.js version, OS platform, architecture, success/failure status, execution duration, and error type on failure. Telemetry is fully non-blocking and gracefully flushes pending events before process exit. Respects consent settings and CI environment detection.

- **Telemetry consent management**: Opt-in anonymous telemetry infrastructure with user control:
  - `jumbo telemetry status` - Show current consent state, effective runtime status, and anonymous ID
  - `jumbo telemetry enable` - Opt into anonymous telemetry (generates anonymous UUID on first enable)
  - `jumbo telemetry disable` - Opt out of anonymous telemetry
  - Telemetry auto-disables in CI environments (CI, GITHUB_ACTIONS, GITLAB_CI, JENKINS_URL, CIRCLECI, TRAVIS, BUILDKITE)
  - Environment variable override: `JUMBO_TELEMETRY_DISABLED=1` disables telemetry regardless of settings
  - First-run consent prompt during `jumbo project init`
  - Settings persisted in `.jumbo/settings.jsonc` under `telemetry` section

- **Worker identification**: The system now tracks which worker (agent/user) is working on each goal, enabling proper claim management across sessions

- **Architecture view command**: New `jumbo architecture view` command to display the current architecture definition

- **Enhanced session context**: Paused and blocked goals are now included in session context output, providing complete visibility into all active work

- **Short flag aliases**: Added short aliases across all entity commands (e.g., `-d` for `--description`, `-n` for `--name`) for faster CLI usage.

- **Gitignore enforcement**: `jumbo project init` now enforces `.gitignore` exclusions for the `.jumbo` directory via `IGitignoreProtocol`.

- **Idempotent claim re-entry**: Entry commands (start, refine, codify) now handle expired claims idempotently, allowing re-entry without manual claim cleanup.

- **Agent configuration improvements**:
  - Updated Claude and Gemini configurers to match current repository settings
  - Added GitHub hooks configurer for `.github/hooks/hooks.json`
  - Agent init now adds `jumbo --help` permission to Claude Code settings
  - Agent init now adds `jumbo --help` to Gemini CLI tools.allowed list

- **Template-managed skills**: `jumbo evolve` and `jumbo project init` now sync template-managed skills from the assets directory.

- **Documentation**: Added reference pages for work commands (`work pause`, `work resume`), worker commands (`worker view`), and maintenance commands (`db rebuild`, `db upgrade`, `repair`). Updated session command reference with `sessions list` and `session compact`. Updated session management guide with paused state lifecycle, work pause/resume workflow, and context compaction.

### Changed

- **Evolve command**: `jumbo evolve --yes` now updates managed skills, configuration, schema, and projections in one command. `heal` remains the focused projection rebuild command.
- **Dependency model clarification**: Dependency commands/documentation now define dependencies as third-party software/services (packages or external APIs). Component coupling is documented under relation commands (`depends_on`).
- **Legacy coupling flag deprecation timeline**: `--consumer-id` and `--provider-id` compatibility flags on `jumbo dependency add` are now explicitly marked deprecated with planned removal in `v3.0.0`.
- **Goal claim storage migrated to SQLite**: Goal claims are now stored in SQLite instead of the filesystem for improved reliability.
- **Worker identity storage migrated to SQLite**: Worker identity persistence moved from filesystem to SQLite for consistency with other state.

- **Internal architecture**:
  - Implemented Host/HostBuilder pattern for cleaner infrastructure composition
  - Introduced Controller-Gateway pattern across all command flows for cleaner separation of presentation and application layers
  - Consolidated `templates/` directory into `assets/` for static file storage

- **V2 namespace remodel (internal)**:
  - Introduced `*Record` types (`GoalRecord`, `SessionRecord`, `ComponentRecord`, `DecisionRecord`, `DependencyRecord`, `GuidelineRecord`, `InvariantRecord`, `RelationRecord`) with dedicated `*RecordMapper` services at the infrastructure/application boundary
  - Replaced five bespoke `Related*` types with generic `RelatedContext<T>` wrapper
  - Split `GoalContext` into pure relations container (`GoalContext`) and composed return type (`ContextualGoalView`)
  - Replaced event-sourced `SessionSummaryProjection` with query-time assembled `SessionContext`
  - Renamed `list/` directories to `get/` and `I*ListReader` interfaces to `I*ViewReader` across all entity namespaces

### Removed

- **Project boundaries**: Removed `boundaries` field from the Project domain model, commands, views, and CLI options. The `--boundary` flag has been removed from `jumbo project init` and `jumbo project update`. Existing databases will have the column dropped via migration.

- **`goal complete` command**: Removed entirely. Replaced by `jumbo goal codify` and `jumbo goal close` for the final lifecycle phase. `GoalCompletedEvent` is retained for backward-compatible event replay.

- **QA mode from goal complete**: The `--commit` flag and interactive QA logic have been removed. Use the new review workflow (`goal submit` → `goal review` → `goal approve`) followed by `goal codify` and `goal close`.

- **Deprecated events**: Removed `GoalReviewedEvent` and `ReviewTurnTracker` which have been superseded by the new review workflow events

### Fixed

- **Managed agent refresh**: The installation update flow now correctly replaces the Jumbo section in AGENTS.md regardless of which version of section markers the file contains. Old installations using the legacy `## Instructions for Jumbo` heading are now detected and updated to the current format instead of appending a duplicate section.

- **Event store hardening**: Event store now handles corruption gracefully with improved observability in evolve/heal workflows.

- **Stale database boot migration**: Pending migrations now run automatically on boot for databases that missed prior upgrades.

- **ProjectRootResolver directory walk**: Fixed the resolver walking up to parent directories, which could cause it to find the wrong `.jumbo` directory.

- **`.jumbo` directory resolution**: Fixed resolution from nearest ancestor to prevent state splitting when multiple `.jumbo` directories exist in the path hierarchy.

- **Hidden commands in help output**: Hidden commands and top-level aliases are no longer shown in help output.

- **TerminalOutput data section rendering**: Fixed `TerminalOutput.toHumanReadable()` to correctly render data section messages.

### Compatibility

- **Backward compatibility in v2.x**: Legacy `--consumer-id` / `--provider-id` behavior remains available during `v2.x` and maps to relations for migration safety.
- **Evolve safety**: The goal status and legacy dependency migrations used by `jumbo evolve --yes` remain idempotent. Re-running a successful evolve produces no duplicate migration events or relations.

### Deprecation Risk Assessment

- **Breaking risk now**: Low. Existing scripts continue to run in `v2.x`, but emit deprecation warnings.
- **Breaking risk at v3.0.0**: High for unattended scripts that still use legacy coupling flags. Migrate these scripts to `jumbo relation add --type depends_on` before adopting `v3.0.0`.
- Migration docs: [`docs/upgrading/v2.md`](docs/upgrading/v2.md), [`docs/reference/commands/dependencies.md`](docs/reference/commands/dependencies.md), [`docs/reference/commands/relations.md`](docs/reference/commands/relations.md)

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
