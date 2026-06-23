# AGENTS.md

## Instructions for Agents on how to collaborate with Jumbo

See JUMBO.md and follow all instructions. If the file does not exist, then ignore this instruction.

## Changesets

When a PR changes user-facing behavior, add a changeset file in `.changeset/` with a short kebab-case name (e.g. `.changeset/fix-goal-output.md`):

```md
---
"jumbo-cli": patch
---

Description of the change.
```

Use `patch` for fixes, `minor` for new features, `major` for breaking changes. Internal refactors, CI changes, and docs-only changes don't need a changeset.
