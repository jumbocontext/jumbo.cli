---
name: refine-jumbo-goals
description: Use when Jumbo goals need refinement before implementation. Curates relations to project entities so the implementing agent receives optimal architectural context.
---

# Refine Jumbo Goals

**Prompt:** Refine one or more Jumbo goals by registering comprehensive relations to project entities so that an autonomous agent has optimal context for correct implementation.

## Why Refinement Matters

When `jumbo goal start` is run, the goal's registered relations determine what context is assembled and provided to the implementing agent. Missing relations mean missing constraints, patterns, or domain knowledge. Irrelevant relations waste tokens and dilute focus. Thorough refinement is the single highest-leverage activity for autonomous goal execution quality.

## Protocol

### 1. Initiate Refinement

```bash
jumbo goal refine --id <goal-id>
```

Review the goal's objective, criteria, and scope.

### 2. Explore All Project Entities

You MUST explore ALL entity categories to build a complete picture of available entities:

```bash
jumbo invariants list
jumbo guidelines list
jumbo decisions list
jumbo dependencies list
jumbo architecture view
```

For **components**, use targeted searches instead of dumping the full list. Extract keywords from the goal's objective and criteria, then search:

```bash
# Search by name (substring or wildcard)
jumbo components search --name "Auth*"
jumbo components search --name "*Gateway"

# Search by type
jumbo components search --type service
jumbo components search --type lib

# Free-text search across description and responsibility
jumbo components search --query "event handling"

# Compact output for quick discovery (id, name, type only)
jumbo components search --output compact --type service

# Combine filters (AND logic)
jumbo components search --name "*Controller" --type service
```

Run multiple targeted searches derived from the goal's domain. Only fall back to `jumbo components list` if searches are insufficient to identify all relevant components.

Do not skip any entity category. Every category is a potential source of implementation context.

### 3. Evaluate Every Entity Against the Goal

For each entity returned, ask: **"Will the implementing agent need to know about this to execute correctly?"**

Only register relations that are directly relevant. Do not register entities that are tangentially related or that add context without actionable value.

Evaluate systematically by category:

- **Invariants**: Which non-negotiable constraints does this implementation touch, cross, or risk violating?
- **Guidelines**: Which coding standards, testing requirements, or process practices apply?
- **Decisions**: Which architectural decisions inform, motivate, or constrain this change?
- **Components**: Which system components will be created, modified, deleted, or depended upon?
- **Dependencies**: Which external libraries are involved in the implementation?

### 4. Register Relations

For every relevant entity, register a relation:

```bash
jumbo relation add \
  --from-type goal \
  --from-id <goal-id> \
  --to-type <entity-type> \
  --to-id <entity-id> \
  --relation-type <type> \
  --description "<why this relation matters for implementation>"
```

**Relation types:**

| Type | Use When |
|------|----------|
| `involves` | Implementation will modify or directly interact with this entity |
| `uses` | Implementation depends on or references this entity |
| `must-respect` | Implementation must adhere to this constraint or decision |
| `follows` | Implementation must follow this practice or standard |
| `implements` | Implementation applies or realizes this architectural decision |

**Description quality is critical.** The description is what the implementing agent reads. It must explain the specific relevance to this goal, not just restate the entity's title.

- BAD: "Related to this invariant"
- BAD: "Must follow this guideline"
- GOOD: "Removal must not leave orphaned registrations or broken import paths across layer boundaries"
- GOOD: "Ensure the read-side query path remains intact after removing the old handler"

### 5. Update Goal Metadata

During entity exploration, you may discover:
- Additional files that belong in scope
- Files that should be created or modified
- Risk of scope creep
- Success criteria that need updating
- Applicable refactoring skills to reference in criteria (prefix with `skill:`)

Update the goal accordingly:

```bash
jumbo goal update --id <goal-id> \
  --criteria "Updated criteria" \
  --scope-in "additional/file/path.ts" \
  --scope-out "namespace/" "a/file/to-not-touch.ts" \
  --previous-goal <previous-goal-id> \
  --next-goal <next-goal-id>
```

### 6. Verify Completeness

Before approving, verify ALL of the following:

- [ ] Every entity category was explored (no categories skipped)
- [ ] Relevant invariants are linked (most goals require 2+ invariant relations)
- [ ] Testing-related guidelines are linked (almost every goal has testing implications)
- [ ] Architectural decisions that inform or constrain the approach are linked
- [ ] All components being modified, created, deleted, or depended upon are linked
- [ ] Every relation description explains the specific relevance, not just the entity name
- [ ] Goal criteria and scope reflect any discoveries made during refinement
- [ ] The goal has at least 5 relations total (fewer suggests incomplete analysis)

### 7. Approve Refinement

Only after completing all verification checks:

```bash
jumbo goal refine --id <goal-id> --approve
```

## Rules

1. **Never approve with fewer than 5 relations** unless the goal is trivially scoped. If you cannot find 5 relevant entities, re-examine your analysis.
2. **Never skip an entity category.** Explore all entity types every time. For components, prefer targeted `jumbo components search` queries over `jumbo components list`. Entity registrations change between sessions.
3. **Never write vague descriptions.** Every relation description must be actionable guidance for the implementing agent.
4. **Always link testing guidelines.** Implementation without testing context produces untested code.
5. **Always link components that prove safety.** When deleting or replacing code, link the replacement component so the agent can verify the change is safe.
6. **Treat skill references as first-class criteria.** If a refactoring skill applies, add `skill:<skill-name>` to the goal's criteria so the implementing agent loads it.
