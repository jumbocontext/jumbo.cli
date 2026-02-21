---
name: review-jumbo-goal
description: Use when a Jumbo goal needs QA review after implementation. Runs the review protocol, verifies every objective, criterion, and related entity constraint, and loops until all pass or escalates unresolvable issues.
---

# Review Jumbo Goal

**Prompt:** Review a completed Jumbo goal implementation against its objective, success criteria, scope, and all related architectural context. Fix failures and re-review until everything passes.

## Why Review Matters

`jumbo goal review` assembles the goal's full context — objective, criteria, scope, architecture, components, decisions, invariants, and guidelines — into a QA verification prompt. A thorough review catches deviations before they compound. A lazy review lets defects ship.

## Protocol

### 1. Initiate Review

```bash
jumbo goal review --goal-id <goal-id>
```

Read the entire output carefully. It contains the verification criteria assembled from the goal's relations.

### 2. Verify Objective and Success Criteria

For each success criterion listed in the output:

1. Locate the implementation artifacts that satisfy it
2. Read the relevant code
3. Confirm the criterion is **fully** met — not partially, not approximately

If ANY criterion is not met: fix the issue, then re-run `jumbo goal review --goal-id <goal-id>`.

### 3. Verify Scope Compliance

If the review output includes scope sections:

- **In Scope**: Confirm all work was done within the listed files/areas. No under-delivery.
- **Out of Scope**: Confirm no work leaked into excluded areas. No over-delivery.

If scope is violated: adjust the implementation, then re-run `jumbo goal review --goal-id <goal-id>`.

### 4. Verify Architecture Alignment

If the review output includes architecture:

- **Organization style**: Do new namespaces and file names match the solution's architectural organization?
- **Design patterns**: Were prescribed patterns applied where applicable?
- **Principles**: Do all new artifacts reflect the listed principles?

If architecture is misaligned: fix it, then re-run `jumbo goal review --goal-id <goal-id>`.

### 5. Verify Related Entities

For each category in the review output:

- **Components**: Were all listed components properly considered? Are interactions correct?
- **Dependencies**: Are dependency contracts respected?
- **Decisions**: Is the implementation consistent with listed architectural decisions?
- **Invariants**: Does the implementation adhere to every listed invariant? This is non-negotiable.
- **Guidelines**: Does the implementation follow listed guidelines?

If ANY entity constraint is violated: fix the issue, then re-run `jumbo goal review --goal-id <goal-id>`.

### 6. Run Tests

```bash
npm test
```

All tests must pass. If tests fail: fix them, then re-run `jumbo goal review --goal-id <goal-id>`.

### 7. Qualify or Re-Review

**If ALL checks pass** (criteria, scope, architecture, entities, tests):

```bash
jumbo goal qualify --goal-id <goal-id>
```

**If ANY check failed**: fix, then loop back to step 1.

## Rules

1. **Never qualify with unresolved failures.** Every criterion, invariant, and test must pass before qualifying.
2. **Never skip entity categories.** Review output includes entities for a reason — each was registered during refinement as essential context.
3. **Always run tests.** Implementation without passing tests is incomplete.
4. **Fix, don't defer.** When you find an issue, fix it immediately and re-review. Do not log it for later.
5. **Re-review after every fix.** Each fix may introduce new issues. Always re-run the full review after changes.
6. **Read the code, don't assume.** Verify each criterion by reading actual implementation, not by recalling what you wrote.
