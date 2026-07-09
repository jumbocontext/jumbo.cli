# Jumbo Evals

Longitudinal evaluation system that measures whether Jumbo's workflow (knowledge capture, context delivery, review-driven correction) measurably improves coding agent performance over multi-session projects.

## Methodology

The treatment under test is **the whole Jumbo system** — `jumbo init`, pre-seeded memory, the lifecycle protocol handed to the agent, agent-driven capture of decisions/components/relations, and the post-session audit — **not** memory delivery in isolation. The execution model is **framework-as-developer orchestration with agent-driven lifecycle**: the framework plays the developer role (it picks the active goal-id per session and hands the agent a `(scenario, goal-id, lifecycle-protocol)` bundle) and the agent itself runs every `jumbo` lifecycle call. The framework never issues lifecycle calls on the agent's behalf; it verifies post-session by snapshotting Jumbo state.

The comparison measures the same agent running the same scenario twice — once armed with Jumbo (real binary on PATH, project initialised, developer-grade goal handoff) and once with Jumbo unreachable (a PATH-shadowing fail-loud shim ensures the baseline arm cannot invoke `jumbo`). Any published lift number therefore attributes to **the entire Jumbo system armed against the same agent**, not to one isolated feature.

## How It Works

The system runs **A/B comparisons**: for the same test scenario, it executes N sessions through an agent harness twice — once with Jumbo enabled, once without. The provider-neutral **scenario prompt** for each session is byte-identical across variants before variant-specific wrapping (this is an invariant of the harness, including any scheduled disruptions). The intentional A/B difference is that the Jumbo variant's effective prompt wraps the scenario with the framework-assigned active goal-id and an explicit lifecycle protocol the agent must follow (run `jumbo session start`, `jumbo goal start`, capture decisions/components/relations as it works, `jumbo goal submit`, `jumbo session end`). The baseline variant receives only the raw scenario prompt and cannot reach the `jumbo` binary. The framework never issues lifecycle calls on the agent's behalf — it verifies execution post-session by reading Jumbo's own state (`jumbo goal show` / `jumbo sessions list` / `jumbo decisions list`).

After execution, 7 scoring dimensions measure the delta:

| Dimension | Type | What it measures |
|-----------|------|-----------------|
| File Accuracy | Deterministic | Were the right files modified? (F1 score) |
| Knowledge Retention | Deterministic | Do patterns from early sessions persist? |
| Disruption Recovery | Deterministic | Do mid-project corrections stick? |
| Token Efficiency | Deterministic | Tokens consumed per quality point |
| Consistency | LLM-as-Judge | Naming, architectural, style coherence across sessions |
| Error Correction | LLM-as-Judge | Mistakes caught and not reintroduced |
| Architectural Quality | LLM-as-Judge | Separation of concerns, dependency direction |

## Prerequisites

- **Node.js 22+**
- **Agent CLI tools** installed and authenticated on your machine (claude, codex, gemini — whichever harnesses you plan to test)
- **Jumbo CLI** installed globally
- **API keys** for the harnesses you want to test (set as environment variables, never in code)

> **Note:** Evals run locally, not in Docker containers. Agent CLIs require host-level authentication (OAuth flows, config files in `~/`) that cannot be provisioned inside fresh containers. Each eval variant gets its own temp working directory for isolation.

## Prompt Auditability

Every `SessionRecord` stores the provider-neutral `scenarioPrompt`, the exact `effectivePrompt` passed to the harness adapter, and any `deliveredContext`. For baseline records, `effectivePrompt` is the scenario prompt unchanged. For Jumbo records with an active goal-id, `effectivePrompt` is the scenario prompt wrapped with the active goal-id and the lifecycle protocol the agent must execute. This makes the measured lift attributable to the whole Jumbo system (init + pre-seeded memory + developer-grade goal handoff + agent-driven lifecycle + audit) rather than to hidden task information, prompt drift across harness providers, or a single isolated feature.

Jumbo records also store a `jumboLifecycleAudit` derived from post-session Jumbo state (`jumbo goal show`, `jumbo sessions list`, `jumbo decisions list`): four booleans (`sessionStartExecuted`, `goalStartExecuted`, `goalSubmitExecuted`, `sessionEndExecuted`) and the raw CLI evidence used to compute them. Lifecycle non-adherence is recorded as audit signal, not a framework error.

## Setup

```bash
npm install
npm run build
npm link   # optional — exposes the `eval` binary on your PATH
```

Examples below use `node dist/cli/index.js`. If you ran `npm link`, you can substitute `eval` (e.g. `eval scenario list`).

## Test Scenarios

Three curated scenarios ship in `scenarios/`. Each one is designed to expose specific amnesia patterns across multi-session projects:

| Scenario | Sessions | Disruptions | What it tests |
|----------|----------|-------------|---------------|
| **Event-Sourced Inventory** | 7 | 2 | Domain modeling with compounding complexity. Disruptions add event metadata and optimistic concurrency — patterns that must propagate to all existing code. Tests whether the agent remembers its own event types and projection logic. |
| **Plugin Architecture** | 6 | 2 | Interface contract adherence over time. Disruptions change execution order (priority) and add dependency resolution — both require updating existing plugins. Tests whether the agent maintains the plugin contract across sessions. |
| **CLI Task Tracker** | 6 | 2 | State machine consistency. Disruptions add a new state and an audit trail — both touch the core transition logic. Tests whether the agent remembers valid transitions and the append-only history constraint. |

Each scenario includes:
- **Retention patterns** — specific terms the agent should reference if it remembers prior sessions
- **Disruptions** — mid-project corrections injected at specific sessions to test recovery
- **Expected files** — the files that should exist by the end

## Quick Start

### 1. Register a scenario

```bash
node dist/cli/index.js scenario create --from-template scenarios/event-sourced-inventory.json
```

This prints the new scenario's UUID — that's the `<id>` used by every other command. You can also list registered scenarios at any time:

```bash
node dist/cli/index.js scenario list
```

### 2. Run the evaluation

```bash
# Single harness (default: claude-code)
node dist/cli/index.js run --scenario <id>

# Multiple harnesses
node dist/cli/index.js run --scenario <id> --harness claude-code codex-cli gemini-cli

# Override session count
node dist/cli/index.js run --scenario <id> --sessions 10
```

`eval run` prints a `Run ID` immediately after creating the run record. Use it from another terminal to watch live, read-only progress without affecting the running eval:

```bash
node dist/cli/index.js status --watch <runId>
```

The watcher reads `.eval-store/runs/<runId>/state.json` once per second in a TTY and renders per-harness, per-variant, per-session status, phase, and elapsed time. When output is piped, it performs a single read for scripting.

**Authentication.** Each adapter shells out to the corresponding agent CLI and inherits whatever auth that CLI is already using on your machine — you do **not** need to set API keys in your shell if the CLIs are already logged in. Examples:

- **Claude Code** — a Claude Max/Pro subscription authenticated via `claude /login` (OAuth) is sufficient. No `ANTHROPIC_API_KEY` required.
- **Codex CLI** — uses the auth configured by `codex login` (or `OPENAI_API_KEY` if you prefer key-based auth).
- **Gemini CLI** — uses the auth configured by `gemini auth` (or `GOOGLE_API_KEY` if you prefer key-based auth).

If a harness CLI isn't logged in, run its native login command before invoking `eval run`. This is why evals run on the host rather than in containers (see the note under Prerequisites).

### 3. Score completed runs

```bash
node dist/cli/index.js score --scenario <id>
```

Scoring writes deterministic dimension scores and comparison metadata back to the result store. Reports read those scored comparisons.

### 4. View results

```bash
# Check run status
node dist/cli/index.js status

# Generate terminal report
node dist/cli/index.js report --scenario <id>

# Filter by harness or dimension
node dist/cli/index.js report --scenario <id> --harness claude-code --dimension file-accuracy knowledge-retention

# Export as JSON (for docs/marketing)
node dist/cli/index.js report --scenario <id> --json
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `eval scenario create --from-template <path>` | Create a scenario from JSON template |
| `eval scenario list` | List available scenarios |
| `eval run --scenario <id> [--harness <names...>] [--sessions <n>]` | Run A/B comparison |
| `eval status --watch <runId>` | Watch a live run heartbeat |
| `eval score --scenario <id>` | Score completed runs |
| `eval report --scenario <id>` | Generate lift report |
| `eval status` | Show run progress and results |

All commands support `--help` for full usage details.

## Supported Harnesses

| Harness | CLI | Adapter |
|---------|-----|---------|
| Claude Code | `claude -p --output-format json` | `ClaudeCodeAdapter` |
| Codex CLI | `codex --ask-for-approval never --sandbox workspace-write exec --json --skip-git-repo-check` | `CodexCliAdapter` |
| Gemini CLI | `gemini --json` | `GeminiCliAdapter` |

## Report Output

The reporting suite produces:

- **Divergence Curve** — session-by-session delta between Jumbo and baseline
- **Lift Percentages** — per-dimension absolute and percentage improvement
- **Divergence Onset** — the session number where amnesia impact becomes significant
- **Disruption Impact** — which mid-project corrections caused the largest delta (ranked)
- **Cross-Harness Aggregation** — which harnesses benefit most from Jumbo
- **Audit Trail** — per-harness explanation of every measured delta: the effective context delivered each session, the final workspace snapshot evidence, and per-dimension scoring evidence

Output formats: terminal (human-readable) and JSON (machine-readable, versioned as `jumbo-eval-report` v1).

Reports are generated from scored comparison metadata stored on completed `TestResult`s. If a scenario has no scored comparisons yet, `eval report --scenario <id>` prints an empty-state message instead of failing.

## Deterministic E2E Validation

`tests/unit/end-to-end-validation.test.ts` is the harness's own self-check. It runs a fake deterministic harness whose output depends solely on whether a known prior-session fact appears in the delivered context. The test suite proves that:

- Jumbo lift is positive **only** when injected Jumbo context contains the needed prior-session fact.
- The same fake harness produces **zero** lift when Jumbo memory is empty (control).
- Each variant gets its own real temp working directory; cross-variant filesystem state cannot leak.
- A failed Jumbo session-end (`JumboSessionEndError`) or a failed harness exec (`HarnessExecutionError`) on either variant invalidates the entire comparison — partial results are never persisted or scored.
- Reports include the audit trail above, so a measured delta can be explained from inputs (effective context) and outputs (workspace snapshot, scoring evidence) alone.

This is what makes a measured Jumbo lift attributable to the whole Jumbo system armed against a parity-matched agent — not to prompt drift, filesystem leakage, scorer artifacts, partial-run persistence, or any single feature in isolation.

## Testing

```bash
# Unit tests — fully deterministic, no live agent CLI or API calls
npm test

# Integration tests — live smoke tests that exercise real agent CLIs
npm run test:integration
```

Default unit tests are deterministic by design. Any test that invokes a live agent CLI or external API belongs in `tests/integration/` and is excluded from `npm test`.

## Creating Custom Scenarios

You can also create your own scenario templates. A scenario JSON file has this structure:

```json
{
  "name": "Scenario Name",
  "initialPrompt": "The first session prompt — sets up the project.",
  "continuationPrompt": "Prompt for sessions 2+. Should ask the agent to review and continue.",
  "sessionCount": 5,
  "expectedFiles": ["files/that/should/exist.ts"],
  "retentionPatterns": ["terms", "the agent", "should remember"],
  "disruptions": [
    {
      "type": "correction",
      "sessionNumber": 3,
      "content": "A mid-project correction the agent must integrate.",
      "recoveryPatterns": ["terms", "proving", "the correction stuck"]
    }
  ]
}
```

Disruption types: `correction` (fix something), `scope-change` (pivot direction), `new-constraint` (add a requirement).

## Architecture

```
src/
  cli/           CLI command surface (Commander)
  domain/        Pure types: TestScenario, SessionRecord, TestResult, ComparisonResult
  harness/       HarnessAdapter interface + 3 implementations
  infrastructure/ LocalExecutor (per-variant temp working directories)
  scoring/       4 deterministic scorers + LLM-as-judge (3 rubrics)
  output/        Terminal display, cross-harness comparison, report generator, JSON export
  storage/       ResultStore interface + JSON file implementation
  ab-runner.ts   A/B comparison orchestrator
  run-session.ts Single session execution
```
