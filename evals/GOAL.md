# Eval Framework

## Objective

Produce an evaluation framework comparing coding-agent performance when working in a project with Jumbo CLI initialized versus a plain no-Jumbo setup, and yields durable, statistically valid, comparable side-by-side metrics across repeatable scenarios.

## Scope

### In scope
- Multiple evaluation scenarios, including at least one null-hypothesis scenario (see Scenarios).
- Durable persistence of per-run metrics with replication support.
- Structural artefact-based scoring (workspace file content), not transcript keyword matching.

### Out of scope
- API-based agent interactions (explicitly disallowed — harnesses only).

## Baseline

The "without Jumbo" setup is **plain agent execution**:
- Use the same agent harness as the with-Jumbo setup.
- No `JUMBO.md`, `AGENTS.md`, or `.claude/settings.json` present in the working tree.
- No `.jumbo/` directory present.
- `jumbo` restricted in the agent's permission set.
- The baseline workdir is asserted clean of Jumbo instruction files before session 1 begins.

The "with Jumbo" setup uses the same agent in the same starting repo state, with Jumbo initialized and `jumbo` available.

## Outcomes

A run of this goal succeeds when each outcome below is true.

1. **A scenario can be specified in a durable, reusable format.**
   - A schema defines starting repo state, instructions, invariants, and expected outcomes.
   - The framework supports addition of new scenarios without modifying runner or scoring code.
   - Every scenario declares `retentionPatterns` as the primary retention signal.

2. **A scenario can be executed end-to-end against a configured agent in both setups.**
   - At least one authored scenario with A/B variants runs to completion in both setups.
   - Each run is identified by a stable run ID.
   - The workspace snapshot captures `.jumbo/events/` (event file names and aggregate counts) in addition to user-authored files, so the Jumbo event log is part of the scoring evidence.

3. **Every run produces durably persisted, retrievable metrics.**
   - Metrics are retrievable by run ID after the harness exits.
   - Token usage is recorded per run and per session.
   - Per-session workspace snapshots are stored (not only the final snapshot) to support per-session scoring.

4. **Each run is scored on both rule-based and model-reviewed dimensions.**
   - Knowledge retention is scored against structural assertions on workspace artefacts, not keyword presence in transcripts.
   - Jumbo arm quality scores (file accuracy, retention, disruption recovery) are only computed for sessions where lifecycle adherence meets the minimum threshold (see Methodology).
   - Token efficiency is only reported when both arms produced functionally equivalent outputs (see Scoring).
   - Rule-based and model-based review are produced by a single scoring pipeline.

5. **The two setups can be compared side-by-side with statistical confidence.**
   - A comparison artifact is produced from K≥5 replicated runs per arm per scenario.
   - Lift numbers are reported as mean ± standard deviation, not as single-point estimates.
   - A result is considered a valid signal only when the lift exceeds one standard deviation.

## Methodology

### Terms
- **Scenario:** The durable task specification shared across both setups: starting repo state, prompt/goal descriptions, invariants, structural assertions, expected outcomes, and any scripted disruptions.
- **Run:** One end-to-end attempt to execute a scenario in one setup, producing a stable run ID and a durable record of outputs and metrics.
- **Replication:** K independent runs of the same scenario in the same setup, used to estimate variance and compute confidence intervals. K≥5 is the minimum for any claim.
- **Session:** One contiguous agent interaction period within a run. A run contains one or more sessions.
- **Setup:** One execution condition for a scenario. In v1, the two setups are Jumbo and baseline.
- **Adherence:** The degree to which the Jumbo arm agent executed the prescribed lifecycle (session start, goal start, in-session captures, goal submit, session end), verified post-session from Jumbo's.

### Replication requirement

A single run per arm is an anecdote, not a measurement. LLM outputs are stochastic: the same prompt produces different code, different files, and different token counts across runs. Without replication, there is no variance estimate, no standard error, and no significance test. Any lift number derived from a single run cannot be distinguished from noise.

**Minimum K:** 5 replications per arm per scenario. With K=5, a t-test at α=0.05 (one-tailed, df=4) requires t > 2.13 to claim a significant result. This is the minimum credible threshold.

**Reporting standard:** All lift numbers are reported as mean(Jumbo) − mean(baseline) ± pooled standard deviation. A lift is reported as a signal only when it exceeds one standard deviation of the baseline distribution.

**Cost acknowledgement:** K=5 at 6–7 sessions per run is 30–35 harness invocations per arm per scenario. This is the unavoidable cost of a valid measurement. The framework must support batch replication (launching K runs automatically and aggregating results) to make this tractable.

Reference: AMA-Bench: Evaluating Long-Horizon Memory for Agentic Applications https://arxiv.org/pdf/2602.22769

### Keeping both setups comparable

The Jumbo arm's effective prompt wraps the scenario task with a framework-assigned active goal-id and an explicit lifecycle protocol. This is an intentional structural difference — the agent is told what to do and given a tool to do it. The baseline arm receives only the scenario task.

**This is an acknowledged prompt asymmetry, not a controlled comparison.** The measured lift therefore attributes to the entire Jumbo system (memory + protocol + goal handoff), not to memory in isolation. Any published lift claim must carry this attribution explicitly.

A future ablation arm (protocol-only, no Jumbo binary or memory) would allow separating prompt structure effects from memory effects. This is however a required step before claiming that memory specifically drives the lift.


### Workspace evidence: capturing `.jumbo/`

The workspace snapshot must include Jumbo's own state as scoring evidence. Specifically:
- `.jumbo/events/` — a structured summary of event files by aggregate type and count. Full file content is not required; filenames and counts are sufficient to verify that the agent registered entities during the session.
- The pre-session and post-session entity diff (`JumboMemorySnapshot`) is the primary evidence for in-session captures. The event log summary provides a secondary, non-CLI-mediated confirmation.

The event log is the ground truth of what happened inside Jumbo. CLI command outputs are a derived view; if a CLI command fails silently, the event log is the fallback. Without it, the audit trail claim of full explainability is false.

### Comparing token usage fairly

Token efficiency is only valid when both arms produced functionally equivalent outputs. Equivalence is defined operationally as: both arms produced all expected files, and both arms' structural assertion scores meet a minimum threshold (≥0.8 of the maximum possible score on the structural assertion for this scenario).

Without output equivalence, token efficiency compares the cost of producing different things — a meaningless ratio.

**When equivalence is not met:** token efficiency is reported as N/A for that replication. Across K replications, report the fraction of replications where equivalence was achieved, and compute token efficiency only over that subset.

Computing quality score from the same sessions used to compute token count is resolved by using the structural assertion score — which is computed independently of token counts — as the quality denominator.

### Structural assertions vs. keyword matching

Knowledge retention is not measurable by checking whether a term appears in the agent's output text. An agent can write "we are not using discriminated unions here" and score full marks on the term "discriminated union." Furthermore, several retention patterns appear verbatim in the scenario's initial prompt — a stateless agent echoing the prompt scores identical retention to one that correctly implemented the domain.

**Retention is measured on artefacts.** Each scenario declares `structuralAssertions`: per-session checks on the actual files in the workspace. 

`retentionPatterns` (keyword strings) may be retained as a lightweight pre-filter to decide whether to run the more expensive structural assertion. They are not the primary signal.

### Scenarios

The scenario set must include at minimum:

1. **Complexity scenarios (existing):** Multi-session, multi-disruption domain-modeling tasks where Jumbo is expected to lift. These test the hypothesis under favourable conditions.

2. **Null-hypothesis scenario:** A single-session task where Jumbo should provide zero or negligible lift. Jumbo cannot improve cross-session retention if there is only one session. If Jumbo shows statistically significant lift on a single-session scenario, the measurement is detecting an artefact (prompt structure, scoring bias, or test contamination), not memory. This scenario is a validity check on the measurement framework itself. A passing eval should show near-zero lift here.

3. **File-reconstruction scenario:** A multi-session task on a codebase where all architectural decisions are legible in the existing files — an agent that carefully reads prior-session output can reconstruct sufficient context without Jumbo. This tests whether Jumbo's advantage is specific to context that cannot be recovered from file artefacts, or whether it is simply a better file-reading aid. Expected result: lower lift than the complexity scenarios, because the agent has an alternative recovery path.

## Scoring

Two tiers. 

### Rule-based checks

- **File Accuracy** — Were the expected files produced, and are they present in the workspace snapshot? Rubric: exact set, superset allowed, or path-prefix match — declared per scenario. Scored per session  using per-session snapshots. Files exceeding the snapshot size cap are recorded as `skipped` (not `absent`) and treated as present for scoring purposes.

- **Knowledge Retention** — Do structural assertions on workspace artefacts pass in the sessions they are declared for? Each scenario declares assertions as structured checks on file content (AST-level or pattern-level, not keyword presence in transcripts). A session's retention score is the fraction of assertions due in that session that pass. 

- **Token Efficiency** — Tokens consumed per arm, normalised by the structural assertion score (not by file accuracy or keyword retention). Only reported when both arms achieved output equivalence (≥0.8 structural assertion score). Not a standalone dimension — reported as a ratio with explicit equivalence status.

- **Adherence Rate** — Fraction of Jumbo arm sessions meeting minimum lifecycle adherence. Reported separately from quality scores, not averaged into the lift. A low adherence rate is a diagnostic finding, not a quality failure of Jumbo — it indicates the agent is not following the protocol, which is a separate signal.

### Model-based review

- **Consistency** — Naming, architectural, and styling conventions held across sessions. Review prompt and rubric versioned alongside the scenario. Judge model must be from a different provider than the agent under test. Rubric questions are atomic and binary-anchored (not holistic 1–5 scales) to reduce self-preference bias.
- **Adaptability** — When the scenario injects a disruption, does the agent's output register and fully integrate it, including retrofitting prior artefacts?

## Constraints

- Must run against coding-agent harnesses; no direct API-based interactions.
- Scenarios must be repeatable: same scenario + same agent + same seed (where seedable) yields comparable runs within measurement variance.
- The framework must be extensible to additional agent harnesses without redesign.
- Replication (K≥5 runs per arm) must be automatable as a single `eval run --replicate K` command — not a manual multi-step process.
- All lift claims in reports must carry their replication count, mean, standard deviation, and significance status explicitly. 

## Challenges

- **Cost of replication:** K=5 per arm per scenario is expensive. The framework must support parallel execution of replications (two arms × K runs, not sequentially) and interleaved session execution (alternating Jumbo and baseline sessions within each replication) to reduce temporal confounding.
- **Structural assertion authoring:** Writing per-scenario TypeScript structural assertions is expert work. Each new scenario requires a domain expert to specify what correct implementation looks like at the file level.
- **Adherence variance:** Agents may adhere to the lifecycle inconsistently across replications. The adherence rate is itself a stochastic variable. The report must distinguish low-lift-due-to-non-adherence from low-lift-due-to-memory-not-helping.

## Open Questions

- **Ablation arm for prompt structure:** A protocol-only, no Jumbo binary or memory to separate prompt structure effects from memory effects?
- **Structural assertion tooling:** Should assertions use the TypeScript compiler API (precise but fragile), a regexp-based structural match (approximate but robust), or a combination? What is the calibration process for new assertions?
- **Parallel replication infrastructure:** Can the host machine sustain K parallel harness invocations without resource contention affecting measurement? What is the right K given the available budget per scenario?
- Should this framework live in the Jumbo CLI repo, or remain a sibling project?
- Can an evals sandbox be containerized while still driving non-API agents (Claude Code CLI, Codex CLI, Gemini CLI)? [Need to verify with Docker Sandboxes (in early access preview)]
- Can defining anti-patterns as desired invariants provide an easy measure of adherence? Models should implement established patterns and best practices by default - if not they should improve over time. Does instructing a model to deviate from best practices and established patterns provide clear signal for measuring the level of adherence?
- What is the durable persistence backend?
