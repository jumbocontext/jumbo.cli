---
name: jumbo-add-decision
description: Use liberally when you make an architectural choice, select a technology, or reject an alternative. Records the decision so future sessions understand why the codebase looks the way it does.
---

# Add Decision

Register an architectural decision with Jumbo when you choose one approach over alternatives. Decisions explain **why** the codebase looks the way it does — without them, future agents may reverse your choices or repeat your analysis.

## Command Syntax

```bash
jumbo decision add \
  --title "<Decision title>" \
  --context "<Problem statement and background>" \
  --rationale "<Why this choice was made>" \
  --alternative "<Rejected option>" \
  --consequences "<Trade-offs accepted>"
```

## Bad Example

```bash
jumbo decision add \
  --title "Use events" \
  --context "Need to track changes"
```

Title is too vague to be useful. Missing rationale means a future agent has no basis for understanding the choice. Missing alternatives means they cannot evaluate whether the context has changed.

## Good Example

```bash
jumbo decision add \
  --title "Use event sourcing over state-based persistence for domain aggregates" \
  --context "Domain aggregates need audit history and the ability to rebuild state at any point in time" \
  --rationale "Event sourcing provides a complete audit trail and enables temporal queries without additional infrastructure" \
  --alternative "State-based persistence with a separate audit log table" \
  --consequences "Requires projection rebuilding for read models; increases storage for high-frequency aggregates"
```

Title names both the chosen and rejected pattern. Context explains the problem. Rationale connects the choice to the problem. Alternatives and consequences give future agents the information they need to judge whether the decision still holds.
