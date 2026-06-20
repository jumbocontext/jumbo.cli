# Parallel & Interleaved Replication Execution — Design

_Design deliverable for Jumbo goal `fa0394d4` (Outcome 5 challenge). This is a
design, not an implementation: it defines the execution model, resolves the
resource-contention question, gives an interleaving go/no-go, and decomposes the
follow-on implementation goals._

## 1. Context & problem

`eval run --replicate K` (Outcome 5, goal 2/2) runs K A/B comparisons
**sequentially**. Each comparison is one `runABComparison`, which runs the
**jumbo arm fully, then the baseline arm fully** (`ab-runner.ts` →
`runMultiSession` for jumbo, then baseline), and each session spawns a real
coding-agent CLI subprocess (claude / codex / gemini) that performs LLM
inference and file I/O.

So one scenario/harness at K≥5 with 6–7 sessions ≈ **60–70+ agent invocations**,
run end to end → wall-time on the order of hours. GOAL.md Challenges require the
framework to support **parallel execution of replications** and **interleaved
session execution** to make K≥5 tractable and to reduce temporal confounding.

## 2. Key insight: parallelism does not bias the measurement

Every scored dimension is **artefact- or count-based**, never wall-clock based:

- file-accuracy, knowledge-retention, **structural-retention** — checks on
  workspace files;
- jumbo-memory-capture, **jumbo-event-capture** — entity / `.jumbo/events`
  counts;
- token-efficiency — **token counts** (not latency);
- protocol-adherence — lifecycle booleans from Jumbo state.

`phaseTimings` are recorded but **not scored**. Therefore CPU/IO contention from
running replications concurrently changes **wall-time and failure rate, not the
measured quality or token metrics**. Parallelism is safe for measurement
*validity*; its risks are purely **operational** (rate limits, OOM, process
failures).

Corollary: `aggregateReplications` is **order-independent** (mean, sample SD,
and counts do not depend on completion order), so the order in which concurrent
replications finish cannot change the `ReplicationReport`.

## 3. Execution model: bounded worker pool

Add `--concurrency <N>` (default **1**) to `eval run`. The K replications per
harness are dispatched through a bounded pool of size N.

### 3.1 Worker-pool interface (the primitive the implementation builds)

```ts
// Pure concurrency primitive — no eval knowledge.
// Runs `tasks` with at most `n` in flight; resolves with results in INPUT order.
// Fail-fast: on the first rejection, stop scheduling new tasks, let in-flight
// tasks settle, then reject with that first error.
export function runWithConcurrency<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  n: number,
): Promise<T[]>;
```

- **Ordering:** results are returned positionally (result[i] ↔ tasks[i]),
  independent of completion order.
- **Error propagation:** fail-fast in v1 (a failed replication aborts the batch
  with a clear error) — simpler and safer than partial aggregation; partial-batch
  tolerance can be a later enhancement.
- **Bound:** at most `n` tasks are ever in flight; `n=1` is exactly the current
  sequential behaviour.
- **Testability:** unit-tested with fake async tasks asserting (a) max observed
  in-flight ≤ n, (b) output order matches input order, (c) fail-fast on rejection.

### 3.2 Wiring into the replicate loop

`run.ts` builds K task closures per harness (`() => abRunner({...})`) and awaits
`runWithConcurrency(tasks, concurrency)`. Aggregation is unchanged because it is
order-independent. `--concurrency 1` reproduces today's output byte-for-byte.

## 4. Resource-contention analysis (non-API harnesses)

Running N replications concurrently means up to **N concurrent agent-CLI
subprocesses** (each spawning its own runtime + LLM calls), plus the jumbo CLI
subprocesses they invoke.

| Contention vector | Effect | Mitigation |
|---|---|---|
| **Provider rate limits** (one API key/account, N concurrent agents) | 429 throttling → retries/failures | The binding constraint; cap N to the account's concurrency headroom |
| **Host CPU / memory** (N agent CLIs + node runtimes) | slowdown / OOM | Cap N to host capacity; fail-fast on OOM |
| **Disk I/O** (workspace snapshots; per-workdir `.jumbo` SQLite) | I/O load; **no cross-contention** (each replication has an isolated workdir) | Acceptable; isolated state |
| **Agent CLI auth/session limits** | some CLIs disallow concurrent sessions | Detected as agent failures; document per-harness |

**Recommended default: N = 1.** Rationale: the binding constraint (provider rate
limits) is **user-specific and external**; a higher default risks mass 429
failures that masquerade as eval failures and silently corrupt a batch. N is
**opt-in** for users who know their headroom.

**Method to pick N for a host:** start at N=2 with a K=2 smoke; watch for non-zero
agent exit codes, 429s in transcripts, and memory pressure; increase N until
failures/pressure appear, then back off by one. Ship a short guidance table
(rate-limit tier → suggested N) alongside `--concurrency`.

## 5. Interleaving (temporal confounding) — GO

**Today:** within a comparison the jumbo arm runs to completion, then baseline.
Over a long batch, time-varying external factors (provider model/load drift)
could bias the always-jumbo-first ordering.

Two axes:

- **(a) Arm interleaving within a comparison** — alternate jumbo/baseline per
  session (`jumbo s1, baseline s1, jumbo s2, …`). **Feasible:** the two arms have
  independent workdirs; sessions *within* an arm remain sequential (each
  continues from the prior), but the two arms are independent, so alternating by
  session index is a contained `ab-runner` refactor (interleave the two
  `runMultiSession` loops). **GO** — low risk, removes within-comparison temporal
  skew. Behind a flag, default-on once validated; a test asserts the session
  execution order alternates by arm.
- **(b) Replication interleaving** — with the worker pool (N>1), replications
  already overlap in time, naturally de-correlating order. At N=1, alternate the
  arm-order per replication.

Arm interleaving is **independent of** the worker pool and can ship separately.

## 6. Decomposition into follow-on implementation goals

1. **`runWithConcurrency` worker-pool primitive** (pure, fully tested). _Foundation._
2. **Wire `--concurrency N` into `eval run --replicate`** — dispatch replications
   through the pool; default 1; aggregation unchanged. _Prereq: goal 1 + Outcome 5
   goal 2/2._
3. **Arm interleaving in `ab-runner`** — per-session jumbo/baseline alternation,
   flagged, with an ordering test. _Independent (parallel) of goals 1–2._
4. _(optional)_ **`--concurrency` guidance + host smoke** to recommend N. _Prereq: goal 2._

Goals 1 → 2 are prerequisite-chained; goal 3 is independent and can run in
parallel; goal 4 is optional.

## 7. Resolving GOAL.md open questions

- _"Can the host sustain K parallel harness invocations without resource
  contention affecting measurement?"_ — **The measurement is not affected**
  (all metrics are artefact/count-based, not wall-clock); only wall-time and
  failure rate are. Parallelism is therefore valid; bound N by provider rate
  limits and host resources (default 1, opt-in higher).
- _"Interleaved session execution?"_ — **Feasible and recommended (GO)** via
  per-session arm alternation, shipped as an independent goal.

## 8. Decisions (registered in Jumbo)

- **Default replication concurrency = 1; opt-in via `--concurrency N`.** Provider
  rate limits are the binding, user-specific constraint; a higher default risks
  mass throttling failures that corrupt a batch.
- **Arm interleaving = GO** (per-session alternation), as an independent
  follow-on goal — it reduces temporal confounding at low risk and is orthogonal
  to the worker pool.
