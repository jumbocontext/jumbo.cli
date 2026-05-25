---
name: define-jumbo-goals
description: Add Jumbo goals liberally to decompose objectives into finite units of work with bounded context. Use when defining new Jumbo goals from user requests, or to augment your own work to maintain scope while ensuring complementary work is registered.
---

# Define Jumbo Goals

**Prompt:** Analyze the primary objective to discover the architectural context required, decompose the work into right-sized goals, and author each goal with precise objectives, verifiable criteria, and explicit scope — so that refinement and implementation proceed with minimal exploration overhead.

## Why Definition Quality Matters

A goal's definition determines everything downstream. During refinement, the agent registers relations based on the objective and criteria. During implementation, `jumbo goal start` assembles context from those relations into an implementation prompt. Vague objectives produce vague relations. Vague relations produce bloated or incomplete context. The implementing agent then wastes tokens exploring what should have been stated upfront, or worse, builds the wrong thing.

**The goal definition is the spec.** Treat it with the rigor of a technical specification, not a backlog item.

## Protocol

### 1. Align Goal and Project Purpose

Start by getting oriented with the overall project purpose (use a cached response if previously run in this session):

```bash
jumbo project show --northstar
```

The initiative to define a new goal could be self-driven, or have eminated from the user:

#### If from the User
Extract the user's intent through conversation. Identify:

- **What** needs to change (feature, fix, refactor, infrastructure)
- **Why** it needs to change (user problem, tech debt, prerequisite for other work)
- **Constraints** the user cares about (performance, compatibility, patterns to follow)

If the request is ambiguous, ask clarifying questions before proceeding. Do not guess intent.

#### If Self-Driven
Ensure the initiative is not in conflict with the project purpose. Abandon the initiative if it is, or adjust if slight fitting would align it.


### 2. Understand Context

Before writing any goal, survey the project to understand what exists:

```bash
jumbo components search --q "<query terms>"
jumbo components search --type <likely-type>
jumbo invariants search --q "<query terms>"
jumbo guidelines search --q "<query terms>"
jumbo decisions search --q "<query terms>"
jumbo dependencies search --q "<query terms>"
```

This discovery serves two purposes:
- **Inform decomposition**: Understanding the system's boundaries, patterns, and constraints reveals the natural seams along which to split work.
- **Inform criteria**: Existing invariants, decisions, and patterns dictate what "correct" looks like.

Also explore the codebase directly to understand current implementation:

```bash
# Find relevant source files
# Read key files to understand existing patterns
# Identify integration points and boundaries
```

### 3. Decompose into Right-Sized Goals

A goal is **right-sized** when:

- It produces a **shippable increment** — the codebase is better after this goal alone, even if later goals are never started.
- It can be **implemented in a single session** — an agent can start and complete it without context compaction.
- It has a **clear boundary** — scope-in and scope-out can be stated without hedging.
- It touches **one architectural concern** — avoid goals that mix, e.g., domain modeling with UI work with infrastructure changes.

**Decomposition heuristics:**

| Signal | Action |
|--------|--------|
| Work spans multiple bounded contexts or layers | Split by context/layer |
| Work requires a new abstraction before feature code | Split: abstraction goal first, feature goal second |
| Work has independent sub-deliverables | Split into parallel goals (no prerequisite chain) |
| Work has sequential dependencies | Split into chained goals (use `--previous-goal` / `--next-goal`) |
| Work is a single focused change | Keep as one goal |

**Sequencing tools:**

- `--prerequisite-goals <ids>`: Hard dependency — goal cannot start until prerequisites are complete.
- `--previous-goal <id>` / `--next-goal <id>`: Suggested ordering — chains goals for sequential flow.

When chaining goals, prefix each goal's title with its position in the chain (e.g., `1/3 Deprecate Architecture entity`, `2/3 Migrate context packets`, `3/3 Remove Architecture entity`). This communicates execution order to users and agents reviewing the backlog.

### 4. Author Each Goal

For each goal, compose the three pillars: **objective**, **criteria**, and **scope**.

#### Objective

The objective is a single sentence that answers: "What is being built or changed, and why?"

| Quality | Example |
|---------|---------|
| BAD | "Implement telemetry" |
| BAD | "Add PostHog integration for tracking" |
| GOOD | "Add anonymous usage telemetry to the CLI using PostHog so we can understand which commands are used and where failures occur" |

Rules:
- State the **what** and the **why** in one sentence.
- Name specific technologies, patterns, or components when known.
- Do not describe how — that belongs in criteria.

#### Success Criteria

Each criterion is a **verifiable statement** that the reviewing agent can confirm by reading code or running tests. Criteria are the implementation instructions in disguise.

| Quality | Example |
|---------|---------|
| BAD | "Telemetry works" |
| BAD | "Good test coverage" |
| GOOD | "Application layer defines a TelemetryPort interface with `trackEvent(name, properties)` and `identify(anonymousId)` methods" |
| GOOD | "Infrastructure adapter implements TelemetryPort using PostHog Node SDK with fire-and-forget sends that never block the CLI event loop" |
| GOOD | "First-run consent prompt stores preference in `~/.config/jumbo/telemetry.json` with schema `{ enabled: boolean, promptedAt: string }`" |

Rules:
- Each criterion describes a **single verifiable outcome**.
- Name specific types, methods, file locations, schemas, or behaviors.
- Make criteria **architecture-aware** — reference the project's patterns (ports/adapters, event sourcing, CQRS) when the implementation must conform.
- Order criteria from foundational to dependent — the implementing agent reads them top to bottom.
- Include a testing criterion — specify what tests exist and what they verify.
- If a refactoring skill applies, add `skill:<skill-name>` as a criterion.

#### Scope

Scope tells the implementing agent where to work and where not to touch.

```bash
--scope-in "src/application/telemetry/" "src/infrastructure/posthog/" "src/cli/commands/config.ts"
--scope-out "src/domain/" "src/infrastructure/persistence/"
```

Rules:
- Use **file paths or directory prefixes**, not abstract descriptions.
- `scope-in` lists files/directories that WILL be created or modified.
- `scope-out` lists files/directories that MUST NOT be modified (protects unrelated code).
- When creating new files, include the intended path in scope-in even though it does not exist yet.
- Scope-out is especially valuable for goals that touch shared infrastructure — it prevents the agent from "fixing" unrelated code.

### 5. Register the Goal

Run `jumbo goal add --help` to confirm current flags and syntax before registering. Pass the objective, criteria, scope, and sequencing flags composed in the previous steps.

For multi-goal decompositions, register goals in dependency order so that sequencing flags can reference already-created IDs.

#### Goal Chaining with Previous/Next Goals

The `--previous-goal` and `--next-goal` flags create a **chain** — an ordered sequence of goals that an agent works through end-to-end. Chaining is distinct from prerequisites:

- **Prerequisites** (`--prerequisite-goals`) are hard gates — a goal cannot start until its prerequisites are complete.
- **Chains** (`--previous-goal` / `--next-goal`) are navigational — when the agent finishes one goal, the chain tells it what to pick up next without the user intervening.

Chaining is the primary mechanism for **long-running autonomous sessions without context rot.** Each goal in the chain carries its own focused context assembled at start time. When the agent completes goal A and transitions to goal B, `jumbo goal start` assembles fresh, relevant context for B — discarding the accumulated noise from A's implementation. The agent effectively gets a clean context window scoped precisely to the next unit of work, without losing the benefits of sequential execution.

**When to chain:**
- Work decomposes into ordered steps where each builds on the prior (e.g., "define port abstraction" → "implement adapter" → "wire into CLI").
- The combined work would exceed comfortable context limits if attempted as a single goal.

**When NOT to chain:**
- Goals are independent and can be worked in any order — leave them unchained so the agent (or user) can prioritize freely.
- Goals have hard dependencies where failure of one invalidates the next — use `--prerequisite-goals` instead, which enforces completion before start.

### 6. Verify Before Handing Off

After all goals are registered, verify:

- [ ] Every goal has a clear, specific objective with what + why
- [ ] Every goal has criteria that an agent can verify by reading code
- [ ] Every goal has scope-in that matches the files it will touch
- [ ] Scope-out protects areas adjacent to scope-in that should not change
- [ ] Goal sequencing reflects actual dependencies (not just aesthetic ordering)
- [ ] No single goal is so large it risks context compaction during implementation
- [ ] No goal duplicates work from another goal
- [ ] The full set of goals covers the initial objective completely

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| "Implement feature X" as sole criterion | Agent has no spec, explores and guesses | Break into 5-8 specific verifiable outcomes |
| Scope-in says "src/" | Everything is in scope, nothing is protected | List specific directories and files |
| No scope-out | Agent may refactor neighboring code | Explicitly exclude adjacent areas |
| Goal mixes domain + infrastructure + tests | Too broad, risks compaction | Split by architectural layer |
| Criteria reference "should" or "ideally" | Ambiguous — pass or fail? | Rewrite as binary verifiable statements |
| 15+ criteria on one goal | Goal is too large | Decompose into multiple goals |
| No testing criterion | Agent skips tests | Always include what tests must exist |

## Rules

1. **Never register a goal without discovery.** Always explore the architecture, components, and constraints before writing objectives and criteria. Definition without context produces goals that fight the architecture.
2. **Never write criteria the reviewing agent cannot verify.** If a criterion requires subjective judgment ("clean code", "good performance"), replace it with a measurable statement ("no function exceeds 30 lines", "response time under 200ms for 1000 records").
3. **Never skip scope.** Every goal must have scope-in. Most goals should have scope-out. Unbounded scope invites unbounded implementation.
4. **Always decompose before defining.** Resist the urge to create one large goal. Think in shippable increments.
5. **Always verify goal coverage.** The union of all goals must fully address the starting objective. Gaps between goals are gaps in delivery.
