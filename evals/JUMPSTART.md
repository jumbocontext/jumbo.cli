# Jumbo Evals — Project Jumpstart

## Project Purpose

Prove that Jumbo's workflow — systematic knowledge capture, curated context delivery, and review-driven correction — measurably improves coding agent performance over time, across sessions, and across agent harnesses. The eval simulates realistic multi-session projects with and without Jumbo active, measuring divergence as agent amnesia compounds in the non-Jumbo runs.

## Hypothesis

Over the lifecycle of a multi-goal project spanning multiple sessions, agents using Jumbo's workflow will produce measurably better outcomes than agents relying on native harness capabilities alone. The advantage compounds over time as knowledge accumulates and sessions reset.

## `jumbo init` Purpose (copy-paste ready)

```
Prove that Jumbo's workflow measurably improves coding agent performance over time by simulating realistic multi-session projects with and without Jumbo active across agent harnesses, measuring how agent amnesia compounds and quantifying Jumbo's lift in knowledge retention, consistency, and efficiency.
```

## Key Design Decisions

### Harness-based execution, not direct API calls

Jumbo integrates with coding agent harnesses (Claude Code CLI, Codex CLI, Gemini CLI, etc.), not raw LLM APIs. Evals must test through the same harnesses to produce apples-to-apples comparisons. The system invokes harness CLIs via subprocess — it does not call LLM APIs directly.

### Longitudinal multi-session simulation, not single-prompt evals

Jumbo's core value is solving agent amnesia across sessions. Within a single session, any agent can track its own plan. The differentiation emerges across session boundaries when agents lose their context window. Each eval run simulates multiple sessions with fresh agent invocations against a persistent workspace.

### Same container, different configuration

Both Jumbo and non-Jumbo runs use an identical container image with all tools installed (including Jumbo). The only difference is whether `jumbo init` is run at project setup. This eliminates any "unfair advantage" argument — both environments have identical tooling available.

### Persistent container, fresh agent per session

The container persists across sessions within a test run (filesystem, including Jumbo's repo-local data, carries forward). Each session is a fresh harness CLI invocation — the agent starts with a clean context window. This simulates real-world agent amnesia: the Jumbo agent recovers via `jumbo session start`; the non-Jumbo agent has only whatever it wrote to files it knows to look for.

### Hybrid scoring

- **Deterministic checks**: file accuracy, pattern presence/absence, test pass/fail — objective, reproducible.
- **LLM-as-judge**: convention adherence, architectural quality — using locked rubrics with evidence anchoring. The judge LLM must differ from the runner to avoid self-model bias.
- **Task prompts are self-contained**: both runners receive identical task descriptions with sufficient information to succeed. No scoring criterion references information only available via Jumbo entities. What Jumbo proves is that structured, automatic context delivery produces better adherence than relying on the agent to extract and retain everything from natural language across sessions.

### Technology stack

TypeScript (Node.js) orchestrator running on the host. Containerized workspaces (Docker) for isolated, reproducible test environments. JSON file storage for results, with a SQLite graduation path if query patterns become complex.

## Measurement Dimensions

| Dimension | What it captures |
|-----------|-----------------|
| **Knowledge retention** | Does session N remember decisions from session 1? |
| **Consistency** | Do patterns established early hold across later goals? |
| **Error correction** | Are mistakes caught and not reintroduced after session boundaries? |
| **Rework rate** | How often does work need to be redone due to lost context? |
| **Efficiency** | Tokens consumed, iterations needed, goals completed per session |
| **Disruption recovery** | When mid-project corrections are introduced, do they persist? |
| **Token efficiency** | Tokens consumed to achieve equivalent or better outcomes — does Jumbo's curated context reduce total token spend? |

## Goal Scaffold — Tracer Bullet Decomposition

Each goal delivers a thin, end-to-end vertical slice. After each goal, the system is buildable, runnable, and demonstrates a new traced capability. Later goals widen the path established by earlier ones.

Run these commands after `jumbo init` to set up the project backlog. Goals are chained in dependency order.

### Goal 1 — Single-Session Smoke Test

```bash
jumbo goal add \
  --title "[EVAL-1/9] Single-session smoke test" \
  --objective "Deliver the thinnest possible end-to-end path: define minimal domain types (TestScenario, SessionRecord, TestResult with just enough fields), build a Dockerfile with Claude Code CLI and Jumbo installed, implement a ContainerManager that can create/start/exec/destroy a container, implement a minimal HarnessAdapter for Claude Code CLI ('claude -p'), and wire it all together so that a single session of a single scenario runs inside a container, captures the agent's output, and stores a SessionRecord to a JSON-backed ResultStore. This is the 'hello world' of the eval system — one scenario, one session, one harness, stored result. TypeScript/Node.js project initialized with build tooling." \
  --criteria \
    "TypeScript project initialized with tsconfig, package.json, and build script" \
    "Minimal TestScenario type: initial prompt, session count" \
    "Minimal SessionRecord type: session number, harness, agent output, files modified, transcript" \
    "Minimal TestResult type: scenario reference, list of session records" \
    "ResultStore interface with JSON file implementation" \
    "Dockerfile with Node.js, Claude Code CLI, and Jumbo installed" \
    "ContainerManager: create, start, exec, stop, destroy lifecycle" \
    "Claude Code HarnessAdapter: invoke via 'claude -p', capture output" \
    "End-to-end: define scenario -> run one session in container -> store SessionRecord" \
    "Works on Docker Desktop for Windows 11" \
  --scope-in "Project setup" "Minimal domain types" "Dockerfile" "ContainerManager" "Claude Code adapter" "ResultStore" \
  --scope-out "Jumbo vs non-Jumbo comparison" "Multi-session" "Scoring" "Disruptions" "Reporting" "CLI"
```

### Goal 2 — A/B Comparison

```bash
jumbo goal add \
  --title "[EVAL-2/9] A/B comparison" \
  --objective "Extend the smoke test to run the same scenario twice: once with JUMBO_ENABLED=true (jumbo init runs at setup) and once with JUMBO_ENABLED=false (Jumbo installed but not initialized). Still single-session. Add a minimal deterministic scorer that compares the two runs on file accuracy (did the agent modify the expected files?). Produce a simple side-by-side terminal output showing the Jumbo vs non-Jumbo results and the file accuracy score for each. This is the first actual measurement — proof that the A/B comparison pipeline works end-to-end." \
  --criteria \
    "JUMBO_ENABLED env var controls whether jumbo init runs at container setup" \
    "Same scenario executed in both Jumbo and non-Jumbo containers" \
    "Deterministic file accuracy scorer: compares files modified against expected list" \
    "TestResult extended with per-run scores and delta" \
    "Side-by-side terminal output showing both results and score delta" \
    "End-to-end: define scenario -> run both variants -> score -> display comparison" \
  --scope-in "A/B run orchestration" "JUMBO_ENABLED configuration" "File accuracy scorer" "Terminal comparison output" \
  --scope-out "Multi-session" "Disruptions" "LLM-as-judge" "Token tracking" "Additional harnesses" \
  --prerequisite-goals "<EVAL-1-ID>"
```

### Goal 3 — Multi-Session Orchestration

```bash
jumbo goal add \
  --title "[EVAL-3/9] Multi-session orchestration" \
  --objective "Extend the A/B comparison to run across N sessions with fresh agent invocations per session. The container persists (filesystem and Jumbo data carry forward) but each session is a new harness CLI invocation — simulating agent amnesia. Session 1 receives the initial broad objective; subsequent sessions receive a continuation prompt. For Jumbo runs, the session prompt instructs the agent to run 'jumbo session start' first and 'jumbo session end' at close. Add knowledge retention scoring: after session N, check whether decisions/patterns established in session 1 are still reflected in the workspace. Produce a per-session timeline in terminal output showing the knowledge retention trajectory — this is where the amnesia signal first becomes visible." \
  --criteria \
    "SessionOrchestrator runs N sessions per scenario with fresh agent invocations" \
    "Container persists across sessions — only agent context resets" \
    "Session 1 delivers initial prompt; subsequent sessions deliver continuation prompt" \
    "Jumbo runs include jumbo session start/end lifecycle" \
    "TestScenario extended with session count and session boundary definitions" \
    "Knowledge retention scorer: checks if session 1 decisions persist through session N" \
    "Per-session timeline output showing knowledge retention trajectory for both runs" \
    "End-to-end: multi-session scenario -> run both variants -> score retention -> show timeline" \
  --scope-in "Multi-session orchestration" "Continuation prompts" "Jumbo session lifecycle" "Knowledge retention scorer" "Timeline output" \
  --scope-out "Disruptions" "LLM-as-judge" "Token tracking" "Additional harnesses" "JSON export" \
  --prerequisite-goals "<EVAL-2-ID>"
```

### Goal 4 — Disruption Injection

```bash
jumbo goal add \
  --title "[EVAL-4/9] Disruption injection" \
  --objective "Add the ability to inject disruptions (mid-project corrections, scope changes, new constraints) at scheduled session boundaries. A Disruption is defined as part of the TestScenario: type (correction, scope change, new constraint), injection session number, and content. At the scheduled session, the disruption text is prepended to the session prompt. Add disruption recovery scoring: in sessions after a disruption, check whether the correction persisted or was lost at the next session boundary. This is where compounding divergence becomes measurable — the non-Jumbo agent forgets corrections while the Jumbo agent retains them." \
  --criteria \
    "Disruption type defined: correction, scope change, new constraint with injection point and content" \
    "TestScenario extended with disruption schedule" \
    "Disruptions injected by prepending to session prompt at scheduled session" \
    "Disruption recovery scorer: checks if corrections persist in subsequent sessions" \
    "Timeline output extended to show disruption points and recovery trajectories" \
    "End-to-end: scenario with disruptions -> run both variants -> score recovery -> show divergence" \
  --scope-in "Disruption types" "Disruption injection" "Disruption recovery scorer" "Extended timeline" \
  --scope-out "LLM-as-judge" "Token tracking" "Additional harnesses" "JSON export" \
  --prerequisite-goals "<EVAL-3-ID>"
```

### Goal 5 — Token Efficiency Tracking

```bash
jumbo goal add \
  --title "[EVAL-5/9] Token efficiency" \
  --objective "Capture token usage (input and output) per session from harness output and add token efficiency as a measurement dimension. Extend SessionRecord with token usage fields. Parse token counts from harness CLI output (each harness reports usage differently — the adapter is responsible for extracting it). Add a token efficiency scorer that compares total token spend across Jumbo vs non-Jumbo runs, normalized by outcome quality (tokens-per-quality-point). Add token usage to the per-session timeline and comparison output. This reveals whether Jumbo's curated context reduces total token spend while maintaining or improving outcomes." \
  --criteria \
    "SessionRecord extended with input/output token counts" \
    "Claude Code adapter extracts token usage from CLI output" \
    "Token efficiency scorer: total tokens normalized by outcome quality score" \
    "Per-session token usage shown in timeline output" \
    "Cumulative token comparison in A/B output" \
    "End-to-end: run scenario -> capture tokens -> score efficiency -> display in report" \
  --scope-in "Token capture" "Token efficiency scorer" "Adapter token extraction" "Extended output" \
  --scope-out "LLM-as-judge" "Additional harnesses" "JSON export" \
  --prerequisite-goals "<EVAL-4-ID>"
```

### Goal 6 — LLM-as-Judge Scoring

```bash
jumbo goal add \
  --title "[EVAL-6/9] LLM-as-judge scoring" \
  --objective "Add qualitative scoring via LLM-as-judge for dimensions that deterministic checks cannot reach: consistency (do patterns established early hold across later sessions?), error correction (are mistakes caught and not reintroduced?), and architectural quality. For each session pair (Jumbo vs non-Jumbo), submit transcripts and workspace snapshots to a judge LLM with a locked rubric containing specific questions and defined scoring scales. The judge LLM must be a different model than the runner to avoid self-model bias — make the judge model configurable. Combine deterministic and LLM-judge scores into a unified TestResult. This completes the hybrid scoring engine across all seven measurement dimensions." \
  --criteria \
    "LLM-as-judge scorer with locked rubric and defined scoring scales" \
    "Judge scores consistency, error correction, and architectural quality" \
    "Judge LLM configurable and enforced to differ from runner model" \
    "Rubric uses evidence anchoring — judge must cite specific transcript/file evidence" \
    "Deterministic and LLM-judge scores unified in TestResult" \
    "All seven measurement dimensions now scored" \
    "Unit tests with mock transcripts verifying rubric application" \
  --scope-in "LLM-as-judge scorer" "Locked rubrics" "Evidence anchoring" "Unified scoring" \
  --scope-out "Additional harnesses" "JSON export" "CLI commands" \
  --prerequisite-goals "<EVAL-5-ID>"
```

### Goal 7 — Second Harness Adapter

```bash
jumbo goal add \
  --title "[EVAL-7/9] Second harness adapter" \
  --objective "Add a second HarnessAdapter (Codex CLI or Gemini CLI — whichever is most readily available and testable). Verify that the same TestScenario produces valid results through the new harness. Add cross-harness comparison to the terminal report: for the same scenario, show side-by-side results across harnesses to reveal which harnesses benefit most from Jumbo. This validates that the HarnessAdapter abstraction works and that results are comparable across harnesses." \
  --criteria \
    "Second HarnessAdapter implemented (Codex CLI or Gemini CLI)" \
    "Adapter captures transcript, files modified, and token usage" \
    "Same TestScenario runnable through both harnesses" \
    "Cross-harness comparison added to terminal report" \
    "HarnessAdapter abstraction validated — no orchestrator changes needed" \
  --scope-in "Second harness adapter" "Cross-harness comparison" "Adapter validation" \
  --scope-out "Third harness" "JSON export" "CLI commands" \
  --prerequisite-goals "<EVAL-6-ID>"
```

### Goal 8 — Full Reporting

```bash
jumbo goal add \
  --title "[EVAL-8/9] Full reporting" \
  --objective "Build the complete reporting suite. Add the third harness adapter. Produce structured reports: session-by-session divergence curve, per-dimension lift percentages, divergence onset detection (the session number where amnesia impact becomes statistically significant), disruption impact analysis (which corrections caused the largest delta), and cross-harness aggregation. Output in both terminal-formatted human-readable and JSON machine-readable formats. The JSON format is designed for external consumption in documentation and marketing." \
  --criteria \
    "Third HarnessAdapter implemented" \
    "Session-by-session divergence curve in terminal output" \
    "Per-dimension lift percentages" \
    "Divergence onset detection: identifies session where amnesia impact becomes significant" \
    "Disruption impact analysis: ranks corrections by delta size" \
    "Cross-harness aggregation: lift by harness type" \
    "JSON export with complete structured data" \
    "Terminal report polished for human readability" \
  --scope-in "Third harness" "Divergence analysis" "Lift quantification" "JSON export" "Terminal polish" \
  --scope-out "CLI commands" \
  --prerequisite-goals "<EVAL-7-ID>"
```

### Goal 9 — CLI Command Surface

```bash
jumbo goal add \
  --title "[EVAL-9/9] CLI command surface" \
  --objective "Wire up the CLI command surface. 'eval scenario create' — define a new test scenario interactively or from a JSON template. 'eval scenario list' — show available scenarios. 'eval run' — execute a scenario against specified harnesses with --harness and --sessions flags, producing both Jumbo and non-Jumbo runs. 'eval score' — run the scoring engine against completed runs. 'eval report' — generate lift reports with optional --harness and --dimension filters. 'eval status' — show in-progress and completed runs with summary scores. Each command follows existing Jumbo CLI patterns for output formatting, error handling, and help text." \
  --criteria \
    "eval scenario create command with interactive and --from-template modes" \
    "eval scenario list command showing available scenarios" \
    "eval run command with --harness and --sessions filters" \
    "eval score command to trigger scoring on completed runs" \
    "eval report command with --harness and --dimension filters" \
    "eval status command showing run progress and summary scores" \
    "All commands include --help with usage examples" \
  --scope-in "CLI commands" "Command registration" "Output formatting" \
  --scope-out "Core simulation logic" "Scoring logic" "Report aggregation" \
  --prerequisite-goals "<EVAL-8-ID>"
```

## Notes

- Goals use `--prerequisite-goals` to enforce ordering. Replace `<EVAL-N-ID>` placeholders with actual goal IDs as each goal is created.
- Each goal is a tracer bullet: it delivers a vertical slice through the full stack and leaves the system in a buildable, runnable state.
- Harness adapters invoke agent CLIs via subprocess inside containers — no direct LLM API calls from the orchestrator.
- The judge LLM for scoring (Goal 6) is the one place where an LLM API call may be needed, unless the judge can also be invoked via a harness CLI. This is an implementation detail to resolve in Goal 6.
- Adding new harness adapters should be trivial — implement the HarnessAdapter interface and register it.
- Test scenarios should be designed so that both Jumbo and non-Jumbo runs receive identical initial prompts with sufficient information to succeed. The advantage Jumbo provides is retention and curation across sessions, not access to hidden information.
