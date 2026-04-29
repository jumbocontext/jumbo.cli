---
name: jumbo-add-guideline
description: Use liberally when the user expresses a preference about how work should be done — coding style, process, testing approach, communication style. Captures the guideline so future sessions follow it without being told again.
---

# Add Guideline

Register a guideline with Jumbo when the user states a preference about how work should be done. Guidelines shape agent behavior across all future sessions.

**Important:** Guidelines must be **generally applicable** to the project. Do not word them for a specific use case, goal, or task. A guideline that only applies to one situation belongs in a goal's criteria, not in the guideline registry.

## Command Syntax

```bash
jumbo guideline add \
  --category "<testing|codingStyle|process|communication|documentation|security|performance|other>" \
  --title "<Guideline title>" \
  --description "<What to do and when>" \
  --rationale "<Why this matters>"
```

## Bad Example

```bash
jumbo guideline add \
  --category codingStyle \
  --title "Use arrow functions in the auth module" \
  --description "All functions in src/auth/ should be arrow functions" \
  --rationale "Consistency in auth code"
```

Too narrow — scoped to one module and one task. This is a goal criterion, not a project guideline.

## Good Example

```bash
jumbo guideline add \
  --category codingStyle \
  --title "Prefer arrow functions for non-method declarations" \
  --description "Use arrow functions for callbacks, inline handlers, and standalone function expressions. Use function declarations for exported named functions and class methods." \
  --rationale "Consistent lexical scoping and concise syntax across the codebase"
```

Applies project-wide. States when to use and when not to use. Rationale explains the benefit.
