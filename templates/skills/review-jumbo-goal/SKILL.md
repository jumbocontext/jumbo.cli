---
name: review-jumbo-goal
description: Use when a Jumbo goal needs QA review after implementation. Runs the review protocol, verifies every objective, criterion, and related entity constraint, and approves the goal for codification or rejects it with feedback.
---

# Review Jumbo Goal

**Prompt:** Review a completed Jumbo goal implementation against its objective, success criteria, scope, and all related architectural context. Approve the goal if no issue are found, otherwise document the issues and reject the goal.

## Why Review Matters

`jumbo goal review` assembles the goal's full context — objective, criteria, scope, architecture, components, decisions, invariants, and guidelines — into a QA verification prompt. A thorough review catches deviations before they compound. A lazy review lets defects ship.

## Protocol

### 1. Initiate Review

```bash
jumbo goal review --id <goal-id>
```

Read the entire output carefully. It contains the verification criteria assembled from the goal's relations.

### 2. Verify Objective and Success Criteria

For each success criterion listed in the output:

1. Locate the implementation artifacts that satisfy it
2. Read the relevant code
3. Confirm the criterion is **fully** met — not partially, not approximately

If ANY criterion is not met: add the issues to a list for feedback.

### 3. Verify Scope Compliance

If the review output includes scope sections:

- **In Scope**: Confirm all work was done within the listed files/areas. No under-delivery.
- **Out of Scope**: Confirm no work leaked into excluded areas. No over-delivery.

If scope is violated: add the issues to the feedback list.

### 4. Verify Architecture Alignment

If the review output includes architecture:

- **Organization style**: Do new namespaces and file names match the solution's architectural organization?
- **Design patterns**: Were prescribed patterns applied where applicable?
- **Principles**: Do all new artifacts reflect the listed principles?

If architecture is misaligned: add the issues to the feedback list.

### 5. Verify Related Entities

For each category in the review output:

- **Components**: Were all listed components properly considered? Are interactions correct?
- **Dependencies**: Are dependency contracts respected?
- **Decisions**: Is the implementation consistent with listed architectural decisions?
- **Invariants**: Does the implementation adhere to every listed invariant? This is non-negotiable.
- **Guidelines**: Does the implementation follow listed guidelines?

If ANY entity constraint is violated: add the issues to the feedback list.

### 6. Run Tests

```bash
npm test
```

All tests must pass. If tests fail: add the issues to the feedback list.

### 7. Qualify or Re-Review

**If ALL checks pass** (criteria, scope, architecture, entities, tests):

```bash
jumbo goal approve --id <goal-id>
```

**If ANY check failed**:

```bash
jumbo goal reject --id <goal-id> --audit-findings <list of issues>
```


## Rules

1. **Never approve with unresolved failures.** Every criterion, invariant, and test must pass before approving.
2. **Never skip entity categories.** Review output includes entities for a reason — each was registered during refinement as essential context.
3. **Always run tests.** Implementation without passing tests is incomplete.
4. **Document issues clearly.** When rejecting a goal, provide detailed feedback for each failure.
5. **Read the code, don't assume.** Verify each criterion by reading actual implementation, not by recalling what you wrote.
