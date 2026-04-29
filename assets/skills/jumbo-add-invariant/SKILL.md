---
name: jumbo-add-invariant
description: Use liberally when you discover or are told a non-negotiable constraint — something that must always be true regardless of context. Registers the invariant so future sessions never violate it.
---

# Add Invariant

Register an invariant with Jumbo when you discover a non-negotiable constraint — a rule that must hold true across the entire project at all times, regardless of which goal is being implemented.

**Important:** Invariants must be **generally applicable** to the project. Do not word them for a specific use case, goal, or task. An invariant that only applies during one piece of work belongs in a goal's criteria, not in the invariant registry. If you find yourself writing "when working on X" or "for the Y feature", it is not an invariant.

## Command Syntax

```bash
jumbo invariant add \
  --title "<Invariant title>" \
  --description "<What must always be true>" \
  --rationale "<Why this is non-negotiable>"
```

## Bad Example

```bash
jumbo invariant add \
  --title "Session endpoint must validate tokens" \
  --description "The /api/session endpoint must check JWT expiry" \
  --rationale "Security requirement for session management"
```

Too narrow — applies to one endpoint. This is a requirement for a specific feature, not a project-wide invariant.

## Good Example

```bash
jumbo invariant add \
  --title "All API endpoints must validate authentication tokens" \
  --description "Every endpoint that accepts authenticated requests must verify token validity, expiry, and scope before processing the request" \
  --rationale "Security compliance requirement — unauthenticated access to protected resources is a critical vulnerability"
```

Applies to every endpoint, not just one. States the full constraint. Rationale explains why violation is unacceptable.
