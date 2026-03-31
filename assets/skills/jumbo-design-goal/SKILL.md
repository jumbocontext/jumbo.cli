---
name: jumbo-design-goal
description: Pre-definition collaborative discovery. Aligns a proposed goal with project audience, pains, and value propositions; surfaces design gaps and open questions before handing off to define-jumbo-goals.
---

# Design Jumbo Goal

**Prompt:** Guide collaborative goal design by aligning a proposed piece of work with the project's audience, audience pains, and value propositions — surfacing design gaps and open questions before handing off to the define-jumbo-goals skill for formal decomposition and registration.

## Why Design Precedes Definition

Definition without alignment produces goals that solve the wrong problem or miss the audience's actual pain. The define-jumbo-goals skill assumes the *what* and *why* are already clear — it focuses on decomposition, criteria, and scope. If those inputs are vague or misaligned, every downstream artifact (criteria, relations, implementation) inherits the drift. Design is where alignment happens.

## Protocol

### 1. Load Project Context

Before discussing the goal, load the project's north-star context:

```bash
jumbo architecture view
```

Also extract the `projectContext` from your session start output. From these two sources, note:

- **Audiences** — who the project serves
- **Audience pains** — what problems those audiences face
- **Value propositions** — what the project promises to deliver

These three lists are the alignment targets for every goal.

### 2. Elicit the Goal Idea

Ask the user what they want to achieve and why. Extract the raw intent before shaping it:

- "What problem are you trying to solve, or what capability are you trying to add?"
- "What prompted this — a user complaint, a technical limitation, a new requirement?"
- "Is there anything you've already decided about how this should work?"

Listen for the *what* and the *why*. Do not jump to solution design. The goal at this stage is understanding, not specification.

### 3. Align with Project Context

Map the proposed goal against each alignment target:

| Alignment Target | Question |
|------------------|----------|
| Each **audience** | Does this goal serve this audience? If so, how? |
| Each **audience pain** | Does this goal address this pain? Directly or indirectly? |
| Each **value proposition** | Does this goal advance this value proposition? |

Document which targets the goal serves. If the goal does not align with any audience pain or value proposition, surface that explicitly:

> "This goal doesn't appear to address any of the project's stated audience pains or value propositions. That may be fine — it could be infrastructure, tech debt, or a new direction. But let's confirm that's intentional before proceeding."

Misalignment is not a blocker — it is a signal that needs acknowledgment.

### 4. Identify Design Gaps

Surface missing information that would prevent clean definition. For each category, ask targeted questions:

| Gap Category | What to Surface |
|--------------|-----------------|
| **Unclear scope** | What is included? What is explicitly excluded? Where are the boundaries? |
| **Unstated assumptions** | What is being taken for granted about the current system, user behavior, or environment? |
| **Unknown constraints** | Are there performance, compatibility, security, or process constraints? |
| **Missing success criteria** | How will we know this is done? What does "correct" look like? |
| **Unresolved dependencies** | Does this require other work to be completed first? Does it depend on external systems or teams? |

Ask one category at a time. Iterate until each gap is resolved or explicitly deferred. Do not overwhelm the user with all questions at once.

### 5. Confirm Readiness

Before handing off, verify the following checklist:

- [ ] **Objective is clear** — the *what* and *why* can be stated in one sentence
- [ ] **Audience alignment is explicit** — at least one audience is identified as the beneficiary
- [ ] **Pain or value proposition is served** — at least one is addressed, or misalignment is acknowledged
- [ ] **No open questions remain** — all design gaps are resolved or explicitly deferred with rationale
- [ ] **User has approved the design** — the user confirms this captures their intent

If any item is unresolved, return to the relevant protocol step. Do not proceed with open gaps.

### 6. Hand Off to Definition

Once the design is confirmed, invoke the define-jumbo-goals skill:

```
/define-jumbo-goals
```

Carry forward the gathered context: the objective, the audience alignment, the resolved design gaps, and any constraints or dependencies discovered. The define-jumbo-goals skill will handle decomposition, criteria authoring, scope definition, and goal registration.

If the user prefers to defer definition, output a structured summary they can carry forward:

```
## Goal Design Summary
- **Objective:** [one-sentence what + why]
- **Audiences served:** [list]
- **Pains addressed:** [list]
- **Value propositions advanced:** [list]
- **Constraints:** [list]
- **Dependencies:** [list]
- **Deferred questions:** [list, if any]
```

## Rules

1. **Never skip project context loading.** Always load audience, pains, and value propositions before discussing alignment. Design without context is guessing.
2. **Never proceed to definition with open design questions.** Every gap must be resolved or explicitly deferred with the user's acknowledgment.
3. **Never fabricate alignment.** If the goal does not align with any audience pain or value proposition, say so. Do not force-fit connections that do not exist.
4. **Never assume the user's intent.** If the raw idea is ambiguous, ask. Do not infer scope, constraints, or success criteria the user has not stated.
5. **Never skip user approval.** The user must confirm the design before handoff. The agent's job is to facilitate, not to decide.

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Skipping straight to definition without design | Goals are defined without alignment, producing work that misses the audience's actual pain | Always run the design protocol first — load context, elicit intent, align, identify gaps |
| Assuming alignment without checking | The goal feels related to the project but no explicit mapping was done | Walk through each audience, pain, and value proposition explicitly |
| Asking too many questions at once | The user is overwhelmed and gives shallow answers | Iterate one gap category at a time, confirming resolution before moving on |
| Force-fitting alignment | The agent claims the goal serves a pain it does not actually address | State misalignment honestly — the user may have context that resolves it, or may accept the gap |
| Treating design as a gate instead of a collaboration | The agent blocks progress because alignment is imperfect | Misalignment is a signal, not a blocker — surface it, discuss it, let the user decide |
