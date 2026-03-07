---
name: codify-jumbo-goal
description: Use when a Jumbo goal has been approved by QA review and needs architectural reconciliation before closing. Captures new learnings, updates stale entities, and ensures documentation reflects the work performed.
---

# Codify Jumbo Goal

**Prompt:** Perform architectural reconciliation for an approved Jumbo goal — capture new learnings, review registered entities for staleness, update documentation, then close the goal.

## Why Codification Matters

After a goal passes QA review, the codebase has changed but the project's registered knowledge may not reflect those changes. Codification is the checkpoint where new invariants, decisions, components, and guidelines discovered during implementation get captured. Skipping codification causes knowledge drift — future agents operate with stale or incomplete context.

## Protocol

### 1. Initiate Codification

```bash
jumbo goal codify --id <goal-id>
```

Review the goal's objective and status. The goal must be in a reviewable state.

### 2. Capture New Learnings

Reflect on the implementation interaction with the user during this goal. Ask:

- Did it surface any **NEW** invariants, guidelines, decisions, components, dependencies, or architectural patterns not yet captured?
- Were you corrected in a way that reveals a missing rule?

Only propose additions that are:
- **Universal** (applicable beyond this specific goal)
- **Dense** (one sentence, no examples unless the example IS the rule)
- **Actionable** (changes how code is written or decisions are made)

If nothing qualifies, say so. Avoid restating what's already captured.

Use `jumbo --help` for command details on registering new entities.

### 3. Review Registered Entities for Staleness

The goal may have changed the codebase in ways that affect registered entities. For each entity type below, consider whether any existing registrations need updating based on the work performed.

#### Components
Did any component descriptions, responsibilities, or paths change? Were any components deprecated or removed?
```bash
jumbo component update --id <id> --description "..." --responsibility "..."
jumbo component deprecate --id <id> --reason "..."
jumbo component add --name "..." --type "..." --description "..." --responsibility "..." --path "..."
```

#### Decisions
Were any architectural decisions made, superseded, or invalidated by this work?
```bash
jumbo decision add --title "..." --context "..." --rationale "..."
jumbo decision update --id <id> --rationale "..."
jumbo decision supersede --id <id> --new-decision-id <new-id>
```

#### Invariants
Were any invariants introduced, weakened, strengthened, or made obsolete?
```bash
jumbo invariant add --title "..." --description "..." --enforcement "..."
jumbo invariant update --id <id> --description "..." --enforcement "..."
jumbo invariant remove --id <id>
```

#### Guidelines
Were any coding, testing, or documentation guidelines introduced or changed?
```bash
jumbo guideline add --category "..." --title "..." --description "..."
jumbo guideline update --guideline-id <id> --description "..."
jumbo guideline remove --guideline-id <id>
```

#### Dependencies
Were any dependencies added, removed, or changed?
```bash
jumbo dependency add --consumer-id <id> --provider-id <id> --contract "..."
jumbo dependency update --id <id> --contract "..."
jumbo dependency remove --id <id>
```

#### Architecture
Did this work change the architecture style, principles, or patterns?
```bash
jumbo architecture update --style "..." --principles "..."
```

#### Relations
Should any new relations be established between entities touched by this goal?
```bash
jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --type <type> --strength <level>
```

### 4. Update Documentation

Evaluate whether changes should be reflected in user documentation:
- Did the changes introduce any new features, modify existing behavior, or fix bugs that users should be aware of?
- If yes, propose updates to `~/docs/*` and update the `CHANGELOG.md`.

### 5. Close the Goal

After completing the reconciliation above, close the goal:

```bash
jumbo goal close --id <goal-id>
```

## Rules

1. **Never skip entity review.** Every entity category must be evaluated for staleness after implementation.
2. **Only capture universal learnings.** Do not register goal-specific observations as project-wide invariants or guidelines.
3. **Keep additions dense.** One sentence per entity. No examples unless the example IS the rule.
4. **Always check documentation impact.** Implementation changes that affect user-facing behavior must be documented.
5. **Close the goal last.** Only run `jumbo goal close` after all reconciliation steps are complete.
